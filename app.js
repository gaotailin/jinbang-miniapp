App({
  globalData: {
    baseURL: 'https://jinbangtimingnm.cn',
    apiKey: 'jinbang-2026',
    isIOS: false,
    payEnabled: false,
    openid: ''
  },

  onLaunch() {
    console.log('九色鹿前程助手 启动')
    try {
      var p = (wx.getDeviceInfo ? wx.getDeviceInfo().platform : wx.getSystemInfoSync().platform) || ''
      this.globalData.isIOS = String(p).toLowerCase() === 'ios'
    } catch (e) {}
    this.ensureLogin()
  },

  ensureLogin: function(cb) {
    if (this.globalData.openid) { if (cb) cb(this.globalData.openid); return }
    var cached = wx.getStorageSync('jb_openid')
    if (cached) { this.globalData.openid = cached; if (cb) cb(cached); return }
    var that = this
    wx.login({
      success: function(lr) {
        that.request('/api/user/login', { method: 'POST', data: { code: lr.code } }).then(function(res) {
          if (res && res.openid) { that.globalData.openid = res.openid; wx.setStorageSync('jb_openid', res.openid) }
          if (cb) cb(that.globalData.openid)
        }).catch(function() { if (cb) cb('') })
      },
      fail: function() { if (cb) cb('') }
    })
  },

  request: function(path, opts) {
    opts = opts || {}
    var that = this
    return new Promise(function(resolve, reject) {
      wx.request({
        url: that.globalData.baseURL + path,
        method: opts.method || 'GET',
        data: opts.data || {},
        timeout: 5000,
        header: { 'Content-Type': 'application/json', 'X-API-Key': that.globalData.apiKey },
        success: function(res) {
          if (res.statusCode === 200 && res.data && res.data.success !== false) {
            resolve(res.data)
          } else {
            reject(res.data || { error: 'fail ' + res.statusCode })
          }
        },
        fail: function(err) { reject(err) }
      })
    })
  }
})
