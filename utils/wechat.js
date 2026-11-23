// 微信能力封装：静默登录 openid / 文本内容安全 / 订阅消息（2026-11-17）
const REPORT_TMPL = 'TMSEMaf4LqTfYexZuM2ttoudSD0J_qEjnLePjFiyIog'
const NEWS_TMPL = 'mW8fULDFiUQKaAYx5O3ZU7oqYH0DdSu-gjVvkuCv5DE'

function getOpenid() {
  return new Promise(function (resolve) {
    const app = getApp()
    if (app.globalData && app.globalData.openid) return resolve(app.globalData.openid)
    try {
      app.ensureLogin(function (oid) { resolve(oid || '') })
    } catch (e) { resolve('') }
  })
}

// 返回 true=通过（含降级放行），false=命中风险
function checkText(text) {
  return getOpenid().then(function (oid) {
    if (!oid) return true
    return new Promise(function (resolve) {
      wx.request({
        url: getApp().globalData.baseURL + '/api/seccheck',
        method: 'POST',
        timeout: 9000,
        header: { 'Content-Type': 'application/json', 'X-API-Key': getApp().globalData.apiKey },
        data: { content: text, openid: oid },
        success: function (res) {
          const d = res && res.data
          resolve(!(d && d.pass === false) && (res.statusCode === 200 || !d))
        },
        fail: function () { resolve(true) }
      })
    })
  }).catch(function () { return true })
}

function subscribe(topic, extra) {
  const tmplId = topic === 'news' ? NEWS_TMPL : REPORT_TMPL
  return new Promise(function (resolve) {
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      success: function (res) {
        if (!res || res[tmplId] !== 'accept') return resolve(false)
        getOpenid().then(function (oid) {
          if (!oid) return resolve(false)
          const data = Object.assign({ openid: oid, topic: topic }, extra || {})
          wx.request({
            url: getApp().globalData.baseURL + '/api/subscribe',
            method: 'POST',
            timeout: 6000,
            header: { 'Content-Type': 'application/json', 'X-API-Key': getApp().globalData.apiKey },
            data: data,
            success: function () { resolve(true) },
            fail: function () { resolve(true) }
          })
        })
      },
      fail: function () { resolve(false) }
    })
  })
}

module.exports = { getOpenid: getOpenid, checkText: checkText, subscribe: subscribe }
