const app = getApp()

Page({
  data: {
    keyword: '',
    list: [],
    allList: [],       // 全量缓存（门类筛选不重拉后端）
    loading: false,
    searched: false,
    openIdx: -1,
    activeCate: '全部',
    cateList: ['全部','哲学','经济学','法学','教育学','文学','历史学','理学','工学','农学','医学','管理学','艺术学']
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
    app.request('/api/major_detail', { data: { major: '%' } })
      .then(rows => {
        const list = this._mapRows(rows || [])
        this.setData({ allList: list, list, loading: false })
      })
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '加载失败', icon: 'none' }) })
      .finally(() => { this._loadingAll = false })
  },

  /** 搜索 */
  doSearch() {
    const kw = (this.data.keyword || '').trim()
    if (!kw) { return this.setData({ allList: [], searched: false }, () => this.loadAll()) }
    this.setData({ loading: true, searched: true, list: [], openIdx: -1, activeCate: '' })
    app.request('/api/major_detail', { data: { major: kw } })
      .then(rows => { this.setData({ list: this._mapRows(rows || []), loading: false }) })
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '查询失败', icon: 'none' }) })
  },

  /** 门类筛选 */
  filterByCate(e) {
    const cate = e.currentTarget.dataset.cate
    if (cate === this.data.activeCate) return
    this.setData({ activeCate: cate, openIdx: -1 })
    if (cate === '全部') {
      this.setData({ list: this.data.allList })
    } else {
      this.setData({ list: this.data.allList.filter(m => m.category === cate) })
    }
  },

  toggle(e) {
    const i = e.currentTarget.dataset.idx
    const opening = this.data.openIdx !== i
    this.setData({ openIdx: opening ? i : -1 })
    if (opening) {
      const m = this.data.list[i]
      if (m && !m.schoolsLoaded) this.loadSchools(m.name, i)
    }
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
      intro: m.introduction || ''
    })).filter(x => x.name)
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
