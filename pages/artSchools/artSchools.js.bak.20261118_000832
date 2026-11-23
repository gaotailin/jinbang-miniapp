const ALL = require('../../assets/data/artSchools.js')
const TYPES = ['全部', '美术', '音乐', '戏剧影视', '传媒', '舞蹈', '综合艺术']

Page({
  data: {
    provNames: ['全部'],
    provIdx: 0,
    typeIdx: 0,
    types: TYPES,
    list: [],
    total: 0
  },

  onLoad() {
    const provs = ['全部'].concat(Array.from(new Set(ALL.map(s => s.prov))).sort())
    this.setData({ provNames: provs, total: ALL.length }, () => this._filter())
  },

  onProv(e) { this.setData({ provIdx: +e.detail.value }, () => this._filter()) },
  onType(e) { this.setData({ typeIdx: +e.currentTarget.dataset.i }, () => this._filter()) },

  _filter() {
    const prov = this.data.provNames[this.data.provIdx]
    const type = TYPES[this.data.typeIdx]
    const list = ALL.filter(s =>
      (prov === '全部' || s.prov === prov) &&
      (type === '全部' || s.type === type))
    this.setData({ list })
  },

  goSchool(e) {
    const name = e.currentTarget.dataset.name
    wx.navigateTo({ url: '/pages/school/school?name=' + encodeURIComponent(name) })
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
