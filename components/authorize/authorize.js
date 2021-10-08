// components/authorize/authorize.js
const config = require('../../config/config')
const util = require('../../utils/util')

const loginModel = require('../../models/login.js')
const phoneNumWatch = require('../../utils/phoneNumWatch')

Component({
    /**
     * 组件的属性列表
     */
    properties: {},

    /**
     * 组件的初始数据
     */
    data: {
        shopName: config.shopName,
        openType: 'getPhoneNumber',
        isShow: false,
        title: '微信手机号授权',
        asyncClose: true,
        authorizeContent: '申请获取您微信绑定的手机号',
        showConfirmButton: false, //确认按钮显示
        cancelText: '拒绝', //取消按钮文案
    },
    observers: {
        //观察者：属性监听
        //单个监听
        isShow(value) {
            this.triggerEvent('authorizeTrigger', value)
            if (value) {
                let that = this
                that.setData({
                    showConfirmButton: false,
                    cancelText: '加载中',
                })
                wx.checkSession({
                    success() {
                        //session_key 未过期，并且在本生命周期一直有效
                        that.setData({
                            showConfirmButton: true,
                            cancelText: '拒绝',
                        })
                    },
                    async fail() {
                        // session_key 已经失效，需要重新执行登录流程
                        await util.queryTokenSilent()
                        that.setData({
                            showConfirmButton: true,
                            cancelText: '拒绝',
                        })
                    },
                })
            }
        },
    },
    /**
     * 组件的方法列表
     */
    methods: {
        getuserinfo(e) {
            console.log(e)
            this.close()
        },
        getphonenumber(e) {
            console.log('输出 ~ getphonenumber', e)
            let encryptedData = e.detail.encryptedData || ''
            let iv = e.detail.iv || ''
            if (encryptedData.length == 0 && iv.length == 0) {
                this.close()
                return
            }
            console.log('开始绑定手机')
            loginModel
                .bindPhone(iv, encryptedData)
                .then((res) => {
                    let pageId = this.getPageId()
                    let page = getCurrentPages().find((page) => page && page.getPageId() == pageId)
                    phoneNumWatch.onNext(page, true)
                    this.close()
                })
                .catch((err) => {
                    this.selectComponent('#dialog').stopLoading()
                })
        },
        show() {
            this.setData({
                isShow: true,
                asyncClose: true,
            })
        },
        close() {
            this.setData(
                {
                    asyncClose: false,
                },
                () => {
                    this.setData({
                        isShow: false,
                        asyncClose: true,
                    })
                }
            )
        },
    },
})
