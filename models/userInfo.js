const util = require('../utils/util')

module.exports = {
  queryUserInfoBase: function (params={}) {
    return new Promise((resolve, reject) => {
      util.request('userinfo-base', params)
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  updateUserInfoBase: function (params) {
    return new Promise((resolve, reject) => {
      util.request('userinfo-base-update', params)
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
}