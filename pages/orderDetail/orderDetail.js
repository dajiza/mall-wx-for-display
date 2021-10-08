import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'
const orderModel = require('../../models/order')
const payModel = require('../../models/pay')
const configModel = require('../../models/config.js')
const userShopInfoModel = require('../../models/userShopInfo')
const commentModel = require('../../models/comment')
const tool = require('../../utils/tool')
const app = getApp()

App.Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        navTitle: '订单详情',
        topHeight: '',
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        dialogShow: false,
        isPullDown: false,
        orderInfo: {},
        orderId: -1,
        quest_loading: false,
        payment_time: 0, // 剩余支付时间
        sale_time_out: false, // 是否已过 允许售后时间
        isUnique: true, // 物流唯一
        isTimeEnd: false,
        isAgentSell: true, // 代理商卖出订单
        remark: '',
    },

    onLoad: function (options) {
        const rem = 750 / wx.getSystemInfoSync().windowWidth
        let topHeight = Number(app.globalData.statusBarHeight * rem) + Number(46 * rem) + 144 + 'rpx'
        let AgentSell = false
        if (options.agentSell) {
            AgentSell = true
        }
        this.setData({
            topHeight: topHeight,
            orderId: Number(options.orderId) || '',
            order_no: Number(options.orderNo) || '',
            isAgentSell: AgentSell,
        })
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        configModel
            .queryConfigList({})
            .then((res) => {
                if (res) {
                    Object.keys(res).forEach((key) => {
                        wx.setStorageSync(key, res[key])
                    })
                    wx.nextTick(() => {
                        this.getOrderDetail()
                    })
                }
            })
            .catch((err) => {})
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        // console.log('下拉');
        this.setData({
            isPullDown: true,
        })
        this.getOrderDetail()
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        // 到底喽～
    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // },

    /**
     * 页面滚动
     */
    onPageScroll: function (e) {
        // console.log('e', e);
    },

    /**
     * 网络请求，获取数据
     */
    getOrderDetail() {
        const params = {
            id: this.data.orderId,
            order_no: this.data.order_no,
        }
        const _this = this
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        if (this.data.isPullDown) {
            wx.showLoading({
                title: '刷新中...',
            })
        } else {
            wx.showLoading({
                title: '加载中...',
            })
        }
        orderModel
            .queryOrderDetail(params)
            .then((res) => {
                if (_this.data.isPullDown) {
                    //停止下拉刷新
                    wx.stopPullDownRefresh()
                }
                //隐藏loading 提示框
                wx.hideLoading()
                //隐藏导航条加载动画
                wx.hideNavigationBarLoading()
                if (res) {
                    let order_info = res
                    let paymentTime = 0
                    let remark = res.message || ''
                    let rem = 750 / wx.getSystemInfoSync().windowWidth
                    if (wx.getSystemInfoSync().windowWidth > 750) {
                        rem = 2
                    }
                    let topHeight = Number(app.globalData.statusBarHeight * rem) + Number(46 * rem) + 144 + 'rpx'
                    if (res.status === 0) {
                        topHeight = Number(app.globalData.statusBarHeight * rem) + Number(46 * rem) + 248 + 'rpx'
                        paymentTime = res.cancel_left_second * 1000
                    }
                    let isUnique = true
                    let logisticsList = []
                    if (res.detail) {
                        res.detail.forEach((ev) => {
                            if (logisticsList.indexOf(ev.logistics_no) === -1) {
                                logisticsList.push(ev.logistics_no)
                            }
                        })
                    }
                    if (logisticsList.length > 1) {
                        isUnique = false
                    }

                    _this.setData({
                        topHeight: topHeight,
                        orderInfo: order_info,
                        isPullDown: false,
                        isUnique: isUnique,
                        payment_time: paymentTime,
                        remark: remark,
                    })
                }
            })
            .catch((err) => {
                wx.nextTick(() => {
                    if (wx.showLoading) {
                        //隐藏loading 提示框
                        wx.hideLoading()
                        //隐藏导航条加载动画
                        wx.hideNavigationBarLoading()
                        if (_this.data.isPullDown) {
                            //停止下拉刷新
                            wx.stopPullDownRefresh()
                        }
                    }
                })
            })
    },

    /**
     * 返回上一页
     */
    ClickBack() {
        let pages = getCurrentPages()
        if (pages.length === 1) {
            wx.switchTab({
                url: '../index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },

    /**
     * 取消订单
     */
    handleOnCancelOrder(res) {
        this.setData({
            operatingOrderId: Number(res.currentTarget.dataset.id),
            operatingOrderStatus: Number(res.currentTarget.dataset.status),
            dialogShow: true,
        })
    },

    /**
     * 点击按钮-去支付
     */
    handleOnGoPay(res) {
        payModel.orderNo = res.currentTarget.dataset.no
        wx.showToast({
            title: '加载中',
            icon: 'loading',
            mask: true,
        })
        tool.debounce(this.goWXPay())
    },
    goWXPay() {
        if (!this.data.quest_loading) {
            this.setData({
                quest_loading: true,
            })
            const params = {
                id: this.data.orderId,
                order_no: this.data.order_no,
            }
            const _this = this
            orderModel.queryOrderDetail(params).then((res) => {
                if (res) {
                    let order_info = res
                    _this.setData({
                        orderInfo: order_info,
                        isPullDown: false,
                        quest_loading: false,
                    })
                    const total_fee = Number(res.price_total_real)
                    // console.log('total', res.currentTarget.dataset.total);
                    console.log('total_fee', total_fee)
                    if (res.status === 0) {
                        payModel.queryPayInfo(total_fee)
                    } else {
                        wx.showToast({
                            title: '抱歉，订单已关闭~',
                            icon: 'none',
                            mask: true,
                        })
                        this.onPullDownRefresh()
                    }
                }
            })
        }
    },

    /**
     * 点击按钮-确认收货
     */
    handleOnConfirmReceipt(res) {
        this.setData({
            operatingOrderId: Number(res.currentTarget.dataset.id),
            operatingOrderStatus: Number(res.currentTarget.dataset.status),
            dialogShow: true,
        })
    },

    /**
     * 弹窗关闭
     */
    onClose() {
        this.setData({
            dialogShow: false,
        }) //点击取消按钮，弹窗隐藏
    },

    onSureCancelOrder() {
        wx.showToast({
            title: '取消中',
            icon: 'loading',
            mask: true,
        })
        tool.debounce(this.sureCancelOrder())
    },
    /**
     * 确定取消订单
     */
    sureCancelOrder() {
        var timeOut2
        if (!this.data.quest_loading) {
            this.setData({
                quest_loading: true,
            })
            clearTimeout(timeOut2)
            const _this = this
            const params = {
                order_id: this.data.operatingOrderId,
            }
            orderModel
                .queryCancelOrder(params)
                .then((res) => {
                    _this.setData({
                        dialogShow: false,
                    })
                    this.getOrderDetail()
                    wx.showToast({
                        title: '取消成功~',
                        icon: 'none',
                        mask: true,
                        duration: 2000,
                    })
                    timeOut2 = setTimeout(() => {
                        _this.setData({
                            quest_loading: false,
                        })
                    }, 500)
                })
                .catch((err) => {
                    _this.setData({
                        quest_loading: false,
                    })
                })
        }
    },

    /**
     * 确认收货
     */
    ConfirmReceipt() {
        var timeOut
        if (!this.data.quest_loading) {
            clearTimeout(timeOut)
            this.setData({
                quest_loading: true,
            })
            const _this = this
            const params = {
                order_id: this.data.operatingOrderId,
            }
            orderModel
                .queryOrderSuccess(params)
                .then((res) => {
                    console.log('res', res)
                    _this.setData({
                        dialogShow: false,
                    })
                    this.getOrderDetail()
                    wx.showToast({
                        title: '确认收货成功~',
                        icon: 'none',
                        mask: true,
                        duration: 2000,
                    })
                    timeOut = setTimeout(() => {
                        _this.setData({
                            quest_loading: false,
                        })
                    }, 500)
                })
                .catch((err) => {
                    console.log('err===>', err)
                    timeOut = setTimeout(() => {
                        _this.setData({
                            quest_loading: false,
                        })
                    }, 500)
                })
        }
    },

    /**
     * 申请售后
     */
    handleOnOrderApply(res) {
        let attrList = []
        if (res.currentTarget.dataset.goods_attr) {
            JSON.parse(res.currentTarget.dataset.goods_attr).forEach((ev) => {
                attrList.push(ev.Value)
            })
        }
        let priceSumEnd = Number(res.currentTarget.dataset.price_sum_end)
        if (res.currentTarget.dataset.refund_money) {
            priceSumEnd = priceSumEnd - Number(res.currentTarget.dataset.refund_money)
        }
        let obj = {
            orderDetailId: Number(res.currentTarget.dataset.order_detail_id),
            img: res.currentTarget.dataset.goods_img,
            name: res.currentTarget.dataset.goods_name,
            price: Number(res.currentTarget.dataset.goods_price),
            quantity: Number(res.currentTarget.dataset.goods_quantity),
            skuId: Number(res.currentTarget.dataset.goods_sku),
            priceSumEnd: priceSumEnd,
            stock: 0,
            attrValue: attrList,
        }
        // 判断是退换还是售后
        if (res.currentTarget.dataset.type === '退换') {
            // 跳转到申请售后页面
            orderModel.refundSubmitInfo = obj
            wx.navigateTo({
                url: '../refundSubmit/refundSubmit',
            })
        } else {
            const params = {
                id: this.data.orderId,
                order_no: this.data.order_no,
            }
            const _this = this
            wx.showNavigationBarLoading() //在当前页面显示导航条加载动画
            //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
            wx.showLoading({
                title: '加载中...',
            })
            orderModel
                .queryOrderDetail(params)
                .then((result) => {
                    //隐藏loading 提示框
                    wx.hideLoading()
                    //隐藏导航条加载动画
                    wx.hideNavigationBarLoading()
                    if (result) {
                        if (result.detail) {
                            result.detail.forEach((ev) => {
                                if (ev.id === Number(res.currentTarget.dataset.order_detail_id)) {
                                    if (ev.stop_apply > 0) {
                                        // 售后过期
                                        _this.setData({
                                            operatingOrderId: Number(res.currentTarget.dataset.id),
                                            operatingOrderStatus: Number(res.currentTarget.dataset.status),
                                            dialogShow: true,
                                        })
                                    } else {
                                        // 跳转到申请售后页面
                                        orderModel.refundSubmitInfo = obj
                                        wx.navigateTo({
                                            url: '../refundSubmit/refundSubmit',
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
                .catch((err) => {
                    wx.nextTick(() => {
                        if (wx.showLoading) {
                            //隐藏loading 提示框
                            wx.hideLoading()
                            //隐藏导航条加载动画
                            wx.hideNavigationBarLoading()
                        }
                    })
                })
        }
    },

    /**
     * 退换货详情 -- 售后详情
     */
    handleOnApplyDetail(res) {
        const goods_id = Number(res.currentTarget.dataset.id)
        // 跳转到售后详情页面
        wx.navigateTo({
            url: '../refundResult/refundResult' + '?orderDetailId=' + goods_id,
        })
    },

    /**
     * 仅退款
     */
    handleOnOnlyRefund(res) {
        console.log(res)
        // 跳转到申请售后页面 -- 仅退款
        let _attr = []
        if (res.currentTarget.dataset.goods_attr) {
            JSON.parse(res.currentTarget.dataset.goods_attr).forEach((ev) => {
                _attr.push(ev.Value)
            })
        }
        let priceSumEnd = Number(res.currentTarget.dataset.price_sum_end)
        if (res.currentTarget.dataset.refund_money) {
            priceSumEnd = priceSumEnd - Number(res.currentTarget.dataset.refund_money)
        }
        let obj = {
            orderDetailId: Number(res.currentTarget.dataset.order_detail_id),
            img: res.currentTarget.dataset.goods_img,
            name: res.currentTarget.dataset.goods_name,
            price: Number(res.currentTarget.dataset.goods_price),
            quantity: Number(res.currentTarget.dataset.goods_quantity),
            skuId: Number(res.currentTarget.dataset.goods_sku),
            priceSumEnd: priceSumEnd,
            stock: 0,
            attrValue: _attr,
        }
        // console.log('obj', obj);
        orderModel.refundSubmitInfo = obj
        orderModel.refundSubmitInfo.refundType = 0
        wx.navigateTo({
            url: '../refundSubmit/refundSubmit',
        })
    },

    /**
     * 查看物流
     */
    handleOnViewLogistics(params) {
        let orderDetailId = -1,
            orderId = -1
        if (params.currentTarget.dataset.source === 'goods') {
            orderDetailId = Number(params.currentTarget.dataset.order_detail_id)
        } else if (params.currentTarget.dataset.source === 'order') {
            orderId = Number(params.currentTarget.dataset.order_id)
        }
        wx.navigateTo({
            url: '../logisticsInfo/logisticsInfo',
            success: function (res) {
                // 通过eventChannel向被打开页面传送数据
                res.eventChannel.emit('acceptDataFromOpenerPage', {
                    order_id: orderId,
                    order_detail_id: orderDetailId,
                })
            },
        })
    },

    /**
     * 判断时间是否过期
     * time 下单时间 || 订单完成时间
     * time_limit 支付过期时间 || 订单售后过期时间
     * time_type 过期时间类型 支付 || 售后
     */
    formatTimeExpired(time, time_limit, time_type) {
        let finish_time = time.replace(/-/g, '/')
        finish_time = Date.parse(new Date(finish_time))
        // console.log('完成时间=>', finish_time);
        let current_time = Date.parse(new Date()) // 当前时间
        // console.log("当前时间戳=>" + current_time);
        let _time = Number(finish_time) + Number(time_limit) - current_time
        let is_Expired = false // 是否过期
        if (_time > 0) {
            is_Expired = false
        } else {
            is_Expired = true
        }
        return is_Expired
    },

    /**
     * 剩余支付时间倒计时结束
     */
    payTimeEnd() {
        // 倒计时结束
        // this.getOrderDetail();
        let orderData = this.data.orderInfo
        orderData['status'] = 9
        let rem = 750 / wx.getSystemInfoSync().windowWidth
        if (wx.getSystemInfoSync().windowWidth > 750) {
            rem = 2
        }
        let topHeight = Number(app.globalData.statusBarHeight * rem) + Number(46 * rem) + 144 + 'rpx'
        this.setData(
            {
                isTimeEnd: true,
                topHeight: topHeight,
                orderInfo: orderData,
            },
            () => {
                // this.getOrderDetail();
            }
        )
    },

    preventTouchMove() {},

    /**
     * 返回首页
     */
    onGoHome() {
        wx.switchTab({
            url: '../index/index',
        })
    },
    // 复制
    handleCopy: function (e) {
        let content = this.data.orderInfo.order_no.toString()
        console.log('content', content)
        wx.setClipboardData({
            data: content,
            success(res) {
                // wx.showToast({
                //     title: '复制成功'
                // })
            },
        })
    },
    /**
     * 评价
     */
    handleOnComment(res) {
        const comment_state = res.currentTarget.dataset.status
        const _index = Number(res.currentTarget.dataset.index)
        const _obj = this.data.orderInfo.detail[_index]
        if(comment_state == 1){
            wx.showToast({
                title: '该商品已评价'
            })
        }
        console.log('_index', _index)
        console.log('_obj', _obj)
        commentModel.commentParams = {
            order_id: _obj.id,
            order_no: Number(res.currentTarget.dataset.no),
            goodsId: _obj.goods_id,
            skuId: _obj.sku_id,
            skuName: _obj.goods_name,
            skuImg: _obj.goods_img,
            skuAttr: _obj.goods_attr,
            skuPrice: _obj.price,
        }
        wx.navigateTo({
            url: '/packageMainSecondary/reviewPublish/reviewPublish',
        })
    },
})
