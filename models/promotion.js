/**
 * 优惠券
 */

const http = require('../utils/util')
const config = require('../config/config')

module.exports = {
    //凑单参数
    makeUpData: {
        // promotion: {}, //促销详情
        // checkList: [], //已有商品列表
        // barterCheckedList: [], //加价购 已加列表
    },
    // 加价购商品存本地
    barterCheckedList: new Map(),
    // 商品促销活动列表
    queryGoodsPromotion: function (goodsIds) {
        return new Promise((resolve, reject) => {
            http.request('promotion-list', {
                shopId: config.shopId,
                goodsIds: goodsIds,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 促销 凑单商品列表 http://confluence.chuanshui.cn/pages/viewpage.action?pageId=7012748
    queryPromotionMakeUp: function (params) {
        return new Promise((resolve, reject) => {
            http.request('promotion-goods-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 加价购sku列表
    queryPromotionBarter: function (promotionId) {
        return new Promise((resolve, reject) => {
            http.request('promotion-exchange-goods-list', {
                promotionId: promotionId, // 促销id
                pi: 1,
                ps: 99999,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
