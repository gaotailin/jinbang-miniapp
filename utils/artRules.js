// 艺术类「综合分折算规则库」——只录官方公开源/公开汇总，逐省核对。
// 统一系数制：综合分 = a×文化分 + b×专业统考分（所有省/公式都能化成这个线性式）。
//   归一750制(文化750/专业300)：文化cw+专业mw → a=cw, b=mw×2.5。
// formulas 数组：多数省 1 条；河南本科 4 条(院校各选其一)→ 前端可切换。
// 控制线 ben/zhuan {c:文化线, m:统考线}；动态/校考线用 null + lineNote。
// 2024 艺考改革后多数省「美术/音乐/舞蹈/表(导)演」四类同一公式(来源已确认) → _uni50 一次出四类。

// 工厂A：统一 50:50（或同系数）省，一次出「美术/音乐/舞蹈/表演」四类。
// opt.calli=[a,b] 追加书法类；opt.broad=[a,b] 追加播音类；opt.verified=true 标官方核实。
function _uni50(code, name, a, b, opt) {
  opt = opt || {}
  const f = [{ name: opt.fname || '文化50%+专业50%', a: a, b: b }]
  const cats = [
    { key: 'art',   name: '美术与设计类', formulas: f, ben: null, zhuan: null },
    { key: 'music', name: '音乐类',       formulas: f, ben: null, zhuan: null },
    { key: 'dance', name: '舞蹈类',       formulas: f, ben: null, zhuan: null },
    { key: 'act',   name: '表(导)演类',   formulas: f, ben: null, zhuan: null }
  ]
  if (opt.calli) cats.push({ key: 'calli', name: '书法类', formulas: [{ name: '文化' + Math.round(opt.calli[0] * 100) + '%', a: opt.calli[0], b: opt.calli[1] }], ben: null, zhuan: null })
  if (opt.broad) cats.push({ key: 'broad', name: '播音与主持类', formulas: [{ name: '文化' + Math.round(opt.broad[0] * 100) + '%', a: opt.broad[0], b: opt.broad[1] }], ben: null, zhuan: null })
  return {
    code: code, name: name, year: 2025, cultureFull: opt.cultureFull || 750, decimals: 2,
    voluntary: '平行志愿', verified: !!opt.verified,
    source: opt.source || (name + '省教育考试院 · 2025（综合分公式据官方/公开汇总，控制线以官方公布为准）'),
    lineNote: (opt.lineNote || (name + '艺术类控制线为动态/校考制，以省考试院当年正式公布为准（本批暂未录固定线）')),
    categories: cats
  }
}
// 工厂B：美术比例与其它类别不同的省（只先录美术，其它类别待逐项核）
function _uniArt(code, name, fname, a, b) {
  return {
    code: code, name: name, year: 2025, cultureFull: 750, decimals: 2,
    voluntary: '平行志愿',
    source: name + '省教育考试院 · 2025（综合分公式据官方/公开汇总，控制线以官方公布为准）',
    lineNote: name + '艺术类控制线以省考试院当年公布为准；美术为' + fname + '，其它类别(音乐/舞蹈/书法/播音)公式待逐项核',
    categories: [
      { key: 'art', name: '美术与设计类', formulas: [{ name: fname, a: a, b: b }], ben: null, zhuan: null }
    ]
  }
}

