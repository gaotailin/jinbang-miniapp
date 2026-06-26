const app = getApp()

Page({
  data: { fav: [], selected: [], cols: [], rows: [], loading: false },

  onShow() {
    this.setData({ fav: wx.getStorageSync('jb_fav') || [] })
  },

  toggle(e) {
    const name = e.currentTarget.dataset.name
    let sel = this.data.selected.slice()
    if (sel.indexOf(name) >= 0) {
      sel = sel.filter(x => x !== name)
    } else {
      if (sel.length >= 3) { wx.showToast({ title: '最多对比 3 所', icon: 'none' }); return }
      sel.push(name)
    }
    this.setData({ selected: sel })
    this.build()
  },

  build() {
    const sel = this.data.selected
    if (sel.length < 2) { this.setData({ cols: [], rows: [] }); return }
    this.setData({ loading: true })
    const favMap = {}
    this.data.fav.forEach(f => { favMap[f.school] = f })
    Promise.all(sel.map(name => Promise.all([
      app.request('/api/college_detail', { data: { name: name } }).catch(() => []),
      app.request('/api/scoreline_history', { data: { school: name } }).catch(() => [])
    ]))).then(results => {
      const cols = sel.map((name, i) => {
        const d = (results[i][0] || [])[0] || {}
        const scores = (results[i][1] || []).map(r => r.min_score).filter(s => s != null)
        return {
          name,
          level: (favMap[name] && favMap[name].level) || d.level || '',
          city: d.city || d.province || '',
          soft: d.ranking_soft_science || '',
          salary: d.avg_salary || '',
          emp: d.employment_rate || '',
          doctor: d.doctor_programs,
          grad: d.has_graduate_school,
          minScore: scores.length ? Math.min.apply(null, scores) : null
        }
      })
      const metric = (label, key, suffix) => ({
        label, vals: cols.map(c => (c[key] != null && c[key] !== '') ? (c[key] + (suffix || '')) : '—')
      })
      const rows = [
        metric('办学层次', 'level', ''),
        metric('所在城市', 'city', ''),
        metric('软科排名', 'soft', ''),
        metric('平均薪酬', 'salary', '元'),
        metric('就业率', 'emp', '%'),
        metric('博士点', 'doctor', '个'),
        { label: '研究生院', vals: cols.map(c => c.grad ? '有' : '—') },
        metric('最低投档', 'minScore', '分')
      ]
      this.setData({ cols, rows, loading: false })
    }).catch(() => { this.setData({ loading: false }); wx.showToast({ title: '对比数据加载失败', icon: 'none' }) })
  },

  goSearch() { wx.switchTab({ url: '/pages/search/search' }) }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
