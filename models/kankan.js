const util = require('../utils/util')

module.exports = {
    // 收藏列表 看看
    queryTutorialLikeList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('tutorial-like-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 看看随机列表
    queryTutorialRandList: function (page_index, page_size) {
        return new Promise((resolve, reject) => {
            util.request('tutorial-rand-list', { page_index, page_size })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 订单sku列表查询 查询客户是否下过单
    queryOrderSkuList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('order-sku-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
