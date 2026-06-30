const SCHEDULE = require('../../assets/data/luquSchedule.js')

Page({
  data: {
    provinces: [],
    provinceIndex: 0,
    current: null,
    year: 2026,
    disclaimer: '',
    showProv: false
  },

  onLoad() {
    const plist = (SCHEDULE.provinces || []).map(p => p.province)
    this.setData({
      provinces: plist,
      current: SCHEDULE.provinces[0],
      year: SCHEDULE.year,
      disclaimer: SCHEDULE.disclaimer
    })
  },

  showPicker() { this.setData({ showProv: true }) },
  hidePicker() { this.setData({ showProv: false }) },

  selectProv(e) {
    const i = parseInt(e.currentTarget.dataset.i, 10)
    this.setData({ provinceIndex: i, current: SCHEDULE.provinces[i], showProv: false })
  }
})
