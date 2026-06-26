const app = getApp()
const vip = require('../../utils/vip.js')

const PLANS = [
  { key: 'season', name: '高考季卡', price: 39, unit: '高考季', tag: '最热', days: 120 },
  { key: 'year', name: '年卡', price: 68, unit: '一年', tag: '更划算', days: 365 }
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

  // C2 支付：前端流程已就绪。商户号通过 + 二蛋上线 /api/pay/create 后自动生效；
  // 接口未就绪时优雅回退"即将开放"。
  buy() {
    const plan = PLANS.find(x => x.key === this.data.picked)
    wx.showLoading({ title: '发起支付', mask: true })
    // 后端用 openid 下单，需 code 换 openid（二蛋 /api/pay/create 内部处理或前端传 code）
    wx.login({
      success: (lr) => {
        app.request('/api/pay/create', {
          method: 'POST',
          data: { plan: plan.key, amount: plan.price, code: lr.code }
        }).then(res => {
          wx.hideLoading()
          if (!res || !res.package) { wx.showToast({ title: '下单失败，请重试', icon: 'none' }); return }
          const otn = res.out_trade_no
          wx.requestPayment({
            timeStamp: res.timeStamp, nonceStr: res.nonceStr, package: res.package,
            signType: res.signType || 'RSA', paySign: res.paySign,
            success: () => this.afterPaid(plan, otn),
            fail: () => wx.showToast({ title: '支付已取消', icon: 'none' })
          })
        }).catch(() => { wx.hideLoading(); wx.showToast({ title: '下单失败，请稍后重试', icon: 'none' }) })
      },
      fail: () => { wx.hideLoading(); this.payComingSoon() }
    })
  },

  payComingSoon() {
    wx.showModal({
      title: '支付即将开放',
      content: '微信支付商户号审核中（约1-2个工作日），通过后即可购买会员。可先点下方"体验会员"试用全部功能。',
      showCancel: false, confirmText: '知道了'
    })
  },

  // 支付成功后：主动查单补单（回调失败也能写会员），再本地开通
  afterPaid(plan, outTradeNo) {
    if (outTradeNo) {
      app.request('/api/pay/query', { data: { out_trade_no: outTradeNo } }).catch(() => {})
    }
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
