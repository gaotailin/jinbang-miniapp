const app = getApp()

Page({
  data: {
    step: 1,
    province: '内蒙古', provinces: ['内蒙古'], examType: '物理类', score: '',
    questions: [], answers: {}, answeredCount: 0, loadingQ: true,
    submitting: false
  },

  onLoad() {
    app.request('/api/holland/questions')
      .then(res => this.setData({ questions: res.questions || [], loadingQ: false }))
      .catch(() => { this.setData({ loadingQ: false }); wx.showToast({ title: '题库加载失败', icon: 'none' }) })
  },

  goStep(e) {
    const step = Number(e.currentTarget.dataset.step)
    if (step === 2 && !this.validBase()) return
    this.setData({ step }); wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  onProvince(e) { this.setData({ province: this.data.provinces[e.detail.value] }) },
  chooseExam(e) { this.setData({ examType: e.currentTarget.dataset.v }) },
  onScore(e) { this.setData({ score: e.detail.value }) },
  validBase() {
    const s = Number(this.data.score)
    if (!s || s < 100 || s > 750) { wx.showToast({ title: '请输入有效分数(100-750)', icon: 'none' }); return false }
    return true
  },

  answer(e) {
    const { qid, choice } = e.currentTarget.dataset
    const answers = Object.assign({}, this.data.answers, { [qid]: choice })
    this.setData({ answers, answeredCount: Object.keys(answers).length })
  },

  submit() {
    if (!this.validBase()) { this.setData({ step: 1 }); return }
    if (this.data.submitting) return
    const holland_answers = Object.keys(this.data.answers).map(qid => ({ qid: Number(qid), choice: this.data.answers[qid] }))
    this.setData({ submitting: true })
    wx.showLoading({ title: '生成报告中…', mask: true })
    app.request('/api/report', {
      method: 'POST',
      data: {
        province: this.data.province, exam_type: this.data.examType, score: Number(this.data.score),
        holland_answers
      }
    }).then(res => {
      wx.hideLoading(); this.setData({ submitting: false })
      const history = wx.getStorageSync('jb_history') || []
      history.unshift({
        time: new Date().toLocaleString(), province: this.data.province,
        examType: this.data.examType, score: Number(this.data.score),
        top3: (res.interest && res.interest.top3) || ''
      })
      wx.setStorageSync('jb_history', history.slice(0, 20))
      wx.setStorageSync('jb_report', res)
      wx.navigateTo({ url: '/pages/report/report' })
    }).catch(err => {
      wx.hideLoading(); this.setData({ submitting: false })
      wx.showToast({ title: (err && err.error) || '生成失败', icon: 'none' })
    })
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
