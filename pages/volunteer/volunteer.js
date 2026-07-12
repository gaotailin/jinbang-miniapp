const app = getApp()
const fav = require('../../utils/fav.js')
const vRules = require('../../utils/volunteerRules.js')

const BATCHES = [
  { key: 'early', name: '提前批', icon: '🔴',
    desc: '军校/公安/飞行员/公费师范生/强基计划等' },
  { key: 'normal', name: '普通批', icon: '🟡',
    desc: '本科一批/二批等常规录取' },
  { key: 'vocational', name: '专科批', icon: '🟢',
    desc: '高职高专批次' }
]

const TIER_NAMES = { chong: '冲', wen: '稳', bao: '保' }

Page({
  data: {
    view: 'fav',            // fav=选校单 | sim=模拟填报
    list: [],
    batches: [],
    totalCount: 0,
    showMove: false,
    moveSchool: '',
    moveFrom: '',
    // 模拟填报
    simProvince: '',
    simSupported: vRules.supported(),
    rule: null,
    simList: [],
    simScore: 0
  },

  onShow() {
    app.ensureLogin(() => {
      fav.pull(raw => this._render(raw))
    })
    this.initSim()
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

    const batches = BATCHES.map(b => {
      const schools = groups[b.key] || []
      return { ...b, schools }
    })

    this.setData({
      list, batches, totalCount: list.length
    })
  },

  switchView(e) {
    this.setData({ view: e.currentTarget.dataset.v })
  },

  // ========== 模拟填报（P1：内蒙古/河南/山东，按省真实志愿表结构） ==========

  initSim() {
    const ctx = wx.getStorageSync('jb_report')
    const province = this.data.simProvince ||
      (ctx && ctx.meta && ctx.meta.province) || '内蒙古'
    const score = (ctx && ctx.meta && ctx.meta.score) || 0
    this.simSubject = (ctx && ctx.meta && ctx.meta.subject) || ''
    this._setSimProvince(province, score)
  },

  _setSimProvince(province, score) {
    const rule = vRules.getRule(province)
    const simList = rule ? (wx.getStorageSync('jb_sim_' + province) || []) : []
    this.setData({
      simProvince: province, rule, simList,
      simScore: score || this.data.simScore
    })
  },

  chooseSimProvince() {
    const items = this.data.simSupported
    wx.showActionSheet({
      itemList: items,
      success: r => this._setSimProvince(items[r.tapIndex])
    })
  },

  _saveSim() {
    wx.setStorageSync('jb_sim_' + this.data.simProvince, this.data.simList)
  },

  // 一键按冲稳保生成（数据源=最近一次测评报告的推荐结果，非编造）
  genFromReport() {
    const { rule, simProvince } = this.data
    if (!rule) return
    const ctx = wx.getStorageSync('jb_report')
    const rec = ctx && ctx.score && ctx.score.recommend
    if (!rec || (!rec.chong && !rec.wen && !rec.bao)) {
      wx.showModal({
        title: '还没有冲稳保结果',
        content: '先在「按分选校」或测评里查一次冲稳保，结果会自动带到这里。',
        showCancel: false, confirmText: '知道了'
      })
      return
    }
    const repProvince = ctx.meta && ctx.meta.province
    if (repProvince && repProvince !== simProvince) {
      wx.showToast({ title: '推荐结果是' + repProvince + '的，已按当前省结构填入，仅供参考', icon: 'none', duration: 2500 })
    }
    // 冲:稳:保 ≈ 25%:50%:25%，不足不硬凑
    const cap = { chong: Math.floor(rule.slots * 0.25), wen: Math.ceil(rule.slots * 0.5), bao: Math.floor(rule.slots * 0.25) }
    const entries = []
    ;['chong', 'wen', 'bao'].forEach(k => {
      (rec[k] || []).slice(0, cap[k]).forEach(it => {
        entries.push({
          school: it.school,
          majors: it.major ? [it.major] : [],
          tier: k, tierName: TIER_NAMES[k],
          minScore: it.ref_score || null,
          adjust: rule.adjustable
        })
      })
    })
    if (!entries.length) { wx.showToast({ title: '推荐结果为空', icon: 'none' }); return }
    const overwrite = () => {
      this.setData({ simList: entries.slice(0, rule.slots) })
      this._saveSim()
      wx.showToast({ title: '已生成 ' + Math.min(entries.length, rule.slots) + ' 个志愿', icon: 'success' })
    }
    if (this.data.simList.length) {
      wx.showModal({
        title: '覆盖当前志愿表？',
        content: '将用冲稳保结果重新生成（当前已填 ' + this.data.simList.length + ' 个）',
        success: r => { if (r.confirm) overwrite() }
      })
    } else overwrite()
  },

  // 从选校单追加（不覆盖，跳过已有院校）
  importFromFav() {
    const { rule, simList } = this.data
    if (!rule) return
    const favList = fav.local()
    if (!favList.length) { wx.showToast({ title: '选校单为空', icon: 'none' }); return }
    const exist = {}
    simList.forEach(x => { exist[x.school] = 1 })
    const add = favList.filter(s => !exist[s.school]).map(s => ({
      school: s.school, majors: [], tier: '', tierName: '',
      minScore: s.minScore || null, adjust: rule.adjustable
    }))
    if (!add.length) { wx.showToast({ title: '选校单院校都已在表中', icon: 'none' }); return }
    const merged = simList.concat(add).slice(0, rule.slots)
    this.setData({ simList: merged })
    this._saveSim()
    wx.showToast({ title: '已带入 ' + Math.min(add.length, rule.slots - simList.length) + ' 所', icon: 'success' })
  },

  addManual() {
    const { rule, simList } = this.data
    if (!rule) return
    if (simList.length >= rule.slots) { wx.showToast({ title: '已满 ' + rule.slots + ' 个志愿', icon: 'none' }); return }
    wx.showModal({
      title: '添加志愿',
      editable: true,
      placeholderText: rule.mode === 'majorFirst' ? '院校名，如: 山东大学' : '院校名，如: 郑州大学',
      success: r => {
        const name = r.confirm && (r.content || '').trim()
        if (!name) return
        const merged = simList.concat([{
          school: name, majors: [], tier: '', tierName: '',
          minScore: null, adjust: rule.adjustable
        }])
        this.setData({ simList: merged })
        this._saveSim()
      }
    })
  },

  removeSim(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const simList = this.data.simList.slice()
    simList.splice(idx, 1)
    this.setData({ simList })
    this._saveSim()
  },

  moveSim(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const dir = Number(e.currentTarget.dataset.dir)  // -1 上移 / 1 下移
    const simList = this.data.simList.slice()
    const to = idx + dir
    if (to < 0 || to >= simList.length) return
    ;[simList[idx], simList[to]] = [simList[to], simList[idx]]
    this.setData({ simList })
    this._saveSim()
  },

  toggleAdjust(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const key = 'simList[' + idx + '].adjust'
    this.setData({ [key]: !this.data.simList[idx].adjust })
    this._saveSim()
  },

  clearSim() {
    if (!this.data.simList.length) return
    wx.showModal({
      title: '清空模拟志愿表？',
      content: '将删除「' + this.data.simProvince + '」已填的 ' + this.data.simList.length + ' 个志愿',
      success: r => {
        if (r.confirm) { this.setData({ simList: [] }); this._saveSim() }
      }
    })
  },

  // 校验：数量/重复/梯度断层/冲稳保结构/批次线资格
  validateSim() {
    const { rule, simList, simProvince, simScore } = this.data
    if (!rule) return
    if (!simList.length) { wx.showToast({ title: '志愿表为空', icon: 'none' }); return }

    const issues = [], goods = [], warns = []

    // 数量
    if (simList.length < Math.min(10, rule.slots)) warns.push('仅填 ' + simList.length + '/' + rule.slots + ' 个——平行志愿建议填满，多一个志愿多一分保障')
    else goods.push('已填 ' + simList.length + '/' + rule.slots + ' 个志愿')

    // 重复
    const seen = {}, dup = []
    simList.forEach(x => {
      const k = x.school + '|' + (x.majors || []).join(',')
      if (seen[k]) dup.push(x.school); seen[k] = 1
    })
    if (dup.length) issues.push('重复志愿: ' + dup.slice(0, 3).join('、') + (dup.length > 3 ? ' 等' : ''))

    // 梯度（有参考分的条目应大体递减，断层>25分提示）
    const scored = simList.map((x, i) => ({ i: i + 1, s: x.minScore })).filter(x => x.s)
    let inversion = 0, maxGap = 0
    for (let j = 1; j < scored.length; j++) {
      if (scored[j].s > scored[j - 1].s + 5) inversion++
      const gap = scored[j - 1].s - scored[j].s
      if (gap > maxGap) maxGap = gap
    }
    if (inversion > 2) issues.push('志愿顺序有 ' + inversion + ' 处分数倒挂——平行志愿按顺序检索，高分院校应排前')
    if (maxGap > 25) warns.push('相邻志愿最大分差 ' + maxGap + ' 分——中段出现断层，建议补几所过渡院校')
    if (scored.length >= 5 && inversion <= 2 && maxGap <= 25) goods.push('梯度大体递减、无明显断层')

    // 冲稳保结构
    const tc = { chong: 0, wen: 0, bao: 0 }
    simList.forEach(x => { if (tc[x.tier] !== undefined) tc[x.tier]++ })
    const tiered = tc.chong + tc.wen + tc.bao
    if (tiered) {
      if (tc.bao === 0) issues.push('没有「保」档志愿——滑档时无兜底')
      if (tc.chong > tiered * 0.5) warns.push('「冲」占比过半——激进，建议加稳/保')
      if (tc.bao > 0 && tc.chong <= tiered * 0.5) goods.push('冲' + tc.chong + ' 稳' + tc.wen + ' 保' + tc.bao + '，结构合理')
    }

    // 批次线资格（真表 batch_line，查不到就跳过不硬拦）
    // 注意批次名各省不一：内蒙古2026「本科批」、河南「本科」、山东「一段」；
    // 必须精确匹配，模糊 indexOf('本科') 会误中「体育本科」等特殊线
    const finish = () => this._showValidateResult(goods, warns, issues)
    if (simScore) {
      const q = "SELECT year,subject,batch,score FROM batch_line WHERE province='" + simProvince +
        "' AND batch IN ('本科批','本科','一段') ORDER BY year DESC LIMIT 12"
      app.request('/api/sql', { data: { q } }).then(rows => {
        const list = rows || []
        const subj = this.simSubject
        const bk = list.find(r => r.subject === subj) ||
                   list.find(r => r.subject === '综合') || list[0]
        if (bk && simScore < bk.score) {
          warns.push('你的分数 ' + simScore + ' 低于' + bk.year + '年' + (bk.subject || '') + bk.batch + '线(' + bk.score + ')——' + rule.batchName + '录取希望小，建议同步准备专科批')
        } else if (bk) {
          goods.push('分数 ' + simScore + ' 过' + bk.year + '年' + (bk.subject || '') + bk.batch + '线(' + bk.score + ')，具备' + rule.batchName + '资格')
        }
        finish()
      }).catch(finish)
    } else {
      warns.push('未获取到你的分数——先做一次测评/按分选校，可校验批次线资格')
      finish()
    }
  },

  _showValidateResult(goods, warns, issues) {
    const score = issues.length === 0 ? '通过 ✅' : '有 ' + issues.length + ' 个问题 ⚠️'
    const lines = []
    if (goods.length) lines.push(...goods.map(g => '✅ ' + g))
    if (warns.length) lines.push(...warns.map(w => '💡 ' + w))
    if (issues.length) lines.push(...issues.map(i => '⚠️ ' + i))
    lines.push('', '（选科要求校验将在后端接口上线后加入）')
    wx.showModal({
      title: '志愿表校验: ' + score,
      content: lines.join('\n'),
      showCancel: false, confirmText: '知道了'
    })
  },

  // 导出文本志愿表到剪贴板
  exportSim() {
    const { rule, simList, simProvince } = this.data
    if (!simList.length) { wx.showToast({ title: '志愿表为空', icon: 'none' }); return }
    const lines = [simProvince + ' · ' + rule.batchName + ' 模拟志愿表（' + rule.modeName + '）',
      '共 ' + simList.length + '/' + rule.slots + ' 个志愿 · 九色鹿前程助手', '']
    simList.forEach((x, i) => {
      let l = (i + 1) + '. ' + x.school
      if (x.majors && x.majors.length) l += ' [' + x.majors.join('/') + ']'
      if (x.tierName) l += ' (' + x.tierName + ')'
      if (x.minScore) l += ' 参考' + x.minScore + '分'
      if (rule.adjustable) l += x.adjust ? ' 服从调剂' : ' 不服从调剂'
      lines.push(l)
    })
    wx.setClipboardData({
      data: lines.join('\n'),
      success: () => wx.showToast({ title: '志愿表已复制', icon: 'success' })
    })
  },

  goSimSchool(e) {
    wx.navigateTo({ url: '/pages/school/school?name=' + encodeURIComponent(e.currentTarget.dataset.school) })
  },

  // ========== 以下为原选校单逻辑 ==========

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
