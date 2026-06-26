const app = getApp()

// 位次比 → 录取概率%（与 report 页同一公式，保持口径一致）
function probOf(ratio) {
  if (!ratio) return null
  let p
  if (ratio < 1) p = 30 + (ratio - 0.7) / 0.3 * 22
  else if (ratio < 1.3) p = 55 + (ratio - 1.0) / 0.3 * 27
  else p = 82 + (ratio - 1.3) / 0.7 * 13
  return Math.max(12, Math.min(96, Math.round(p)))
}
function levelOf(p) {
  if (p == null) return { k: '', t: '' }
  if (p < 55) return { k: 'chong', t: '冲' }
  if (p < 82) return { k: 'wen', t: '稳' }
  return { k: 'bao', t: '保' }
}

Page({
  data: {
    profile: { province: '内蒙古', subject: '物理类', score: '--', rank: '' },
    hasRank: false,
    keyword: '',
    loading: false,
    searched: false,
    list: [],
    error: '', errIcon: '', errDesc: '', errRetry: false
  },

  onShow() {
    const r = wx.getStorageSync('jb_report')
    let profile = { province: '内蒙古', subject: '物理类', score: '--', rank: '' }
    if (r && r.meta) {
      profile = {
        province: r.meta.province || '内蒙古',
        subject: r.meta.subject || '物理类',
        score: r.meta.score || '--',
        rank: (r.score && r.score.user_rank) ? String(r.score.user_rank) : ''
      }
    }
    this.setData({ profile, hasRank: !!profile.rank })
  },

  onPullDownRefresh() {
    if (this.data.searched && !this.data.loading) this.query()
    wx.stopPullDownRefresh()
  },

  onInput(e) { this.setData({ keyword: e.detail.value }) },
  onRankInput(e) {
    const rank = e.detail.value.replace(/[^0-9]/g, '')
    this.setData({ 'profile.rank': rank, hasRank: !!rank })
  },
  goPick() { wx.navigateTo({ url: '/pages/pick/pick' }) },

  query() {
    const kw = (this.data.keyword || '').trim()
    const rank = parseInt(this.data.profile.rank, 10)
    if (!rank) { wx.showToast({ title: '先填你的位次', icon: 'none' }); return }
    if (!kw) { wx.showToast({ title: '输入院校名', icon: 'none' }); return }
    this.setData({ loading: true, searched: true, error: '' })
    const safe = kw.replace(/'/g, '')
    const q = "SELECT school,major,min_score,min_rank,year,subject FROM same_score_destination "
      + "WHERE school LIKE '%" + safe + "%' AND min_rank>0 ORDER BY year DESC, min_rank ASC LIMIT 80"
    app.request('/api/sql', { data: { q } }).then(res => {
      const rows = res.rows || res.data || res || []
      const list = rows.map(r => {
        const ratio = r.min_rank / rank
        const p = probOf(ratio)
        const lv = levelOf(p)
        return {
          school: r.school, major: r.major, year: r.year, subject: r.subject,
          minScore: r.min_score, minRank: r.min_rank,
          prob: p, lk: lv.k, lt: lv.t
        }
      })
      this.setData({ loading: false, list })
    }).catch(err => {
      const e = require('../../utils/err.js').classify(err)
      this.setData({ loading: false, list: [], error: e.title, errIcon: e.icon, errDesc: e.desc, errRetry: true })
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
