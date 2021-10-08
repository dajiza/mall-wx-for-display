/**
 * 积分商城模块逻辑类
 */

const util = require('../utils/util')
const config = require('../config/config')
const userShopInfoModel = require('./userShopInfo')
const mockData = require('./mockData')

module.exports = {
    orderGoods: {},
    orderCoupon: {},
    orderCheckList: [
        {
            freightId: 51,
            goodsId: 184,
            id: 282,
            img: 'https://storehouse-upyun.chuanshui.cn/productImport/2021-04-09/lm00lm61TvoqFB5S.O1CN01O2Rvxl1pKgQPQeNPh_!!50505342.jpg',
            max_discount: 0,
            name: '新增产品布料-2021.04.09',
            off_2: 0,
            parameters: null,
            price: 40000,
            quantity: 1,
            shopSkuId: 326,
            skuId: 282,
            stock: 8,
            unit: '码',
            user_discount: 0,
        },
    ],
    goodsList: [],

    /**
     * 积分商品列表
     * "pi": 1,
     * "ps": 10,
     * "priceSort": 2,//0 不排序 1 升序 2降序
     * "salesSort": 0//0 不排序 1 升序 2降序
     */
    queryPointsGoodsList: function (page, limit = 10) {
        return new Promise((resolve, reject) => {
            util.request('points-goods-list', {
                pi: page,
                ps: limit,
                priceSort: 0, //0 不排序 1 升序 2降序
                salesSort: 2, //0 不排序 1 升序 2降序
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 积分优惠券列表
     * "pi": 1,
     * "ps": 10,
     */
    queryPointsCouponList: function (page, limit = 10) {
        return new Promise((resolve, reject) => {
            util.request('points-coupon-list', {
                pi: page,
                ps: limit,
                status: 2,
                shopId: config.shopId,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    /**
     * 积分商品详情
     * "goodsId": 1,
     */
    queryPointsGoodsDetail: function (goodsId) {
        return new Promise((resolve, reject) => {
            util.request('points-goods-detail', {
                goodsId,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 积分下单
     * "address_id"
     * "id"
     * "num"
     */
    creatPointsOrder: function (params) {
        return new Promise((resolve, reject) => {
            util.request('points-order-create', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 订单详情
     */
    queryOrderDetail: function (params) {
        return new Promise((resolve, reject) => {
            util.request('points-order-detail', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 订单发货
     */
    queryOrderSand: function (params) {
        return new Promise((resolve, reject) => {
            util.request('points-order-sand', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 订单物流信息
     */
    queryOrderSdInfo: function (params) {
        return new Promise((resolve, reject) => {
            util.request('sd-info', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    //代理商品列表
    pointsAgentGoodsList: function (page, shopId, status) {
        return new Promise((resolve, reject) => {
            util.request('points-agent-goods-list', {
                pi: page,
                ps: 10,
                shopId: shopId,
                status: status,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //商品详情
    pointsAgentGoodsDetail: function (goodsId) {
        return new Promise((resolve, reject) => {
            util.request('points-agent-goods-detail', {
                goodsId: goodsId,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //商品添加/修改
    pointsAgentGoodsEdit: function (params) {
        return new Promise((resolve, reject) => {
            util.request('points-goods-edit', {
                ...params,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //商品上下架
    pointsAgentGoodsStatus: function (goodsId, status) {
        return new Promise((resolve, reject) => {
            util.request('points-goods-status', {
                goodsId: goodsId,
                status: status,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //删除商品
    pointsAgentGoodsDelete: function (goodsId) {
        return new Promise((resolve, reject) => {
            util.request('points-goods-delete', {
                goodsId: goodsId,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //优惠券列表
    pointsAgentCouponList: function (page, shopId, status) {
        return new Promise((resolve, reject) => {
            util.request('points-agent-coupon-list', {
                pi: page,
                ps: 10,
                shopId: shopId,
                status: status,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //优惠券详情
    pointsAgentCouponDetail: function (id) {
        return new Promise((resolve, reject) => {
            util.request('points-coupon-detail', {
                id: id,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //优惠券新增/编辑
    pointsAgentCouponEdit: function (id, points, couponId) {
        return new Promise((resolve, reject) => {
            util.request('points-agent-coupon-edit', {
                id: id,
                points: points,
                couponId: couponId,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //删除优惠券
    pointsAgentCouponDelete: function (id) {
        return new Promise((resolve, reject) => {
            util.request('points-agent-coupon-delete', {
                id: id,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //优惠券上下架
    pointsAgentCouponStatus: function (id, status) {
        return new Promise((resolve, reject) => {
            util.request('points-agent-coupon-status', {
                id: id,
                status: status,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //优惠券选择列表
    pointsAgentShopCouponList: function (shopId, title) {
        return new Promise((resolve, reject) => {
            util.request('points-shop-coupon-list', {
                shopId: shopId,
                title: title,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //兑换订单列表
    pointsOrderListAdmin: function (page, is_sand, limit = 10) {
        return new Promise((resolve, reject) => {
            util.request('points-order-list-admin', {
                limit: limit,
                page: page,
                is_sand: is_sand,
                exchange_type: 1,
            }).then((res) => {
                if (mockData.orderListGoods) {
                    resolve(mockData.orderListGoods())
                } else {
                    resolve(res)
                }
            }).catch((err) => {
                reject(err)
            })
        })
    },

    //未发货数量
    pointsOrderListNotSandNum: function () {
        return new Promise((resolve, reject) => {
            util.request('points-order-list-admin', {
                limit: 10000,
                page: 1,
                is_sand: 2,
                exchange_type: 1,
            }).then(res=>{
                let logisticsUniqueSet = new Set()
                let list = res.lists || []
                list.forEach(value => {
                    let key = value.logistics_unique
                    if (!logisticsUniqueSet.has(key)) {
                        logisticsUniqueSet.add(key)
                    }
                })
                return logisticsUniqueSet.size
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    //积分日志列表
    pointsLogList: function (page, searchType) {
        return new Promise((resolve, reject) => {
            util.request('points-log-list', {
                page: page,
                search_type: searchType,
                limit: 10,
            }).then((res) => {
                resolve(res)
            }).catch((err) => {
                reject(err)
            })
        })
    },

    //兑换记录用户
    pointsOrderListUser: function (page, isSand, exchangeType) {
        return new Promise((resolve, reject) => {
            util.request('points-order-list-user', {
                limit: 10,
                page: page,
                exchange_type: exchangeType,
                is_sand: isSand
            }).then((res) => {
                if (exchangeType == 1) {
                    if (mockData.orderListGoods) {
                        resolve(mockData.orderListGoods())
                    } else {
                        resolve(res)
                    }
                } else if (exchangeType == 2) {
                    if (mockData.orderListCoupons) {
                        resolve(mockData.orderListCoupons())
                    } else {
                        resolve(res)
                    }
                } else {
                    resolve(res)
                }
            }).catch((err) => {
                reject(err)
            })
        })
    },

    //我的优惠卷列表(使用情况)
    myCouponList: function (ids) {
        return new Promise((resolve, reject) => {
            util.request('my-coupon-list', {
                ids: ids,
            }).then((res) => {
                resolve(res)
            }).catch((err) => {
                reject(err)
            })
        })
    },
}
