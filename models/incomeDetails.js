/**
 * 收益明细模块逻辑类
 */

const http = require("../utils/util");

module.exports = {

    /**
     * 收益明细列表
     */

    queryList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request("agent-commission-list", obj)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

};
