const app = getApp()

Page({
  data: {
    history: [],
    hasReport: false
  },

  onShow() {
    const fmt = ts => {
      if (!ts) return ''
      const d = new Date(ts)
      const pad = n => String(n).padStart(2, '0')
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' + pad(d.getMinutes())
    }
    this.setData({
      history: (wx.getStorageSync('jb_history') || []).map(h => ({ ...h, time: fmt(h.time) })),
      hasReport: !!wx.getStorageSync('jb_report')
    })
  },

  goTest() {
    wx.navigateTo({ url: '/pages/test/test' })
  },

  goReport() {
    if (!this.data.hasReport) {
      wx.showToast({ title: '还没有报告', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/report/report' })
  },

  goMbti() { wx.navigateTo({ url: '/pages/mbti/mbti' }) },
  goSubject() { wx.navigateTo({ url: '/pages/subject/subject' }) },
  goWarn() { wx.navigateTo({ url: '/pages/warn/warn' }) },
  goFeedback() { wx.navigateTo({ url: '/pages/feedback/feedback' }) },
  goAbout() { wx.navigateTo({ url: '/pages/about/about' }) },

  onShareAppMessage() {
    return { title: '九色鹿前程助手 · 内蒙古考生报全国大学，按分选校查冲稳保', path: '/pages/index/index' }
  },

  clearHistory() {
    wx.showModal({
      title: '清空记录', content: '确认清空全部测评历史？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('jb_history')
          this.setData({ history: [] })
        }
      }
    })
  }
,
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
