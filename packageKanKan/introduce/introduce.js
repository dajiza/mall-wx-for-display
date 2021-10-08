Page({
  data: {
    introduce: "",
  },
  onLoad: function (options) {
    const eventChannel = this.getOpenerEventChannel()
    let that = this
    //介绍不限字数，避免url带参数数据不全
    if (eventChannel && eventChannel.on) {
      eventChannel.on('introduceContent', function (data) {
        that.setData({
          introduce: data
        })
      })
    }
  },
  onReady: function () { },
  bindIntroduceInput: function (e) {
    this.data.introduce = e.detail.value
  },
  handleSave: function (e) {
    if (this.data.introduce == '') {
      wx.showToast({
        title: '请输入正文',
        icon: 'none',
        duration: 2000
      })
      return
    }
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel && eventChannel.emit) {
      eventChannel.emit('introduceConrentEdit', this.data.introduce);
    }
    wx.navigateBack({
      delta: 1,
    })
  },
  ClickBack: function () {
    let pages = getCurrentPages();
    if (pages.length === 1) {
      wx.switchTab({
        url: "/pages/index/index",
      });
    } else {
      wx.navigateBack({
        delta: 1,
      });
    }
  },
})