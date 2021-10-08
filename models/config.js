/**
 * 订单模块逻辑类
 */

const http = require("../utils/util");
const config = require("../config/config");
const payModel = require("./pay");


module.exports = {
    /**
     * 商城订单理由列表
     */
    // 配置列表
    queryConfigList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request("config-with-shop", obj)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },


};
