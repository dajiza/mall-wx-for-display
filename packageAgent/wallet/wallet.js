// pages/wallet/wallet.js
const moneyModel = require('../../models/money')
const constant = require('../../config/constant.js')

Page({
    /**
     * 页面的初始数据
     */
    data: {
        constant,
        navTitle: '我的钱包',
        showPop: false,
        pool: {},
        record: [],
        rules: [],
        isDisable: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {},
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        this.queryDetail()
        this.queryCommissionRules()
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    onClose() {
        this.setData({ showPop: false })
    },
    showPopup() {
        this.setData({ showPop: true })
    },
    gotoWithdraw() {
        let isDisable = this.data.isDisable
        if (isDisable) {
            wx.showToast({
                title: '没有可提现金额或存在申请中的订单',
                icon: 'none',
                duration: 3000,
            })
            return
        }
        wx.navigateTo({
            url: '/packageAgent/withdraw/withdraw',
        })
    },
    /**
     * 网络请求，获取钱包信息
     */
    queryDetail() {
        moneyModel.queryWallet({}).then((res) => {
            this.setData({
                pool: res.my_package,
                record: res.commission_check_list || [],
            })
            if (this.data.record.length == 0 || this.data.record[0].status == 1 || res.my_package.can_out_money == 0) {
                this.setData({
                    isDisable: true,
                })
            } else {
                this.setData({
                    isDisable: false,
                })
            }
            wx.stopPullDownRefresh()
        })
    },
    /**
     * 网络请求，获取提现规则
     */
    queryCommissionRules() {
        moneyModel.queryCommissionRules({}).then((res) => {
            let txt = JSON.parse(res)

            let txtArray = []
            for (var key in txt) {
                txtArray.push({
                    title: key,
                    value: txt[key],
                })
            }
            this.setData({
                rules: txtArray,
            })
        })
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.queryDetail()
        this.queryCommissionRules()
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
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {},
})
