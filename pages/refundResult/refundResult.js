// pages/refundResult/refundResult.js
const orderModel = require('../../models/order')
const constant = require('../../config/constant.js')

Page({
    /**
     * 页面的初始数据
     */
    data: {
        navTitle: '选择服务类型',
        expressList: [],
        showExpressPop: false,
        orderApplyId: '',
        detail: {},
        title: '',
        describe: '',
        expressId: '',
        expressName: '',
        expressNo: '',
        sellerAddress: {},
        rejectReason: '', //拒绝理由

        addressShow: false, //寄件地址显示
        expressShow: false, //退货快递显示
    },
    tempData: {
        paramsId: -1,
        paramsType: 1,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.tempData.paramsId = Number(options.id) || Number(options.orderDetailId)
        this.tempData.paramsType = options.id ? 1 : 2
        // 获取卖家地址
        orderModel.queryRefundAddress().then((res) => {
            if (res) {
                this.setData({
                    sellerAddress: JSON.parse(res),
                })
            }
        })

        // 获取快递公司列表
        orderModel.queryExpressList().then((res) => {
            this.setData({
                expressList: res,
            })
        })
        this.getRefundDetail()
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},
    onChangeExpress(event) {
        let value = event.detail
        this.setData({
            expressNo: value,
        })
        // const { picker, value, index } = event.detail;
    },
    openExpress() {
        this.setData({
            showExpressPop: true,
        })
    },
    closeExpress() {
        this.setData({
            showExpressPop: false,
        })
    },
    onCancelExpress() {
        this.closeExpress()
    },
    // 获取拒绝理由
    queryRejectedReason(id) {
        orderModel.queryOperateList(id).then((res) => {
            console.log('GOOGLE: qqqqqqq', res)
            let reason
            if (res[res.length - 1].result == 0) {
                reason = res[res.length - 1].reason
            }
            this.setData({
                rejectReason: reason,
            })
        })
    },

    // 选择快递
    chooseExpress: function (event) {
        let expressId = event.currentTarget.dataset.id
        let expressName = event.currentTarget.dataset.name
        this.setData({
            expressName,
            expressId,
        })
        this.closeExpress()
    },
    // 提交退货快递
    submitExpress: function (event) {
        let orderApplyId = this.data.orderApplyId
        let expressName = this.data.expressName
        let expressNo = this.data.expressNo
        console.log('GOOGLE: orderApplyId, expressName, expressNo', orderApplyId, expressName, expressNo)
        if (expressName && expressNo) {
            orderModel.creatRefundExpress(orderApplyId, expressName, expressNo).then((res) => {
                wx.showToast({
                    title: '提交成功',
                    icon: 'none',
                    duration: 2000,
                })
                wx.redirectTo({
                    url: '/pages/refundResult/refundResult?id=' + this.data.detail.id,
                })
            })
        } else {
            wx.showToast({
                title: '请填写快递公司和快递单号',
                icon: 'none',
                duration: 2000,
            })
        }
    },

    /**
     * 查看物流
     */
    handleOnViewLogistics() {
        let detail = this.data.detail
        let applyId = detail.id
        wx.navigateTo({
            url: '../logisticsInfo/logisticsInfo',
            success: function (res) {
                // 通过eventChannel向被打开页面传送数据
                res.eventChannel.emit('acceptDataFromOpenerPage', {
                    apply_id: applyId,
                })
            },
        })
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

    /**
     * 获取售后详情
     */
    getRefundDetail() {
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        wx.showLoading({
            title: '加载中...',
        })
        orderModel.queryRefundDetail(this.tempData.paramsId, this.tempData.paramsType).then((res) => {
            console.log('GOOGLE: res', res)
            // subOrder = subOrder[0]
            let detail = {
                id: res.id,
                orderId: res.order_id,
                orderDetailId: res.order_detail_id,
                img: res.goods_img,
                name: res.goods_name,
                price: res.order_detail_money,
                money: res.money,
                orderDetailMoney: res.order_detail_money,
                attrRefund: res.goods_attr,
                status: res.status,
                quantity: res.order_detail_num,
                reason: res.reason,
                updatedTime: res.updated_time,
                createdTime: res.created_time,
                orderDetailNo: res.order_detail_no,
                type: res.type, //0仅退款，1退货退款，2换货
                companyName: res.logistics_company_name,
                logisticsNo: res.logistics_no,
                refundMoney: res.money,
            }
            // 生成头部的文字信息
            let type = res.type
            let status = res.status
            this.queryRejectedReason(detail.id)

            let title = ''
            let describe = ''
            if (type == 0) {
                title = constant.ORDER_REFUND_TEXT[status].title
                describe = constant.ORDER_REFUND_TEXT[status].describe
            } else if (detail.type == 1) {
                title = constant.ORDER_RETURN_TEXT[status].title
                describe = constant.ORDER_RETURN_TEXT[status].describe
            } else {
                title = constant.ORDER_CHANGE_TEXT[status].title
                describe = constant.ORDER_CHANGE_TEXT[status].describe
            }

            if (describe == 'reason') {
                describe = detail.reason
            } else if (describe == 'updateTime') {
                describe = detail.updatedTime
            }
            // 生成每个模块的显示
            let addressShow = false
            let expressShow = false
            if (type == 0) {
                addressShow = false
                expressShow = false
            } else if (detail.type == 1) {
                if (detail.status >= 4) {
                    addressShow = true
                    expressShow = true
                }
            } else {
                if (detail.status >= 4 && detail.status < 8) {
                    addressShow = true
                    expressShow = true
                }
            }

            this.setData({
                orderApplyId: detail.id,
                detail,
                title,
                describe,
                addressShow,
                expressShow,
            })
            wx.hideLoading()
            console.log('GOOGLE: detail', this.data.detail)
        })
    },
})
