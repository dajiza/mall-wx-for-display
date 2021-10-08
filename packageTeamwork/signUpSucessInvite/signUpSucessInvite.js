// pages/orderCheck/orderCheck.js
const userShopInfoModel = require('../../models/userShopInfo')
const payModel = require('../../models/pay')
const teamworkModel = require('../../models/teamwork')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        inviteCode: '',
        courseId: '',
        cash_back_money: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        this.getUserInfo()
        this.getCourseDetail()
    },
    onPop: function (e) {
        let pages = getCurrentPages()
        if (pages.length == 1) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        } else {
            // wx.navigateBack({
            //     delta: 1,
            // })
            wx.switchTab({
                url: '/pages/teamworkIndex/teamworkIndex',
            })
        }
    },
    gotoDetail() {
        wx.navigateTo({
            url: `/packageTeamwork/courseDetail/courseDetail?course_id=${payModel.courseId}`,
        })
    },
    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        wx.showLoading({
            title: '加载中...',
        })
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                let inviteCode = res.user_info.invite_code || ''
                this.setData({
                    inviteCode: inviteCode,
                })
                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },
    // 获取详情
    getCourseDetail() {
        teamworkModel
            .queryCourseDetailStudent(payModel.courseId)
            .then((res) => {
                this.setData({
                    cash_back_money: res.cash_back_money,
                })
            })
            .catch((err) => {})
    },
})
