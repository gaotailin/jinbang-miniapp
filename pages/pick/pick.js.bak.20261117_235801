const app = getApp()
const favSync = require('../../utils/fav.js')
const vip = require('../../utils/vip.js')
// 全国省份主数据（所有省），实际开放由 DATA_READY 控制：仅 ready 省显示在 picker
const ALL_PROVINCES = ['内蒙古', '北京', '天津', '河北', '山西', '辽宁', '吉林', '黑龙江', '上海', '江苏',
  '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆']
// 冲稳保已全国化（后端 enrollment_national 303,827条/31省），全开。
// section/samescore/batchline 等仍各自独立控制 DATA_READY（仅内蒙古有一分一段等同分数据）。
const DATA_READY = ALL_PROVINCES.reduce((o, p) => { o[p] = true; return o }, {})
const PROVINCES = ALL_PROVINCES.filter(p => DATA_READY[p])   // 仅开放已就绪的省
// 位次模式需用「一分一段」(one_section)反查分数，该表目前仅内蒙古入库。
// 其它省走分数模式（分数直接交省感知的 /api/report），故位次模式暂限内蒙古。
const ONE_SECTION_READY = { '内蒙古': true }
// 3+3 新高考省：不分文理，考生只选「综合」；其余省考生选物理类/历史类（老高考省的历史数据由后端映射理/文）
const SUBJ_33 = ['北京', '天津', '上海', '山东', '浙江', '海南']
function subjectsOf(prov) {
  if (SUBJ_33.indexOf(prov) >= 0) return ['综合']
  return ['物理类', '历史类', '艺术类', '体育类']
}
const SUBJECTS = subjectsOf('北京')
const TIERS = [
  { key: 'chong', name: '冲', desc: '冲一冲' },
  { key: 'wen', name: '稳', desc: '稳一稳' },
  { key: 'bao', name: '保', desc: '保一保' }
]

// 位次比 → 录取概率%（升级版：基于掌上高考 Pro_Low/Pro_High 模型 + 波动缓冲）
function prob(ratio) {
  if (!ratio) return null
  // ratio = 院校录取位次 / 考生位次
  // ratio<1 = 院校更难（冲），ratio>1 = 院校更容易（保）
  const theta = 0.08  // 波动缓冲区间
  const proLow = 0.75 - theta   // 大概率录取下界
  const proHigh = 1.35 + theta  // 小概率录取上界

  let p
  if (ratio <= proLow) {
    p = 85 + (proLow - ratio) / proLow * 13  // 85-98%
  } else if (ratio <= 1.0) {
    p = 50 + (1.0 - ratio) / (1.0 - proLow) * 35  // 50-85%
  } else if (ratio <= 1.25) {
    p = 25 + (1.25 - ratio) / 0.25 * 25  // 25-50%
  } else if (ratio <= proHigh) {
    p = 8 + (proHigh - ratio) / (proHigh - 1.25) * 17  // 8-25%
  } else {
    p = Math.max(3, 8 - (ratio - proHigh) * 5)  // 3-8%
  }
  return Math.max(3, Math.min(98, Math.round(p)))
}

