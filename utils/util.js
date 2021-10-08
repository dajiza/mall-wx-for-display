const config = require('../config/config')

import moment from 'moment'

let httpLog = {
    enable: true,
    httpLogRequestOption: function (requestOption) {
        let that = this
        if (that.enable) {
            let request = {}
            for (let p in requestOption) {
                if (typeof requestOption[p] != 'function') {
                    request[p] = requestOption[p]
                }
            }
            let success = requestOption.success
            let fail = requestOption.fail
            requestOption.success = function (e) {
                that.printRequestLog(request)
                that.printResponseLog(e)
                success(e)
            }
            requestOption.fail = function (e) {
                that.printRequestLog(request)
                that.printResponseLog(e)
                fail(e)
            }
        }
        return requestOption
    },
    printRequestLog: function (request) {
        this.printLine()
        // console.log('request begin')
        this.printLine()
        // console.log(JSON.stringify(request, null, 4))
        this.printLine()
        // console.log('request end')
        this.printLine()
    },
    printResponseLog: function (response) {
        this.printLine()
        // console.log('response begin')
        this.printLine()
        // console.log(JSON.stringify(response, null, 2))
        this.printLine()
        // console.log('response end')
        this.printLine()
    },
    printLine: function () {
        // console.log('---------------------------------')
    },
}
console.log(httpLog)

