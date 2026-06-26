Component({
  properties: {
    rows: { type: Number, value: 5 },
    show: { type: Boolean, value: true }
  },
  data: { rowsArr: [] },
  lifetimes: {
    attached() {
      const n = Math.max(1, this.data.rows || 5)
      const arr = []
      for (let i = 0; i < n; i++) arr.push(i)
      this.setData({ rowsArr: arr })
    }
  }
})
