/**
 * 用户/店铺信息逻辑类
 */

const http = require('../utils/util')
const config = require('../config/config')

module.exports = {
    // 获取用户/店铺信息
    queryUserShopInfo: function () {
        return new Promise((resolve, reject) => {
            // 防止详情页登录 返回一个假数据
            let checkCode = http.checkToken()
            if (checkCode != 0) {
                resolve({
                    user_info: {
                        user_id: 0,
                        shop_id: 0,
                        nick_name: '',
                        phone: '',
                        sex: 0,
                        province: '',
                        city: '',
                        country: '',
                        avatar_url: '',
                        inviter_id: 0,
                        user_info: 0,
                        discount_id: 0,
                        discount_value: 0,
                        discount_title: '',
                        discount_freight_id: 0,
                        course_sub: 0,
                        is_admin: 0,
                        invite_code: '',
                        points: -1,
                    },
                    shop_info: {
                        shop_id: 0,
                        shop_name: '',
                        tool_course: 0,
                        tool_points: 0,
                        tool_tutorial: 0,
                        basic_rate: 0,
                        additional_rate: 0,
                        tutorial_rate: 0,
                        tutorial_days: 0,
                    },
                })
                return
            }
            http.request('user-shop-info', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 我的钱包
    queryMyIncome: function () {
        return new Promise((resolve, reject) => {
            http.request('agent-my-package-small', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 根据id获取用户信息
    queryUserInfo: function (id) {
        return new Promise((resolve, reject) => {
            http.request('user-data-easy', { id: Number(id) }, 'POST', false)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 工具箱 - 团作 开启/关闭 1不开 2开启
    updateToolCourse: function (tool_course) {
        return new Promise((resolve, reject) => {
            http.request('shop-tool-course', { tool_course })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 工具箱 - 积分商城 开启/关闭 1不开 2开启
    updateToolPoints: function (tool_points) {
        return new Promise((resolve, reject) => {
            http.request('shop-tool-points', { tool_points })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 工具箱 - 看看 开启/关闭 1不开 2开启
    updateToolTutorial: function (tool_tutorial) {
        return new Promise((resolve, reject) => {
            http.request('shop-tool-tutorial', { tool_tutorial })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
