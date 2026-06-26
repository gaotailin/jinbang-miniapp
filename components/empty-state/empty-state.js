Component({
  properties: {
    icon: { type: String, value: '📭' },
    img: { type: String, value: '' },     // 有值时用插画替代 emoji
    title: { type: String, value: '暂无数据' },
    desc: { type: String, value: '' },
    action: { type: String, value: '' }   // 有值时显示按钮，点击 triggerEvent('action')
  },
  methods: {
    onTap() { this.triggerEvent('action') }
  }
})
