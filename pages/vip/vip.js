const app = getApp()
const vip = require('../../utils/vip.js')

const PLANS = [
  { key: 'season', name: '高考季卡', price: 39, unit: '3个月', tag: '最热', days: 90 },
  { key: 'year', name: '年卡', price: 69, unit: '一年', tag: '更划算', days: 365 }
]

Page({
  data: { plans: PLANS, picked: 'season', isVip: false, expireText: '', isIOS: false },

  onShow() {
    this._renderVip()
    // 进页面同步服务端权威会员状态（覆盖退款回收、换设备等场景）
    vip.refreshVipFromServer().then(() => this._renderVip())
  },

  _renderVip() {
    const isV = vip.isVip()
    let expireText = ''
    if (isV) {
      const d = new Date(vip.expireMs())
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
          // 价格后端定，前端不传，防篡改；platform 回传真实设备端，供 signData 签名
          data: { plan: plan.key, code: lr.code, platform: app.globalData.isIOS ? 'ios' : 'android' }
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
      title: '暂时无法支付',
      content: '支付通道暂时不可用，请稍后再试。有问题可加客服微信 bobo184458。',
      showCancel: false, confirmText: '知道了'
    })
  },

  // 支付成功后：轮询服务端确认真实到账（不再本地伪造付费会员；微信发货回调有几秒延迟）
  afterPaid(plan, outTradeNo) {
    wx.showLoading({ title: '开通确认中', mask: true })
    let tries = 0
    const MAX_TRIES = 8   // 8 次 × 1.5s ≈ 12s，覆盖发货回调延迟（真机实测约 9s）
    const poll = () => {
      tries++
      vip.refreshVipFromServer(true).then((srv) => {
        if (srv && srv.vip) {
          wx.hideLoading()
          this._renderVip()
          wx.showToast({ title: '开通成功', icon: 'success' })
        } else if (tries >= MAX_TRIES) {
          wx.hideLoading()
          // 超时不等于失败：回调可能稍慢，权益会在下次进入页面时自动校正
          wx.showModal({
            title: '支付已完成',
            content: '会员权益正在开通中，通常几秒内到账。若稍后仍未显示，重新进入本页即可刷新。',
            showCancel: false, confirmText: '知道了'
          })
          this._renderVip()
        } else {
          setTimeout(poll, 1500)
        }
      })
    }
    poll()
  },

  trial() {
    wx.showModal({
      title: '体验会员', content: '开通 1 天体验，解锁不限次按分选校与完整冲稳保',
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
    return { title: '试试这个AI选校助手，高考升学一站搞定' }
  },
})
