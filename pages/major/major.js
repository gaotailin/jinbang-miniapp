const app = getApp()

Page({
  data: {
    keyword: '',
    list: [],
    allList: [],       // 全量缓存（门类筛选不重拉后端）
    loading: false,
    searched: false,
    openIdx: -1,
    // 三级联动筛选（全部由真实数据动态生成，不再写死）
    levelList: ['全部', '本科', '专科'],
    activeLevel: '全部',
    cateList: [],          // 当前学历下的门类（动态）
    activeCate: '全部',
    subList: [],           // 当前门类下的专业类（动态，二级钻取）
    activeSub: '全部'
  },

  onLoad() {
    // 首次进入加载全量专业
    this.loadAll()
  },

  onShow() {
    if (!this.data.allList.length && !this.data.loading) this.loadAll()
  },

  onInput(e) { this.setData({ keyword: e.detail.value }) },

  onPullDownRefresh() {
    if (this.data.searched) this.doSearch()
    else this.loadAll()
    wx.stopPullDownRefresh()
  },

  /** 加载全量专业 */
  loadAll() {
    if (this._loadingAll) return
    this._loadingAll = true
    this.setData({ loading: true, searched: false })
    app.request('/api/major_detail', { data: { major: '%', brief: 1, limit: 2000 } })
      .then(rows => {
        const list = this._mapRows(rows || [])
        this.setData({
          allList: list, list,
          loading: false,
          cateList: this._buildCates(list, '全部'),
          subList: [],
          activeLevel: '全部', activeCate: '全部', activeSub: '全部'
        })
      })
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '加载失败', icon: 'none' }) })
      .finally(() => { this._loadingAll = false })
  },

  /** 从数据中提取去重后的门类（按出现量降序，前置"全部"） */
  _buildCates(list, level) {
    const pool = level === '全部' ? list : list.filter(m => m.level === level)
    const count = {}
    pool.forEach(m => { if (m.category) count[m.category] = (count[m.category] || 0) + 1 })
    return ['全部'].concat(Object.keys(count).sort((a, b) => count[b] - count[a]))
  },

  /** 从当前学历+门类数据中提取去重专业类 */
  _buildSubs(list, level, cate) {
    let pool = level === '全部' ? list : list.filter(m => m.level === level)
    if (cate !== '全部') pool = pool.filter(m => m.category === cate)
    const count = {}
    pool.forEach(m => { if (m.subCategory) count[m.subCategory] = (count[m.subCategory] || 0) + 1 })
    return ['全部'].concat(Object.keys(count).sort((a, b) => count[b] - count[a]))
  },

  /** 按当前三级筛选条件重算列表（纯前端过滤，不重拉后端） */
  _applyFilter() {
    const { allList, activeLevel, activeCate, activeSub } = this.data
    let out = allList
    if (activeLevel !== '全部') out = out.filter(m => m.level === activeLevel)
    if (activeCate !== '全部') out = out.filter(m => m.category === activeCate)
    if (activeSub !== '全部') out = out.filter(m => m.subCategory === activeSub)
    this.setData({ list: out, openIdx: -1 })
  },

  /** 学历切换：重建门类、清空专业类 */
  filterByLevel(e) {
    const level = e.currentTarget.dataset.level
    if (level === this.data.activeLevel) return
    this.setData({
      activeLevel: level,
      activeCate: '全部', activeSub: '全部',
      cateList: this._buildCates(this.data.allList, level),
      subList: []
    })
    this._applyFilter()
  },

  /** 门类切换：重建专业类（二级钻取条） */
  filterByCate(e) {
    const cate = e.currentTarget.dataset.cate
    if (cate === this.data.activeCate) return
    this.setData({
      activeCate: cate, activeSub: '全部',
      subList: cate === '全部' ? [] : this._buildSubs(this.data.allList, this.data.activeLevel, cate)
    })
    this._applyFilter()
  },

  /** 专业类切换 */
  filterBySub(e) {
    const sub = e.currentTarget.dataset.sub
    if (sub === this.data.activeSub) return
    this.setData({ activeSub: sub })
    this._applyFilter()
  },

  /** 搜索 */
  doSearch() {
    const kw = (this.data.keyword || '').trim()
    if (!kw) { return this.setData({ allList: [], searched: false }, () => this.loadAll()) }
    this.setData({ loading: true, searched: true, list: [], openIdx: -1 })
    app.request('/api/major_detail', { data: { major: kw } })
      .then(rows => { this.setData({ list: this._mapRows(rows || []), loading: false }) })
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '查询失败', icon: 'none' }) })
  },

  toggle(e) {
    const i = e.currentTarget.dataset.idx
    const opening = this.data.openIdx !== i
    this.setData({ openIdx: opening ? i : -1 })
    if (opening) {
      const m = this.data.list[i]
      if (m && !m.detailLoaded) this.loadDetail(m.name, i)
      if (m && !m.schoolsLoaded) this.loadSchools(m.name, i)
    }
  },

  /** 展开时才拉长文本：列表接口只返回轻量字段，避免一次吐 5MB */
  loadDetail(name, idx) {
    app.request('/api/major_detail', { data: { major: name, exact: 1 } })
      .then(rows => {
        const d = (rows || [])[0] || {}
        this.setData({
          [`list[${idx}].intro`]: d.introduction || '',
          [`list[${idx}].courses`]: d.courses || '',
          [`list[${idx}].direction`]: d.employment_direction || '',
          [`list[${idx}].majorCode`]: d.major_code || '',
          [`list[${idx}].dataSource`]: d.source || '',
          [`list[${idx}].detailLoaded`]: true
        })
      })
      .catch(() => { this.setData({ [`list[${idx}].detailLoaded`]: true }) })
  },

  // 开设院校：enrollment_special 里专业组含该专业的院校录取分（按校去重，最新年优先）
  loadSchools(name, idx) {
    const kw = (name || '').replace(/['";\\%]/g, '').trim()
    if (!kw) { this.setData({ [`list[${idx}].schoolsLoaded`]: true, [`list[${idx}].schools`]: [] }); return }
    const q = `SELECT school,province,min_score,min_rank,year FROM enrollment_special WHERE major LIKE '%${kw}%' ORDER BY year DESC, min_score DESC LIMIT 60`
    app.request('/api/sql', { data: { q } }).then(rows => {
      const seen = {}, out = []
      ;(rows || []).forEach(r => {
        if (r.school && !seen[r.school]) { seen[r.school] = 1; out.push({ school: r.school, province: r.province || '', minScore: r.min_score, minRank: r.min_rank, year: r.year }) }
      })
      this.setData({ [`list[${idx}].schools`]: out.slice(0, 15), [`list[${idx}].schoolsLoaded`]: true })
    }).catch(() => { this.setData({ [`list[${idx}].schoolsLoaded`]: true, [`list[${idx}].schools`]: [] }) })
  },

  goSchool(e) {
    wx.navigateTo({ url: '/pages/school/school?name=' + encodeURIComponent(e.currentTarget.dataset.name) })
  },

  goProCompare() { wx.navigateTo({ url: '/pages/proCompare/proCompare' }) },

  /** 映射后端数据 */
  _mapRows(rows) {
    return (rows || []).map(m => ({
      id: m.id,
      name: m.major_name || m.major || '',
      category: m.category || '',
      subCategory: m.sub_category || '',
      degree: m.degree || '',
      level: m.level || '',
      years: m.study_years || '',
      empRate: m.employment_rate || '',
      salary: m.salary_avg || '',
      courses: m.courses || '',
      direction: m.employment_direction || '',
      intro: m.introduction || '',
      majorCode: m.major_code || '',
      dataSource: m.source || ''
    })).filter(x => x.name)
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能选校', path: '/pages/major/major' }
  },
  onShareTimeline() {
    return { title: '试试这个AI选校助手，高考升学一站搞定' }
  },
})
