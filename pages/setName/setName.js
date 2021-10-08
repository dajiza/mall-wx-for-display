// pages/orderCheck/orderCheck.js
const loginModel = require('../../models/login.js')
const userShopInfoModel = require('../../models/userShopInfo')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        name: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.getUserInfo()
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    getUserInfo() {
        wx.showLoading({
            title: '加载中...',
        })
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                console.log('输出 ~ res', res)
                this.setData({
                    name: res.user_info.nick_name,
                })
                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },
    saveName: function (e) {
        let name = this.data.name
        console.log('输出 ~ name', name)
        if (!name) {
            wx.showToast({
                title: '请输入昵称',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        let openId = wx.getStorageSync('openId')
        loginModel.updateUserInfo(openId, name).then((res) => {
            wx.showToast({
                title: '昵称修改成功',
                icon: 'none',
                duration: 2000,
            })
            this.onPop()
        })
    },
})
