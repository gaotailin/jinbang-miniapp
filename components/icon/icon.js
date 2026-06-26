// 统一线性图标组件：内置 SVG，矢量清晰、可调色，零外部依赖。
// 用法：<icon name="school" color="#555" size="44" />（size 单位 rpx）
const PATHS = {
  // —— 首页金刚区 / 通用 ——
  school:     '<path d="M4 9.5l8-4 8 4M5.5 9v10h13V9"/><path d="M9.5 19v-4.5h5V19"/><path d="M8 12h.5M15.5 12h.5"/>',
  major:      '<path d="M12 6.5C10 5 7 5 5 5.5v12c2-.5 5-.5 7 1 2-1.5 5-1.5 7-1v-12C17 5 14 5 12 6.5z"/><path d="M12 6.5v12"/>',
  fill:       '<path d="M13 3L5 13.5h5.5L9 21l8-10.5h-5.5z"/>',
  same:       '<path d="M12 21c4-4 6.5-7 6.5-10.5A6.5 6.5 0 105.5 10.5C5.5 14 8 17 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  rank1:      '<path d="M3.5 20h17"/><path d="M6 20v-6M10.5 20V8M15 20v-9M19 20V5"/>',
  batch:      '<path d="M3.5 20h17"/><path d="M5 16l4.5-4.5 3.5 3 6-7"/>',
  plan:       '<rect x="6" y="4.5" width="12" height="15.5" rx="2"/><path d="M9.5 4.5h5v2.5h-5z"/><path d="M9 11.5h6M9 15h4"/>',
  more:       '<rect x="4.5" y="4.5" width="6" height="6" rx="1.4"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.4"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.4"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.4"/>',
  // —— 全部服务页 / 其它 ——
  search:     '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  list:       '<path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11"/><circle cx="4.5" cy="6.5" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="17.5" r="1.2"/>',
  compare:    '<path d="M7 8.5L4 11.5l3 3M4 11.5h7M17 16.5l3-3-3-3M20 13.5h-7"/>',
  proCompare: '<path d="M3.5 20h17"/><rect x="6" y="10" width="4" height="10" rx="1"/><rect x="14" y="6" width="4" height="14" rx="1"/>',
  trophy:     '<path d="M8 4.5h8V9a4 4 0 01-8 0z"/><path d="M8 6H5.5v1A3 3 0 008 10M16 6h2.5v1a3 3 0 01-2.5 3"/><path d="M12 12.5v3.5M9.5 20h5l-1-4h-3z"/>',
  shield:     '<path d="M12 3.2l6.5 2.6V11c0 4.6-3.2 7.4-6.5 9-3.3-1.6-6.5-4.4-6.5-9V5.8z"/><path d="M12 9v4M12 16h.01"/>',
  cap:        '<path d="M2.5 9.2L12 5l9.5 4.2L12 13.4z"/><path d="M6.5 11.2V16c0 1.1 2.7 2 5.5 2s5.5-.9 5.5-2v-4.8"/><path d="M21.5 9.5v4"/>',
  compass:    '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2.2 5.2-5.3 2.3 2.2-5.2z"/>',
  mind:       '<path d="M9.5 19.5v-2.2a5 5 0 01-2-9.1A4.2 4.2 0 0114.5 6a4 4 0 014 5.2 4.2 4.2 0 01-2 6v2.3"/><path d="M12 9v3M12 12l2 1"/>',
  ai:         '<rect x="5" y="8" width="14" height="11" rx="3.2"/><path d="M12 4v4M9.2 13h.01M14.8 13h.01M9.5 16.2h5"/><path d="M3.2 12.2v3M20.8 12.2v3"/>',
  report:     '<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4"/><path d="M9.5 13l2 2 3.2-3.2"/>',
  // —— 查大学分类入口 ——
  medal:      '<circle cx="12" cy="9" r="5"/><path d="M9.5 13.3L8 20.5l4-2.2 4 2.2-1.5-7.2"/><path d="M12 7.2l.9 1.8 2 .3-1.45 1.4.35 2L12 11.8l-1.8.9.35-2L9.1 9.3l2-.3z"/>',
  cross:      '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  globe:      '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>',
  star:       '<path d="M12 3.5l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 17.9l-5.2 2.6 1-5.75-4.2-4.1 5.8-.85z"/>',
  palette:    '<path d="M12 3.5a8.5 8.5 0 100 17c1.3 0 2-.9 2-2 0-1.2 1-2 2.2-2H18a3 3 0 003-3c0-4.7-4-7-9-7z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="8.5" r="1"/><circle cx="16" cy="11.5" r="1"/>',
  plane:      '<path d="M21 4L3.5 11l6.2 2.3L12 20.5l2.2-6.2z"/><path d="M21 4l-11.3 9.3"/>',
  // —— 我的页 ——
  share:      '<path d="M6 11.5V19a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0018 19v-7.5"/><path d="M12 3.5v11M8 7l4-3.5L16 7"/>',
  chat:       '<path d="M20 14.5A2 2 0 0118 16.5H8.5L4.5 20V6A2 2 0 016.5 4h11.5A2 2 0 0120 6z"/><path d="M8.5 10h7M8.5 13h4"/>',
  info:       '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.8h.01"/>',
  salary:     '<circle cx="12" cy="12" r="8.5"/><path d="M9 8.5l3 3.4 3-3.4"/><path d="M12 11.9v5.1M9.6 13.4h4.8M9.6 15.4h4.8"/>',
  // —— 选校单头部 / pick 模式 ——
  save:       '<path d="M5 4.5h11l3 3V18a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18V6A1.5 1.5 0 015 4.5z"/><path d="M8 4.5v5h7V4.5"/><rect x="8" y="13" width="8" height="6.5"/>',
  folder:     '<path d="M3.5 7.5a2 2 0 012-2H9l2 2.5h7a2 2 0 012 2V18a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18z"/>',
  pulse:      '<path d="M3.5 12h4l2-5 3 11 2.5-6h5.5"/>',
  ruler:      '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>'
}

Component({
  properties: {
    name: { type: String, value: '' },
    color: { type: String, value: '#555555' },
    size: { type: Number, value: 40 }
  },
  data: { src: '' },
  observers: {
    'name, color': function (name, color) {
      const d = PATHS[name]
      if (!d) { this.setData({ src: '' }); return }
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="'
        + color + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'
      this.setData({ src: 'data:image/svg+xml,' + encodeURIComponent(svg) })
    }
  }
})
