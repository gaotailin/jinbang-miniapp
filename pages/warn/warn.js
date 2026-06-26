Page({
  data: {
    tips: [
      { t: "查教育部名单", d: "只认教育部每年公布的《全国高等学校名单》，名单外一律存疑。" },
      { t: "警惕山寨名校", d: "名字蹭中国、北京、财经、科技等高大上字眼、与知名校高度相似的，多为野鸡。" },
      { t: "不轻信内部指标", d: "声称花钱买名额、低分上名校、包录取的，100% 是骗局。" },
      { t: "核对官网与学信网", d: "正规院校在学信网可查；官网域名应为 edu.cn 后缀，警惕仿冒站。" },
      { t: "看录取批次", d: "正规本科有明确批次线与代码；野鸡大学往往无招生代码、无批次。" },
      { t: "保护个人信息", d: "不向陌生招生老师转账、不泄露准考证号与身份证照片。" }
    ]
  },
  tapTip(e) {
    const tips = this.data.tips.map((v,i) => i===e.currentTarget.dataset.index ? {...v,open:!v.open} : v);
    this.setData({tips});
  },
  goSearch() { wx.switchTab({ url: "/pages/search/search" }) }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})