module.exports = {
    httpLog: httpLog,
    hasEmoji: function (substring) {
        var reg = new RegExp('[~#^$@%&!?%*]', 'g')
        if (substring.match(reg)) {
            return true
        }
        for (var i = 0; i < substring.length; i++) {
            var hs = substring.charCodeAt(i)
            if (0xd800 <= hs && hs <= 0xdbff) {
                if (substring.length > 1) {
                    var ls = substring.charCodeAt(i + 1)
                    var uc = (hs - 0xd800) * 0x400 + (ls - 0xdc00) + 0x10000
                    if (0x1d000 <= uc && uc <= 0x1f77f) {
                        return true
                    }
                }
            } else if (substring.length > 1) {
                var ls = substring.charCodeAt(i + 1)
                if (ls == 0x20e3) {
                    return true
                }
            } else {
                if (0x2100 <= hs && hs <= 0x27ff) {
                    return true
                } else if (0x2b05 <= hs && hs <= 0x2b07) {
                    return true
                } else if (0x2934 <= hs && hs <= 0x2935) {
                    return true
                } else if (0x3297 <= hs && hs <= 0x3299) {
                    return true
                } else if (hs == 0xa9 || hs == 0xae || hs == 0x303d || hs == 0x3030 || hs == 0x2b55 || hs == 0x2b1c || hs == 0x2b1b || hs == 0x2b50) {
                    return true
                }
            }
        }
    },
    formatTime: function (date) {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        const hour = date.getHours()
        const minute = date.getMinutes()
        const second = date.getSeconds()

        return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
    },

    formatNumber: function (n) {
        n = n.toString()
        return n[1] ? n : '0' + n
    },
    /**
     * 封装微信的的request
     */
    request: async function (url, data = {}, method = 'POST', needLogin = 'true', showErrorMsg = true) {
        console.log('输出 ~ url', url)
        let that = this
        return (
            new Promise(function (resolve, reject) {
                if (needLogin) {
                    // checkToken 0 通过验证 1 没有token 2 token过期
                    let checkCode = that.checkToken()
                    if (checkCode == 1) {
                        //未登录，启动登录页面并抛出异常，中断链式调用
                        wx.redirectTo({
                            url: '/pages/login/login',
                        })
                        reject('util request 未登录')
                    } else if (checkCode == 2) {
                        //token过期，刷新token
                        that.refreshToken().then((res) => {
                            //保存新的token相关信息
                            that.saveUserStorage(res)
                            if (!res.token) {
                                //返回的新token错误，重新登录，并抛出异常，中断链式调用
                                wx.redirectTo({
                                    url: '/pages/login/login',
                                })
                                reject('需重新登录')
                            } else {
                                //token有效，交由下游继续执行原始网络请求
                                resolve(0)
                            }
                        })
                    } else {
                        //已登录，交由下游处理token过期问题
                        resolve(0)
                    }
                } else {
                    //交由下游处理 token 正常
                    resolve(0)
                }
            })
                // .then((checkCode) => {
                //     return new Promise(function (resolve, reject) {
                //         if (checkCode == 2 && needLogin) {
                //             //token过期，刷新token
                //             that.refreshToken().then((res) => {
                //                 //保存新的token相关信息
                //                 that.saveUserStorage(res);
                //                 if (!res.token) {
                //                     //返回的新token错误，重新登录，并抛出异常，中断链式调用
                //                     wx.redirectTo({
                //                         url: "/pages/login/login",
                //                     });
                //                     reject("需重新登录");
                //                 } else {
                //                     //token有效，交由下游继续执行原始网络请求
                //                     resolve(0);
                //                 }
                //             });
                //         } else {
                //             resolve(0);
                //         }
                //     });
                // })
                .then((res) => {
                    return new Promise(function (resolve, reject) {
                        let requestOption = httpLog.httpLogRequestOption({
                            url: config.apiUrl + url,
                            data: data,
                            method: method,
                            header: {
                                'shop-id': config.shopId,
                                'Content-Type': 'application/json;charset=UTF-8',
                                token: wx.getStorageSync('token'),
                            },
                            success: function (res) {
                                if (res.data.code != 200) {
                                    console.log('请求出现错误 res===>', res)
                                    if (res.data.code == -1) {
                                        //token的时效性已经校验过，所以这里出现-1的可能大概率是异地登陆，需要重新登录
                                        wx.redirectTo({
                                            url: '/pages/login/login',
                                        })
                                        reject(res.data.msg)
                                        return
                                    } else if (res.data.code == -2) {
                                        // 无代理商权限 重新登录授权
                                        wx.redirectTo({
                                            url: '/pages/login/login',
                                        })
                                        reject(res.data.msg)
                                        return
                                    } else if (res.data.code == 404) {
                                        // 店铺下架状态 跳转空白页
                                        wx.redirectTo({
                                            url: '/pages/shopBlank/shopBlank',
                                        })
                                        reject(res.data.msg)
                                        return
                                    }
                                    reject(res.data.msg)
                                    //修复wx原生loading隐藏时，将正在展示的toast也隐藏的问题
                                    if (showErrorMsg) {
                                        setTimeout(() => {
                                            console.log('res.data ===>', res)
                                            console.log('res.data.msg', res.data.msg)
                                            wx.showToast({
                                                title: res.data.msg,
                                                icon: 'none',
                                                duration: 2000,
                                            })
                                        })
                                    }
                                    return
                                }
                                resolve(res.data.data)
                            },
                            fail: function (err) {
                                console.log('请求出现fail res===>', res)
                                console.log('请求出现fail err===>', err)
                                reject(err)
                            },
                        })
                        wx.request(requestOption)
                    })
                })
        )
    },
    // 上传单个文件
    uploadFile: function (filePath, api = '', formData = {}) {
        console.log('GOOGLE: filePath', filePath)
        let that = this

        return new Promise((resolve, reject) => {
            let checkCode = that.checkToken()
            if (checkCode != 0) {
                //未登录，启动登录页面并抛出异常，中断链式调用
                wx.redirectTo({
                    url: '/pages/login/login',
                })
                reject('未登录')
            } else {
                //已登录，交由下游处理token过期问题
            }
            let url = config.apiUrl + 'upload-file'

            if (api.length > 0) {
                url = config.apiUrl + api
            }
            wx.uploadFile({
                url: url,
                filePath: filePath,
                name: 'file',
                formData: {
                    ...formData,
                },
                header: {
                    'shop-id': config.shopId,
                    'Content-Type': 'multipart/form-data',
                    token: wx.getStorageSync('token'),
                },
                success: (res) => {
                    console.log('success')
                    resolve(res.data)
                },
                fail: (err) => {
                    console.log('fail')
                    reject(err)
                },
            })
        })
    },
    /**
     * 判断token 是否存在及过期
     * @return 0 通过验证 1 没有token 2 token过期
     */
    // "token":  "M9zgWfcDUyGgdnGj0HRzzvE66f2ZRI5e92VCRPSFfPMIK3VJLHziQHOZL4s4tRTS",
    // "open_id": "ocags5NSrnRexVgX8n2zukJjqSKw",
    // "refresh_token": "Y43mcmu1JCS1C2SmjTPxcVkUDi1AlchLk0FHrEI7SZwuQy0Yy2oYdMy4wGMSWRTZ",
    // "token_expired_time": "2020-10-19 12:01:36"
    checkToken: function () {
        const token = wx.getStorageSync('token')
        const tokenExpiredTime = wx.getStorageSync('tokenExpiredTime')
        if (!token) {
            return 1
        }
        let nowStamp = Date.parse(new Date())
        let tokenStamp = moment(tokenExpiredTime).format('x')
        // 判断过期
        if (tokenStamp < nowStamp) {
            return 2
        }
        // 验证通过
        return 0
    },
    //
    /**
     * 判断是否需要获取用户头像昵称
     * @return  0不需要 1需要登录
     */
    needGetUserProfile: function () {
        //是否已获取用户信息 0未获取 1已获取
        const userInfo = wx.getStorageSync('userInfo')
        // console.log('判断是否需要获取用户头像昵称 ', userInfo == 0 ? '未获取' : '已获取')
        if (userInfo == 0) {
            return 1
        } else {
            return 0
        }
    },

    /**
     * 刷新token
     *
     */
    refreshToken: function () {
        let refreshToken = wx.getStorageSync('refreshToken')
        return new Promise(function (resolve, reject) {
            wx.request({
                url: config.apiUrl + 'user-refresh-token',
                data: {
                    refresh_token: refreshToken,
                },
                method: 'POST',
                header: {
                    'shop-id': config.shopId,
                    'content-type': 'application/json',
                    token: wx.getStorageSync('token'),
                },
                success(res) {
                    if (res.data.code == 200) {
                        resolve(res.data.data)
                    } else {
                        wx.redirectTo({
                            url: '/pages/login/login',
                        })
                        reject('需重新登录')
                    }
                },
                fail: (err) => {
                    reject(err)
                },
            })
        })
    },
    // 保存本地信息
    saveUserStorage: function (info) {
        wx.setStorageSync('openId', info.open_id)
        wx.setStorageSync('refreshToken', info.refresh_token)
        wx.setStorageSync('token', info.token)
        wx.setStorageSync('tokenExpiredTime', info.token_expired_time)
        wx.setStorageSync('isShopAdmin', info.is_shop_admin)
        wx.setStorageSync('userInfo', info.user_info) //是否已获取用户信息 0未获取 1已获取
    },
    throttle: function (fn, interval) {
        var enterTime = 0 //触发的时间
        var gapTime = interval || 300 //间隔时间，如果interval不传，则默认300ms
        return function () {
            var context = this
            var backTime = new Date() //第一次函数return即触发的时间
            if (backTime - enterTime > gapTime) {
                fn.call(context, arguments)
                enterTime = backTime //赋值给第一次触发的时间，这样就保存了第二次触发的时间
            }
        }
    },

    /**
     * 2021.4改版后 静默登录
     * 只获取openid 不获取头像昵称
     * 2021.5改造获取手机前登陆一次 以防session_key过期 改为同步
     * 增加checkSession验证
     */
    queryTokenSilent: function () {
        return new Promise((resolve, reject) => {
            this.needGetUserProfile()

            let that = this
            let checkCode = this.checkToken()
            // if (checkCode == 0) {
            //     return
            // }
            wx.checkSession({
                async success() {
                    //session_key 未过期，并且在本生命周期一直有效
                    if (checkCode != 0) {
                        await that.wxlogin()
                        resolve()
                    }
                },
                async fail() {
                    // session_key 已经失效，需要重新执行登录流程
                    await that.wxlogin()
                    resolve()
                },
            })
        })
    },
    // 微信login
    wxlogin: function () {
        let that = this
        return new Promise((resolve, reject) => {
            wx.login({
                success(res) {
                    console.log('输出 ~ utils  user-login')

                    that.request(
                        'user-login',
                        {
                            js_code: res.code,
                            shop_id: config.shopId,
                        },
                        'POST',
                        false
                    )
                        .then((result) => {
                            that.saveUserStorage(result)
                            that.request('user-last-login-update', {})

                            resolve()
                        })
                        .catch((error) => {
                            reject(error)
                        })
                },
                fail(err) {
                    reject(err)
                },
            })
        })
    },
    /*函数防抖*/
    debounce: function (fn, interval) {
        var timer
        var gapTime = interval || 200 //间隔时间，如果interval不传，则默认200ms
        return function () {
            clearTimeout(timer)
            var context = this
            var args = arguments //保存此处的arguments，因为setTimeout是全局的，arguments不是防抖函数需要的。
            timer = setTimeout(function () {
                fn.call(context, args)
            }, gapTime)
        }
    },
    /**
     * 埋点方法
     *
     * name    上报名称
     * parameter  上报参数
     * exposure false 普通上报 true 曝光上报 按id多次上报
     */
    tracking: function (name, parameter, exposure = false) {
        if (exposure) {
            for (let i = 0; i < parameter.goods_id.length; i++) {
                const id = parameter.goods_id[i]
                wx.reportAnalytics(name, { goods_id: id, page: parameter.page })
            }
        } else {
            wx.reportAnalytics(name, parameter)
        }
    },
}
