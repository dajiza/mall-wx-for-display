const util = require('../utils/util')

module.exports = {
    introduction: '', //团作介绍详情

    // 消息通知数量
    queryNoticeCount: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-notice-count', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 消息通知列表
    queryNoticeList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-notice-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 消息详情
    queryNoticeDetail: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-detail', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 删除消息
    delNoticeList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-notice-delete', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 圈子列表
    queryCircleList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-circle-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 作业墙列表
    queryWorkList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-work-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    /**
     *  圈子新增
     */
    creatCircle: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-create', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    /**
     *  评论回复
     */
    creatCommentReply: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-reply', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 点赞
    queryLike: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-like', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 删除
    queryDel: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-delete', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 老师评论作业
    queryCommentGrade: function (params) {
        return new Promise((resolve, reject) => {
            util.request('comment-grade', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 是否被禁言
    queryUserIsMute: function (params) {
        return new Promise((resolve, reject) => {
            util.request('user-is-banned', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

}
