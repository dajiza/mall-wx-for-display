/**
 * 登录模块逻辑类
 */

const http = require('../utils/util.js')
const config = require('../config/config')

module.exports = {
    // 调用微信登录
    wxLogin: function () {
        return new Promise((resolve, reject) => {
            wx.login({
                success(res) {
                    console.log('输出 ~ wxLogin', res)
                    if (res.code) {
                        // 登录远程服务器
                        resolve(res)
                    } else {
                        reject(res)
                    }
                },
                fail(err) {
                    reject(err)
                },
            })
        })
    },
    // 获取微信openid
    queryToken: function (userData, showErrorMsg = true) {
        console.log('输出 ~ login model user-login')
        return new Promise((resolve, reject) => {
            this.wxLogin()
                .then((res) => {
                    http.request(
                        'user-login',
                        {
                            js_code: res.code,
                            shop_id: config.shopId,
                            iv: userData.iv,
                            encrypt_data: userData.encryptedData,
                        },
                        'POST',
                        false,
                        showErrorMsg
                    )
                        .then((result) => {
                            resolve(result)
                        })
                        .catch((error) => {
                            reject(error)
                        })
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 判断是否绑定了手机
    queryPhone: function () {
        return new Promise((resolve, reject) => {
            http.request('user-phone-query', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 登录完成后 跳转绑定手机页面
    // gotoLoginPhone: async function (isOrder) {
    //     isOrder = isOrder || false;
    //     let hasPhone = await this.queryPhone();
    //     if (hasPhone.phone == "") {
    //         wx.navigateTo({
    //             url: "../../pages/login/login?is_order=" + isOrder
    //             // url: "../../pages/loginPhone/loginPhone?is_order=" + isOrder,
    //         });
    //     }
    // },
    // 绑定手机
    bindPhone: function (iv, encrypt_data) {
        return new Promise((resolve, reject) => {
            http.request('user-bind-phone', { iv, encrypt_data })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 保存本地信息
    saveUserStorage: function (info) {
        // wx.clearStorageSync()
        wx.setStorageSync('openId', info.open_id)
        wx.setStorageSync('refreshToken', info.refresh_token)
        wx.setStorageSync('token', info.token)
        wx.setStorageSync('tokenExpiredTime', info.token_expired_time)
        wx.setStorageSync('isShopAdmin', info.is_shop_admin)
        wx.setStorageSync('userInfo', info.user_info) //是否已获取用户信息 0未获取 1已获取
    },

    // 受邀请用户授权/注册/登陆接口
    createUserInviteLogin: function (userData, showErrorMsg = true) {
        return new Promise((resolve, reject) => {
            this.wxLogin()
                .then((res) => {
                    let user_login_req = {
                        js_code: res.code,
                        shop_id: config.shopId,
                        // iv: userData.iv,
                        // encrypt_data: userData.encryptedData,
                        inviter_id: userData.inviterId,
                    }
                    console.log('输出 ~ user_login_req', user_login_req)
                    // return
                    http.request(
                        'user-invite-login',
                        {
                            user_login_req,
                        },
                        'POST',
                        false,
                        showErrorMsg
                    )
                        .then((result) => {
                            resolve(result)
                        })
                        .catch((error) => {
                            reject(error)
                        })
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 新用户邀请（手机授权）
    createUserInviteBindPhone: function (inviter_id, user_bind_phone) {
        return new Promise((resolve, reject) => {
            http.request('user-invite-bind-phone', {
                inviter_id,
                user_bind_phone,
            })
                .then((result) => {
                    resolve(result)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    },

    // 更新用户信息（需登陆）
    updateUserInfo: function (wx_openid, nick_name, avatar_url) {
        return new Promise((resolve, reject) => {
            http.request('user-info-update', { wx_openid, nick_name, avatar_url })
                .then((res) => {
                    // 刷新是否已经获取用户信息标记 只在触发user-login获取
                    wx.setStorageSync('userInfo', 1)
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 更新最后登陆时间
    updateLoginTime: function () {
        return new Promise((resolve, reject) => {
            http.request('user-last-login-update', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
