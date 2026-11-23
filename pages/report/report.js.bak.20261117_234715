const DIM = {
  R: '现实型', I: '研究型', A: '艺术型',
  S: '社会型', E: '企业型', C: '常规型'
}
const Q_PER_DIM = 10   // 每维度题数，用于算百分比

Page({
  data: {
    hasReport: false,
    meta: null,
    interest: null,
    hexagon: [],
    score: null
  },

  onShow() {
    const r = wx.getStorageSync('jb_report')
    if (!r || !r.success) {
      this.setData({ hasReport: false })
      return
    }

    // 兴趣六维 → 百分比
    const scores = (r.interest && r.interest.scores) || {}
    const hexagon = Object.keys(DIM).map(k => ({
      key: k, name: DIM[k],
      score: scores[k] || 0,
      pct: Math.round(((scores[k] || 0) / Q_PER_DIM) * 100)
    })).sort((a, b) => b.score - a.score)

    // 位次比 → 录取概率%（冲低/稳中/保高）
    const prob = (ratio) => {
      if (!ratio) return null
      let p
      if (ratio < 1) p = 30 + (ratio - 0.7) / 0.3 * 22
      else if (ratio < 1.3) p = 55 + (ratio - 1.0) / 0.3 * 27
      else p = 82 + (ratio - 1.3) / 0.7 * 13
      return Math.max(12, Math.min(96, Math.round(p)))
    }
    const score = r.score ? Object.assign({}, r.score) : null
    if (score && score.recommend) {
      Object.keys(score.recommend).forEach(k => {
        score.recommend[k] = (score.recommend[k] || []).map(it => ({ ...it, prob: prob(it.rank_ratio) }))
      })
    }

    this.setData({
      hasReport: true,
      meta: r.meta,
      interest: r.interest,
      hexagon,
      score
    })
  },

  goTest() {
    wx.navigateTo({ url: '/pages/test/test' })
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
