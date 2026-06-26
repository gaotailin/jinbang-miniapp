Page({
  data: { content: '', contact: '', kefu: 'bobo184458' },

  onContent(e) { this.setData({ content: e.detail.value }) },
  onContact(e) { this.setData({ contact: e.detail.value }) },

  submit() {
    const content = (this.data.content || '').trim()
    if (content.length < 5) { wx.showToast({ title: '请至少写 5 个字', icon: 'none' }); return }
    // 后端 /api/feedback 暂未开放，先本地暂存，后续接口上线再上传
    const list = wx.getStorageSync('jb_feedback') || []
    list.unshift({ content, contact: this.data.contact || '', time: Date.now() })
    wx.setStorageSync('jb_feedback', list)
    this.setData({ content: '', contact: '' })
    wx.showModal({
      title: '感谢反馈', showCancel: false, confirmText: '好的',
      content: '已收到你的建议，我们会尽快改进。急事可加客服微信：' + this.data.kefu
    })
  },

  copyKefu() {
    wx.setClipboardData({ data: this.data.kefu, success: () => wx.showToast({ title: '客服微信已复制', icon: 'none' }) })
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
