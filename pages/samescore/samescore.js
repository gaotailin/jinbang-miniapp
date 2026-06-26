const app = getApp()
const { classify } = require('../../utils/err')
const SUBJECTS = ['物理类', '历史类']
const SUBJ_MAP = { '物理类': '理科', '历史类': '文科' }   // 数据为老高考口径

function bucketOf(rank) {
  if (rank <= 1000) return '0-1000'
  if (rank <= 5000) return '1000-5000'
  if (rank <= 10000) return '5000-10000'
  if (rank <= 20000) return '10000-20000'
  if (rank <= 50000) return '20000-50000'
  if (rank <= 100000) return '50000-100000'
  return '100000+'
}

Page({
  data: {
    subjects: SUBJECTS, subjectIndex: 0, score: '',
    loading: false, done: false, userRank: 0, bucket: '', list: []
  },

  onScore(e) { this.setData({ score: e.detail.value }) },
  onSubject(e) { this.setData({ subjectIndex: Number(e.detail.value) }) },

  onPullDownRefresh() {
    if (this.data.done) this.query()
    wx.stopPullDownRefresh()
  },

  query() {
    const score = parseInt(this.data.score, 10)
    if (!score || score < 100 || score > 750) {
      wx.showToast({ title: '请输入有效分数', icon: 'none' }); return
    }
    const subject = this.data.subjects[this.data.subjectIndex]
    this.setData({ loading: true, done: false })
    // 先用 /api/report 拿到位次（内部已处理 科类映射）
    app.request('/api/report', {
      method: 'POST',
      data: { province: '北京', subject, score, holland_answers: [] }
    }).then(r => {
      const rank = ((r && r.score) || {}).user_rank || 0
      if (!rank) { throw new Error('no rank') }
      const bucket = bucketOf(rank)
      const subj = SUBJ_MAP[subject]
      const q = "SELECT school,major,min_score,min_rank,school_level,year FROM same_score_destination "
        + "WHERE rank_bucket='" + bucket + "' AND subject='" + subj + "' ORDER BY year DESC, min_rank LIMIT 60"
      return app.request('/api/sql', { data: { q } }).then(rows => {
        const list = (rows || []).map(x => ({
          school: x.school, major: x.major || '', level: x.school_level || '',
          minScore: x.min_score, minRank: x.min_rank, year: x.year
        }))
        this.setData({ loading: false, done: true, userRank: rank, bucket, list })
      })
    }).catch((err) => {
      this.setData({ loading: false })
      wx.showToast({ title: classify(err).title, icon: 'none' })
    })
  },

  // ±5分步进：调整分数并重查相邻位次去向
  stepScore(e) {
    const d = Number(e.currentTarget.dataset.d)
    const s = parseInt(this.data.score, 10) + d
    if (s < 100 || s > 750) { wx.showToast({ title: '超出分数范围', icon: 'none' }); return }
    this.setData({ score: String(s) }, () => this.query())
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
