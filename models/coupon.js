/**
 * 优惠券
 */

const http = require('../utils/util')
const config = require('../config/config')

module.exports = {
    // 可选优惠卷列表 订单
    queryOrderCoupun: function (data) {
        return new Promise((resolve, reject) => {
            http.request('order-coupon-list', { data })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 我的优惠卷列表
    queryMyCoupun: function () {
        return new Promise((resolve, reject) => {
            http.request('user-coupon-list')
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    orderCouponGoodsList: function (request = {}) {
        let { page = 1, limit = 10, orderSales = 0, orderPrice = 0, couponId = 0, useGoodsType = 0 } = request
        return new Promise((resolve, reject) => {
            http.request('order-coupon-goods-list', {
                page: page,
                limit: limit,
                order_sales: orderSales,
                order_price: orderPrice,
                coupon_id: couponId,
                use_goods_type: useGoodsType,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 优惠卷领取页面 单张领取页面详情
    queryCoupunSingle: function (id) {
        return new Promise((resolve, reject) => {
            http.request('coupon-data', { id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 优惠卷领取操作 单张领取
    getCoupunSingle: function (id) {
        return new Promise((resolve, reject) => {
            http.request('coupon-get', { id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
