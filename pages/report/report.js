const sec = require('../../utils/wechat.js')

const DIM = {
  R: '现实型', I: '研究型', A: '艺术型',
  S: '社会型', E: '企业型', C: '常规型'
}
const Q_PER_DIM = 10   // 每维度题数，用于算百分比

Page({
  data: {
    hasReport: false,
    subOn: false,
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
        score.recommend[k] = (score.recommend[k] || []).map(it => ({
          ...it,
          prob: prob(it.rank_ratio),
          // 后端给的是 ref_score/ref_rank（参考年份口径），页面统一用 min_score/min_rank 渲染
          min_score: it.ref_score != null ? it.ref_score : it.min_score,
          min_rank: it.ref_rank != null ? it.ref_rank : it.min_rank,
          refYear: it.ref_year || score.data_year || ''
        }))
      })
    }

    this.setData({
      hasReport: true,
      meta: r.meta,
      interest: r.interest,
      hexagon,
      score
    })
    this.setData({ subOn: wx.getStorageSync('jb_sub_report') === 1 })
  },

  subReport() {
    sec.subscribe('report', { send: 1, name: '升学报告' }).then(ok => {
      if (ok) {
        wx.setStorageSync('jb_sub_report', 1)
        this.setData({ subOn: true })
        wx.showToast({ title: '已开启报告提醒', icon: 'success' })
      } else {
        wx.showToast({ title: '未开启，可随时再来', icon: 'none' })
      }
    })
  },

  goTest() {
    wx.navigateTo({ url: '/pages/test/test' })
  }
,
  onShareAppMessage() {
    return { title: '我生成了一份升学选校报告，你也来测测', path: '/pages/report/report' }
  },
  onShareTimeline() {
    return { title: '试试这个AI选校助手，高考升学一站搞定' }
  },
})
