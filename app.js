//app.js
import config from './config/config'
import util from './utils/util'
import MiniHook from './aop/miniHook'
import EventBus from './aop/eventBus'
import Poster from './models/poster'

// 生产包取消日志输出
if (!config.logDebug) {
    console.log = () => {}
}
util.httpLog.enable = config.httpLog

//aop 所有使用App.Page创建的Page，其生命周期都会在这里得到回调，优先级高于Page当中的生命周期
//可以在这里做一些统一的业务，比如埋点信息上报，添加全局数据等
//增加eventBus支持
MiniHook.config(EventBus.configOption)

Date.prototype.format = function (fmt) {
    var o = {
        'M+': this.getMonth() + 1, //月份
        'd+': this.getDate(), //日
        'h+': this.getHours(), //小时
        'm+': this.getMinutes(), //分
        's+': this.getSeconds(), //秒
        'q+': Math.floor((this.getMonth() + 3) / 3), //季度
        S: this.getMilliseconds(), //毫秒
    }
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
        }
    }
    return fmt
}

App({
    onLaunch: async function () {
        this.overShare()

        wx.getSystemInfo({
            success: (res) => {
                // 状态栏高度
                this.globalData.statusBarHeight = res.statusBarHeight
            },
        })
        // 获取用户信息
        // wx.getSetting({
        //     success: (res) => {
        //         if (res.authSetting['scope.userInfo']) {
        //             // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
        //             wx.getUserInfo({
        //                 success: (res) => {
        //                     // 可以将 res 发送给后台解码出 unionId
        //                     this.globalData.userInfo = res.userInfo

        //                     // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        //                     // 所以此处加入 callback 以防止这种情况
        //                     if (this.userInfoReadyCallback) {
        //                         this.userInfoReadyCallback(res)
        //                     }
        //                 },
        //             })
        //         }
        //     },
        // })
        await util.queryTokenSilent()
        Poster.clearCache()
    },
    onShow: function () {
        this.autoUpdate()
    },
    //重写分享方法
    overShare: function () {
        //监听路由切换
        //间接实现全局设置分享内容
        wx.onAppRoute(function (res) {
            //获取加载的页面
            let pages = getCurrentPages(),
                //获取当前页面的对象
                view = pages[pages.length - 1],
                data
            data = view.data

            // 禁用分享
            if (data.disabledShare) {
                return
            }
            wx.showShareMenu({
                withShareTicket: false,
            })
            if (view) {
                console.log('输出 ~ view', view)
                if (!data.isOverShare) {
                    view.onShareAppMessage = function () {
                        //你的分享配置
                        return {
                            title: config.shareTitle,
                            path: '/pages/index/index',
                            imageUrl: '/assets/images/share-img.png',
                        }
                    }
                }
            }
        })
    },

    // 提示更新
    autoUpdate: function () {
        console.log('小程序自动更新')

        var self = this
        // 获取小程序更新机制兼容
        if (wx.canIUse('getUpdateManager')) {
            const updateManager = wx.getUpdateManager()
            //1. 检查小程序是否有新版本发布
            updateManager.onCheckForUpdate(function (res) {
                // 请求完新版本信息的回调
                if (res.hasUpdate) {
                    //检测到新版本，需要更新，给出提示
                    wx.showModal({
                        title: '更新提示',
                        content: '检测到新版本，是否下载新版本并重启小程序？',
                        success: function (res) {
                            if (res.confirm) {
                                //2. 用户确定下载更新小程序，小程序下载及更新静默进行
                                self.downLoadAndUpdate(updateManager)
                            } else if (res.cancel) {
                                //用户点击取消按钮的处理，如果需要强制更新，则给出二次弹窗，如果不需要，则这里的代码都可以删掉了
                                wx.showModal({
                                    title: '温馨提示~',
                                    content: '本次版本更新涉及到新的功能添加，旧版本无法正常访问的哦~',
                                    showCancel: false, //隐藏取消按钮
                                    confirmText: '确定更新', //只保留确定更新按钮
                                    success: function (res) {
                                        if (res.confirm) {
                                            //下载新版本，并重新应用
                                            self.downLoadAndUpdate(updateManager)
                                        }
                                    },
                                })
                            }
                        },
                    })
                }
            })
        } else {
            // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
            wx.showModal({
                title: '提示',
                content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
            })
        }
    },
    /**
     * 下载小程序新版本并重启应用
     */
    downLoadAndUpdate: function (updateManager) {
        var self = this
        wx.showLoading()
        //静默下载更新小程序新版本
        updateManager.onUpdateReady(function () {
            wx.hideLoading()
            //新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
        })
        updateManager.onUpdateFailed(function () {
            // 新的版本下载失败
            wx.showModal({
                title: '已经有新版本了哟~',
                content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
            })
        })
    },
    globalData: {
        userInfo: null,
        screenConfig: null,
    },
})
