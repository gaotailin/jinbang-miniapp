const app = getApp()

const ALL_PROVINCES = ['内蒙古', '北京', '天津', '河北', '山西', '辽宁', '吉林', '黑龙江', '上海', '江苏',
  '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆']
const SUBJ_33 = ['北京', '天津', '上海', '山东', '浙江', '海南']
function subjectsOf(p) { return SUBJ_33.indexOf(p) >= 0 ? ['综合'] : ['物理类', '历史类'] }
Page({
  data: { score: '', subject: '物理类', rank: null, source: '', loading: false,
          provinces: ALL_PROVINCES, provinceIndex: 0, province: '内蒙古',
          subjects: subjectsOf('内蒙古'), subjectIndex: 0, year: null },
  onScore(e) { this.setData({ score: e.detail.value }) },
  chooseSub(e) { this.setData({ subject: e.currentTarget.dataset.v, rank: null }) },
  onProvince(e) {
    const i = Number(e.detail.value); const prov = ALL_PROVINCES[i]
    const subs = subjectsOf(prov)
    this.setData({ provinceIndex: i, province: prov, subjects: subs, subjectIndex: 0,
                   subject: subs[0], rank: null, source: '' })
  },
  onSubject(e) {
    const i = Number(e.detail.value)
    this.setData({ subjectIndex: i, subject: this.data.subjects[i], rank: null, source: '' })
  },
  query() {
    const s = Number(this.data.score)
    if (!s || s < 100 || s > 750) { wx.showToast({ title: '请输入有效分数', icon: 'none' }); return }
    this.setData({ loading: true })
    app.request('/api/score_convert', { data: { score: s, subject: this.data.subject, province: this.data.province } })
      .then(r => this.setData({ rank: r.estimated_rank, source: r.rank_source, year: r.year || null, loading: false }))
      .catch(() => { this.setData({ loading: false }); wx.showToast({ title: '查询失败', icon: 'none' }) })
  }
,
  onShareAppMessage() {
    return { title: '九色鹿前程助手 — AI智能填志愿', path: '/pages/index/index' }
  },
  onShareTimeline() {
    return { title: '试试这个AI志愿助手，高考志愿一站搞定' }
  },
})
