const http = require("../utils/util");


module.exports = {
    /**
     * 物流信息列表
     */

    queryLogisticsInfo: function (obj) {
        return new Promise((resolve, reject) => {
            http.request("order-sd-info", obj,'POST',false)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },


};
