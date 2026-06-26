const app = getApp()

const TABS = [
  { key: 'soft', name: '院校排名', q: 'SELECT school,ranking_soft_science,school_level FROM college_detail WHERE ranking_soft_science>0 ORDER BY ranking_soft_science ASC LIMIT 50' },
  { key: 'salary', name: '薪酬最高', q: 'SELECT school,avg_salary,school_level FROM college_detail WHERE avg_salary>0 ORDER BY avg_salary DESC LIMIT 50' },
  { key: 'emp', name: '就业率', q: 'SELECT school,employment_rate,school_level FROM college_detail WHERE employment_rate>0 ORDER BY employment_rate DESC LIMIT 50' },
  { key: 'mj', name: '专业薪酬', q: "SELECT major_name AS school, salary_avg, '专业' AS school_level FROM major_detail WHERE salary_avg>0 ORDER BY salary_avg DESC LIMIT 50" }
]

Page({
  data: { tabs: TABS, tab: 'soft', list: [], loading: false, cache: {} },

  onLoad() { this.load('soft') },

  onPullDownRefresh() {
    this.setData({ [`cache.${this.data.tab}`]: null })
    this.load(this.data.tab)
    wx.stopPullDownRefresh()
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.k
    if (key === this.data.tab) return
    this.setData({ tab: key })
    this.load(key)
  },

  load(key) {
    if (this.data.cache[key]) { this.setData({ list: this.data.cache[key] }); return }
    const tab = TABS.find(t => t.key === key)
    this.setData({ loading: true, list: [] })
    app.request('/api/sql', { data: { q: tab.q } })
      .then(rows => {
        const list = (rows || []).map((r, i) => ({
          rank: i + 1,
          school: r.school,
          level: r.school_level || '',
          metric: key === 'soft' ? ('软科第 ' + r.ranking_soft_science)
            : key === 'salary' ? (r.avg_salary + ' 元')
              : (r.employment_rate + '%')
        }))
        this.setData({ list, loading: false, [`cache.${key}`]: list })
      })
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '加载失败', icon: 'none' }) })
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
