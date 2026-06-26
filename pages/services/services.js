Page({
  go(e) {
    const d = e.currentTarget.dataset
    if (!d.url) { wx.showToast({ title: '即将上线', icon: 'none' }); return }
    if (d.guard === 'report' && !wx.getStorageSync('jb_report')) {
      wx.showToast({ title: '先做霍兰德测评', icon: 'none' }); return
    }
    if (d.tab) { wx.switchTab({ url: d.url }) }
    else { wx.navigateTo({ url: d.url }) }
  },
  onShareAppMessage() {
    return { title: '九色鹿前程助手 · 高考志愿全套工具', path: '/pages/index/index' }
  }
,
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
