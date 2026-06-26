Page({
  data: { version: '1.0.0', kefu: 'bobo184458' },

  copyKefu() {
    wx.setClipboardData({ data: this.data.kefu, success: () => wx.showToast({ title: '客服微信已复制', icon: 'none' }) })
  },
  goPrivacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }) },
  goAgreement() { wx.navigateTo({ url: '/pages/agreement/agreement' }) }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
