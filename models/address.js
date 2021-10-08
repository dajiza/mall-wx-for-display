const http = require("../utils/util");

module.exports = {
    // 地址管理-获取购物车列表
    cacheAddressList: [],
    getDefaultAddress: function () {
        return new Promise((resolve, reject) => {
            if (this.cacheAddressList.length > 0) {
                resolve(this.cacheAddressList[0]);
            } else {
                this.getAddressList()
                    .then((res) => {
                        if (res.length > 0) {
                            resolve(res[0]);
                        } else {
                            resolve();
                        }
                    }).catch((err) => {
                        reject(err);
                    })
            }
        });
    },
    getAddressList: function () {
        return http.request("user-address-list")
            .then((addressList) => {
                this.cacheAddressList = addressList || [];
                return this.cacheAddressList;
            });
    },
    // 地址管理-新增
    // {
    //   name: name,
    //   phone: phone,
    //   province_code: addressObject.province_code,
    //   city_code: addressObject.address,
    //   area_code: addressObject.area_code,
    //   address: addressObject.address,
    //   is_default: is_default,
    // }
    addAddress: function (request) {
        return http.request("user-address-create", request)
            .then((res) => {
                return this.getAddressList();
            });
    },
    // 地址管理-更新
    // {
    //   id: id,
    //   name: name,
    //   phone: phone,
    //   province_code: addressObject.province_code,
    //   city_code: addressObject.address,
    //   area_code: addressObject.area_code,
    //   address: addressObject.address,
    //   is_default: is_default,
    // }
    editAddress: function (request) {
        return http.request("user-address-update", request)
            .then((res) => {
                return this.getAddressList();
            });
    },
    // 地址管理-删除
    deleteAddress: function (id) {
        return http.request("user-address-delete", {
            id: id,
        }).then((res) => {
            return this.getAddressList();
        });
    },
}
