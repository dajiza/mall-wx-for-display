// pages/orderCheck/orderCheck.js
const orderModel = require('../../models/order')

App.Page({
    /**
     * 页面的初始数据
     */
    data: { isShowShare: false },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {},
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },

    // 打开弹框
    onClickShare(event) {
        this.setData({
            isShowShare: true,
        })
    },
    // 关闭弹框
    onCloseShare(event) {
        this.setData({
            isShowShare: false,
        })
    },
})
