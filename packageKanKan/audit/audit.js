Page({
  data: {},
  onLoad: function (options) { },
  handlePublish: function () {
    wx.redirectTo({
      url: '/packageKanKan/publish/publish',
    })
  },
  handleBackToList: function () {
    // wx.switchTab({
    //   url: '/pages/kankanIndex/kankanIndex',
    // })
    this.ClickBack()
  },
  ClickBack: function () {
    let pages = getCurrentPages();
    if (pages.length === 1) {
      wx.switchTab({
        url: '/pages/kankanIndex/kankanIndex',
      });
    } else {
      wx.navigateBack({
        delta: 1,
      });
    }
  },
})