/**
 * 评价
 */

const util = require('../utils/util')
const config = require('../config/config')

module.exports = {
    commentParams: {},
    // 店铺评价列表
    queryShopCommentList: function (params) {
        return new Promise((resolve, reject) => {
            util.request(
                'comment-shop-list',
                params,
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
    // 获取评价详情
    queryCommentDetail: function (params) {
        return new Promise((resolve, reject) => {
            util.request(
                'comment-shop-detail',
                params,
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
    // 创建评价
    creatComment: function (params) {
        return new Promise((resolve, reject) => {
            util.request(
                'comment-shop-create',
                params,
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
    // 我的评价列表
    queryMyComment: function (params) {
        return new Promise((resolve, reject) => {
            util.request(
                'comment-goods-list',
                params,
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

    // 评价回复
    queryCommentReply: function (params) {
        return new Promise((resolve, reject) => {
            util.request(
                'comment-shop-reply',
                params,
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
    // 评价点赞
    queryCommentLike: function (params) {
        return new Promise((resolve, reject) => {
            util.request(
                'comment-like',
                params,
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
}
