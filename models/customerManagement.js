/**
 * 客户管理模块逻辑类
 */

const http = require("../utils/util");

module.exports = {

    /**
     * 客户列表
     */

    queryCustomerList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request("agent-customer-list", obj)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

};
