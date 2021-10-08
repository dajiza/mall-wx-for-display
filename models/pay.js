const util = require('../utils/util')

module.exports = {
    orderNo: '',
    // ===================旧版支付 已切换使用新支付接口===================
    // // 获取支付参数
    // queryPayInfo: function (total_fee, orderCheckList) {
    //     return new Promise((resolve, reject) => {
    //         util.request('goods-pay', {
    //             order_no: this.orderNo.toString(),
    //             total_fee,
    //         })
    //             .then((res) => {
    //                 this.pay(res, total_fee, orderCheckList)
    //                 resolve(res)
    //             })
    //             .catch((err) => {
    //                 reject(err)
    //             })
    //     })
    // },
    // // 微信支付确认
    // queryPayConfirm: function (unique_id) {
    //     return new Promise((resolve, reject) => {
    //         util.request('goods-pay-confirm', {
    //             unique_id: unique_id.toString(),
    //         })
    //             .then((res) => {
    //                 // 根绝页面栈判断跳转 去除订单确认的页面栈
    //                 let pages = getCurrentPages()
    //                 let view = pages[pages.length - 1]
    //                 if (view.route == 'pages/orderCheck/orderCheck' || view.route == 'pages/orderDetail/orderDetail') {
    //                     wx.redirectTo({
    //                         url: '/pages/paySuccess/paySuccess?orderNo=' + this.orderNo,
    //                     })
    //                 } else {
    //                     wx.navigateTo({
    //                         url: '/pages/paySuccess/paySuccess?orderNo=' + this.orderNo,
    //                     })
    //                 }
    //                 this.orderNo = ''
    //                 resolve(res)
    //             })
    //             .catch((err) => {
    //                 reject(err)
    //             })
    //     })
    // },

    /**
     * 拉起收银台
     */
    // {pay_sign: "35AA566A49E8F5ECABD60DCAB4852082", prepay_id: "wx23165829706876b116e36c2f7418f70000", nonce_str: "3m3PKRcuoZXGt9Hv", sin_type: "MD5"}
    pay: function (result, total_fee, orderCheckList) {
        var payInfo = result
        // let timestamp = parseInt(new Date().getTime() / 1000).toString();
        wx.requestPayment({
            timeStamp: payInfo.time_stamp.toString(),
            nonceStr: payInfo.nonce_str,
            package: 'prepay_id=' + payInfo.prepay_id,
            signType: payInfo.sin_type,
            paySign: payInfo.pay_sign,

            success: (res) => {
                console.log('输出 ~ res', res)
                if (orderCheckList && orderCheckList.length > 0) {
                    // 埋点上报
                    util.tracking('pay_success', { total_price: total_fee, goods_ids: orderCheckList.map((item) => item.goodsId).join(',') })
                }
                this.queryPayConfirm(result.unique_id)
            },
            fail: (err) => {
                // 根绝页面栈判断跳转 去除订单确认的页面栈
                let pages = getCurrentPages()
                let view = pages[pages.length - 1]
                if (view.route == 'pages/orderCheck/orderCheck') {
                    wx.redirectTo({
                        url: '/pages/orderDetail/orderDetail?orderNo=' + this.orderNo,
                    })
                } else if (view.route == 'pages/orderDetail/orderDetail') {
                } else {
                    wx.navigateTo({
                        url: '/pages/orderDetail/orderDetail?orderNo=' + this.orderNo,
                    })
                }

                this.orderNo = ''
            },
            complete: (res) => {
                wx.hideLoading()
            },
        })
    },

    queryPayInfo: function (total_fee, orderCheckList) {
        return new Promise((resolve, reject) => {
            util.request('vx-pay', {
                order_no: this.orderNo.toString(),
                total_fee,
                source: 1,
            })
                .then((res) => {
                    this.pay(res, total_fee, orderCheckList)
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 微信支付确认
    queryPayConfirm: function (unique_id) {
        return new Promise((resolve, reject) => {
            util.request('vx-pay-confirm', {
                unique_id: unique_id.toString(),
            })
                .then((res) => {
                    // 根绝页面栈判断跳转 去除订单确认的页面栈
                    let pages = getCurrentPages()
                    let view = pages[pages.length - 1]
                    if (view.route == 'pages/orderCheck/orderCheck' || view.route == 'pages/orderDetail/orderDetail') {
                        wx.redirectTo({
                            url: '/pages/paySuccess/paySuccess?orderNo=' + this.orderNo,
                        })
                    } else {
                        wx.navigateTo({
                            url: '/pages/paySuccess/paySuccess?orderNo=' + this.orderNo,
                        })
                    }
                    this.orderNo = ''
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    /**
     * 获取支付参数 新 团作
     * "order_no":"", //string  订单号
     * "total_fee":"" //int  支付金额（单位：分）
     * "source":1 //来源 1订单 2团作
     */
    queryPayInfoTeamwork: function (total_fee, order_no, source = 1, that) {
        return new Promise((resolve, reject) => {
            util.request('vx-pay', {
                total_fee,
                order_no,
                source,
            })
                .then((res) => {
                    this.payTeamwork(res, total_fee, that)
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 拉起收银台 团作
     */
    payTeamwork: function (result, total_fee, that) {
        var payInfo = result
        wx.requestPayment({
            timeStamp: payInfo.time_stamp.toString(),
            nonceStr: payInfo.nonce_str,
            package: 'prepay_id=' + payInfo.prepay_id,
            signType: payInfo.sin_type,
            paySign: payInfo.pay_sign,

            success: (res) => {
                this.queryPayConfirmTeamwork(result.unique_id)
            },
            fail: (err) => {
                wx.showToast({
                    title: '未支付成功',
                    icon: 'none',
                })

                wx.switchTab({
                    url: `/pages/teamworkIndex/teamworkIndex`,
                })
            },
            complete: (res) => {
                wx.hideLoading()
                // wx.showLoading({
                //     title: "正在跳转订单页",
                //     icon: "loading",
                // });
            },
        })
    },
    courseId: '', //缓存 课程id 团作支付成功跳转用
    teamworkType: '', //缓存 课程类型 团作支付成功跳转用
    // 微信支付确认 团作
    queryPayConfirmTeamwork: function (unique_id) {
        return new Promise((resolve, reject) => {
            util.request('vx-pay-confirm', {
                unique_id: unique_id.toString(),
            })
                .then((res) => {
                    if (this.teamworkType == 22) {
                        // 邀请返现 跳转复制邀请码页面
                        wx.redirectTo({
                            url: '/packageTeamwork/signUpSucessInvite/signUpSucessInvite',
                        })
                    } else {
                        wx.redirectTo({
                            url: '/packageTeamwork/signUpSucess/signUpSucess',
                        })
                    }

                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
