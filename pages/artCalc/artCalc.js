const { PROVINCES, calcComposite, checkLine } = require('../../utils/artRules.js')
const SECTION = require('../../assets/data/artSection.js')
const MAJSEC = require('../../assets/data/artMajorSection.js')

Page({
  data: {
    provNames: [],
    provIdx: 0,
    catNames: [],
    catIdx: 0,
    formNames: [],
    formIdx: 0,
    multiForm: false,     // 该类别是否多公式（如河南）
    culture: '',
    major: '',
    result: null,
    lineText: '', lineCls: '',
    lineNote: ''
  },

  onLoad() {
    this.setData({ provNames: PROVINCES.map(p => p.name) })
    this._syncProv(0)
  },

  _syncProv(provIdx) {
    const prov = PROVINCES[provIdx]
    this.setData({
      provIdx,
      catNames: prov.categories.map(c => c.name),
      catIdx: 0,
      lineNote: prov.lineNote || ''
    })
    this._syncCat(provIdx, 0)
  },
  _syncCat(provIdx, catIdx) {
    const cat = PROVINCES[provIdx].categories[catIdx]
    this.setData({
      catIdx,
      formNames: cat.formulas.map(f => f.name),
      formIdx: 0,
      multiForm: cat.formulas.length > 1,
      result: null
    })
  },

  onProv(e) { this._syncProv(+e.detail.value) },
  onCat(e) { this._syncCat(this.data.provIdx, +e.detail.value) },
  onForm(e) { this.setData({ formIdx: +e.detail.value, result: null }) },
  onCulture(e) { this.setData({ culture: e.detail.value.replace(/[^0-9.]/g, '') }) },
  onMajor(e) { this.setData({ major: e.detail.value.replace(/[^0-9.]/g, '') }) },

  calc() {
    const prov = PROVINCES[this.data.provIdx]
    const cat = prov.categories[this.data.catIdx]
    const formula = cat.formulas[this.data.formIdx]
    const culture = parseFloat(this.data.culture)
    const major = parseFloat(this.data.major)
    if (isNaN(culture) || isNaN(major)) { wx.showToast({ title: '填文化分和专业分', icon: 'none' }); return }
    if (culture > prov.cultureFull) { wx.showToast({ title: '文化分超过满分' + prov.cultureFull, icon: 'none' }); return }
    if (major > 300) { wx.showToast({ title: '专业统考分超过满分300', icon: 'none' }); return }

    const comp = calcComposite(prov, formula, culture, major)
    const line = checkLine(cat, culture, major)
    const map = {
      ben: { t: '已达本科控制线 ✓', cls: 'ok' },
      zhuan: { t: '达专科线，未达本科线', cls: 'mid' },
      none: { t: '未达专科控制线', cls: 'no' },
      unknown: { t: '该省控制线为动态/校考制，见下方说明', cls: 'mid' }
    }
    // 综合分→全省位次（若该省该类有官方分段数据）
    let seg = null
    const segData = SECTION[prov.code + '|' + cat.key]
    if (segData) {
      const rank = SECTION.rankOf(segData, comp)
      const beat = Math.max(0, Math.min(100, ((segData.total - rank) / segData.total * 100)))
      seg = { rank: rank, total: segData.total, beat: beat.toFixed(1), name: segData.name, source: segData.source }
    }

    // 专业统考分→全省专业位次(若有该省该类专业分一分一段)
    let mseg = null
    const mData = MAJSEC[prov.code + '|' + cat.key]
    if (mData) {
      const mrank = MAJSEC.rankOf(mData, major)
      const mbeat = Math.max(0, Math.min(100, ((mData.total - mrank) / mData.total * 100)))
      mseg = { rank: mrank, total: mData.total, beat: mbeat.toFixed(1), source: mData.source }
    }

    this.setData({
      result: { comp, cat, prov, formula, seg, mseg },
      lineText: map[line].t, lineCls: map[line].cls
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
