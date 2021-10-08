// miniprogram/pages/login/login.js
const loginModel = require("../../models/login.js");
const userShopInfoModel = require("../../models/userShopInfo");
const phoneNumWatch = require("../../utils/phoneNumWatch");

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        userInfo: {
            nick_name: "",
            avatar_url: "",
        },
        showBack: false,
        isOrder: 0,
    },
    // 获取手机

    getPhoneNumber: function (e) {
        console.log("输出 ~ file: loginPhone.js ~ line 14 ~ e", e);
        if (e.detail.errMsg != "getPhoneNumber:ok") {
            this.setData({
                showBack: true,
            });
            return;
        }
        let isOrder = this.data.isOrder;
        console.log("输出 ~ isOrder", isOrder);

        loginModel
            .bindPhone(e.detail.iv, e.detail.encryptedData)
            .then((res) => {
                // if (isOrder == 1) {
                //     wx.reLaunch({
                //         url: "../orderCheck/orderCheck",
                //     });
                // } else {
                //     wx.switchTab({
                //         url: "../index/index",
                //     });
                // }
                phoneNumWatch.onNext(this, true)
                wx.navigateBack()
            });
    },
    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        const _this = this;
        userShopInfoModel.queryUserShopInfo({}).then((res) => {
            this.setData({
                userInfo: res.user_info,
            });
        });
    },

    gotoIndex() {
        wx.switchTab({
            url: "../index/index",
        });
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log("输出 ~ options", options);
        this.setData({
            isOrder: options.is_order,
        });
        this.getUserInfo();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () { },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () { },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () { },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () { },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () { },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () { },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () { },
});
