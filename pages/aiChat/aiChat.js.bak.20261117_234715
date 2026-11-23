const app = getApp()

const QUICK = [
  '理科550分能报哪些学校？',
  '软件工程和计算机科学有什么区别？',
  '强基计划和综合评价有什么区别？',
  '物理类选科可以报哪些专业？',
  '分析2025年高考作文题的立意角度',
  '推荐几个就业率高的工科专业'
]

let msgId = 0

Page({
  data: {
    messages: [],
    input: '',
    loading: false,
    quickQuestions: QUICK
  },

  onShow() {
    const r = wx.getStorageSync('jb_report')
    if (r && r.meta) {
      this._ctx = r.meta.province + r.meta.subject + '考生，' + r.meta.score + '分'
    }
  },

  onInput(e) { this.setData({ input: e.detail.value }) },

  askQuick(e) {
    const q = e.currentTarget.dataset.q
    this.setData({ input: q }, () => this.send())
  },

  send() {
    const content = (this.data.input || '').trim()
    if (!content || this.data.loading) return

    const msgs = this.data.messages.concat({ id: ++msgId, role: 'user', content })
    this.setData({ messages: msgs, input: '', loading: true })

    app.request('/api/chat', {
      method: 'GET',
      data: { msg: content, ctx: this._ctx || '' }
    }).then(res => {
      const reply = (res && (res.reply || res.message)) || '抱歉，暂时无法回复，请稍后重试。'
      this.setData({
        messages: this.data.messages.concat({ id: ++msgId, role: 'ai', content: reply }),
        loading: false
      })
    }).catch(() => {
      this.setData({
        messages: this.data.messages.concat({ id: ++msgId, role: 'ai', content: '网络异常，请检查网络后重试 🙏' }),
        loading: false
      })
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
