// 学生向「职业库」——按行业领域精选高考生关注的代表职业。
// 内容为通识职业指导(职业描述/对口专业/学历/前景);薪资以「就业薪酬榜」(salary_data真实数据)为准。
// 不含招聘平台实时数据(合规)。可持续增补。
module.exports = [
  { field: 'IT / 互联网', icon: 'ai', jobs: [
    { name: '软件工程师', desc: '开发与维护软件系统、APP、网站', majors: '计算机科学与技术、软件工程', edu: '本科', outlook: '需求大、薪资高' },
    { name: '算法 / AI 工程师', desc: '做机器学习、数据/算法模型', majors: '人工智能、计算机、数学', edu: '本科/硕士', outlook: '热门、起薪高' },
    { name: '数据分析师', desc: '用数据支持业务决策', majors: '统计学、数据科学、计算机', edu: '本科', outlook: '通用、跨行业' },
    { name: '网络安全工程师', desc: '保护系统与数据安全', majors: '网络空间安全、信息安全', edu: '本科', outlook: '缺口大' }
  ]},
  { field: '医疗 / 健康', icon: 'cross', jobs: [
    { name: '临床医生', desc: '诊断治疗病人(需规培+执业医师)', majors: '临床医学', edu: '本科起,多需硕博', outlook: '稳定、周期长' },
    { name: '护士', desc: '临床护理', majors: '护理学', edu: '专科/本科', outlook: '需求稳定' },
    { name: '药师', desc: '药品调剂与用药指导', majors: '药学、临床药学', edu: '本科', outlook: '稳定' },
    { name: '医学影像技师', desc: '影像检查与技术', majors: '医学影像技术', edu: '本科/专科', outlook: '稳定' }
  ]},
  { field: '财经 / 金融', icon: 'salary', jobs: [
    { name: '会计 / 审计', desc: '账务、报表、审计', majors: '会计学、审计学', edu: '本科', outlook: '通用、稳定' },
    { name: '金融分析 / 投行', desc: '投融资、证券、风控', majors: '金融学、经济学', edu: '本科/硕士', outlook: '高薪、竞争大' },
    { name: '银行从业', desc: '柜面、客户经理、风控', majors: '金融、经济、会计', edu: '本科', outlook: '稳定' }
  ]},
  { field: '教育', icon: 'cap', jobs: [
    { name: '中小学教师', desc: '学科教学(需教师资格证)', majors: '师范类各专业', edu: '本科', outlook: '稳定、编制' },
    { name: '高校 / 研究', desc: '教学科研', majors: '对应学科', edu: '博士为主', outlook: '门槛高' }
  ]},
  { field: '法律', icon: 'shield', jobs: [
    { name: '律师', desc: '诉讼/非诉法律服务(需法考)', majors: '法学', edu: '本科起', outlook: '两极分化' },
    { name: '法务 / 公检法', desc: '企业法务、法院检察院(需考试)', majors: '法学', edu: '本科', outlook: '稳定' }
  ]},
  { field: '工程 / 制造', icon: 'plan', jobs: [
    { name: '机械 / 电气工程师', desc: '设计制造设备与系统', majors: '机械工程、电气工程', edu: '本科', outlook: '需求稳定' },
    { name: '土木 / 建筑工程师', desc: '工程设计与施工管理', majors: '土木工程、建筑学', edu: '本科', outlook: '随行业波动' },
    { name: '汽车 / 新能源工程师', desc: '整车/三电/智能驾驶', majors: '车辆工程、新能源', edu: '本科', outlook: '上升' }
  ]},
  { field: '设计 / 传媒', icon: 'palette', jobs: [
    { name: 'UI / 视觉设计师', desc: '界面与视觉设计', majors: '设计学类、数字媒体', edu: '本科/专科', outlook: '看作品' },
    { name: '新媒体 / 运营', desc: '内容、运营、增长', majors: '传播学、新闻、市场营销', edu: '本科', outlook: '门槛低竞争大' },
    { name: '记者 / 编辑', desc: '采编、内容生产', majors: '新闻学、汉语言文学', edu: '本科', outlook: '转型中' }
  ]},
  { field: '公共 / 管理', icon: 'compass', jobs: [
    { name: '公务员', desc: '政府机关(需国/省考)', majors: '不限,法学/经济/中文/管理常考', edu: '本科', outlook: '稳定、竞争大' },
    { name: '人力资源', desc: '招聘、薪酬、培训', majors: '人力资源管理、管理学', edu: '本科', outlook: '通用' }
  ]}
]
