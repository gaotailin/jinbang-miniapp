// 会员 / 每日免费额度（C1 阶段先用本地存储；C2 接后端后改为服务端校验）
const FREE_PER_DAY = 5
const FREE_TIER_SHOW = 3   // 免费用户每档(冲/稳/保)只看前 3 所

function today() {
  const d = new Date()
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}

// 会员状态：jb_vip = { plan, expire(ms) }
function isVip() {
  const v = wx.getStorageSync('jb_vip')
  return !!(v && v.expire && v.expire > Date.now())
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

// 本地体验开通（C2 上线后由支付回调替代）
function grantTrial(days) {
  wx.setStorageSync('jb_vip', { plan: 'trial', expire: Date.now() + (days || 1) * 86400000 })
}

module.exports = { FREE_PER_DAY, FREE_TIER_SHOW, isVip, remaining, consume, addBonus, grantTrial, today }
