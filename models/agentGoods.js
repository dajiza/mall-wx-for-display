/**
 * 代理端商品
 */

const http = require("../utils/util");
const config = require("../config/config");

module.exports = {
    // 未上架商品列表
    queryGoodsNotList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request("agent-to-on-goods-list", obj,'POST')
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    // 商品SKU列表
    queryGoodsSKUList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request("agent-goods-sku-list", obj,'POST')
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    // 批量上架
    batchAgentGoods: function (obj) {
        return new Promise((resolve, reject) => {
            http.request("agent-goods-arr-choose", obj,'POST')
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },
};
