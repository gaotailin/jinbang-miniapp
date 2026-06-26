const app = getApp()
const favSync = require('../../utils/fav.js')

// 源数据里 college_majors 很多是招生专业组拼接串（含括号注释、「、」分隔、结尾"等"）
// → 去注释、拆分、去重，清成干净的单专业列表
function cleanMajors(rows) {
  const seen = {}, out = []
  ;(rows || []).forEach(m => {
    let s = m.major || ''
    if (!s) return
    s = s.replace(/[（(][^（()）]*[)）]/g, '')   // 去成对括号注释
         .replace(/[（(].*$/, '')               // 去残留未闭合括号
    s.split(/[、,，;；]/).forEach(part => {
      const name = part.replace(/等$/, '').trim()
      if (name.length >= 2 && !seen[name]) { seen[name] = 1; out.push(name) }
    })
  })
  return out
}

Page({
  data: { name: '', level: '', province: '', majors: [], history: [], loading: true,
          intro: '', softRank: '', avgSalary: '', empRate: '',
          hasGrad: false, masterN: 0, doctorN: 0, ugMajorN: 0, website: '' },

  onLoad(q) {
    const name = decodeURIComponent(q.name || '')
    this.setData({ name })
    wx.setNavigationBarTitle({ title: name || '院校详情' })
    // 院校富内容(简介/软科/均薪/就业率/研究生信息)经 /api/sql 取 college_detail 完整行
    const safe = name.replace(/'/g, '')
    const dq = "SELECT province,city,intro,ranking_soft_science,avg_salary,employment_rate,"
      + "has_graduate_school,master_programs,doctor_programs,undergraduate_majors,website "
      + "FROM college_detail WHERE school='" + safe + "' LIMIT 1"
    Promise.all([
      app.request('/api/scoreline_history', { data: { school: name } }).catch(() => []),
      app.request('/api/college_majors', { data: { school: name } }).catch(() => []),
      app.request('/api/sql', { data: { q: dq } }).catch(() => [])
    ]).then(([rows, majors, detail]) => {
      rows = rows || []
      const level = (rows.find(r => r.school_level) || {}).school_level || ''
      const history = rows.filter(r => r.min_score)
        .sort((a, b) => (b.year - a.year) || (b.min_score - a.min_score))
        .slice(0, 50)
      const mj = cleanMajors(majors)
      const d = ((detail && (detail.rows || detail.data || detail)) || [])[0] || {}
      this.setData({
        level, history, majors: mj, loading: false,
        province: d.province || d.city || '',
        intro: d.intro || '',
        softRank: d.ranking_soft_science || '',
        avgSalary: d.avg_salary || '',
        empRate: d.employment_rate || '',
        hasGrad: !!d.has_graduate_school,
        masterN: d.master_programs || 0,
        doctorN: d.doctor_programs || 0,
        ugMajorN: d.undergraduate_majors || 0,
        website: d.website || ''
      })
    })
  },

  copySite() {
    if (!this.data.website) return
    wx.setClipboardData({ data: this.data.website, success: () => wx.showToast({ title: '官网已复制', icon: 'none' }) })
  },

  favorite() {
    const fav = wx.getStorageSync('jb_fav') || []
    if (!fav.find(x => x.school === this.data.name)) {
      fav.unshift({ school: this.data.name, level: this.data.level, province: this.data.province, batch: 'normal', time: Date.now() })
      wx.setStorageSync('jb_fav', fav)
      favSync.push()
      wx.showToast({ title: '已加入选校单', icon: 'success' })
    } else {
      wx.showToast({ title: '已在选校单中', icon: 'none' })
    }
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
