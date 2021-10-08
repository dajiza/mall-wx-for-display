// pages/invite/invite.js
const inviteModel = require('../../models/invite')
const loginModel = require('../../models/login.js')
const userShopInfoModel = require('../../models/userShopInfo')
const util = require('../../utils/util')

const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        navTitle: '川小布，什么布都有',
        inviterId: '',
        avatar: '',
        nickName: '',
        loading: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // let inviterId, avatar, nickName

        // var scene =
        //     '%7B%22avatar%22%3A%22https%3A%2F%2Fthirdwx.qlogo.cn%2Fmmopen%2Fvi_32%2FQ3auHgzwzM4lN3viaK8Mxz5C1v9ocvO6f3fAbmvroeONe53J9eicTNiaTibMjd9iciaxUeicPibWQq0oGjib6lrO7ogictSg%2F132%22%2C%22user_id%22%3A3%2C%22nick_name%22%3A%22%E6%AC%A2%E4%B9%90%E9%A9%AC%22%7D'
        // scene = decodeURIComponent(scene)
        // scene = JSON.parse(scene)
        // inviterId = scene.user_id
        // avatar = scene.avatar
        // nickName = scene.nick_name

        // if (options.scene) {
        //     // 参数二维码传递过来的参数
        //     var scene = decodeURIComponent(options.scene)
        //     scene = JSON.parse(scene)
        //     inviterId = scene.user_id
        //     avatar = scene.avatar
        //     nickName = scene.nick_name
        // } else {
        //     inviterId = options.user_id
        //     avatar = options.avatar
        //     nickName = options.nick_name
        // }
        // this.setData({
        //     inviterId,
        //     avatar,
        //     nickName,
        // })

        let id = options.scene ? options.scene : options.user_id
        userShopInfoModel.queryUserInfo(id).then((res) => {
            console.log('输出 ~ res', res)
            this.setData({
                inviterId: id,
                avatar: res.avatar_url,
                nickName: res.nick_name,
            })
        })

        wx.checkSession({
            success() {
                //session_key 未过期，并且在本生命周期一直有效
            },
            async fail() {
                // session_key 已经失效，需要重新执行登录流程
                await util.queryTokenSilent()
            },
        })
    },
    // aaa: function (e) {
    //     let result = {
    //         code: 400,
    //         msg: '领取失败',
    //         data: false,
    //     }
    //     console.log('输出 ~ result', result)
    //     this.post({
    //         eventName: 'getInviteCouponResult',
    //         eventParams: result,
    //         isSticky: true,
    //     })
    //     wx.switchTab({
    //         url: '../index/index',
    //     })
    // },
    // 微信获取用户信息
    onGotUserInfo: async function (e) {
        if (e.detail.errMsg != 'getPhoneNumber:ok') {
            return
        }
        if (this.data.loading) {
            return
        }
        let inviterId = Number(this.data.inviterId)
        this.setData({
            loading: true,
        })
        let user_bind_phone = {
            iv: e.detail.iv,
            encrypt_data: e.detail.encryptedData,
        }

        loginModel
            .createUserInviteBindPhone(inviterId, user_bind_phone)
            .then((res) => {
                console.log('输出 ~ result', res)
                wx.showToast({
                    title: '领取成功,可在“我的-优惠券包”内查看',
                    icon: 'none',
                    duration: 3000,
                })
                setTimeout(() => {
                    wx.switchTab({
                        url: '../index/index',
                    })
                }, 1000)
                this.setData({
                    loading: false,
                })
            })
            .catch((err) => {
                setTimeout(() => {
                    wx.switchTab({
                        url: '../index/index',
                    })
                }, 1000)
                this.setData({
                    loading: false,
                })
            })
    },

    authorize: function () {},

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
    onShareAppMessage: function (res) {
        return {
            title: '分享',
            path: '/pages/goodsDetail/goodsDetail',
            // imageUrl: '',
            success: function (res) {
                // 转发成功
            },
            fail: function (res) {
                // 转发失败
            },
        }
    },
})
