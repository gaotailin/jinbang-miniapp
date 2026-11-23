const ALL = require('../../assets/data/artSchools.js')
const Y26 = require('../../assets/data/art2026.js')
const TYPES = ['全部', '美术', '音乐', '戏剧影视', '传媒', '舞蹈', '综合艺术']

// 类别 → 院校类型（用于把 2026 招生数据并入筛选）
function typeOf(cats) {
  const c = (cats || []).join(',')
  if (c.indexOf('美术') >= 0) return '美术'
  if (c.indexOf('音乐') >= 0) return '音乐'
  if (c.indexOf('舞蹈') >= 0) return '舞蹈'
  if (c.indexOf('播音') >= 0) return '传媒'
  if (c.indexOf('表（导）演') >= 0 || c.indexOf('表演') >= 0) return '戏剧影视'
  return '综合艺术'
}

// 合并：独立艺术院校（116）+ 2026 实际在蒙招生院校（291）
const MERGED = (function () {
  const map = {}
  ALL.forEach(s => { map[s.name] = { name: s.name, prov: s.prov, type: s.type } })
  Y26.forEach(s => {
    const cur = map[s.n]
    const cats = s.c || []
    if (cur) {
      cur.d = 1; cur.mn = s.mn; cur.mx = s.mx; cur.m = s.m; cur.catN = cats.length
      cur.cats = cats.slice(0, 3).join(' · ')
    } else {
      map[s.n] = {
        name: s.n, prov: s.p || '其他', type: typeOf(cats),
        d: 1, mn: s.mn, mx: s.mx, m: s.m, catN: cats.length,
        cats: cats.slice(0, 3).join(' · ')
      }
    }
  })
  return Object.keys(map).map(k => map[k])
})()

Page({
  data: {
    provNames: ['全部'],
    provIdx: 0,
    typeIdx: 0,
    types: TYPES,
    list: [],
    total: MERGED.length,
    onlyData: false,
    nData: Y26.length
  },

  onLoad() {
    const provs = ['全部'].concat(Array.from(new Set(MERGED.map(s => s.prov))).sort())
    this.setData({ provNames: provs }, () => this._filter())
  },

  onProv(e) { this.setData({ provIdx: +e.detail.value }, () => this._filter()) },
  onType(e) { this.setData({ typeIdx: +e.currentTarget.dataset.i }, () => this._filter()) },
  toggleData() { this.setData({ onlyData: !this.data.onlyData }, () => this._filter()) },

  _filter() {
    const prov = this.data.provNames[this.data.provIdx]
    const type = TYPES[this.data.typeIdx]
    const only = this.data.onlyData
    let list = MERGED.filter(s =>
      (prov === '全部' || s.prov === prov) &&
      (type === '全部' || s.type === type) &&
      (!only || s.d))
    // 有 2026 数据的排前面，并按综合分区间从高到低
    list.sort((a, b) => (b.d ? 1 : 0) - (a.d ? 1 : 0) || (b.mx || 0) - (a.mx || 0))
    this.setData({ list })
  },

  goSchool(e) {
    const name = e.currentTarget.dataset.name
    wx.navigateTo({ url: '/pages/school/school?name=' + encodeURIComponent(name) })
  },

  onShareAppMessage() {
    const n = this.data.name || ''
    return {
      title: '2026 在内蒙古招生的艺术院校名单（' + this.data.nData + '所）',
      path: '/pages/artSchools/artSchools'
    }
  },
  onShareTimeline() {
    return { title: '2026 内蒙古艺术类招生院校与投档综合分' }
  }
})
