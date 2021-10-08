/**
 * 资金模块逻辑类
 */

const http = require('../utils/util')
const config = require('../config/config')

module.exports = {
    // 我的钱包-详情 代理商
    queryWallet: function () {
        return new Promise((resolve, reject) => {
            http.request('agent-my-package', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 今日额度-提现
    queryWithdrawalQuota: function () {
        return new Promise((resolve, reject) => {
            http.request('agent-withdrawal-today', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 申请提现
     * "money":1,  //分
     * "type":1, //1 提现到零钱 (微信钱包) 2提现到银行卡'
     */
    putWithdrawal: function (money, type) {
        return new Promise((resolve, reject) => {
            http.request('agent-withdrawal', {
                money,
                type,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 提现规则
     */
    queryCommissionRules: function () {
        return new Promise((resolve, reject) => {
            http.request('agent-commission-txt', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 我的钱包-顾客
    queryWalletCustomer: function () {
        return new Promise((resolve, reject) => {
            http.request('customer-my-package', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 佣金日志-顾客
    queryCustomerCommissionLog: function () {
        return new Promise((resolve, reject) => {
            http.request('customer-commission-log', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 提现申请-顾客
    putWithdrawalCustomer: function (money, type) {
        return new Promise((resolve, reject) => {
            http.request('customer-withdrawal', { money, type })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 提现规则-顾客
     */
    queryCommissionRulesCustomer: function () {
        return new Promise((resolve, reject) => {
            http.request('customer-commission-txt', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 今日额度-提现-顾客
    queryWithdrawalQuotaCustomer: function () {
        return new Promise((resolve, reject) => {
            http.request('customer-withdrawal-today', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 提现日志 判断是否可以提现
    queryCommissionCheckList: function () {
        return new Promise((resolve, reject) => {
            http.request('commission-check-list', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
