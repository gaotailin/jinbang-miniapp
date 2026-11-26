const app = getApp()
Page({
  data: { groups: [], loading: true },
  onLoad() {
    app.request('/api/batchline_list', { data: { province: '内蒙古' } })
      .then(rows => {
        const by = {}
        ;(rows || []).forEach(r => { (by[r.year] = by[r.year] || []).push(r) })
        const groups = Object.keys(by).sort((a, b) => b - a).map(y => ({ year: y, items: by[y] }))
        this.setData({ groups, loading: false })
      })
      .catch(() => { this.setData({ loading: false }) })
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能选校', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI选校助手，高考升学一站搞定' }
  },
})
