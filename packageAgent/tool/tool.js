// pages/orderCheck/orderCheck.js
const userShopInfoModel = require('../../models/userShopInfo')
const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        tool_course: 1, //团作 1不开 2开启
        tool_points: 1, //积分商城 1不开 2开启
        tool_tutorial: 1, //看看 1不开 2开启
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        this.getUserInfo()
        console.log('输出 ~ app', app)
    },
    onPop() {
        let pages = getCurrentPages()
        if (pages.length === 1) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
    setToolCourse: function (e) {
        let course = e.detail ? 2 : 1
        this.setData({
            tool_course: course,
        })
        userShopInfoModel
            .updateToolCourse(course)
            .then((res) => {
                wx.showToast({
                    title: '设置成功',
                    icon: 'none',
                    duration: 2000,
                })
                // wx.switchTab({
                //     url: '/pages/index/index',
                // })
            })
            .catch((err) => {})
    },
    setToolPoints: function (e) {
        let points = e.detail ? 2 : 1
        this.setData({
            tool_points: points,
        })
        userShopInfoModel
            .updateToolPoints(points)
            .then((res) => {
                wx.showToast({
                    title: '设置成功',
                    icon: 'none',
                    duration: 2000,
                })
                // wx.switchTab({
                //     url: '/pages/index/index',
                // })
            })
            .catch((err) => {})
    },
    setToolTutorial: function (e) {
        let points = e.detail ? 2 : 1
        this.setData({
            tool_tutorial: points,
        })

        userShopInfoModel
            .updateToolTutorial(points)
            .then((res) => {
                wx.showToast({
                    title: '设置成功',
                    icon: 'none',
                    duration: 2000,
                })
                // wx.switchTab({
                //     url: '/pages/index/index',
                // })
            })
            .catch((err) => {})
    },
    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        wx.showLoading()
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                console.log('输出 ~ res', res)
                let tool_course = res.shop_info.tool_course
                let tool_points = res.shop_info.tool_points
                let tool_tutorial = res.shop_info.tool_tutorial
                this.setData({
                    tool_course,
                    tool_points,
                    tool_tutorial,
                })
                wx.hideLoading()
            })
            .catch((err) => {})
    },
})
