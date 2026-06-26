const app = getApp()
const fav = require('../../utils/fav.js')

const BATCHES = [
  { key: 'early', name: '提前批', icon: '🔴',
    desc: '军校/公安/飞行员/公费师范生/强基计划等' },
  { key: 'normal', name: '普通批', icon: '🟡',
    desc: '本科一批/二批等常规录取' },
  { key: 'vocational', name: '专科批', icon: '🟢',
    desc: '高职高专批次' }
]

Page({
  data: {
    list: [],
    batches: [],
    totalCount: 0,
    showMove: false,
    moveSchool: '',
    moveFrom: ''
  },

  onShow() {
    app.ensureLogin(() => {
      fav.pull(raw => this._render(raw))
    })
  },

  _render(raw) {
    const list = raw || []
    // 按批次分组，batch 字段缺失的默认归入普通批
    const groups = {}
    BATCHES.forEach(b => { groups[b.key] = [] })
    list.forEach(s => {
      const batch = s.batch && groups[s.batch] ? s.batch : 'normal'
      groups[batch].push(s)
    })

    // 试取批次线（用存储的省份+科类，默认内蒙古物理类）
    const ctx = wx.getStorageSync('jb_report')
    const province = (ctx && ctx.meta && ctx.meta.province) || '内蒙古'

    const batches = BATCHES.map(b => {
      const schools = groups[b.key] || []
      return { ...b, schools }
    })

    this.setData({
      list, batches, totalCount: list.length
    })
  },

  remove(e) {
    const school = e.currentTarget.dataset.school
    const f = fav.local().filter(x => x.school !== school)
    fav.saveLocal(f)
    fav.push()
    this._render(f)
  },

  // 移动院校到其他批次
  moveBatch(e) {
    const school = e.currentTarget.dataset.school
    const from = e.currentTarget.dataset.batch || 'normal'
    this.setData({ showMove: true, moveSchool: school, moveFrom: from })
  },

  doMove(e) {
    const to = e.currentTarget.dataset.to
    const f = fav.local().map(x => {
      if (x.school === this.data.moveSchool) return { ...x, batch: to }
      return x
    })
    fav.saveLocal(f)
    fav.push()
    this.setData({ showMove: false })
    this._render(f)
  },

  closeMove() { this.setData({ showMove: false }) },

  // 多份志愿表管理
  savePlan() {
    if (!this.data.totalCount) { wx.showToast({ title: '选校单为空', icon: 'none' }); return }
    const plans = wx.getStorageSync('jb_plans') || []
    const name = '方案' + (plans.length + 1) + ' (' + new Date().toLocaleDateString() + ')'
    plans.unshift({ name, schools: fav.local(), time: Date.now() })
    wx.setStorageSync('jb_plans', plans.slice(0, 10))
    wx.showToast({ title: '已保存: ' + name, icon: 'success' })
  },

  loadPlan(e) {
    const idx = e.currentTarget.dataset.idx
    const plans = wx.getStorageSync('jb_plans') || []
    const plan = plans[idx]
    if (!plan || !plan.schools) return
    wx.showModal({
      title: '加载志愿方案',
      content: '将替换当前选校单为「' + plan.name + '」（' + plan.schools.length + '所）',
      success: r => {
        if (r.confirm) {
          fav.saveLocal(plan.schools)
          fav.push()
          this._render(plan.schools)
        }
      }
    })
  },

  deletePlan(e) {
    const idx = e.currentTarget.dataset.idx
    const plans = wx.getStorageSync('jb_plans') || []
    plans.splice(idx, 1)
    wx.setStorageSync('jb_plans', plans)
    this.setData({ savedPlans: plans })
  },

  showPlans() {
    const plans = wx.getStorageSync('jb_plans') || []
    if (!plans.length) { wx.showToast({ title: '暂无保存的方案', icon: 'none' }); return }
    const items = plans.map((p, i) => (i + 1) + '. ' + p.name + '（' + p.schools.length + '所）')
    wx.showActionSheet({
      itemList: items,
      success: r => {
        const plan = plans[r.tapIndex]
        wx.showModal({
          title: '加载「' + plan.name + '」',
          content: '将替换当前选校单？',
          success: res => {
            if (res.confirm) {
              fav.saveLocal(plan.schools)
              fav.push()
              this._render(plan.schools)
            }
          }
        })
      }
    })
  },

  // 志愿诊断（升级版：梯度断层+批次合理性+选科提示）
  diagnose() {
    const { batches } = this.data
    const early = batches.find(b => b.key === 'early').schools.length
    const normal = batches.find(b => b.key === 'normal').schools.length
    const voc = batches.find(b => b.key === 'vocational').schools.length
    const total = early + normal + voc
    if (!total) { wx.showToast({ title: '选校单为空，先去加院校', icon: 'none' }); return }

    const issues = [], goods = [], warns = []
    if (total < 8) issues.push('院校数量偏少（建议≥8所）')
    else if (total > 25) issues.push('院校偏多（建议≤20所）')
    else goods.push('院校数量合理（' + total + '所）')

    if (early === 0) warns.push('提前批为空——军校/公费师范生/强基计划可在此批填报')
    if (normal < 3) issues.push('普通批院校不足（建议≥5所）')
    if (voc === 0 && normal > 0) goods.push('专科批无院校（若目标为本科，属正常）')

    // 梯度断层检测
    const allSchools = batches.flatMap(b => b.schools)
    const elite = allSchools.filter(s => (s.level || '').match(/985|211|双一流/)).length
    const key = allSchools.filter(s => (s.level || '').match(/省重点|公办/)).length
    const reg = total - elite - key

    if (elite > total * 0.6) issues.push('985/211占比过高→冲太猛，滑档风险大')
    else if (elite === 0 && total > 5) warns.push('没有985/211院校→可适当冲刺1-2所')
    else if (elite > 0 && reg > 0) goods.push('冲刺/稳妥/保底梯度分布合理')

    // 批次错位检测
    const earlyElite = batches.find(b => b.key === 'early').schools.filter(s => (s.level || '').match(/985/)).length
    if (earlyElite > 3) warns.push('提前批985较多→提前批录取后普通批志愿自动作废')

    // 选科提示
    const ctx = wx.getStorageSync('jb_report')
    if (ctx && ctx.meta && ctx.meta.subject) {
      const subj = ctx.meta.subject
      if (subj === '艺术类' && !allSchools.some(s => (s.level || '').match(/艺术|美术|音乐/)))
        warns.push('科类为艺术类，但选校单中无艺术类院校')
      if (subj === '体育类' && !allSchools.some(s => (s.level || '').match(/体育/)))
        warns.push('科类为体育类，但选校单中无体育类院校')
    }

    const score = issues.length === 0 ? '优秀 🎉' : issues.length === 1 ? '良好 👍' : '待优化 ⚠️'
    const lines = [
      `📊 共${total}所：提前批${early} · 普通批${normal} · 专科批${voc}`,
      `🏫 985/211: ${elite}所 · 重点: ${key}所 · 其他: ${reg}所`,
      ''
    ]
    if (goods.length) lines.push(...goods.map(g => `✅ ${g}`))
    if (warns.length) lines.push(...warns.map(w => `💡 ${w}`))
    if (issues.length) lines.push(...issues.map(i => `⚠️ ${i}`))

    wx.showModal({
      title: `志愿诊断: ${score}`,
      content: lines.join('\n'),
      showCancel: false, confirmText: '知道了'
    })
  },

  goSchool(e) {
    wx.navigateTo({ url: '/pages/school/school?name=' + encodeURIComponent(e.currentTarget.dataset.school) })
  },

  goSearch() { wx.switchTab({ url: '/pages/search/search' }) },

  goPick() { wx.navigateTo({ url: '/pages/autofill/autofill' }) },

  goCompare() { wx.navigateTo({ url: '/pages/compare/compare' }) },

  onShareAppMessage() {
    const n = this.data.totalCount
    const title = n ? ('我用九色鹿整理了 ' + n + ' 所院校的志愿表，冲稳保科学填报') : '九色鹿前程助手 · 智能选校，科学填志愿'
    return { title, path: '/pages/index/index' }
  },

  onShareTimeline() {
    const n = this.data.totalCount
    return { title: n ? ('我的志愿表已选 ' + n + ' 所院校 · 九色鹿前程助手') : '九色鹿前程助手 · 科学填志愿' }
  }
})
