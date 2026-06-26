// 把 app.request 的 reject 分类成可展示的错误态（网络/超时/服务器）
function classify(err) {
  const msg = (err && (err.errMsg || err.error || err.message || '')) + ''
  if (/timeout/i.test(msg)) return { icon: '🐢', title: '请求超时', desc: '网络较慢，下拉或点击重试' }
  if (/fail/i.test(msg)) return { icon: '📡', title: '网络连接失败', desc: '请检查网络后重试' }
  return { icon: '🛠️', title: '服务器繁忙', desc: '稍后再试，或下拉刷新' }
}
module.exports = { classify }