const PROVINCES = [
  {
    code: 'neimenggu', name: '内蒙古', year: 2025, cultureFull: 750, decimals: 0,
    voluntary: '平行志愿（同分先比专业统考，再比文化）',
    source: '内蒙古招生考试信息网 nm.zsks.cn · 2025',
    categories: [
      { key: 'art',    name: '美术与设计类',  formulas: [{ name: '文化60%+专业40%', a: 0.6, b: 1.0 }],  ben: { c: 282, m: 197 }, zhuan: { c: 160, m: 183 } },
      { key: 'calli',  name: '书法类',        formulas: [{ name: '文化60%+专业40%', a: 0.6, b: 1.0 }],  ben: { c: 300, m: 237 }, zhuan: { c: 160, m: 183 } },
      { key: 'musedu', name: '音乐教育类',    formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: { c: 282, m: 210 }, zhuan: { c: 160, m: 170 } },
      { key: 'musvoc', name: '音乐表演(声乐)', formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: { c: 282, m: 200 }, zhuan: { c: 160, m: 162 } },
      { key: 'musins', name: '音乐表演(器乐)', formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: { c: 282, m: 190 }, zhuan: { c: 160, m: 155 } },
      { key: 'dance',  name: '舞蹈类',        formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: { c: 282, m: 203 }, zhuan: { c: 160, m: 188 } },
      { key: 'broad',  name: '播音与主持类',  formulas: [{ name: '文化70%+专业30%', a: 0.7, b: 0.75 }], ben: { c: 370, m: 200 }, zhuan: { c: 160, m: 175 } }
    ]
  },
  {
    code: 'shandong', name: '山东', year: 2025, cultureFull: 750, decimals: 2,
    voluntary: '平行志愿',
    source: '山东省教育招生考试院 sdzk.cn · 2025',
    lineNote: '本科文化线 = 普通类一段线×75%（动态，按当年一段线计）',
    categories: [
      { key: 'art',    name: '美术与设计类',   formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'musedu', name: '音乐(教育)',     formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'musins', name: '音乐(器乐)',     formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'dance',  name: '舞蹈类',         formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'act',    name: '表(导)演类',     formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'calli',  name: '书法类',         formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null }
    ]
  },
  {
    code: 'henan', name: '河南', year: 2025, cultureFull: 750, decimals: 2,
    voluntary: '平行志愿',
    source: '河南省教育厅 jyt.henan.gov.cn · 2025',
    lineNote: '⚠️ 本科综合分由招生院校在下列4种办法中各自选其一，请按目标院校简章切换公式；美术统考合格线175',
    categories: [
      { key: 'art', name: '美术与设计类（本科）',
        formulas: [
          { name: '文化80%+专业20%', a: 0.8, b: 0.5 },
          { name: '文化50%+专业50%', a: 0.5, b: 1.25 },
          { name: '文化70%+专业30%', a: 0.7, b: 0.75 },
          { name: '文化60%+专业40%', a: 0.6, b: 1.0 }
        ], ben: null, zhuan: null },
      { key: 'art_zhuan', name: '美术与设计类（专科）',
        formulas: [{ name: '文化×0.5+专业×1.25', a: 0.5, b: 1.25 }], ben: null, zhuan: null }
    ]
  },
  // —— 统一 50:50 省（美术/音乐/舞蹈/表演 四类同公式）——
  _uni50('hebei', '河北', 0.5, 1.25, { verified: true, calli: [0.5, 1.25], broad: [0.7, 0.75],
    source: '河北省教育考试院 · 2025（官方核实）',
    lineNote: '美术/音乐/书法本科文化线=普通本科线×80%；舞蹈/表演×75%；播音=普通本科线（动态，以当年公布为准）' }),
  {
    code: 'guangdong', name: '广东', year: 2025, cultureFull: 750, decimals: 2, voluntary: '平行志愿', verified: true,
    source: '广东省教育考试院 eea.gd.gov.cn · 2025（官方核实）',
    lineNote: '广东美术/音乐/舞蹈/表演/书法=文化50%+专业50%；播音=文化70%+专业30%；控制线以当年公布为准',
    categories: [
      { key: 'art',    name: '美术与设计类', formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'musedu', name: '音乐(教育)',   formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'music',  name: '音乐(表演)',   formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'dance',  name: '舞蹈类',       formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'act',    name: '表(导)演类',   formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'calli',  name: '书法类',       formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'broad',  name: '播音与主持类', formulas: [{ name: '文化70%+专业30%', a: 0.7, b: 0.75 }], ben: null, zhuan: null }
    ]
  },
  _uni50('anhui', '安徽', 0.5, 1.25),
  _uni50('shanxi_jin', '山西', 0.5, 1.25),
  _uni50('shaanxi', '陕西', 0.5, 1.25),
  _uni50('jiangxi', '江西', 0.5, 1.25),
  _uni50('zhejiang', '浙江', 0.5, 1.25),
  _uni50('fujian', '福建', 0.5, 1.25),
  _uni50('beijing', '北京', 0.5, 1.25),
  _uni50('tianjin', '天津', 0.5, 1.25),
  _uni50('jilin', '吉林', 0.5, 1.25),
  _uni50('shanghai', '上海', 0.5, 1.25),
  _uni50('guangxi', '广西', 0.5, 1.25),
  _uni50('chongqing', '重庆', 0.5, 1.25),
  _uni50('guizhou', '贵州', 0.5, 1.25),
  {
    code: 'yunnan', name: '云南', year: 2025, cultureFull: 750, decimals: 2, voluntary: '平行志愿',
    source: '云南省招生考试院 · 2025（美术多办法，院校自选）',
    lineNote: '⚠️ 云南美术综合分有多种办法(院校自选)，请按目标院校简章切换公式；控制线以官方为准',
    categories: [
      { key: 'art', name: '美术与设计类', formulas: [
          { name: '文化50%+专业50%', a: 0.5, b: 1.25 },
          { name: '文化70%+专业30%', a: 0.7, b: 0.75 },
          { name: '纯文化(按文化排序)', a: 1.0, b: 0 }
        ], ben: null, zhuan: null },
      { key: 'music', name: '音乐类',     formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'dance', name: '舞蹈类',     formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null },
      { key: 'act',   name: '表(导)演类', formulas: [{ name: '文化50%+专业50%', a: 0.5, b: 1.25 }], ben: null, zhuan: null }
    ]
  },
  _uni50('gansu', '甘肃', 0.5, 1.25),
  _uni50('ningxia', '宁夏', 0.5, 1.25),
  _uni50('xinjiang', '新疆', 0.5, 1.25),
  _uni50('xizang', '西藏', 0.5, 1.25),
  _uni50('qinghai', '青海', 0.5, 1.25),
  // —— 美术 60:40（其它类别待核）——
  _uniArt('jiangsu', '江苏', '文化60%+专业40%', 0.6, 1.0),
  _uniArt('heilongjiang', '黑龙江', '文化60%+专业40%', 0.6, 1.0),
  // —— 海南：文化满分900、综合分折算到500、美术55:45 ——
  _uni50('hainan', '海南', 0.3056, 0.75, {
    cultureFull: 900, fname: '文化55%+专业45%（满分500）',
    lineNote: '海南高考文化满分900、综合分折算满分500；公式=(0.55×文化/900+0.45×专业/300)×500'
  }),
  // —— 原"复杂省"经官方核实，系数制均可表示，全部补齐 ——
  _uni50('sichuan', '四川', 0.5, 1.25, { lineNote: '四川美术/音乐/舞蹈/表演 50:50；美术文化线=普通本科线×80%，以省考试院公布为准' }),
  _uni50('hunan', '湖南', 0.3, 0.7, { fname: '文化30%+专业70%', lineNote: '湖南美术/音乐/舞蹈/表演 综合分=文化×30%+专业×70%（满分约435，保留1位），以省考试院公布为准' }),
  _uniArt('hubei', '湖北', '[文化40%+专业60%]×2', 0.8, 1.2),
  _uniArt('liaoning', '辽宁', '文化60%+专业40%(百分制满分100)', 0.08, 0.13333)
  // 注：辽宁为百分制(综合分满分100)；湖南满分约435；海南满分500；其余多为750制。
]

// 综合分 = a×文化 + b×专业，按省 decimals 取整/保留小数
function calcComposite(prov, formula, culture, major) {
  const raw = formula.a * culture + formula.b * major
  const d = prov.decimals || 0
  return d === 0 ? Math.round(raw) : Math.round(raw * Math.pow(10, d)) / Math.pow(10, d)
}

// 控制线达标判定 → 'ben' | 'zhuan' | 'none' | 'unknown'
function checkLine(cat, culture, major) {
  if (!cat.ben && !cat.zhuan) return 'unknown'
  if (cat.ben && culture >= cat.ben.c && major >= cat.ben.m) return 'ben'
  if (cat.zhuan && culture >= cat.zhuan.c && major >= cat.zhuan.m) return 'zhuan'
  return 'none'
}

module.exports = { PROVINCES, calcComposite, checkLine }
