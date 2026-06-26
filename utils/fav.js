// 选校单云端同步（本地为主，openid 在则双向同步）
function app() { return getApp() }

function local() { return wx.getStorageSync('jb_fav') || [] }
function saveLocal(list) { wx.setStorageSync('jb_fav', list || []) }

// 把本地整表推到云端（整表替换）
function push() {
  const a = app()
  const openid = a && a.globalData && a.globalData.openid
  if (!openid) return
  a.request('/api/favorites', { method: 'POST', data: { openid, list: local() } }).catch(() => {})
}

// 拉云端并落地；首次(云端空+本地有)则上传本地，避免丢已有选校单
function pull(cb) {
  const a = app()
  const openid = a && a.globalData && a.globalData.openid
  if (!openid) { cb && cb(local()); return }
  a.request('/api/favorites', { data: { openid } }).then(res => {
    const server = (res && res.list) || []
    if (server.length === 0 && local().length > 0) { push(); cb && cb(local()); return }
    saveLocal(server); cb && cb(server)
  }).catch(() => { cb && cb(local()) })
}

module.exports = { local, saveLocal, push, pull }
