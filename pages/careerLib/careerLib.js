const FIELDS = require('../../assets/data/careerLib.js')

Page({
  data: { fields: FIELDS, openIdx: 0 },
  toggle(e) {
    const i = e.currentTarget.dataset.i
    this.setData({ openIdx: this.data.openIdx === i ? -1 : i })
  },
  goSalary() { wx.navigateTo({ url: '/pages/career/career' }) }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
