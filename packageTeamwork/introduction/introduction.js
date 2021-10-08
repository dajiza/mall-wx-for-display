const teamworkModel = require('../../models/teamwork')
const util = require('../../utils/util')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        content: '',
        editable: true,
    },

    onPop: function (e) {
        let that = this
        wx.showModal({
            title: '',
            content: '是否保存团作介绍',
            confirmText: '保存',
            cancelText: '不保存',
            success(res) {
                if (res.confirm) {
                    that.saveIntroduction()
                    wx.navigateBack({
                        delta: 1,
                    })
                } else if (res.cancel) {
                    wx.navigateBack({
                        delta: 1,
                    })
                }
            },
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function () {
        console.log('输出 ~ teamworkModel.introduction', teamworkModel.introduction)
        this.setData({
            content: teamworkModel.introduction,
        })
        this.ctx = this.selectComponent('#article')
        /**
         * @description 设置获取链接的方法
         * @param {String} type 链接的类型（img/video/audio/link）
         * @param {String} value 修改链接时，这里会传入旧值
         * @returns {Promise} 返回线上地址（type为音视频时可以返回一个数组作为源地址）
         */
        this.ctx.getSrc = (type, value) => {
            console.log('输出 ~ value', value)
            return new Promise((resolve, reject) => {
                if (type == 'img') {
                    wx.showActionSheet({
                        itemList: ['本地选取', '远程链接'],
                        success: (res) => {
                            // 本地选取
                            if (res.tapIndex == 0) {
                                wx.chooseImage({
                                    count: 1,
                                    success: (res) => {
                                        //  上传到服务器后返回
                                        wx.showLoading({
                                            title: '上传中',
                                        })
                                        util.uploadFile(res.tempFilePaths[0])
                                            .then((res) => {
                                                let result = JSON.parse(res)
                                                wx.hideLoading()
                                                resolve(result.data.file_url) // 返回线上地址
                                            })
                                            .catch((err) => {
                                                wx.hideLoading()
                                                reject(err)
                                            })
                                    },
                                    fail: reject,
                                })
                            }
                            // 远程链接
                            else {
                                this.callback = {
                                    resolve,
                                    reject,
                                }
                                this.setData({
                                    modal: {
                                        title: '图片链接',
                                        value,
                                    },
                                })
                            }
                        },
                    })
                } else if (type == 'video') {
                    wx.showActionSheet({
                        itemList: ['本地选取', '远程链接'],
                        success: (res) => {
                            // 本地选取
                            if (res.tapIndex == 0)
                                wx.chooseVideo({
                                    count: 1,
                                    success: (res) => {
                                        //  上传到服务器后返回
                                        wx.showLoading({
                                            title: '上传中',
                                        })
                                        util.uploadFile(res.tempFilePath)
                                            .then((res) => {
                                                let result = JSON.parse(res)
                                                wx.hideLoading()
                                                resolve(result.data.file_url) // 返回线上地址
                                            })
                                            .catch((err) => {
                                                wx.hideLoading()
                                                reject(err)
                                            })
                                    },
                                    fail: reject,
                                })
                            // 远程链接
                            else {
                                this.callback = {
                                    resolve,
                                    reject,
                                }
                                this.setData({
                                    modal: {
                                        title: '视频链接',
                                        value,
                                    },
                                })
                            }
                        },
                    })
                } else {
                    this.callback = {
                        resolve,
                        reject,
                    }
                    let title
                    if (type == 'video') title = '视频链接'
                    else if (type == 'audio') title = '音频链接'
                    else if (type == 'link') title = '链接地址'
                    this.setData({
                        modal: {
                            title,
                            value,
                        },
                    })
                }
            })
        }
    },
    // 处理模态框
    modalInput(e) {
        this.value = e.detail.value
    },
    modalConfirm() {
        this.callback.resolve(this.value || this.data.modal.value || '')
        this.setData({
            modal: null,
        })
    },
    modalCancel() {
        this.callback.reject()
        this.setData({
            modal: null,
        })
    },
    // 调用编辑器接口
    edit(e) {
        console.log('输出 ~ e.currentTarget.dataset.method', e.currentTarget.dataset.method)
        console.log('输出 ~ this.ctx', this.ctx)

        this.ctx[e.currentTarget.dataset.method]()
    },
    // 清空编辑器内容
    clear() {
        wx.showModal({
            title: '确认',
            content: '确定清空内容吗？',
            success: (res) => {
                if (res.confirm) this.ctx.clear()
            },
        })
    },
    // 保存编辑器内容
    save() {
        let that = this
        wx.showModal({
            title: '保存团作介绍',
            confirmText: '完成',
            success: (res) => {
                if (res.confirm) {
                    that.saveIntroduction()
                    wx.navigateBack({
                        delta: 1,
                    })
                    // 结束编辑
                    // this.setData({
                    //     editable: false,
                    // })
                }
            },
        })
    },
    // 保存编辑内容
    saveIntroduction() {
        var content = this.ctx.getContent()
        this.post({
            eventName: 'updateIntroduction',
            eventParams: content,
        })
    },
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        // wx.showModal({
        //     title: '',
        //     content: '是否保存团作介绍',
        //     confirmText: '保存',
        //     cancelText: '取消',
        //     success(res) {
        //         if (res.confirm) {
        //             console.log('用户点击确定')
        //         } else if (res.cancel) {
        //             console.log('用户点击取消')
        //         }
        //     },
        // })
    },
})
