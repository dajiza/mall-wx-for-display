import util from './util'

const loginModel = require('../models/login')
const configModel = require('../models/config')
const userShopInfoModel = require('../models/userShopInfo')

let getLoginPhone = function (page, callback, retry, needLogin = true, endRetry = null) {
    if (!needLogin) {
        //已经登录
        //直接绑定手机号
        let authorize = page.selectComponent('#authorize')
        console.log(authorize)
        if (authorize != null) {
            authorize.setData(
                {
                    isShow: true,
                    openType: 'getPhoneNumber',
                },
                () => {
                    page['phoneNumWatch'] = (event) => {
                        if (event) {
                            if (page.lifecycler === 'onShow' || page.lifecycler === 'onReady') {
                                callback()
                            } else {
                                let lifecyclerCallback = (lifecycler) => {
                                    if (lifecycler === 'onShow') {
                                        callback()
                                        page.lifecyclerWatch.removeLifecyclerCallback(lifecyclerCallback)
                                        console.log(page)
                                    }
                                }
                                page.lifecyclerWatch.addLifecyclerCallback(lifecyclerCallback)
                                console.log(page)
                            }
                        }
                    }
                }
            )
        } else {
            //未找到手机号授权组件
            callback()
        }
        return
    }
    //需要先登录再绑定手机号
    wx.getSetting({
        success: function (res) {
            console.log('输出 ~ getSetting', '绑定手机')

            if (res.authSetting['scope.userInfo']) {
                //已授予权限，静默登录
                //绑定手机号
                let authorize = page.selectComponent('#authorize')
                if (authorize != null) {
                    authorize.setData(
                        {
                            isShow: true,
                            openType: 'getPhoneNumber',
                        },
                        () => {
                            page['phoneNumWatch'] = (event) => {
                                if (event) {
                                    if (page.lifecycler === 'onShow' || page.lifecycler === 'onReady') {
                                        callback()
                                    } else {
                                        let lifecyclerCallback = (lifecycler) => {
                                            if (lifecycler === 'onShow') {
                                                callback()
                                                page.lifecyclerWatch.removeLifecyclerCallback(lifecyclerCallback)
                                                console.log(page)
                                            }
                                        }
                                        page.lifecyclerWatch.addLifecyclerCallback(lifecyclerCallback)
                                        console.log(page)
                                    }
                                }
                            }
                        }
                    )
                } else {
                    //未找到手机号授权组件
                    callback()
                }
            } else {
                //授予的权限被回收,直接认为重试次数为0，重走登录流程
                if (endRetry != null) {
                    endRetry(page, callback)
                }
            }
        },
    })
}

module.exports = {
    loginObserver: function (page, callback, path = '', isTab = false) {
        let checkCode = util.needGetUserProfile()
        let that = this
        if (checkCode != 0) {
            if (path.length > 0) {
                page.post({
                    eventName: 'afterLogin',
                    eventParams: {
                        path: path,
                        isTab: isTab,
                    },
                    isSticky: true,
                })
                wx.redirectTo({
                    url: '/pages/login/login?fromUser=' + 1,
                })
                return
            }
            wx.navigateTo({
                url: '/pages/login/login?fromUser=' + 1,
                success: function (res) {
                    page['loginWatch'] = (event) => {
                        if (event) {
                            if (page.lifecycler === 'onShow') {
                                callback()
                            } else {
                                let lifecyclerCallback = (lifecycler) => {
                                    console.log(lifecycler)
                                    if (lifecycler === 'onShow') {
                                        that.phoneNumObserver(
                                            page,
                                            () => {
                                                callback()
                                            },
                                            true
                                        )
                                        page.lifecyclerWatch.removeLifecyclerCallback(lifecyclerCallback)
                                        console.log(page)
                                    }
                                }
                                page.lifecyclerWatch.addLifecyclerCallback(lifecyclerCallback)
                                console.log(page)
                            }
                        }
                    }
                    console.log(page)
                },
            })
        } else {
            callback()
        }
    },
    loginOnNext: function (page, isLogin) {
        console.log('loginOnNext')
        if (page.post) {
            page.post({
                eventName: 'loginWatch',
                eventParams: isLogin,
            })
        }
    },
    phoneNumObserver: function (page, callback, force = false) {
        //查询是否绑定过手机号
        if (force) {
            //强制请求手机号
            let retry = 3
            getLoginPhone(page, callback, retry, false)
            return
        }
        let that = this
        that.loginObserver(page, () => {
            loginModel.queryPhone().then((res) => {
                console.log('loginModel.queryPhone phone:' + res.phone)
                if (res.phone && res.phone.length > 0) {
                    //有手机号
                    callback()
                } else {
                    //无手机号
                    let retry = 3
                    getLoginPhone(page, callback, retry, true, (page, callback) => {
                        that.loginObserver(page, () => {
                            //重新登录完成，直接绑定手机号
                            getLoginPhone(page, callback, 0, false)
                        })
                    })
                }
            })
        })
    },
    phoneNumOnNext: function (page, isLogin) {
        if (page.post) {
            page.post({
                eventName: 'phoneNumWatch',
                eventParams: isLogin,
            })
        }
    },
}
