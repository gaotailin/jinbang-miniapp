const app = getApp()
const { classify } = require('../../utils/err')

const PROVINCES = ['内蒙古', '北京', '天津', '河北', '山西', '辽宁', '吉林', '黑龙江', '上海', '江苏',
  '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆']
const YEARS = [2024, 2023, 2022]

Page({
  data: {
    mode: 'school',
    ph: '搜院校名称…',
    keyword: '',
    province: '北京', provinces: PROVINCES, provinceIndex: 0,
    year: 2024, years: YEARS, yearIndex: 0,
    subject: '全部',
    subjects: ['全部', '物理类', '历史类', '理科', '文科'],
    subjectIndex: 0,
    list: [],
    loading: false,
    error: '', errIcon: '📋', errDesc: '换个院校/专业名或科类再试', errRetry: false
  },

  onLoad() { this.search() },

  onSchool(e) { this.setData({ keyword: e.detail.value }) },

  onPullDownRefresh() {
    if ((this.data.keyword || '').trim()) this.search()
    wx.stopPullDownRefresh()
  },

  onProvince(e) {
    this.setData({ provinceIndex: Number(e.detail.value), province: PROVINCES[Number(e.detail.value)] }, () => this.search())
  },

  onYear(e) {
    this.setData({ yearIndex: Number(e.detail.value), year: YEARS[Number(e.detail.value)] }, () => this.search())
  },

  onSubject(e) {
    this.setData({ subjectIndex: Number(e.detail.value), subject: ['全部', '物理类', '历史类', '理科', '文科'][Number(e.detail.value)] }, () => this.search())
  },

  setMode(e) {
    const mode = e.currentTarget.dataset.m
    if (mode === this.data.mode) return
    this.setData({ mode, ph: mode === 'major' ? '搜专业名称，如 计算机…' : '搜院校名称…' }, () => this.search())
  },

  search() {
    this.setData({ loading: true, error: '', list: [] })
    const { keyword, subject, mode, province, year } = this.data
    const kw = (keyword || '').trim()
    const prov = province.replace(/'/g, "''")
    let q = "SELECT DISTINCT school,school_id,major,subject,batch,min_score,min_rank FROM enrollment_special WHERE province='" + prov + "' AND year=" + year
    if (subject !== '全部') q += " AND subject='" + subject.replace(/'/g, "''") + "'"
    if (kw) q += mode === 'major'
      ? " AND major LIKE '%" + kw.replace(/'/g, "''") + "%'"
      : " AND school LIKE '%" + kw.replace(/'/g, "''") + "%'"
    q += ' ORDER BY school, min_score DESC LIMIT 80'

    app.request('/api/sql', { data: { q } })
      .then(rows => {
        if (!rows || rows.length === 0) {
          this.setData({ loading: false, error: '没有匹配的录取数据', errIcon: '📋', errDesc: '换个院校/专业名或科类再试', errRetry: false })
          return
        }
        const map = {}
        rows.forEach(r => {
          if (!map[r.school]) map[r.school] = { school: r.school, sid: r.school_id, items: [] }
          map[r.school].items.push({
            major: r.major, subject: r.subject,
            score: r.min_score, rank: r.min_rank, batch: r.batch
          })
        })
        const list = Object.values(map)
        this.setData({ loading: false, list })
      })
      .catch((err) => {
        const e = classify(err)
        this.setData({ loading: false, error: e.title, errIcon: e.icon, errDesc: e.desc, errRetry: true })
      })
  },

  goOfficialPlan(e) {
    const sid = e.currentTarget.dataset.sid
    if (!sid) return
    
    // 先看缓存
    if (this.data.planCache && this.data.planCache[sid]) {
      wx.showToast({ title: this.data.planCache[sid], icon: 'none', duration: 3000 })
      return
    }
    
    wx.showLoading({ title: '查询中' })
    const { province, subject } = this.data
    app.request('/api/plan_count?province=' + encodeURIComponent(province) + '&school_id=' + sid + '&subject=' + encodeURIComponent(subject || '综合'))
      .then(res => {
        wx.hideLoading()
        const items = res || []
        const total = items.reduce((s, it) => s + (it.count || 0), 0)
        const info = total > 0 ? ('📋 计划招 ' + total + ' 人，' + items.length + ' 个专业组（2025招生计划·参考，2026以各省考试院官方为准）') : '暂无计划数据'
        // 缓存
        const cache = this.data.planCache || {}
        cache[sid] = info
        this.setData({ planCache: cache })
        wx.showToast({ title: info, icon: 'none', duration: 3000 })
      })
      .catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '查询失败，请重试', icon: 'none' })
      })
  },

  goSchool(e) {
    wx.navigateTo({ url: '/pages/school/school?name=' + encodeURIComponent(e.currentTarget.dataset.name) })
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
