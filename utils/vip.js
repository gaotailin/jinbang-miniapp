// 会员 / 每日免费额度
// 会员真相源 = 服务端 vip_members（GET /api/vip/status），本地缓存仅作弱网/离线兜底，
// 防止"改本地缓存白嫖会员"和"清缓存/换设备 VIP 丢失"。免费额度仍为本地计数（本就该本地）。
const FREE_PER_DAY = 5
const FREE_TIER_SHOW = 3   // 免费用户每档(冲/稳/保)只看前 3 所
const SERVER_TTL = 5 * 60 * 1000   // 服务端状态缓存有效期 5 分钟，期内以服务端为准、不重复请求

function today() {
  const d = new Date()
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}

// 本地体验会员（仅"体验会员"功能用；真实付费会员以服务端为准，不再靠它当真）
function localVip() {
  const v = wx.getStorageSync('jb_vip')
  return !!(v && v.expire && v.expire > Date.now())
}

// 拉取服务端权威会员状态（带并发合并 + TTL 缓存 + 失败兜底，永不 reject）
let _inflight = null
function refreshVipFromServer(force) {
  if (_inflight) return _inflight
  const app = getApp()
  _inflight = new Promise((resolve) => {
    app.ensureLogin((openid) => {
      const cached = wx.getStorageSync('jb_vip_server')
      const now = Date.now()
      // 缓存新鲜且非强制 → 直接复用，省请求
      if (!force && cached && cached.fetchedAt && now - cached.fetchedAt < SERVER_TTL) {
        _inflight = null
        resolve(cached)
        return
      }
      if (!openid) {   // 拿不到 openid（未登录/弱网）→ 用旧缓存或本地兜底，不阻断
        _inflight = null
        resolve(cached || { vip: false, expire: 0, fetchedAt: 0 })
        return
      }
      app.request('/api/vip/status?openid=' + encodeURIComponent(openid))
        .then((res) => {
          const data = { vip: !!(res && res.vip), expire: (res && res.expire) || 0, fetchedAt: Date.now() }
          wx.setStorageSync('jb_vip_server', data)
          _inflight = null
          resolve(data)
        })
        .catch(() => {   // 网络失败：保留旧缓存，交给 isVip 本地兜底
          _inflight = null
          resolve(cached || { vip: false, expire: 0, fetchedAt: 0 })
        })
    })
  })
  return _inflight
}

// 本地体验会员（plan='trial'，免费营销、1 天，本地控制无妨，不涉付费资损）
function localTrialActive() {
  const v = wx.getStorageSync('jb_vip')
  return !!(v && v.plan === 'trial' && v.expire && v.expire > Date.now())
}

// 会员判断：服务端缓存新鲜期内【付费会员只信服务端】（本地伪造付费无效，防白嫖）；
// 免费体验会员(plan=trial)仍本地放行。服务端缓存过期/缺失才整体回退本地。
function isVip() {
  const srv = wx.getStorageSync('jb_vip_server')
  if (srv && srv.fetchedAt && Date.now() - srv.fetchedAt < SERVER_TTL) {
    return !!srv.vip || localTrialActive()
  }
  return localVip()
}

// 当前会员到期时间（毫秒）：优先服务端，回退本地
function expireMs() {
  const srv = wx.getStorageSync('jb_vip_server')
  if (srv && srv.vip && srv.expire) return srv.expire
  const v = wx.getStorageSync('jb_vip')
  return (v && v.expire) || 0
}

function quotaState() {
  let q = wx.getStorageSync('jb_quota') || {}
  if (q.date !== today()) { q = { date: today(), used: 0, bonus: 0 }; wx.setStorageSync('jb_quota', q) }
  return q
}

function remaining() {
  if (isVip()) return Infinity
  const q = quotaState()
  return Math.max(0, FREE_PER_DAY + (q.bonus || 0) - (q.used || 0))
}

// 消耗 1 次，返回是否成功
function consume() {
  if (isVip()) return true
  const q = quotaState()
  if ((q.used || 0) >= FREE_PER_DAY + (q.bonus || 0)) return false
  q.used = (q.used || 0) + 1
  wx.setStorageSync('jb_quota', q)
  return true
}

// 分享解锁 +n 次（当日有效）
function addBonus(n) {
  const q = quotaState()
  q.bonus = (q.bonus || 0) + (n || 1)
  wx.setStorageSync('jb_quota', q)
}

// 本地体验开通（仅 1 天体验功能；真实支付会员由服务端发货，不走这里）
function grantTrial(days) {
  wx.setStorageSync('jb_vip', { plan: 'trial', expire: Date.now() + (days || 1) * 86400000 })
}

module.exports = {
  FREE_PER_DAY, FREE_TIER_SHOW,
  isVip, localVip, refreshVipFromServer, expireMs,
  remaining, consume, addBonus, grantTrial, today
}
