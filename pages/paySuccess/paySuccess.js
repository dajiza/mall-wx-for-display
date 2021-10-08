// pages/paySuccess.js
const orderModel = require("../../models/order");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        detail: '',
        order_no: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log('GOOGLE: options', options)
        this.setData({
            order_no: Number(options.orderNo),
        });
        this.getOrderDetail();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        });
    },
    gotoIndex: function (e) {
        wx.switchTab({
            url: "../index/index",
        });
    },
    gotoOrderDetail: function (e) {
        wx.navigateTo({
            url: "../orderDetail/orderDetail" + "?orderId=" + this.data.detail.id,
        });
    },
    getOrderDetail() {
        const params = {
            order_no: this.data.order_no,
        };

        orderModel.queryOrderDetail(params).then((res) => {
            console.log('GOOGLE: res', res)
            this.setData({
                detail: res,
            });
        });
    },


    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {},

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {},
});
