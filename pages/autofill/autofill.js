const app = getApp()

Page({
  data: {
    hasData: false,
    meta: { province: '北京', subject: '物理类', score: '' },
    chong: 6, wen: 6, bao: 6,
    levelPref: 'all',
    levels: [
      { k: 'all', label: '不限' },
      { k: '211', label: '优先211' },
      { k: '985', label: '优先985' }
    ],
    loading: false, done: false,
    result: { chong: [], wen: [], bao: [] },
    total: 0
  },

  onShow() {
    const r = wx.getStorageSync('jb_report')
    if (r && r.meta && r.meta.score) {
      this.setData({
        hasData: true,
        meta: {
          province: r.meta.province || '北京',
          subject: r.meta.subject || '物理类',
          score: r.meta.score
        }
      })
    } else {
      this.setData({ hasData: false })
    }
  },

  step(e) {
    const { band, d } = e.currentTarget.dataset
    let v = this.data[band] + Number(d)
    v = Math.max(0, Math.min(12, v))
    this.setData({ [band]: v })
  },

  setLevel(e) { this.setData({ levelPref: e.currentTarget.dataset.k }) },

  goPick() { wx.navigateTo({ url: '/pages/pick/pick' }) },
  goVolunteer() { wx.switchTab({ url: '/pages/volunteer/volunteer' }) },

  generate() {
    const m = this.data.meta
    const pref = this.data.levelPref
    this.setData({ loading: true, done: false })
    app.request('/api/report', {
      method: 'POST',
      data: { province: m.province, subject: m.subject, score: parseInt(m.score, 10), holland_answers: [] }
    }).then(r => {
      const rec = ((r && r.score) || {}).recommend || {}
      const pick = (arr, n) => {
        let a = (arr || []).slice()
        if (pref !== 'all') {
          const hit = a.filter(x => (x.school_level || '').indexOf(pref) >= 0)
          const rest = a.filter(x => (x.school_level || '').indexOf(pref) < 0)
          a = hit.concat(rest)   // 命中层次的排前面，不够再补其它
        }
        return a.slice(0, n).map(x => ({
          school: x.school, major: x.major, level: x.school_level,
          minScore: x.min_score, minRank: x.min_rank
        }))
      }
      const result = {
        chong: pick(rec.chong, this.data.chong),
        wen: pick(rec.wen, this.data.wen),
        bao: pick(rec.bao, this.data.bao)
      }
      const all = [].concat(result.chong, result.wen, result.bao)
      const total = all.length
      // 写入选校单（去重）
      const fav = wx.getStorageSync('jb_fav') || []
      const exist = {}
      fav.forEach(f => { exist[f.school] = 1 })
      all.forEach(it => {
        if (!exist[it.school]) {
          fav.unshift({ school: it.school, level: it.level, province: m.province, batch: 'normal', time: Date.now() })
          exist[it.school] = 1
        }
      })
      wx.setStorageSync('jb_fav', fav)
      try { require('../../utils/fav.js').push() } catch (e) {}
      this.setData({ loading: false, done: true, result, total })
      wx.showToast({ title: '已生成 ' + total + ' 所', icon: 'success' })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '生成失败，请重试', icon: 'none' })
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
