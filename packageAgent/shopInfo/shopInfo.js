// pages/orderCheck/orderCheck.js

const userShopInfoModel = require('../../models/userShopInfo')
const loginWatch = require('../../utils/loginWatch')
const util = require('../../utils/util')
const loginModel = require('../../models/login.js')
const phoneNumWatch = require('../../utils/phoneNumWatch')
const config = require('../../config/config')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        version: '',
        envVersion: '',
        nickName: '',
        shopName: '',
        avatar: '',
        phone: '',
        openId: wx.getStorageSync('openId'),
        token: wx.getStorageSync('token'),
        userInfo: {},
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        const accountInfo = wx.getAccountInfoSync()
        this.setData({
            version: accountInfo.miniProgram.version,
            envVersion: accountInfo.miniProgram.envVersion,
        })
    },
    onShow: function (e) {
        loginWatch.observer(
            this,
            () => {
                this.getUserInfo()
            },
            '/pages/mySetting/mySetting',
            true
        )
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
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
                console.log('输出 ~ res', res)
                this.setData({
                    nickName: res.user_info.nick_name,
                    shopName: res.shop_info.shop_name,
                    avatar: res.user_info.avatar_url,
                    phone: res.user_info.phone,
                })
                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },

    // 图片上传
    afterRead(event) {
        const file = event.detail.file
        const nickName = this.data.nickName

        util.uploadFile(file.path)
            .then((res) => {
                let result = JSON.parse(res)
                console.log('输出 ~ result', result)

                let openId = wx.getStorageSync('openId')
                loginModel.updateUserInfo(openId, nickName, result.data.file_url).then((res) => {
                    wx.showToast({
                        title: '头像修改成功',
                        icon: 'none',
                        duration: 2000,
                    })
                })

                this.setData({
                    avatar: result.data.file_url,
                })
            })
            .catch((err) => {
                // reject(err)
            })
    },
    // 图片超出限制
    oversize(event) {
        wx.showToast({
            title: '图片大小请在10M以下',
            icon: 'none',
            duration: 2000,
        })
    },
    /**
     * 获取手机号
     */
    updatePhone() {
        console.log('输出 ~ updatePhone')
        let pageId = this.getPageId()
        let page = getCurrentPages().find((page) => page && page.getPageId() == pageId)
        phoneNumWatch.observer(
            page,
            () => {
                wx.redirectTo({
                    url: '/packageAgent/shopInfo/shopInfo',
                })
            },
            true
        )
    },
    /**
     * 重新授权登录
     */
    clickLoginAgainBtn() {
        // wx.navigateTo({
        //     url: '/pages/login/login?fromUser=' + 1,
        // })
        wx.showLoading({
            title: '重新授权中...',
        })
        wx.login({
            success(res) {
                util.request(
                    'user-login',
                    {
                        js_code: res.code,
                        shop_id: config.shopId,
                    },
                    'POST',
                    false
                )
                    .then((result) => {
                        console.log('输出 ~ result', result)
                        util.saveUserStorage(result)
                        wx.hideLoading()
                        loginModel.updateLoginTime()
                        wx.showToast({
                            title: '重新授权成功',
                            icon: 'none',
                            duration: 2000,
                        })
                    })
                    .catch((error) => {
                        wx.hideLoading()
                    })
            },
            fail(err) {
                wx.hideLoading()
            },
        })
    },
    // 设置昵称
    gotoSetName() {
        wx.navigateTo({
            url: '/pages/setName/setName',
        })
    },
    /**
     * 扫码下单
     */
    handleCodeOrder() {
        wx.navigateTo({
            url: '/pages/codeOrder/codeOrder',
        })
        // 无权限
        // wx.showToast({
        //     title: '暂无权限，请联系管理员哦~',
        //     icon: 'none',
        //     duration: 2000,
        // })
    },
    /**
     * 待完成功能
     */
    clickUnfinishedBtn() {
        wx.showToast({
            title: '抱歉，功能暂未开放～',
            icon: 'none',
            duration: 2000,
        })
    },
})
