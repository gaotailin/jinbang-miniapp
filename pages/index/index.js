const app = getApp()

Page({
  data: {
    days: 0,
    dotPos: 62,  // 曲线发光点位置(%)
    category: 'normal',  // 'normal' | 'art'
    hasData: false,
    profile: { province: '北京', subject: '物理类', score: '--', rank: '--' },
    bands: { chong: '--', wen: '--', bao: '--' },
    rankBoards: []  // 首页高校排行榜预览（对标掌上）
  },

  onShow() {
    const now = new Date()
    let year = now.getFullYear()
    if (now > new Date(year + '-06-07T00:00:00')) year++
    const gaokao = new Date(year + '-06-07T00:00:00')
    const days = Math.max(0, Math.ceil((gaokao - now) / 86400000))

    // 读用户成绩
    const r = wx.getStorageSync('jb_report')
    let hasData = false, profile = { province: '北京', subject: '物理类', score: '--', rank: '--' }, bands = { chong: '--', wen: '--', bao: '--' }
    if (r && r.meta) {
      hasData = true
      profile = {
        province: r.meta.province || '北京',
        subject: r.meta.subject || '物理类',
        score: r.meta.score || '--',
        rank: (r.score && r.score.user_rank) ? r.score.user_rank : '--'
      }
      if (r.score && r.score.recommend) {
        bands = {
          chong: r.score.recommend.chong ? r.score.recommend.chong.length : '--',
          wen: r.score.recommend.wen ? r.score.recommend.wen.length : '--',
          bao: r.score.recommend.bao ? r.score.recommend.bao.length : '--'
        }
      }
    }

    // 曲线点位置：按分数在 200-750 区间归一化
    let dotPos = 62
    if (hasData && profile.score !== '--') {
      const s = parseInt(profile.score, 10)
      dotPos = Math.max(18, Math.min(82, 20 + (s - 200) / 550 * 64))
    }
    this.setData({ days, hasData, profile, bands, dotPos }, () => {
      if (hasData) this.drawViz()
    })

    if (!this.data.rankBoards.length) this.loadRankBoards()
  },

  // 首页高校排行榜预览：软科 + 薪酬 两榜各取 top4（复用 ranking 页同源 /api/sql）
  loadRankBoards() {
    const boards = [
      { key: 'soft', title: '软科中国最好大学', unit: '',
        q: 'SELECT school,ranking_soft_science AS v,school_level FROM college_detail WHERE ranking_soft_science>0 ORDER BY ranking_soft_science ASC LIMIT 4' },
      { key: 'salary', title: '毕业薪酬最高', unit: '元',
        q: 'SELECT school,avg_salary AS v,school_level FROM college_detail WHERE avg_salary>0 ORDER BY avg_salary DESC LIMIT 4' }
    ]
    Promise.all(boards.map(b =>
      app.request('/api/sql', { data: { q: b.q } })
        .then(res => {
          const rows = res.rows || res.data || res || []
          return {
            key: b.key, title: b.title,
            items: rows.map((r, i) => ({
              rank: i + 1,
              school: r.school,
              metric: b.key === 'soft' ? ('软科第 ' + r.v) : (r.v + b.unit)
            }))
          }
        })
        .catch(() => null)
    )).then(list => {
      const rankBoards = list.filter(b => b && b.items.length)
      if (rankBoards.length) this.setData({ rankBoards })
    })
  },

  // 绘制 Hero 分数分布曲线（canvas 真图，零后端）
  drawViz() {
    wx.createSelectorQuery().in(this).select('#vizCanvas')
      .fields({ node: true, size: true }).exec(res => {
        if (!res || !res[0] || !res[0].node) return
        const cvs = res[0].node, W = res[0].width, H = res[0].height
        const ctx = cvs.getContext('2d')
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2
        cvs.width = W * dpr; cvs.height = H * dpr
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, W, H)

        const padX = 6, baseY = H - 4, topPad = 8
        const mu = W * 0.5, sigma = W * 0.26, amp = H - topPad - 6
        const yAt = x => baseY - amp * Math.exp(-Math.pow(x - mu, 2) / (2 * sigma * sigma))

        // 曲线下渐变填充
        ctx.beginPath()
        ctx.moveTo(padX, baseY)
        for (let x = padX; x <= W - padX; x += 2) ctx.lineTo(x, yAt(x))
        ctx.lineTo(W - padX, baseY); ctx.closePath()
        const g = ctx.createLinearGradient(0, topPad, 0, baseY)
        g.addColorStop(0, 'rgba(255,140,0,0.20)')
        g.addColorStop(1, 'rgba(255,140,0,0.01)')
        ctx.fillStyle = g; ctx.fill()

        // 曲线描边
        ctx.beginPath()
        ctx.moveTo(padX, yAt(padX))
        for (let x = padX; x <= W - padX; x += 2) ctx.lineTo(x, yAt(x))
        ctx.strokeStyle = 'rgba(255,140,0,0.55)'; ctx.lineWidth = 1.5; ctx.stroke()

        // 你的位置：竖向引导虚线 + 发光点
        const dotX = padX + (W - 2 * padX) * (this.data.dotPos / 100), dotY = yAt(dotX)
        ctx.beginPath(); ctx.setLineDash([3, 3])
        ctx.moveTo(dotX, dotY); ctx.lineTo(dotX, baseY)
        ctx.strokeStyle = 'rgba(255,140,0,0.35)'; ctx.lineWidth = 1; ctx.stroke()
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.shadowColor = 'rgba(255,140,0,0.85)'; ctx.shadowBlur = 10
        ctx.fillStyle = '#FF8C00'; ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
        ctx.beginPath(); ctx.fillStyle = '#fff'
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2); ctx.fill()
      })
  },

  switchCat(e) { this.setData({ category: e.currentTarget.dataset.cat }) },

  goTest() { wx.navigateTo({ url: '/pages/test/test' }) },
  goPick() { wx.navigateTo({ url: '/pages/pick/pick' }) },
  goMajor() { wx.navigateTo({ url: '/pages/major/major' }) },
  goRanking() { wx.navigateTo({ url: '/pages/ranking/ranking' }) },
  goSameScore() { wx.navigateTo({ url: '/pages/samescore/samescore' }) },
  goSearch() { wx.switchTab({ url: '/pages/search/search' }) },
  goVolunteer() { wx.switchTab({ url: '/pages/volunteer/volunteer' }) },
  goRank() { wx.navigateTo({ url: '/pages/section/section' }) },
  goBatch() { wx.navigateTo({ url: '/pages/batchline/batchline' }) },
  goWarn() { wx.navigateTo({ url: '/pages/warn/warn' }) },
  goEnrollPlan() { wx.navigateTo({ url: '/pages/enrollPlan/enrollPlan' }) },
  goServices() { wx.navigateTo({ url: '/pages/services/services' }) },
  goAutofill() { wx.navigateTo({ url: '/pages/autofill/autofill' }) },
  goArtCalc() { wx.navigateTo({ url: '/pages/artCalc/artCalc' }) },
  goArtSchools() { wx.navigateTo({ url: '/pages/artSchools/artSchools' }) },
  goGuide() { wx.navigateTo({ url: '/pages/guide/guide' }) },
  goAbout() { wx.navigateTo({ url: '/pages/about/about' }) },
  goReport() {
    if (!wx.getStorageSync('jb_report')) { wx.showToast({ title: '先做测一测', icon: 'none' }); return }
    wx.navigateTo({ url: '/pages/report/report' })
  },

  onShareAppMessage() {
    return { title: '九色鹿前程助手 · 智能选校，科学填志愿', path: '/pages/index/index' }
  },

  onShareTimeline() {
    return { title: '九色鹿前程助手 · 智能选校，科学填志愿' }
  }
})
