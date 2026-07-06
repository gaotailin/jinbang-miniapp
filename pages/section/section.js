const app = getApp()
const { classify } = require('../../utils/err')

// 全国 ready：列出所有省份，DATA_READY 标记已有录取数据的省
const ALL_PROVINCES = ['内蒙古', '北京', '天津', '河北', '山西', '辽宁', '吉林', '黑龙江', '上海', '江苏',
  '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆']
const DATA_READY = ALL_PROVINCES.reduce((o, p) => { o[p] = true; return o }, {})

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021]
// 不同高考模式对应不同科类
const SUBJ_33 = ['北京', '天津', '上海', '山东', '浙江', '海南']
function subjectsOf(prov) {
  return SUBJ_33.indexOf(prov) >= 0 ? ['综合'] : ['物理类', '历史类']
}

Page({
  data: {
    provinces: ALL_PROVINCES, provinceIndex: 0, province: '内蒙古',
    years: YEARS, yearIndex: 1, year: 2025,   // yearIndex 与 YEARS[1]=2025 对齐(原0显示2026查2025不一致)
    subjects: subjectsOf('内蒙古'), subjectIndex: 0, subject: '物理类',
    score: '',
    loading: false, done: false, isDerived: false,
    result: null,   // { score, cumulative_count, section_count, rank_low, rank_high, nearby[] }
    error: '', errIcon: '📊', errDesc: '检查分数或换个条件再查', errRetry: false
  },

  onLoad() {},

  onPullDownRefresh() {
    if (this.data.done) this.query()
    wx.stopPullDownRefresh()
  },

  onProvince(e) {
    const i = Number(e.detail.value)
    const prov = ALL_PROVINCES[i]
    this.setData({ provinceIndex: i, province: prov, subjects: subjectsOf(prov), subjectIndex: 0, subject: subjectsOf(prov)[0], done: false, result: null })
  },
  onYear(e) {
    const i = Number(e.detail.value)
    const y = YEARS[i]
    this.setData({ yearIndex: i, year: y, done: false, result: null })
  },
  onSubject(e) {
    this.setData({ subjectIndex: Number(e.detail.value), subject: this.data.subjects[Number(e.detail.value)], done: false, result: null })
  },
  onScore(e) { this.setData({ score: e.detail.value }) },

  query() {
    const score = parseInt(this.data.score, 10)
    if (!score || score < 100 || score > 750) {
      wx.showToast({ title: '请输入有效分数(100-750)', icon: 'none' }); return
    }
    // 校验数据就绪
    if (!DATA_READY[this.data.province]) {
      wx.showModal({
        title: '该省数据即将开放',
        content: '「' + this.data.province + '」的一分一段数据正在整理中。当前已全面支持内蒙古考生，敬请期待更多省份。',
        showCancel: false, confirmText: '知道了'
      })
      return
    }
    const { year, subject, province } = this.data
    this.setData({ loading: true, done: false, error: '' })

    // 查该分数两侧 ±15 分段（直方图）+ 全省总人数（算超越%）
    // 优先真实官方一分一段 one_section(31省已入库)，该省该年该科类缺数据时回退派生表标"参考"
    const lo = Math.max(0, score - 15), hi = Math.min(750, score + 15)
    const fetchDist = (tableName) => {
      const qDist = `SELECT score,cumulative_count,section_count,rank_low,rank_high FROM ${tableName} WHERE province='${province}' AND year=${year} AND exam_type='${subject}' AND score BETWEEN ${lo} AND ${hi} ORDER BY score DESC`
      const qTotal = `SELECT MAX(cumulative_count) AS total FROM ${tableName} WHERE province='${province}' AND year=${year} AND exam_type='${subject}'`
      return Promise.all([app.request('/api/sql', { data: { q: qDist } }), app.request('/api/sql', { data: { q: qTotal } })])
    }
    fetchDist('one_section')
      .then(([rows, totRows]) => {
        if (rows && rows.length) return [rows, totRows, false]
        return fetchDist('one_section_derived').then(([r2, t2]) => [r2, t2, true])
      })
      .then(([rows, totRows, isDerived]) => {
        if (!rows || rows.length === 0) {
          this.setData({ loading: false, error: '未找到该分数段数据', errIcon: '📊', errDesc: '检查年份和科类再查', errRetry: false })
          return
        }
        const total = (totRows && totRows[0] && totRows[0].total) ? totRows[0].total : null
        const hit = rows.find(r => r.score === score)
        // 直方图：升序 {score, same, isMe}
        const chart = rows.slice().sort((a, b) => a.score - b.score).map(r => ({
          score: r.score, same: r.section_count || 0, isMe: r.score === score
        }))
        // 表格：≤本人分的 11 行（降序，与原逻辑一致）
        const nearby = rows.filter(r => r.score <= score).slice(0, 11).map(r => ({
          score: r.score, rank: r.cumulative_count, same: r.section_count || 0, isMe: r.score === score
        }))
        // 超越全省百分比 = (总人数 - 本人及以上累计) / 总人数
        let beatPct = null
        // 派生数据不显示超越率（非真实考生分布）
        if (!isDerived && hit && total) beatPct = ((total - hit.cumulative_count) / total * 100).toFixed(2)
        this.setData({
          loading: false, done: true,
          isDerived: isDerived,
          result: {
            score: score,
            cumulative_count: hit ? hit.cumulative_count : null,
            section_count: hit ? (hit.section_count || 0) : null,
            rank_low: hit ? hit.rank_low : null,
            rank_high: hit ? hit.rank_high : null,
            beatPct, total, nearby, chart, equiv: []
          }
        }, () => {
          if (chart.length) this._renderDist(chart)
          if (hit && hit.cumulative_count) this._loadEquiv(hit.cumulative_count, year, subject)
        })
      })
      .catch((err) => {
        const e = classify(err)
        this.setData({ loading: false, error: e.title, errIcon: e.icon, errDesc: e.desc, errRetry: true })
      })
  },

  // 历年等效分：按位次在各年一分一段表反查对应分数（跨新旧高考映射科类）
  _loadEquiv(rank, baseYear, subject) {
    const others = YEARS.filter(y => y !== baseYear)
    const examTypeFor = (y) => y >= 2024 ? subject
      : (subject === '物理类' ? '理科' : subject === '历史类' ? '文科' : subject)
    const qs = others.map(y => app.request('/api/sql', {
      data: { q: `SELECT score FROM one_section WHERE province='${this.data.province}' AND year=${y} AND exam_type='${examTypeFor(y)}' AND cumulative_count >= ${rank} ORDER BY cumulative_count ASC LIMIT 1` }
    }))
    Promise.all(qs).then(rs => {
      const equiv = others.map((y, i) => ({ year: y, score: (rs[i] && rs[i][0]) ? rs[i][0].score : null }))
        .filter(e => e.score != null).sort((a, b) => b.year - a.year)
      this.setData({ 'result.equiv': equiv })
    }).catch(() => {})
  },

  // 一分一段直方图（canvas 真图）
  _renderDist(chart) {
    wx.createSelectorQuery().in(this).select('#distCanvas')
      .fields({ node: true, size: true }).exec(res => {
        if (!res || !res[0] || !res[0].node) return
        const cvs = res[0].node, W = res[0].width, H = res[0].height
        const ctx = cvs.getContext('2d')
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2
        cvs.width = W * dpr; cvs.height = H * dpr
        ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H)

        const padL = 6, padR = 6, padT = 12, padB = 18
        const n = chart.length
        const maxSame = Math.max.apply(null, chart.map(c => c.same)) || 1
        const bw = (W - padL - padR) / n
        const baseY = H - padB
        chart.forEach((c, i) => {
          const x = padL + i * bw
          const h = (c.same / maxSame) * (H - padT - padB)
          const y = baseY - h
          ctx.fillStyle = c.isMe ? '#FF6600' : 'rgba(255,140,0,0.28)'
          ctx.fillRect(x + bw * 0.12, y, bw * 0.76, h)
          if (c.isMe) {
            ctx.fillStyle = '#FF6600'; ctx.font = 'bold 10px sans-serif'
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
            ctx.fillText(c.score, x + bw / 2, y - 2)
          }
        })
        // x 轴端点分数
        ctx.fillStyle = '#bbb'; ctx.font = '9px sans-serif'; ctx.textBaseline = 'top'
        ctx.textAlign = 'left'; ctx.fillText(chart[0].score, padL, baseY + 4)
        ctx.textAlign = 'right'; ctx.fillText(chart[n - 1].score, W - padR, baseY + 4)
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
