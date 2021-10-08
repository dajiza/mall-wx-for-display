// miniprogram/pages/login/login.js
const config = require('../../config/config')

const loginModel = require('../../models/login.js')
const configModel = require('../../models/config.js')
const loginWatch = require('../../utils/loginWatch.js')

const userShopInfoModel = require('../../models/userShopInfo')

const util = require('../../utils/util')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        shopName: config.shopName,
        loading: false,
        fromUser: true,
        afterLogin: {
            path: '',
            isTab: false,
        },
    },
    events: {
        afterLogin: function (afterLogin) {
            console.log('输出 ~ afterLogin', afterLogin)
            let { path = '', isTab = false } = afterLogin
            this.data.afterLogin = {
                path: path,
                isTab: isTab,
            }
        },
    },

    // 微信获取用户信息
    // onGotUserInfo: function (e) {
    //     console.log('输出 ~ e', e)
    //     if (e.detail.errMsg != 'getUserInfo:ok') {
    //         return
    //     }
    //     if (this.data.loading) {
    //         return
    //     }
    //     this.setData({
    //         loading: true,
    //     })
    //     wx.getUserInfo({
    //         success: (res) => {
    //             var userData = res
    //             loginModel
    //                 .queryToken(userData)
    //                 .then((res) => {
    //                     loginModel.saveUserStorage(res)
    //                     return userShopInfoModel.queryUserShopInfo()
    //                 })
    //                 .then((res) => {
    //                     let userInfo = res.user_info
    //                     wx.setStorageSync('userInfo', {
    //                         nickName: userInfo.nick_name,
    //                         avatarUrl: userInfo.avatar_url,
    //                     })
    //                 })
    //                 .then((result) => {
    //                     configModel
    //                         .queryConfigList({})
    //                         .then((res) => {
    //                             console.log('输出 ~ res queryConfigList', res)
    //                             if (res) {
    //                                 Object.keys(res).forEach((key) => {
    //                                     wx.setStorageSync(key, res[key])
    //                                 })
    //                             }
    //                             this.setData({
    //                                 loading: false,
    //                             })
    //                             if (this.data.fromUser) {
    //                                 //主动发起登录请求
    //                                 //完成登录操作后续流程
    //                                 console.log(this.data.afterLogin)
    //                                 if (this.data.afterLogin.path === '') {
    //                                     loginWatch.onNext(this, true)
    //                                     wx.navigateBack()
    //                                 } else {
    //                                     if (this.data.afterLogin.isTab) {
    //                                         wx.switchTab({
    //                                             url: this.data.afterLogin.path,
    //                                         })
    //                                     } else {
    //                                         wx.redirectTo({
    //                                             url: this.data.afterLogin.path,
    //                                         })
    //                                     }
    //                                 }
    //                             } else {
    //                                 //网络请求中发现token存在问题导致的登录
    //                                 wx.switchTab({
    //                                     url: '../index/index',
    //                                 })
    //                             }
    //                         })
    //                         .catch((err) => {
    //                             this.setData({
    //                                 loading: false,
    //                             })
    //                         })
    //                 })
    //                 .catch((err) => {
    //                     this.setData({
    //                         loading: false,
    //                     })
    //                 })
    //         },
    //         fail: (err) => {
    //             this.setData({
    //                 loading: false,
    //             })
    //         },
    //     })
    // },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // wx.showLoading({})
        // let that = this
        // wx.login({
        //     success(res) {
        //         util.request(
        //             'user-login',
        //             {
        //                 js_code: res.code,
        //                 shop_id: config.shopId,
        //             },
        //             'POST',
        //             false
        //         )
        //             .then((result) => {
        //                 util.saveUserStorage(result)
        //                 wx.hideLoading()
        //             })
        //             .catch((error) => {
        //                 wx.hideLoading()
        //             })
        //     },
        //     fail(err) {
        //         wx.hideLoading()
        //     },
        // })
    },
    loginFun: function (options) {
        console.log('输出 ~ loginFun')
        return new Promise((resolve, reject) => {
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
                            util.saveUserStorage(result)
                            loginModel.updateLoginTime()

                            resolve()
                        })
                        .catch((error) => {
                            reject(err)
                        })
                },
                fail(err) {
                    reject(err)
                },
            })
        })
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        wx.getUserProfile({
            desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
            success: (res) => {
                console.log('输出 ~ onReady-wx.getUserProfile', res)
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true,
                })
            },
        })
    },

    onCancel: function () {
        if (this.data.fromUser) {
            loginWatch.onNext(this, false)
            // wx.navigateBack()
            // return
        }
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
    ClickBack: function () {
        this.onCancel()
    },
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
    getUserProfile(e) {
        // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
        // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
        wx.getUserProfile({
            desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
            success: async (res) => {
                await this.loginFun()
                console.log('输出 ~ 用于完善会员资料用于完善会员资料用于完善会员资料', res)
                // 上传头像昵称
                let userInfo = wx.getStorageSync('userInfo')
                if (userInfo == 0) {
                    let openId = wx.getStorageSync('openId')
                    loginModel.updateUserInfo(openId, res.userInfo.nickName, res.userInfo.avatarUrl)
                }
                console.log('输出 ~ this.data.afterLogin', this.data.afterLogin)

                // 更新标记
                if (this.data.fromUser) {
                    //主动发起登录请求
                    //完成登录操作后续流程
                    if (this.data.afterLogin.path === '') {
                        loginWatch.onNext(this, true)
                        // wx.navigateBack()
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
                    } else {
                        if (this.data.afterLogin.isTab) {
                            wx.switchTab({
                                url: this.data.afterLogin.path,
                            })
                        } else {
                            wx.redirectTo({
                                url: this.data.afterLogin.path,
                            })
                        }
                    }
                } else {
                    //网络请求中发现token存在问题导致的登录
                    wx.switchTab({
                        url: '/pages/index/index',
                    })
                }
            },
        })
    },

    cc(e) {
        userShopInfoModel.queryUserShopInfo().then((res) => {
            console.log('输出 ~ res', res)
        })
    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {},
})
