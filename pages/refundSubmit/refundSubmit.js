// pages/refund/refund.js
const orderModel = require('../../models/order')
const util = require('../../utils/util')
const addressModel = require('../../models/address')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        navTitle: '选择服务类型',
        isShowReason: false,
        goodsList: {},
        reasonList: [], //退款理由列表
        reasonId: '', //选择的退款原因id
        reasonName: '', //选择的退款原因name
        refundType: -1, //退款类型 -1 未选择服务类型 0仅退款，1退货退款，2换货

        defaultAddress: {},
        fileList: [],
        showSubmitConfirmDialog: false,
        quest_loading: false, // 是否请求中
    },
    events: {
        getSelectedAddress: function (address) {
            this.setData({
                defaultAddress: address,
            })
        },
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let refundType = orderModel.refundSubmitInfo.refundType == 0 ? 0 : -1
        this.setNavTitle(refundType)
        if (refundType != -1) {
            this.setReasonList(refundType)
        }

        this.setData({
            goodsList: orderModel.refundSubmitInfo,
            refundType,
        })
        console.log('GOOGLE: orderModel.refundSubmitInfo', orderModel.refundSubmitInfo)
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    /**
     * 获取退款理由列表
     */
    setReasonList: function (type) {
        orderModel.queryReasonList(type).then((res) => {
            this.setData({
                reasonList: res,
            })
        })
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},
    // 选择售后类型
    chooseType: async function (event) {
        let type = event.currentTarget.dataset.type
        this.setNavTitle(type)
        this.setReasonList(type)

        // 获取默认地址
        let defaultAddress = this.data.defaultAddress
        defaultAddress = await addressModel.getDefaultAddress()

        this.setData({
            refundType: type,
            defaultAddress,
        })
    },
    // 设置标题
    setNavTitle: function (type) {
        let title = ''
        if (type == -1) {
            title = '选择服务类型'
        } else if (type == 0) {
            title = '申请退款'
        } else if (type == 1) {
            title = '退货退款'
        } else if (type == 2) {
            title = '申请换货'
        }
        this.setData({
            navTitle: title,
        })
    },
    // 选择售后理由
    chooseReason: function (event) {
        let reasonId = event.currentTarget.dataset.id
        let reasonName = event.currentTarget.dataset.name
        this.setData({
            reasonId,
            reasonName,
        })
        this.onCloseReason()
    },
    // 提交
    submit: function () {
        let reasonId = this.data.reasonId
        let fileList = this.data.fileList
        console.log('GOOGLE: fileList', fileList)
        let refundType = this.data.refundType
        let defaultAddress = this.data.defaultAddress
        // 选择理由
        if (!reasonId) {
            wx.showToast({
                title: '请选择退换原因',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        // 上传图片
        // if (fileList.length == 0) {
        //     wx.showToast({
        //         title: "请上传凭证",
        //         icon: "none",
        //         duration: 2000,
        //     });
        //     return;
        // }
        // 换货需要地址
        if (refundType == 2 && !defaultAddress.name) {
            wx.showToast({
                title: '请选择换货地址',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        this.setData({
            showSubmitConfirmDialog: true,
        })
    },
    // 图片上传
    afterRead(event) {
        console.log('输出 ~ event', event)
        // const { file } = event.detail;
        const file = event.detail.file

        let fileList = this.data.fileList
        var index = 0
        for (let i = fileList.length; i < 3; i++) {
            util.uploadFile(file[index].path)
                .then((res) => {
                    let result = JSON.parse(res)
                    fileList.push({
                        url: result.data.file_url,
                        deletable: true,
                    })
                    this.setData({
                        fileList,
                    })
                })
                .catch((err) => {
                    // reject(err)
                })
            index++
            if (index >= file.length) {
                break
            }
        }
    },
    // 图片删除
    deleteImg(event) {
        let fileList = this.data.fileList
        let index = event.detail.index
        fileList.splice(index, 1)
        this.setData({
            fileList,
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
    onOpenReason: function () {
        this.setData({
            isShowReason: true,
        })
    },
    onCloseReason: function () {
        this.setData({
            isShowReason: false,
        })
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.setData({
            quest_loading: false,
        })
    },

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
     * 弹窗关闭
     */
    onDialogClose() {
        this.setData({
            showSubmitConfirmDialog: false,
        }) //点击取消按钮，弹窗隐藏
    },

    /**
     * 确定提交
     */
    sureSubmit() {
        if (this.data.quest_loading) {
            return
        }
        let reasonId = this.data.reasonId
        let fileList = this.data.fileList
        let defaultAddress = this.data.defaultAddress
        let goodsList = this.data.goodsList
        let orderDetailId = goodsList.orderDetailId
        let type = Number(this.data.refundType)
        let imgs = fileList.map((item) => item.url).join(',')
        let reason = this.data.reasonName
        let money = goodsList.priceSumEnd
        let address_id = defaultAddress.id ? defaultAddress.id : ''
        wx.showLoading({
            title: '提交中...',
        })
        orderModel
            .creatRefundOrder(orderDetailId, type, imgs, reasonId, reason, money, address_id)
            .then((res) => {
                setTimeout(() => {
                    this.setData(
                        {
                            quest_loading: false,
                        },
                        500
                    )
                })
                wx.hideLoading()
                wx.redirectTo({
                    url: '../refundResult/refundResult?orderDetailId=' + goodsList.orderDetailId,
                })
            })
            .catch((err) => {
                this.onDialogClose()
            })
    },

    preventTouchMove() {},
})
