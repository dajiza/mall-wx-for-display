/**
 * 订单模块逻辑类
 */

const util = require('../utils/util')
const config = require('../config/config')
const cartModel = require('./cart')

module.exports = {
    // 获取商品详情
    queryGoodsDetail: function (goodsId, userId = 0) {
        return new Promise((resolve, reject) => {
            util.request(
                'goods-detail',
                {
                    goods_id: Number(goodsId),
                    userId,
                },
                'POST',
                false
            )
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 默认详情
    queryGoodsDefaultDetail: function () {
        return new Promise((resolve, reject) => {
            util.request('goods-default-detail', {}, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 添加购物车 is_exchange 1加价购 正常不传
    // creatCartGoods: function (sku_id, goods_id, count, price, promotion_i = 0, is_exchange = 0) {
    //     return cartModel.addToCartGoods(sku_id, goods_id, count, price, promotion_id, is_exchange)
    // },
    // 查寻购物车列表 返回条数
    queryCartNum: function () {
        return cartModel.queryCartNum()
    },

    // 凑单商品列表
    queryFreightGoodsList: function (request = {}) {
        let { page = 1, limit = 20, orderSales = 0, orderPrice = 0, freightId = 0 } = request
        return new Promise((resolve, reject) => {
            util.request('order-freight-goods-list', {
                page: page,
                limit: limit,
                order_sales: orderSales,
                order_price: orderPrice,
                freight_id: freightId,
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
     * 万能商品列表
     * 文档 http://confluence.chuanshui.cn/pages/viewpage.action?pageId=7012437
     */
    queryShopGoodsList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('shop-goods-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 收藏列表
    queryFavoriteList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('goods-favorite-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 详情 收藏商品
    createFavorite: function (shopGoodsId) {
        return new Promise((resolve, reject) => {
            util.request('goods-favorite-create', { shopGoodsId })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 删除收藏商品
    deleteFavorite: function (favoriteIds) {
        return new Promise((resolve, reject) => {
            util.request('goods-favorite-delete', { favoriteIds })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 商品系列-商品列表（系列详情）
    queryGroupGoods: function (params) {
        return new Promise((resolve, reject) => {
            util.request('goods-group-data', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 商品系列-商品列表（系列详情）
    queryGroupGoodsList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('goods-group-goods-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
