// pages/orderCheck/orderCheck.js
const teamworkModel = require('../../models/teamwork')
const payModel = require('../../models/pay')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        // courseId: '', //课程id
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {},
    onPop: function (e) {
        // wx.navigateBack({
        //     delta: 1,
        // })
        wx.switchTab({
            url: '/pages/teamworkIndex/teamworkIndex',
        })
    },
    gotoList: function (e) {
        wx.switchTab({
            url: '/pages/teamworkIndex/teamworkIndex',
        })
    },
    gotoCard: function (e) {
        wx.showLoading({
            title: '加载中...',
        })
        let courseId = payModel.courseId
        teamworkModel
            .userCardInfo({
                course_id: courseId,
            })
            .then((res) => {
                console.log(res)
                wx.hideLoading()
                wx.nextTick(() => {
                    this.navigateToContactCard(res)
                })
            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    navigateToContactCard(userCardInfo) {
        let courseId = payModel.courseId
        //判断必填信息是否已经填写
        if (userCardInfo.wx_account && userCardInfo.wx_qr_url && userCardInfo.wx_account.length > 0 && userCardInfo.wx_qr_url.length > 0) {
            //必填信息已完善
            let admin = 0
            wx.navigateTo({
                url: '/packageTeamwork/contactCardView/contactCardView?course_id=' + courseId + '&admin=' + admin,
            })
        } else {
            console.log('老师未设置名片')
            //必填信息未完善
            //学员，提示名片信息不全，无法查看
            wx.showToast({
                title: '老师未设置名片',
                icon: 'none',
                duration: 2000,
            })
            this.post({
                eventName: 'getTeamworkIndexActive',
                eventParams: '1',
            })
            setTimeout(() => {
                wx.switchTab({
                    url: '/pages/teamworkIndex/teamworkIndex',
                })
            }, 2000)
        }
    },
})
