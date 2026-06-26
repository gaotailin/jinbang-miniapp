const app = getApp()
Page({
  data: { score: '', subject: '物理类', rank: null, source: '', loading: false },
  onScore(e) { this.setData({ score: e.detail.value }) },
  chooseSub(e) { this.setData({ subject: e.currentTarget.dataset.v, rank: null }) },
  query() {
    const s = Number(this.data.score)
    if (!s || s < 100 || s > 750) { wx.showToast({ title: '请输入有效分数', icon: 'none' }); return }
    this.setData({ loading: true })
    app.request('/api/score_convert', { data: { score: s, subject: this.data.subject } })
      .then(r => this.setData({ rank: r.estimated_rank, source: r.rank_source, loading: false }))
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '查询失败', icon: 'none' }) })
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
