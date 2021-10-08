/**
 * 列表搜索模块逻辑类
 */

const util = require('../utils/util')
const config = require('../config/config')

module.exports = {
    // 获取热门商品列表
    queryHotGoodsList: function (obj) {
        return new Promise((resolve, reject) => {
            util.request('goods-popular-product-list', obj, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 猜你喜欢商品列表
    queryYouLikeGoodsList: function (obj) {
        return new Promise((resolve, reject) => {
            util.request(
                'goods-you-like-product-list',
                {
                    limit: Number(obj.limit),
                    page: Number(obj.page),
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

    // 热搜榜列表
    queryMostSearchList: function (obj) {
        return new Promise((resolve, reject) => {
            util.request(
                'goods-most-search-list',
                {
                    limit: Number(obj.limit),
                    page: Number(obj.page),
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

    // 商品分类列表
    queryGoodsCateList: function (obj) {
        return new Promise((resolve, reject) => {
            util.request('goods-category-list', {}, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 商品分类列表 V2
    queryV2GoodsCateList: function (obj) {
        return new Promise((resolve, reject) => {
            util.request('v2/goods-category-list', {}, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 商品搜索列表
    // queryGoodsSearchList: function (obj) {
    //     return new Promise((resolve, reject) => {
    //         util.request("goods-search", obj,'POST',false)
    //             .then((res) => {
    //                 resolve(res);
    //             })
    //             .catch((err) => {
    //                 reject(err);
    //             });
    //     });
    // },

    queryGoodsSearchList: function (request = {}) {
        // console.log(request)
        let {
            limit = 10,
            page = 1,
            name = '',
            order_sales = 0,
            order_price = 0,
            color = '',
            brand = '',
            material = '',
            origin = '',
            unit = '',
            pattern = '',
            tag_id = '',
            other_id = -1,
            size = '',
        } = request

        return new Promise((resolve, reject) => {
            util.request(
                'goods-search',
                {
                    limit,
                    page,
                    name,
                    order_sales,
                    order_price,
                    color,
                    brand,
                    material,
                    origin,
                    unit,
                    pattern,
                    tag_id,
                    other_id,
                    size,
                },
                'POST',
                false
            )
                .then((res) => {
                    // 埋点上报
                    util.tracking('search_enter', {
                        brand: brand || '',
                        color: color || '',
                        material: material || '',
                        origin: origin || '',
                        pattern: pattern || '',
                        size: size || '',
                        other_id: other_id || '',
                        tag_id: tag_id || '',
                        search_name: name || '',
                    })
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 图片检索商品 获取id列表
    queryGoodsIdByImg: function (pic_url) {
        return new Promise((resolve, reject) => {
            util.request('goods-image-search', { pic_url }, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 根据id查询商品详情
    queryGoodsDetailByIds: function (product_ids) {
        return new Promise((resolve, reject) => {
            util.request('goods-product-search', { product_ids }, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
