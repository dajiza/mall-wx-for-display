/**
 * 活动
 */

const http = require('../utils/util')

module.exports = {
    // 广告列表
    queryAdvList: function () {
        return new Promise((resolve, reject) => {
            http.request('adv-list', {}, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 文章详情（小程序）
    queryAboutDetail: function (id) {
        return new Promise((resolve, reject) => {
            http.request('about-data', { id }, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 文章列表(小程序)
    queryAboutList: function (page, limit) {
        return new Promise((resolve, reject) => {
            http.request('about-list', { page, limit }, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
