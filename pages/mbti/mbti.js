// 自包含 MBTI 简版（20题，4维度各5题），无需后端
const Q = [
  { q: '聚会后你通常感觉', a: '充满能量', av: 'E', b: '需要独处恢复', bv: 'I' },
  { q: '认识新朋友你', a: '主动攀谈', av: 'E', b: '等对方先开口', bv: 'I' },
  { q: '你更喜欢', a: '热闹的集体活动', av: 'E', b: '小范围深聊', bv: 'I' },
  { q: '思考问题时你倾向', a: '边说边想', av: 'E', b: '想清楚再说', bv: 'I' },
  { q: '周末你更想', a: '约朋友出去', av: 'E', b: '在家做自己的事', bv: 'I' },
  { q: '你更relate', a: '具体的事实细节', av: 'S', b: '背后的规律与可能', bv: 'N' },
  { q: '学习时你喜欢', a: '按步骤实操', av: 'S', b: '先理解大框架', bv: 'N' },
  { q: '你更信任', a: '亲身经验', av: 'S', b: '直觉灵感', bv: 'N' },
  { q: '描述事情你偏', a: '写实具体', av: 'S', b: '联想发散', bv: 'N' },
  { q: '你更关注', a: '当下现实', av: 'S', b: '未来可能', bv: 'N' },
  { q: '做决定你更看重', a: '逻辑对错', av: 'T', b: '人的感受', bv: 'F' },
  { q: '朋友诉苦你先', a: '帮分析解决', av: 'T', b: '共情安慰', bv: 'F' },
  { q: '你更欣赏别人', a: '公正理性', av: 'T', b: '善良体贴', bv: 'F' },
  { q: '评价一件事你看', a: '是否合理', av: 'T', b: '是否和谐', bv: 'F' },
  { q: '争论时你倾向', a: '坚持事实', av: 'T', b: '照顾关系', bv: 'F' },
  { q: '你的生活更', a: '有计划有安排', av: 'J', b: '随性灵活', bv: 'P' },
  { q: '面对deadline你', a: '提前完成', av: 'J', b: '临近才冲刺', bv: 'P' },
  { q: '你喜欢', a: '事情定下来', av: 'J', b: '保留选择空间', bv: 'P' },
  { q: '出行你会', a: '做好攻略', av: 'J', b: '走到哪算哪', bv: 'P' },
  { q: '你的桌面通常', a: '整齐有序', av: 'J', b: '随手堆放', bv: 'P' }
]
const MAJOR = {
  E: '', I: '', S: '', N: '',
  INTJ: '计算机/金融工程/建筑学', INTP: '数学/物理学/哲学', ENTJ: '管理学/法学/经济学', ENTP: '市场营销/传媒/创业',
  INFJ: '心理学/教育学/社会学', INFP: '汉语言文学/艺术/新闻', ENFJ: '教育学/人力资源/公共管理', ENFP: '传媒/设计/国际关系',
  ISTJ: '会计/法学/土木工程', ISFJ: '护理/学前教育/行政管理', ESTJ: '工商管理/金融/法学', ESFJ: '护理/教育/酒店管理',
  ISTP: '机械工程/电子信息/汽车', ISFP: '艺术设计/园林/烹饪', ESTP: '市场营销/物流/体育', ESFP: '表演/旅游管理/公关'
}

Page({
  data: { qs: Q, idx: 0, answers: {}, type: '', majors: '', done: false },
  pick(e) {
    const v = e.currentTarget.dataset.v
    const answers = Object.assign({}, this.data.answers, { [this.data.idx]: v })
    const next = this.data.idx + 1
    if (next >= Q.length) {
      const c = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
      Object.values(answers).forEach(x => c[x]++)
      const type = (c.E >= c.I ? 'E' : 'I') + (c.S >= c.N ? 'S' : 'N') + (c.T >= c.F ? 'T' : 'F') + (c.J >= c.P ? 'J' : 'P')
      this.setData({ answers, done: true, type, majors: MAJOR[type] || '' })
    } else {
      this.setData({ answers, idx: next })
    }
  },
  back() { if (this.data.idx > 0) this.setData({ idx: this.data.idx - 1 }) },
  restart() { this.setData({ idx: 0, answers: {}, done: false, type: '', majors: '' }) },
  goTest() { wx.navigateTo({ url: '/pages/test/test' }) }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
