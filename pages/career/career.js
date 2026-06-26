const app = getApp()

const CATS = ['全部', '工学', '医学', '管理学', '经济学', '理学', '文学', '法学', '教育学', '农学', '艺术学', '历史学', '哲学']
const SORTS = [
  { k: 'salary_3yr', label: '3年薪' },
  { k: 'salary_start', label: '起薪' },
  { k: 'salary_5yr', label: '5年薪' },
  { k: 'employment_rate', label: '就业率' }
]
const META = {
  salary_3yr:      { label: '毕业3年年薪', annual: true },
  salary_start:    { label: '起薪', annual: true },
  salary_5yr:      { label: '毕业5年年薪', annual: true },
  employment_rate: { label: '就业率', annual: false }
}
// 月薪(元) → 年薪(万)，一位小数
function wan(monthly) {
  if (!monthly) return '--'
  return (monthly * 12 / 10000).toFixed(1)
}

Page({
  data: {
    cats: CATS, catIdx: 0,
    sorts: SORTS, sortKey: 'salary_3yr',
    list: [], loading: false
  },

  onLoad() { this.query() },

  onPullDownRefresh() { this.query(); wx.stopPullDownRefresh() },

  pickCat(e) { this.setData({ catIdx: Number(e.currentTarget.dataset.i) }, () => this.query()) },
  pickSort(e) {
    const k = e.currentTarget.dataset.k
    if (k === this.data.sortKey) return
    this.setData({ sortKey: k }, () => this.query())
  },

  query() {
    const cat = this.data.cats[this.data.catIdx]
    const key = this.data.sortKey
    let q = "SELECT major_name,category,salary_start,salary_3yr,salary_5yr,employment_rate FROM salary_data WHERE salary_3yr IS NOT NULL"
    if (cat !== '全部') q += " AND category='" + cat + "'"
    q += " ORDER BY " + key + " DESC LIMIT 60"
    this.setData({ loading: true, list: [] })
    app.request('/api/sql', { data: { q } })
      .then(rows => {
        const meta = META[key]
        const list = (rows || []).map((r, i) => ({
          rank: i + 1,
          name: r.major_name,
          cat: r.category,
          head: meta.annual ? wan(r[key]) + '万' : ((r[key] || '--') + '%'),
          headLabel: meta.label,
          start: wan(r.salary_start),
          yr5: wan(r.salary_5yr),
          emp: (r.employment_rate != null && r.employment_rate !== '' && r.employment_rate !== 'undefined') ? r.employment_rate : '--'
        }))
        this.setData({ list, loading: false })
      })
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '加载失败，请重试', icon: 'none' }) })
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
