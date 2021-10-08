// pages/withdraw/withdraw.js
const moneyModel = require('../../models/money')
const tool = require('../../utils/tool')
Page({
    /**
     * 页面的初始数据
     */
    data: { navTitle: '提现', pool: {}, record: [], isDisable: false, withdrawNum: '', remainingAmount: 0 },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.getDetail()
        this.getQuota()
        this.queryRecord()
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    /**
     * 网络请求，获取钱包信息
     */
    getDetail() {
        moneyModel.queryWalletCustomer({}).then((res) => {
            this.setData({
                pool: res,
            })
        })
    },
    /**
     * 网络请求，今日提现额度
     */
    getQuota() {
        moneyModel.queryWithdrawalQuotaCustomer({}).then((res) => {
            this.setData({
                remainingAmount: res.withdrawal_today_left,
            })
        })
    },
    /**
     * 网络请求，获取钱包信息
     */
    queryRecord() {
        moneyModel.queryCustomerCommissionLog({}).then((res) => {
            if (res[0].status == 1) {
                this.setData({
                    isDisable: true,
                })
            }
            wx.stopPullDownRefresh()
        })
    },
    /**
     * 提现
     */
    withdraw() {
        let withdrawNum = this.data.withdrawNum
        let can_out_money = this.data.pool.can_out_money
        if (!withdrawNum || withdrawNum <= 0) {
            wx.showToast({
                title: '请输入正确金额',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        let money = Number(tool.numberMul(withdrawNum, 100))
        if (money > can_out_money) {
            wx.showToast({
                title: '不能大于可提现金额',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        if (money <= 30) {
            wx.showToast({
                title: '提现金额至少为0.3元以上',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        let type = 1
        console.log('输出 ~ money', money)
        moneyModel.putWithdrawalCustomer(money, type).then((res) => {
            wx.showToast({
                title: '申请成功',
                icon: 'none',
                duration: 2000,
            })
            wx.navigateBack({
                delta: 1,
            })
        })
    },
    allWithdraw() {
        if (this.data.pool.can_out_money == 0) {
            wx.showToast({
                title: '没有可提现金额',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        this.setData({
            withdrawNum: Number(this.data.pool.can_out_money / 100),
        })
    },
    onChangeInput(e) {
        this.setData({
            withdrawNum: e.detail,
        })
    },
    /**
     * 格式化金额
     */
    // formatMoney: function (val) {
    //     if (val == 0) {
    //         return '0.00'
    //     }
    //     if (!val) {
    //         return '0.00'
    //     }
    //     //金额转换 分->元 保留2位小数
    //     var str = (val / 100).toFixed(2) + ''
    //     var intSum = str.substring(0, str.indexOf('.')).replace(/\B(?=(?:\d{3})+$)/g, ',') //取到整数部分
    //     // var intSum = str.substring(0, str.indexOf('.')).replace(getRegExp('/B(?=(?:d{3})+$)', 'g'), '.')
    //     var dot = str.substring(str.length, str.indexOf('.')) //取到小数部分搜索
    //     var ret = intSum + dot
    //     return ret
    // },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {},

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
})
