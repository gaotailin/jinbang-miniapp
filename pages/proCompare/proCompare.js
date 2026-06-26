const app = getApp()

Page({
  data: { keyword: '', results: [], searched: false, loading: false, selected: [], rows: [] },

  onInput(e) { this.setData({ keyword: e.detail.value }) },

  doSearch() {
    const kw = (this.data.keyword || '').trim()
    if (!kw) { wx.showToast({ title: '请输入专业名', icon: 'none' }); return }
    this.setData({ loading: true, searched: true, results: [] })
    app.request('/api/major_detail', { data: { major: kw } })
      .then(rows => {
        const selNames = this.data.selected.map(s => s.name)
        const results = (rows || []).map(m => ({
          name: m.major_name || m.major || '',
          category: m.category || '',
          degree: m.degree || '',
          level: m.level || '',
          years: m.study_years || '',
          emp: m.employment_rate || '',
          salary: m.salary_avg || '',
          courses: m.courses || '',
          inSel: selNames.indexOf(m.major_name || m.major || '') >= 0
        })).filter(x => x.name)
        // 同名去重
        const seen = {}, uniq = []
        results.forEach(r => { if (!seen[r.name]) { seen[r.name] = 1; uniq.push(r) } })
        this.setData({ results: uniq.slice(0, 30), loading: false })
      })
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '查询失败', icon: 'none' }) })
  },

  add(e) {
    const i = e.currentTarget.dataset.idx
    const m = this.data.results[i]
    if (!m || m.inSel) return
    if (this.data.selected.length >= 3) { wx.showToast({ title: '最多对比 3 个', icon: 'none' }); return }
    const selected = this.data.selected.concat([m])
    this.setData({ selected, [`results[${i}].inSel`]: true })
    this.build(selected)
  },

  removeSel(e) {
    const name = e.currentTarget.dataset.name
    const selected = this.data.selected.filter(x => x.name !== name)
    const results = this.data.results.map(r => r.name === name ? { ...r, inSel: false } : r)
    this.setData({ selected, results })
    this.build(selected)
  },

  build(selected) {
    if (selected.length < 2) { this.setData({ rows: [] }); return }
    const metric = (label, key, suffix) => ({
      label, vals: selected.map(c => (c[key] != null && c[key] !== '') ? (c[key] + (suffix || '')) : '—')
    })
    this.setData({
      rows: [
        metric('门类', 'category', ''),
        metric('学位', 'degree', ''),
        metric('层次', 'level', ''),
        metric('学制', 'years', ''),
        metric('就业率', 'emp', '%'),
        metric('平均薪酬', 'salary', '元')
      ]
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
