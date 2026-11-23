const app = getApp()
const { classify } = require('../../utils/err')

// 全国 ready：列出所有省份，DATA_READY 标记已有数据的省
const ALL_PROVINCES = ['内蒙古', '北京', '天津', '河北', '山西', '辽宁', '吉林', '黑龙江', '上海', '江苏',
  '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆']
const DATA_READY = ALL_PROVINCES.reduce((o, p) => { o[p] = true; return o }, {})

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019]

// 科类轨道（新旧高考归一：理工=理科/物理类，文史=文科/历史类）
const TRACK_SUBJ = { 'li': ['理科', '物理类'], 'wen': ['文科', '历史类'] }
// 趋势序列：本科一批(旧)与本科批(新)合并为「本科控制线」
const SERIES = [
  { key: 'ben', name: '本科线', color: '#FF6600', batches: ['本科一批', '本科批'] },
  { key: 'ben2', name: '本科二批', color: '#3A86FF', batches: ['本科二批'] },
  { key: 'zhuan', name: '专科批', color: '#06A77D', batches: ['专科批'] }
]

Page({
  data: {
    provinces: ALL_PROVINCES, provinceIndex: 1, province: '北京',
    years: YEARS, yearIndex: 0, year: 2025,
    track: 'li',
    loading: false,
    groups: [],        // 选中年份表格：[{subject, batches: [{batch, score}]}]
    hasTrend: false,   // 是否有可画的趋势线（≥2 点）
    error: ''
  },

  onLoad() { this.loadAll('内蒙古') },

  onPullDownRefresh() {
    if (DATA_READY[this.data.province]) this.loadAll(this.data.province)
    wx.stopPullDownRefresh()
  },

  onProvince(e) {
    const i = Number(e.detail.value)
    const prov = ALL_PROVINCES[i]
    this.setData({ provinceIndex: i, province: prov })
    if (!DATA_READY[prov]) {
      this.allRows = []
      this.setData({ groups: [], hasTrend: false, error: '该省批次线数据正在整理中，敬请期待' })
      return
    }
    this.loadAll(prov)
  },

  onYear(e) {
    const idx = Number(e.detail.value)
    this.setData({ yearIndex: idx, year: YEARS[idx] })
    this.applyYear(YEARS[idx])
  },

  onTrack(e) {
    this.setData({ track: e.currentTarget.dataset.k }, () => this.drawTrend())
  },

  // 一次拉全年份，缓存到 this.allRows，再分别驱动表格与趋势图
  loadAll(province) {
    this.setData({ loading: true, error: '' })
    const q = `SELECT year,subject,batch,score FROM batch_line WHERE province='${province}'`
    app.request('/api/sql', { data: { q } })
      .then(rows => {
        if (!rows || rows.length === 0) {
          this.allRows = []
          this.setData({ loading: false, groups: [], hasTrend: false, error: '暂无该省批次线数据' })
          return
        }
        this.allRows = rows
        this.setData({ loading: false })
        this.applyYear(this.data.year)
        this.drawTrend()
      })
      .catch((err) => { const e = classify(err); this.setData({ loading: false, error: e.title + ' · ' + e.desc }) })
  },

  // 按年份过滤缓存生成表格
  applyYear(year) {
    const rows = (this.allRows || []).filter(r => r.year === year)
      .sort((a, b) => b.score - a.score)
    if (rows.length === 0) {
      this.setData({ groups: [], error: '暂无该年份批次线数据' })
      return
    }
    const map = {}
    rows.forEach(r => {
      if (!map[r.subject]) map[r.subject] = []
      map[r.subject].push({ batch: r.batch, score: r.score })
    })
    const groups = Object.keys(map).map(s => ({ subject: s, batches: map[s] }))
    this.setData({ groups, error: '' })
  },

  // 绘制历年趋势折线（canvas 真图，零后端）
  drawTrend() {
    const rows = this.allRows || []
    const subj = TRACK_SUBJ[this.data.track]
    const yearsAsc = YEARS.slice().sort((a, b) => a - b)
    // 构造每条序列在各年份的分数
    const series = SERIES.map(s => {
      const pts = []
      yearsAsc.forEach(y => {
        const hit = rows.find(r => r.year === y && subj.indexOf(r.subject) >= 0 && s.batches.indexOf(r.batch) >= 0)
        if (hit) pts.push({ year: y, score: hit.score })
      })
      return Object.assign({}, s, { pts })
    }).filter(s => s.pts.length >= 2)

    if (series.length === 0) { this.setData({ hasTrend: false }); return }
    this.setData({ hasTrend: true }, () => this._renderTrend(series, yearsAsc))
  },

  _renderTrend(series, yearsAsc) {
    wx.createSelectorQuery().in(this).select('#trendCanvas')
      .fields({ node: true, size: true }).exec(res => {
        if (!res || !res[0] || !res[0].node) return
        const cvs = res[0].node, W = res[0].width, H = res[0].height
        const ctx = cvs.getContext('2d')
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2
        cvs.width = W * dpr; cvs.height = H * dpr
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, W, H)

        const padL = 36, padR = 12, padT = 14, padB = 22
        const minY = yearsAsc[0], maxY = yearsAsc[yearsAsc.length - 1]
        let lo = Infinity, hi = -Infinity
        series.forEach(s => s.pts.forEach(p => { lo = Math.min(lo, p.score); hi = Math.max(hi, p.score) }))
        const pad = Math.max(10, (hi - lo) * 0.15); lo -= pad; hi += pad
        const xFor = y => padL + (maxY === minY ? 0 : (y - minY) / (maxY - minY)) * (W - padL - padR)
        const yFor = s => padT + (1 - (s - lo) / (hi - lo)) * (H - padT - padB)

        // y 网格 + 分数刻度（4 条）
        ctx.font = '9px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
        for (let i = 0; i <= 3; i++) {
          const val = lo + (hi - lo) * i / 3, yy = yFor(val)
          ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy)
          ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1; ctx.stroke()
          ctx.fillStyle = '#bbb'; ctx.fillText(Math.round(val), padL - 4, yy)
        }
        // x 年份刻度
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#999'
        yearsAsc.forEach(y => ctx.fillText(String(y).slice(2), xFor(y), H - padB + 5))

        // 折线 + 点
        series.forEach(s => {
          ctx.beginPath()
          s.pts.forEach((p, i) => {
            const x = xFor(p.year), y = yFor(p.score)
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          })
          ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke()
          s.pts.forEach(p => {
            ctx.beginPath(); ctx.fillStyle = '#fff'
            ctx.arc(xFor(p.year), yFor(p.score), 3, 0, Math.PI * 2); ctx.fill()
            ctx.lineWidth = 2; ctx.strokeStyle = s.color; ctx.stroke()
          })
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
