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
        this.queryLog()
        this.queryCommissionCheckList()
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
            url: '/packageMainSecondary/withdrawPersonal/withdrawPersonal',
        })
    },
    /**
     * 网络请求，获取钱包信息
     */
    queryDetail() {
        moneyModel.queryWalletCustomer({}).then((res) => {
            console.log('输出 ~ res', res)
            this.setData({
                pool: res,
                record: res.commission_check_list,
            })
            if (res.can_out_money == 0) {
                this.setData({
                    isDisable: true,
                })
            }
            wx.stopPullDownRefresh()
        })
    },
    queryLog() {
        moneyModel.queryCustomerCommissionLog({}).then((res) => {
            console.log('输出 ~ res', res)
            this.setData({
                record: res || [],
            })
        })
    },
    /**
     * 网络请求，获取提现规则
     */
    queryCommissionRules() {
        moneyModel.queryCommissionRulesCustomer({}).then((res) => {
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
     * 提现日志 提现日志
     */
    queryCommissionCheckList() {
        moneyModel.queryCommissionCheckList({}).then((res) => {
            let list = res || []
            if (list.length > 0 && list[0].status == 1) {
                this.setData({
                    isDisable: true,
                })
            }
            this.setData({
                withdrawList: list,
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
        this.queryLog()
        this.queryCommissionCheckList()
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
