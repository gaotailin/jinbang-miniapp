const app = getApp()
const favSync = require('../../utils/fav.js')

// SQL 转义：单引号双写（与 search 页统一的防御式处理，替代粗暴删引号）
function sqlEscape(v) { return String(v == null ? '' : v).replace(/'/g, "''") }

// 属地展示：对标掌上高考「省 + 完整行政区名」（如 贵州黔南布依族苗族自治州、河南省直辖县级行政区划）。
// 不改库、仅前端拼接；直辖市/city 已含省名时去重，避免「北京北京」「上海上海市」。
function buildRegion(province, city) {
  const p = String(province || '').trim()
  const c = String(city || '').trim()
  if (!c) return p
  if (!p) return c
  if (c === p || c.indexOf(p) === 0) return c      // 北京/北京、上海市已含上海、自治州等已带省名
  return p + c
}

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
  data: { name: '', level: '', province: '', majors: [], history: [], groups: [], loading: true,
          intro: '', softRank: '', softRankText: '', softRankLbl: '', avgSalary: '', empRate: '',
          hasGrad: false, masterN: 0, doctorN: 0, ugMajorN: 0, website: '', phone: '', address: '',
          honorTags: [], schoolType: '', region: '', inFav: false, schoolNature: '', hasTuimian: false,
          hasMaster: false, hasDoctor: false },

  onLoad(q) {
    const name = decodeURIComponent(q.name || '')
    this.setData({ name })
    wx.setNavigationBarTitle({ title: name || '院校详情' })
    // 院校富内容(简介/软科/均薪/就业率/研究生信息)经 /api/sql 取 college_detail 完整行
    const safe = sqlEscape(name)
    const dq = "SELECT province,city,school_type,is_985,is_211,is_double_first_class,intro,ranking_soft_science,ranking_board,ranking_label,avg_salary,employment_rate,"
      + "has_graduate_school,master_programs,doctor_programs,undergraduate_majors,website,phone,address,school_nature,has_tuimian,has_master,has_doctor "
      + "FROM college_detail WHERE school='" + safe + "' LIMIT 1"
    Promise.all([
      app.request('/api/scoreline_history', { data: { school: name } }).catch(() => []),
      app.request('/api/college_majors', { data: { school: name } }).catch(() => []),
      app.request('/api/sql', { data: { q: dq } }).catch(() => []),
      app.request('/api/school_groups', { data: { school: name } }).catch(() => [])
    ]).then(([rows, majors, detail, groups]) => {
      rows = rows || []
      const level = (rows.find(r => r.school_level) || {}).school_level || ''
      const history = rows.filter(r => r.min_score)
        .sort((a, b) => (b.year - a.year) || (b.min_score - a.min_score))
        .slice(0, 50)
      const mj = cleanMajors(majors)
      const grp = (groups || []).filter(g => g.min_score)
        .sort((a, b) => (a.province === b.province
          ? (a.subject === b.subject ? b.min_score - a.min_score : (a.subject < b.subject ? -1 : 1))
          : (a.province < b.province ? -1 : 1)))
        .slice(0, 60)
      const d = ((detail && (detail.rows || detail.data || detail)) || [])[0] || {}
      // 是否已在选校单（吸底按钮态）
      const inFav = (wx.getStorageSync('jb_fav') || []).some(x => x.school === (d.school || name))
      // 头部身份标签：985/211/双一流（有才显示，与搜索卡片口径一致）
      const honorTags = []
      if (d.is_985) honorTags.push('985')
      if (d.is_211) honorTags.push('211')
      if (d.is_double_first_class) honorTags.push('双一流')
      // 属地：对标掌上高考「省 + 完整行政区名」拼接；city 缺省回退省份
      const region = buildRegion(d.province, d.city || d.province)
      this.setData({
        level, history, majors: mj, groups: grp, loading: false,
        honorTags, inFav,
        schoolType: d.school_type || '',
        region,
        province: d.province || d.city || '',
        intro: d.intro || '',
        softRank: d.ranking_soft_science || '',
        softRankText: (function (rk, lab) {
          if (!rk || rk <= 0) return ''
          return (lab || String(rk)) + ''
        })(d.ranking_soft_science, d.ranking_label),
        softRankLbl: (function (board) {
          var b = (board || '').trim()
          if (!b || b.indexOf('中国大学排名') === 0) return '软科排名'
          return '软科' + b.replace('高职-', '高职').replace(/类$/, '') + '排名'
        })(d.ranking_board),
        avgSalary: d.avg_salary ? Number(d.avg_salary).toLocaleString('en-US') : '',
        empRate: d.employment_rate || '',
        hasGrad: !!d.has_graduate_school,
        masterN: d.master_programs || 0,
        doctorN: d.doctor_programs || 0,
        ugMajorN: d.undergraduate_majors || 0,
        website: d.website || '',
        phone: (d.phone || '').trim(),
        address: (d.address || '').trim(),
        schoolNature: d.school_nature || '',
        hasTuimian: !!d.has_tuimian,
        hasMaster: !!d.has_master,
        hasDoctor: !!d.has_doctor
      })
    })
  },

  copySite() {
    if (!this.data.website) return
    wx.setClipboardData({ data: this.data.website, success: () => wx.showToast({ title: '官网已复制', icon: 'none' }) })
  },

  copyPhone() {
    const raw = this.data.phone || ''
    const m = raw.match(/[0-9][0-9\-]{6,19}/)
    if (!m) return
    const p = m[0]
    wx.makePhoneCall({ phoneNumber: p, fail: () => {
      wx.setClipboardData({ data: p, success: () => wx.showToast({ title: '电话已复制', icon: 'none' }) })
    } })
  },

  favorite() {
    let fav = wx.getStorageSync('jb_fav') || []
    const idx = fav.findIndex(x => x.school === this.data.name)
    if (idx < 0) {
      fav.unshift({ school: this.data.name, level: this.data.level, province: this.data.province, batch: 'normal', time: Date.now() })
      wx.setStorageSync('jb_fav', fav)
      favSync.push()
      this.setData({ inFav: true })
      wx.showToast({ title: '已加入选校单', icon: 'success' })
    } else {
      fav.splice(idx, 1)
      wx.setStorageSync('jb_fav', fav)
      favSync.push()
      this.setData({ inFav: false })
      wx.showToast({ title: '已移选校单', icon: 'none' })
    }
  }
,
  onShareAppMessage() {
    const n = this.data.name || ''
    return {
      title: n ? (n + ' 院校详情 · 录取分数与专业') : '九色鹿前程助手 — AI智能选校',
      path: '/pages/school/school?name=' + encodeURIComponent(n)
    }
  },
  onShareTimeline() {
    return { title: '试试这个AI选校助手，高考升学一站搞定' }
  },
})
