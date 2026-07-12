// 各省志愿表结构配置（模拟填报 P1：内蒙古/河南/山东）
// 数据依据（2026-07-12 核实，官方口径）：
// - 内蒙古 2025 新高考落地：本科批「院校专业组」平行志愿 45 个，每组 12 个专业 + 服从调剂
// - 河南 2025 新高考落地：本科批「院校专业组」平行志愿 48 个，每组 6 个专业 + 服从调剂
// - 山东：常规批「专业(类)+院校」平行志愿，每次最多 96 个，1 专业 1 志愿，无组内调剂
// P2 扩省时在此追加配置即可，页面逻辑不用动。

const RULES = {
  '内蒙古': {
    mode: 'group', modeName: '院校专业组',
    batchName: '本科批', slots: 45, majorsPerGroup: 12, adjustable: true,
    unit: '院校专业组',
    desc: '本科批设 45 个「院校专业组」平行志愿，每组可填 12 个专业和 1 个是否服从组内调剂'
  },
  '河南': {
    mode: 'group', modeName: '院校专业组',
    batchName: '本科批', slots: 48, majorsPerGroup: 6, adjustable: true,
    unit: '院校专业组',
    desc: '本科批设 48 个「院校专业组」平行志愿，每组可填 6 个专业和 1 个是否服从组内调剂'
  },
  '山东': {
    mode: 'majorFirst', modeName: '专业(类)+院校',
    batchName: '常规批', slots: 96, majorsPerGroup: 1, adjustable: false,
    unit: '专业(类)+院校',
    desc: '常规批以「专业(类)+院校」为志愿单位，每次填报最多 96 个志愿，1 个专业即 1 个志愿，无专业调剂'
  }
}

function getRule(province) { return RULES[province] || null }
function supported() { return Object.keys(RULES) }

module.exports = { RULES, getRule, supported }
