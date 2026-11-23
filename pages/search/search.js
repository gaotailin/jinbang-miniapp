const app = getApp()
const favSync = require('../../utils/fav.js')

const PAGE = 30
const COLS = 'school,province,city,school_level,school_type,is_985,is_211,is_double_first_class,ranking_soft_science,avg_salary,employment_rate,undergraduate_majors,master_programs,has_graduate_school'

// 城市名归一化：去掉「市/盟/地区」后缀，合并「呼和浩特」「呼和浩特市」这类同源脏数据
function normCity(c) {
  c = (c || '').trim()
  ;['市', '盟', '地区'].forEach(suf => {
    if (c.length > suf.length && c.endsWith(suf)) c = c.slice(0, -suf.length)
  })
  return c
}
// 单引号转义，防 SQL 注入（城市名进 IN 列表前必走）
function sqlEscape(v) { return String(v).replace(/'/g, "''") }

function favSchoolSet() {
  const set = {}
  ;(wx.getStorageSync('jb_fav') || []).forEach(x => { set[x.school] = 1 })
  return set
}

// 文字校徽：校名首二字 + 按校名哈希定色（零图源，每校稳定）
const BADGE_COLORS = ['#e8780a', '#2b86d9', '#27ae60', '#8b5cf6', '#e85d6a', '#0ea5a4', '#d4a017', '#6366f1']
function schoolBadge(name) {
  const n = (name || '').replace(/[（(].*$/, '')
  let h = 0
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0
  return { txt: n.slice(0, 2), color: BADGE_COLORS[h % BADGE_COLORS.length] }
}

Page({
  data: {
    keyword: '', schools: [], loading: false, noMore: false,
    // 筛选态
    province: '不限', level: '不限', activeCate: '全部', sort: 'default', sortLabel: '综合排序',
    panel: '',   // '' | 'prov' | 'city' | 'level' | 'sort'
    // 城市级筛选（选定省份后按需加载）
    city: '不限', cityOpts: [], cityLoading: false, cityMap: {}, // 归一化名 -> 原始变体数组
    // 常驻分类横滑条（按 school_type 实际取值，每个都点得出院校）
    cateStrip: ['全部', '综合', '理工', '师范', '医学', '财经', '农业', '农林', '语言', '艺术', '政法', '法学', '体育', '民族'],
    // 院校地区（按院校数量排序，热门省份自然靠前）
    provOpts: ['不限', '北京', '江苏', '辽宁', '上海', '山东', '广东', '内蒙古', '湖北', '浙江', '天津', '河北', '四川', '河南', '黑龙江', '湖南', '江西', '吉林', '陕西', '安徽', '重庆', '福建', '新疆', '广西', '山西', '云南', '甘肃', '贵州', '海南', '宁夏', '青海', '西藏'],
    // 院校层次（school_level 实际取值）
    levelOpts: ['不限', '985', '211', '双一流', 'C9', '省重点', '其他'],
    sortOpts: [
      { k: 'default', label: '综合排序' },
      { k: 'soft', label: '软科排名' },
      { k: 'salary', label: '毕业薪酬' },
      { k: 'emp', label: '就业率' }
    ]
  },

  onLoad() { this.load(true) },

  // 从详情页返回时刷新「已加入」状态
  onShow() { this.syncFavFlags() },

  onPullDownRefresh() { this.load(true); wx.stopPullDownRefresh() },

  onReachBottom() { if (!this.data.noMore && !this.data.loading) this.load(false) },

  onInput(e) { this.setData({ keyword: e.detail.value }) },

  syncFavFlags() {
    if (!this.data.schools.length) return
    const set = favSchoolSet()
    this.setData({ schools: this.data.schools.map(s => ({ ...s, inFav: !!set[s.school] })) })
  },

  // ── 拼 SQL ─────────────────────────────
  buildSQL(offset) {
    const w = []
    const kw = (this.data.keyword || '').replace(/['";\\]/g, '').trim()
    if (kw) w.push(`school LIKE '%${kw}%'`)
    if (this.data.province !== '不限') w.push(`province='${sqlEscape(this.data.province)}'`)
    // 城市级：用归一化名对应的所有原始变体做 IN 精确匹配（接口禁 %，且能合并脏数据）
    if (this.data.city !== '不限' && this.data.province !== '不限') {
      const variants = (this.data.cityMap[this.data.city] || [this.data.city]).map(sqlEscape)
      if (variants.length) w.push(`city IN (${variants.map(v => `'${v}'`).join(',')})`)
    }
    if (this.data.level !== '不限') w.push(`school_level LIKE '%${sqlEscape(this.data.level)}%'`)
    const c = this.data.activeCate
    if (c && c !== '全部') w.push(`school_type='${c}'`)
    const where = w.length ? ('WHERE ' + w.join(' AND ')) : ''
    let order
    if (this.data.sort === 'salary') order = 'ORDER BY avg_salary DESC'
    else if (this.data.sort === 'emp') order = 'ORDER BY employment_rate DESC'
    else order = "ORDER BY CASE WHEN ranking_soft_science>0 AND (ranking_board IS NULL OR ranking_board LIKE '中国大学排名%') THEN 0 ELSE 1 END, ranking_soft_science ASC"
    return `SELECT ${COLS} FROM college_detail ${where} ${order} LIMIT ${PAGE} OFFSET ${offset}`
  },

  mapRow(r, set) {
    const tags = []
    if (r.is_985) tags.push({ t: '985', hot: true })
    if (r.is_211) tags.push({ t: '211', hot: true })
    if (r.is_double_first_class) tags.push({ t: '双一流', hot: true })
    if (r.school_level === 'C9') tags.push({ t: 'C9', hot: true })
    else if (r.school_level === '省重点') tags.push({ t: '省重点', hot: false })
    if (r.has_graduate_school) tags.push({ t: '研究生院', hot: false })
    // 卡片增强：软科排名（>0 才显示）、本科专业数（>0 才显示）
    const soft = r.ranking_soft_science ? Number(r.ranking_soft_science) : 0
    const majors = r.undergraduate_majors ? Number(r.undergraduate_majors) : 0
    return {
      school: r.school, province: r.province || '', city: r.city || '', type: r.school_type || '',
      badge: schoolBadge(r.school), tags, inFav: !!set[r.school],
      softRank: soft, majorCount: majors
    }
  },

  load(reset) {
    if (this.data.loading) return
    const offset = reset ? 0 : this.data.schools.length
    this.setData(reset ? { loading: true, schools: [], noMore: false } : { loading: true })
    app.request('/api/sql', { data: { q: this.buildSQL(offset) } })
      .then(rows => {
        const set = favSchoolSet()
        const add = (rows || []).map(r => this.mapRow(r, set)).filter(x => x.school)
        const schools = reset ? add : this.data.schools.concat(add)
        this.setData({ schools, loading: false, noMore: add.length < PAGE })
      })
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '加载失败', icon: 'none' }) })
  },

  doSearch() { this.setData({ panel: '' }); this.load(true) },

  // ── 筛选交互 ───────────────────────────
  openPanel(e) {
    const p = e.currentTarget.dataset.p
    this.setData({ panel: this.data.panel === p ? '' : p })
  },
  closePanel() { this.setData({ panel: '' }) },

  pickProv(e) {
    const v = e.currentTarget.dataset.v
    // 切换省份：重置城市筛选与缓存；选「不限」则清空城市
    if (v === this.data.province) { this.setData({ panel: '' }); return }
    this.setData({ province: v, city: '不限', cityOpts: [], cityMap: {}, panel: '' })
    if (v !== '不限') this.loadCities(v)
    this.load(true)
  },

  // 按需拉取该省城市，归一化去后缀后合并同源变体
  loadCities(prov) {
    this.setData({ cityLoading: true })
    app.request('/api/sql', { data: { q: `SELECT DISTINCT city FROM college_detail WHERE province='${sqlEscape(prov)}' AND city<>''` } })
      .then(rows => {
        const map = {}
        ;(rows || []).forEach(r => {
          const raw = (r.city || '').trim()
          if (!raw) return
          const key = normCity(raw)
          if (!map[key]) map[key] = []
          if (map[key].indexOf(raw) === -1) map[key] = map[key].concat(raw)
        })
        this.setData({ cityOpts: Object.keys(map).sort(), cityMap: map, cityLoading: false })
      })
      .catch(() => { this.setData({ cityLoading: false }); wx.showToast({ title: '城市加载失败', icon: 'none' }) })
  },

  pickCity(e) {
    const v = e.currentTarget.dataset.v
    this.setData({ city: v, panel: '' })
    this.load(true)
  },

  pickLevel(e) { this.setData({ level: e.currentTarget.dataset.v, panel: '' }); this.load(true) },
  pickSort(e) {
    const k = e.currentTarget.dataset.v
    const o = this.data.sortOpts.find(x => x.k === k)
    this.setData({ sort: k, sortLabel: o ? o.label : '综合排序', panel: '' })
    this.load(true)
  },

  pickCate(e) {
    const c = e.currentTarget.dataset.c
    if (c === this.data.activeCate) return
    this.setData({ activeCate: c, panel: '' })
    this.load(true)
  },

  // 列表卡直接加入选校单
  addFav(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.schools[idx]
    if (!item || item.inFav) return
    const fav = wx.getStorageSync('jb_fav') || []
    if (!fav.find(x => x.school === item.school)) {
      fav.unshift({ school: item.school, level: (item.tags[0] && item.tags[0].t) || '', province: item.province, batch: 'normal', time: Date.now() })
      wx.setStorageSync('jb_fav', fav)
      favSync.push()
    }
    this.setData({ [`schools[${idx}].inFav`]: true })
    wx.showToast({ title: '已加入选校单', icon: 'success' })
  },

  goSchool(e) {
    wx.navigateTo({ url: '/pages/school/school?name=' + encodeURIComponent(e.currentTarget.dataset.name) })
  },

  // 顶部 tab：全部院校(本页) / 大学排名 / 院校对比 / 我的关注
  goTab(e) {
    const t = e.currentTarget.dataset.t
    if (t === 'rank') { wx.navigateTo({ url: '/pages/ranking/ranking' }) }
    else if (t === 'compare') { wx.navigateTo({ url: '/pages/compare/compare' }) }
    else if (t === 'fav') { wx.switchTab({ url: '/pages/volunteer/volunteer' }) }
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
