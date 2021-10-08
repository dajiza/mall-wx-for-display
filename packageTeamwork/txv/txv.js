// pages/orderCheck/orderCheck.js
const orderModel = require('../../models/order')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {},

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {},
    onPop: function (e) {
        let pages = getCurrentPages()
        if (pages.length == 1) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
})
