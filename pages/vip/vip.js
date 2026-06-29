const app = getApp()
const vip = require('../../utils/vip.js')

const PLANS = [
  { key: 'season', name: '高考季卡', price: 39, unit: '高考季', tag: '最热', days: 120 },
  { key: 'year', name: '年卡', price: 69, unit: '一年', tag: '更划算', days: 365 }
]

Page({
  data: { plans: PLANS, picked: 'season', isVip: false, expireText: '', isIOS: false },

  onShow() {
    const isV = vip.isVip()
    let expireText = ''
    if (isV) {
      const v = wx.getStorageSync('jb_vip') || {}
      const d = new Date(v.expire)
      expireText = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
    }
    this.setData({ isVip: isV, expireText, isIOS: app.globalData.isIOS })
  },

  pick(e) { this.setData({ picked: e.currentTarget.dataset.k }) },

  // 虚拟支付：后端 /api/vpay/create 出 signData+双签名，前端调 wx.requestVirtualPayment。
  // 接口未就绪/低版本不支持时优雅回退"即将开放"。
  buy() {
    const plan = PLANS.find(x => x.key === this.data.picked)
    if (!wx.requestVirtualPayment) {
      // 联调诊断：API 不存在时给明确提示(而非笼统"即将开放")
      wx.showModal({
        title: '无法调起支付',
        content: '当前微信不支持虚拟支付接口(requestVirtualPayment)。请升级微信到最新版，或确认小程序虚拟支付已开通。',
        showCancel: false, confirmText: '知道了'
      })
      return
    }
    wx.showLoading({ title: '发起支付', mask: true })
    wx.login({
      success: (lr) => {
        app.request('/api/vpay/create', {
          method: 'POST',
          data: { plan: plan.key, code: lr.code }   // 价格后端定，前端不传，防篡改
        }).then(res => {
          wx.hideLoading()
          if (!res || !res.signData || !res.paySig) {
            wx.showToast({ title: '下单失败，请重试', icon: 'none' }); return
          }
          const otn = res.out_trade_no
          wx.requestVirtualPayment({
            signData: res.signData,
            paySig: res.paySig,
            signature: res.signature,
            mode: res.mode,
            env: res.env,
            success: () => this.afterPaid(plan, otn),
            fail: (err) => {
              const m = (err && err.errMsg) || ''
              wx.showToast({ title: m.indexOf('cancel') >= 0 ? '支付已取消' : '支付未完成', icon: 'none' })
            }
          })
        }).catch(() => { wx.hideLoading(); wx.showToast({ title: '下单失败，请稍后重试', icon: 'none' }) })
      },
      fail: () => { wx.hideLoading(); this.payComingSoon() }
    })
  },

  payComingSoon() {
    wx.showModal({
      title: '支付即将开放',
      content: '会员支付正在最后联调，马上开放。可先点下方"体验会员"试用全部功能。',
      showCancel: false, confirmText: '知道了'
    })
  },

  // 支付成功后：本地先开通（即时反馈）；真实会员以服务端发货回调写入 vip_members 为准
  afterPaid(plan, outTradeNo) {
    vip.grantTrial(plan.days)
    this.onShow()
    wx.showToast({ title: '开通成功', icon: 'success' })
  },

  trial() {
    wx.showModal({
      title: '体验会员', content: '开通 1 天体验，解锁不限次按分选校与完整冲稳保（仅本地体验用）',
      success: (r) => {
        if (r.confirm) { vip.grantTrial(1); this.onShow(); wx.showToast({ title: '已开通体验', icon: 'success' }) }
      }
    })
  },

  onShareAppMessage() {
    return { title: '九色鹿前程助手 · 内蒙古考生报全国大学，按分选校查冲稳保', path: '/pages/index/index' }
  }
,
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