Page({
  data: {
    mode: 'score',   // 'score' | 'rank' | 'lincha'
    provinces: PROVINCES, provinceIndex: 0,
    province: '北京',
    subjects: SUBJECTS, subjectIndex: 0,
    score: '', rank: '', batchLine: '',
    tiers: TIERS, tab: 'chong',
    loading: false, done: false,
    showAdvanced: false, colorBlind: false, visionLimit: false, heightLimit: false,
    oralOptions: ['不限', '需口试合格'], oralIndex: 0,
    userRank: 0,
    result: { chong: [], wen: [], bao: [] },
    counts: { chong: 0, wen: 0, bao: 0 },
    fullCounts: { chong: 0, wen: 0, bao: 0 },
    isVipUser: false
  },

  onLoad(q) {
    if (q && q.score) this.setData({ score: q.score, mode: 'score' })
    if (q && q.rank) this.setData({ rank: q.rank, mode: 'rank' })
  },

  onShow() {
    const r = vip.remaining()
    this.setData({ remaining: r === Infinity ? '不限次' : r })
  },

  switchMode(e) { this.setData({ mode: e.currentTarget.dataset.m, done: false, result: { chong:[], wen:[], bao:[] } }) },
  onScore(e) { this.setData({ score: e.detail.value }) },
  onRank(e) { this.setData({ rank: e.detail.value }) },
  onBatchLine(e) { this.setData({ batchLine: e.detail.value }) },
  onSubject(e) { this.setData({ subjectIndex: Number(e.detail.value) }) },
  onProvince(e) {
    const i = Number(e.detail.value)
    const prov = PROVINCES[i]
    this.setData({ provinceIndex: i, province: prov, subjects: subjectsOf(prov), subjectIndex: 0 })
  },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.k }) },
  toggleAdvanced() { this.setData({ showAdvanced: !this.data.showAdvanced }) },
  toggleColorBlind() { this.setData({ colorBlind: !this.data.colorBlind }) },
  toggleVision() { this.setData({ visionLimit: !this.data.visionLimit }) },
  toggleHeight() { this.setData({ heightLimit: !this.data.heightLimit }) },
  onOral(e) { this.setData({ oralIndex: Number(e.detail.value) }) },

  // 位次 → 分数（查一分一段表）
  rankToScore(rank, subject) {
    const province = this.data.province
    const examType = subject  // 物理类/历史类 直接对应 one_section 的 exam_type
    const q = `SELECT score FROM one_section WHERE province='${province}' AND year=2025 AND exam_type='${examType}' AND cumulative_count >= ${rank} ORDER BY cumulative_count ASC LIMIT 1`
    return app.request('/api/sql', { data: { q } }).then(rows => {
      if (rows && rows.length > 0) return rows[0].score
      // 位次超出范围：取最低分数线
      return app.request('/api/sql', {
        data: { q: `SELECT MIN(score) as s FROM one_section WHERE province='${province}' AND year=2025 AND exam_type='${examType}'` }
      }).then(r2 => (r2 && r2.length > 0 ? r2[0].s : 200))
    })
  },

  query() {
    const { mode, province, score, rank, subjects, subjectIndex } = this.data
    const subject = subjects[subjectIndex]

    // 校验特殊省份数据就绪
    if (!DATA_READY[province]) {
      wx.showModal({
        title: '该省数据即将开放',
        content: '「' + province + '」的录取数据正在整理中。当前已全面支持内蒙古考生，敬请期待更多省份。',
        showCancel: false, confirmText: '知道了'
      })
      return
    }

    // 付费墙：非会员扣一次免费额度，耗尽弹引导
    if (!vip.isVip()) {
      const rem = vip.remaining()
      if (rem <= 0) {
        wx.showModal({
          title: '今日免费次数已用完',
          content: '每天 5 次免费查询，分享好友 +1 次。开通会员不限次、查看全部冲稳保院校。',
          confirmText: '开通会员', cancelText: '稍后再说',
          success: r => { if (r.confirm) wx.navigateTo({ url: '/pages/vip/vip' }) }
        })
        return
      }
      vip.consume()
    }

    if (mode === 'lincha') {
      const s = parseInt(score, 10), line = parseInt(this.data.batchLine, 10)
      if (!s || s < 100 || s > 750) { wx.showToast({ title: '请输入有效分数', icon: 'none' }); return }
      if (!line || line < 100) { wx.showToast({ title: '请输入当年批次线', icon: 'none' }); return }
      const diff = s - line
      // 线差校正：等效分 = 历史年批次线 + 线差（历史年批次线在查询中自动匹配）
      // 简化处理：直接传分数，后端用 one_section 插值
      this._doQuery(s, subject)
    } else if (mode === 'score') {
      const s = parseInt(score, 10)
      if (!s || s < 100 || s > 750) { wx.showToast({ title: '请输入有效分数(100-750)', icon: 'none' }); return }
      const line = parseInt(this.data.batchLine, 10)
      if (line && s < line) {
        wx.showToast({ title: '分数低于批次线，结果仅供参考', icon: 'none', duration: 2500 })
      }
      this._doQuery(s, subject)
    } else {
      const r = parseInt(rank, 10)
      if (!r || r < 1) { wx.showToast({ title: '请输入有效位次', icon: 'none' }); return }
      // 位次模式依赖一分一段(one_section)，目前仅内蒙古入库；其它省引导改用分数模式
      if (!ONE_SECTION_READY[province]) {
        wx.showModal({
          title: '位次模式暂仅支持内蒙古',
          content: '其它省份的一分一段数据仍在整理中，请改用「分数」模式查询冲稳保（已支持全国 31 省）。',
          showCancel: false, confirmText: '知道了'
        })
        return
      }
      this.setData({ loading: true })
      // 位次→分数 转换
      this.rankToScore(r, subject).then(convertedScore => {
        if (!convertedScore) { this.setData({ loading: false }); wx.showToast({ title: '位次转换失败', icon: 'none' }); return }
        this._doQuery(convertedScore, subject)
      }).catch(() => {
        this.setData({ loading: false })
        wx.showToast({ title: '位次转换失败，请重试', icon: 'none' })
      })
    }
  },

  _doQuery(score, subject) {
    this.setData({ loading: true })
    app.request('/api/report', {
      method: 'POST',
      data: { province: this.data.province, subject, score, holland_answers: [] }
    }).then(r => {
      const sc = (r && r.score) || {}
      const rec = sc.recommend || {}
      const favSet = {}
      ;(wx.getStorageSync('jb_fav') || []).forEach(x => { favSet[x.school] = 1 })
      const mapTier = arr => (arr || []).map(it => {
        const p = prob(1 / it.rank_ratio)  // 后端ratio是user/school，取倒数变school/user
        return {
          school: it.school, level: it.school_level || '', major: it.major || '',
          minScore: it.ref_score, minRank: it.min_rank, gap: it.gap, year: it.year || '',
          prob: p, inFav: !!favSet[it.school],
          color: p !== null ? (p < 30 ? '#e74c3c' : p > 75 ? '#27ae60' : '#e85d04') : '#999'
        }
      })
      const isV = vip.isVip()
      const limit = isV ? 999 : (vip.FREE_TIER_SHOW || 3)
      const result = {
        chong: mapTier(rec.chong).slice(0, limit),
        wen: mapTier(rec.wen).slice(0, limit),
        bao: mapTier(rec.bao).slice(0, limit)
      }
      const fullCounts = {
        chong: (rec.chong || []).length,
        wen: (rec.wen || []).length,
        bao: (rec.bao || []).length
      }
      this.setData({
        score: String(score),
        loading: false, done: true,
        userRank: sc.user_rank || 0,
        result,
        counts: { chong: result.chong.length, wen: result.wen.length, bao: result.bao.length },
        fullCounts,
        isVipUser: isV
      })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '查询失败，请重试', icon: 'none' })
    })
  },

  addFav(e) {
    const { tier, idx } = e.currentTarget.dataset
    const item = this.data.result[tier][idx]
    if (!item || item.inFav) return
    const fav = wx.getStorageSync('jb_fav') || []
    if (!fav.find(x => x.school === item.school)) {
      fav.unshift({ school: item.school, level: item.level, province: '', batch: 'normal', time: Date.now() })
      wx.setStorageSync('jb_fav', fav)
      favSync.push()
    }
    this.setData({ [`result.${tier}[${idx}].inFav`]: true })
    wx.showToast({ title: '已加入选校单', icon: 'success' })
  },

  // 一键智能填报：冲2+稳3+保2 → 填满选校单
  autoFill() {
    const { result } = this.data
    const picks = [
      ...(result.chong || []).slice(0, 2).map(s => ({ ...s, batch: 'early' })),
      ...(result.wen || []).slice(0, 3).map(s => ({ ...s, batch: 'normal' })),
      ...(result.bao || []).slice(0, 2).map(s => ({ ...s, batch: 'normal' }))
    ]
    if (!picks.length) { wx.showToast({ title: '暂无推荐结果', icon: 'none' }); return }

    const fav = wx.getStorageSync('jb_fav') || []
    let added = 0
    picks.forEach(p => {
      if (!fav.find(x => x.school === p.school)) {
        fav.unshift({ school: p.school, level: p.level, province: this.data.province, batch: p.batch, time: Date.now() })
        added++
      }
    })
    wx.setStorageSync('jb_fav', fav.slice(0, 30))
    favSync.push()
    wx.showModal({
      title: '已加入选校单', content: `冲2+稳3+保2，共新增 ${added} 所院校`,
      confirmText: '去看看', cancelText: '继续浏览',
      success: r => { if (r.confirm) wx.switchTab({ url: '/pages/volunteer/volunteer' }) }
    })
  },

  goSchool(e) {
    wx.navigateTo({ url: '/pages/school/school?name=' + encodeURIComponent(e.currentTarget.dataset.name) })
  },

  // 导出选校方案为图片
  exportImage() {
    const { province, score, subject, userRank, result, subjects } = this.data
    if (!score) return

    wx.showLoading({ title: '生成中…' })

    // 准备所有学校列表（冲稳保合并，标注梯度）
    const all = []
    ;['chong', 'wen', 'bao'].forEach(k => {
      (result[k] || []).forEach(it => {
        all.push({ ...it, tier: k, tierName: { chong: '冲', wen: '稳', bao: '保' }[k] })
      })
    })

    const W = 320   // canvas 宽度
    const LH = 28   // 行高
    const PAD = 14  // 边距
    let y = PAD

    // 创建离屏 canvas
    const ctx = wx.createCanvasContext('exportCanvas', this)
    if (!ctx) { wx.hideLoading(); wx.showToast({ title: '导出失败', icon: 'none' }); return }

    // 背景
    ctx.setFillStyle('#FFFFFF')
    ctx.fillRect(0, 0, W, 9999)

    // 标题
    ctx.setFillStyle('#FF6600')
    ctx.setFontSize(18)
    ctx.setTextAlign('center')
    ctx.fillText('九色鹿 · 选校方案', W / 2, y + 18)
    y += 40

    // 用户信息行
    ctx.setFillStyle('#666')
    ctx.setFontSize(12)
    ctx.setTextAlign('center')
    ctx.fillText(`${province} · ${subject} · ${score}分 · 位次约${userRank || '—'}名`, W / 2, y + 14)
    y += 30

    // 分隔线
    ctx.setStrokeStyle('#f0f0f0')
    ctx.setLineWidth(1)
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    y += 10

    // 分梯度画
    ;['chong', 'wen', 'bao'].forEach(k => {
      const items = all.filter(it => it.tier === k)
      if (!items.length) return
      const tierColors = { chong: '#E74C3C', wen: '#F39C12', bao: '#27AE60' }
      const tierNames = { chong: '🔴 冲一冲', wen: '🟡 稳一稳', bao: '🟢 保一保' }

      // 梯度标题
      ctx.setFillStyle(tierColors[k])
      ctx.setFontSize(14)
      ctx.setTextAlign('left')
      ctx.fillText(`${tierNames[k]}  (${items.length}所)`, PAD, y + 14)
      y += LH

      // 表头
      ctx.setFillStyle('#999')
      ctx.setFontSize(10)
      ctx.fillText('院校', PAD, y + 12)
      ctx.fillText('分数', PAD + 140, y + 12)
      ctx.setTextAlign('right')
      ctx.fillText('概率', W - PAD, y + 12)
      ctx.setTextAlign('left')
      y += 18

      // 分隔
      ctx.setStrokeStyle('#eee')
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()

      // 学校行（最多显示前8个）
      const show = items.slice(0, 8)
      show.forEach((it, i) => {
        y += LH
        const school = it.school.length > 8 ? it.school.slice(0, 7) + '…' : it.school
        ctx.setFillStyle('#333')
        ctx.setFontSize(12)
        ctx.fillText(school, PAD, y + 3)
        ctx.fillText(`${it.minScore}分`, PAD + 140, y + 3)
        ctx.setTextAlign('right')
        const probText = it.prob != null ? `${it.prob}%` : '—'
        ctx.setFillStyle(it.prob >= 60 ? '#27AE60' : it.prob >= 30 ? '#F39C12' : '#E74C3C')
        ctx.fillText(probText, W - PAD, y + 3)
        ctx.setTextAlign('left')
        ctx.setFillStyle('#333')
      })

      y += 12
    })

    // 页脚
    ctx.setStrokeStyle('#f0f0f0')
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    y += 14
    ctx.setFillStyle('#bbb')
    ctx.setFontSize(10)
    ctx.setTextAlign('center')
    ctx.fillText('九色鹿前程助手 · 仅供参考', W / 2, y + 10)

    const totalH = y + 30
    ctx.draw(false, () => {
      // 导出图片
      wx.canvasToTempFilePath({
        canvasId: 'exportCanvas',
        x: 0, y: 0, width: W, height: totalH, destWidth: W * 2, destHeight: totalH * 2,
        success: (res) => {
          wx.hideLoading()
          // 先保存到相册
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: () => {
              // 无相册权限，预览
              wx.previewImage({ urls: [res.tempFilePath] })
            }
          })
        },
        fail: () => { wx.hideLoading(); wx.showToast({ title: '导出失败', icon: 'none' }) }
      })
    })
  },

  goVip() {
    wx.navigateTo({ url: '/pages/vip/vip' })
  },

  onShareAppMessage() {
    vip.addBonus(1)
    wx.showToast({ title: '分享成功，今日免费 +1 次', icon: 'success' })
    return { title: '我在九色鹿前程助手查到了冲稳保选校方案，内蒙古考生快来试', path: '/pages/index/index' }
  }
,
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
