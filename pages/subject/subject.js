// 新高考 3+1+2 选科测评（内蒙古：首选 物理/历史，再选 2 科）
const NAME = { phy: '物理', his: '历史', chem: '化学', bio: '生物', geo: '地理', pol: '政治' }

// 专业覆盖率（约数，公开口径）：first -> 'engA,engB'(字母序) -> 覆盖%
const COVER = {
  phy: { 'bio,chem': 96, 'chem,geo': 97, 'chem,pol': 96, 'bio,geo': 88, 'bio,pol': 88, 'geo,pol': 88 },
  his: { 'bio,chem': 62, 'chem,geo': 60, 'chem,pol': 62, 'bio,geo': 51, 'bio,pol': 53, 'geo,pol': 50 }
}

const QUESTIONS = [
  { q: '下面两类题，你更拿手？', opts: [
    { t: '数理推导、逻辑计算', w: { phy: 2, chem: 1 } },
    { t: '阅读理解、史料背记', w: { his: 2, pol: 1 } } ] },
  { q: '更愿意花时间钻研？', opts: [
    { t: '物理 / 化学实验', w: { phy: 1, chem: 2 } },
    { t: '历史 / 时政热点', w: { his: 1, pol: 2 } } ] },
  { q: '你对哪类更感兴趣？', opts: [
    { t: '生命科学、医学健康', w: { bio: 2, chem: 1 } },
    { t: '地理环境、区域经济', w: { geo: 2 } } ] },
  { q: '将来更想从事？', opts: [
    { t: '工程师 / 医生 / 科研', w: { phy: 2, chem: 1, bio: 1 } },
    { t: '公务员 / 法律 / 教育传媒', w: { his: 2, pol: 2 } } ] },
  { q: '做题时你更偏向？', opts: [
    { t: '公式推理、找规律', w: { phy: 2, geo: 1 } },
    { t: '记忆理解、归纳观点', w: { his: 1, bio: 1, pol: 1 } } ] },
  { q: '再选一科，你更想保？', opts: [
    { t: '化学（理工医必备）', w: { chem: 2 } },
    { t: '政治（考公考研友好）', w: { pol: 2 } } ] }
]

Page({
  data: { step: 'intro', qIndex: 0, total: QUESTIONS.length, question: null, scores: {}, result: null },

  start() {
    this.setData({
      step: 'quiz', qIndex: 0,
      question: QUESTIONS[0],
      scores: { phy: 0, his: 0, chem: 0, bio: 0, geo: 0, pol: 0 },
      result: null
    })
  },

  choose(e) {
    const opt = QUESTIONS[this.data.qIndex].opts[e.currentTarget.dataset.i]
    const scores = Object.assign({}, this.data.scores)
    Object.keys(opt.w).forEach(k => { scores[k] += opt.w[k] })
    const next = this.data.qIndex + 1
    if (next < QUESTIONS.length) {
      this.setData({ scores, qIndex: next, question: QUESTIONS[next] })
    } else {
      this.setData({ scores }, () => this.compute())
    }
  },

  compute() {
    const s = this.data.scores
    const first = s.phy >= s.his ? 'phy' : 'his'
    // 再选：4 选 2，按得分降序
    const seconds = ['chem', 'bio', 'geo', 'pol'].sort((a, b) => s[b] - s[a]).slice(0, 2)
    const eng = seconds.slice().sort()           // 字母序做 key
    const key = eng.join(',')
    const coverage = COVER[first][key] || (first === 'phy' ? 88 : 52)
    const set = {}; seconds.forEach(k => { set[k] = 1 })

    let dir
    if (first === 'phy') {
      dir = '理学 · 工学 · 农学'
      if (set.chem) dir += ' · 医学'
      if (set.pol) dir += ' · 公安军警/马理论'
    } else {
      dir = '文史哲 · 法学 · 教育 · 经管'
      if (set.pol) dir += ' · 公安/考公'
      if (set.chem) dir += ' · 部分医护'
    }

    // 备选组合（同首选，按覆盖率降序，排除已选）
    const alts = Object.keys(COVER[first])
      .filter(k => k !== key)
      .sort((a, b) => COVER[first][b] - COVER[first][a])
      .slice(0, 2)
      .map(k => ({
        combo: NAME[first] + ' + ' + k.split(',').map(x => NAME[x]).join(' + '),
        cover: COVER[first][k]
      }))

    this.setData({
      step: 'result',
      result: {
        first: NAME[first],
        combo: NAME[first] + ' + ' + seconds.map(k => NAME[k]).join(' + '),
        seconds: seconds.map(k => NAME[k]),
        coverage, dir, alts
      }
    })
  },

  restart() { this.setData({ step: 'intro', result: null }) }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
