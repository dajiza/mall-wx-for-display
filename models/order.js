/**
 * 订单模块逻辑类
 */

const http = require('../utils/util')
const config = require('../config/config')
const payModel = require('./pay')
module.exports = {
    // 主商品
    orderCheckList: [
        // {
        //     attr: [
        //         { title: '品牌', value: '川水' },
        //         { title: '色号', value: '02' },
        //         { title: '重量', value: '1000' },
        //     ],
        //     freightId: 2,
        //     goodsId: 186,
        //     id: 287,
        //     img: 'https://storehouse-upyun.chuanshui.cn/productImport/2021-04-09/dsHZCtTz2rygL1FY.O1CN01gSHuzH1pKgQgwV0fz_!!50505342.jpg',
        //     max_discount: 0,
        //     name: 'wwei 日本进口品牌细帆布 眼睛复古花卉植物 包包家居手作diy',
        //     off_2: 0,
        //     parameters: null,
        //     price: 5000,
        //     quantity: 1,
        //     shopSkuId: 288,
        //     skuId: 287,
        //     stock: 9,
        //     unit: '码',
        //     user_discount: 0,
        // },
    ],
    // 加购商品
    orderCheckBarterList: [
        // {
        //     attr: [
        //         { title: '品牌', value: '川水' },
        //         { title: '色号', value: '02' },
        //         { title: '重量', value: '1000' },
        //     ],
        //     freightId: 2,
        //     goodsId: 186,
        //     id: 287,
        //     img: 'https://storehouse-upyun.chuanshui.cn/productImport/2021-04-09/dsHZCtTz2rygL1FY.O1CN01gSHuzH1pKgQgwV0fz_!!50505342.jpg',
        //     max_discount: 0,
        //     name: 'wwei 日本进口品牌细帆布 眼睛复古花卉植物 包包家居手作diy',
        //     off_2: 0,
        //     parameters: null,
        //     price: 5000,
        //     quantity: 1,
        //     shopSkuId: 288,
        //     skuId: 287,
        //     stock: 9,
        //     unit: '码',
        //     user_discount: 0,
        // },
    ],
    // 下单促销信息 没有传false
    orderCheckPromotion: [
        // {
        // id: 24,
        // rules: [{ id: 21, needNum: 200, objId: 0, subNum: 30 }],
        // title: '满减最新',
        // topMoney: 200,
        // type: 1,
        // useGoodsType: 2,
        // }
    ],
    refundSubmitInfo: {
        // orderDetailId: 554,
        // img: "https://storehouse-upyun.chuanshui.cn/2020-10-21/files/JMDs3DbMpGR8y3T1.jpeg",
        // name: "日本进口小碎花布",
        // price: 10,
        // quantity: 1,
        // skuId: 1,
        // stock: 731,
        // attrValue: ["小猪佩奇", "黄色", "粉色花纹"]
    },
    refundType: -1,
    backOrderList: true,
    orderListPage: 1,
    orderListLimit: 20,

    // 创建订单
    creatOrder: async function (data, address_id, total_fee, csrf_token, coupon_user_id, message = '') {
        return new Promise((resolve, reject) => {
            http.request('order-create', {
                data,
                address_id,
                csrf_token,
                coupon_user_id,
                message,
            })
                .then((res) => {
                    payModel.orderNo = res.order_no
                    let totalFee = res.price_total_real ? res.price_total_real : total_fee
                    payModel.queryPayInfo(totalFee, this.orderCheckList)
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 获取下单csrf-token
    queryCsrfToken: function () {
        return new Promise((resolve, reject) => {
            http.request('order-csrf-token', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 创建订单前查询运费
     */
    // queryOrderFreight: function (data, address_id, message = '') {
    //     return new Promise((resolve, reject) => {
    //         http.request('order-freight', {
    //             data,
    //             address_id,
    //             message,
    //         })
    //             .then((res) => {
    //                 resolve(res)
    //             })
    //             .catch((err) => {
    //                 reject(err)
    //             })
    //     })
    // },
    /**
     * 创建订单前查询优惠金额
     */
    queryOrderDiscount: function (data, address_id, message = '', csrf_token) {
        return new Promise((resolve, reject) => {
            http.request('order-math', {
                data,
                address_id,
                message,
                csrf_token,
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
     * 商城订单理由列表
     *
     * @param   {[type]}  type        0仅退款理由 1退货理由 2换货理由 3后台关闭理由
     */
    queryReasonList: function (type) {
        type = Number(type)
        return new Promise((resolve, reject) => {
            http.request('order-reason-list', {
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
     * 提交申请 退款/退货/换货
     */
    // {
    //     "order_detail_id": 370, //order_detail表id字段
    //     "type": 0, //0仅退款，1退货退款，2换货
    //     "imgs": "tutut", //建议上送json字符串，因为会有多张图片。上送什么保存什么，展示的时候前端解析展示
    //     "reason_id": 1,
    //     "reason": "理由理由",
    //     "money": 100 //单位分
    // }
    creatRefundOrder: function (order_detail_id, type, imgs, reason_id, reason, money, address_id) {
        return new Promise((resolve, reject) => {
            http.request('order-stop-apply', {
                order_detail_id,
                type,
                imgs,
                reason_id,
                reason,
                money,
                address_id,
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
     * 查询售后订单详情
     *
     * type 1:id 2:order_detail_id
     */
    queryRefundDetail: function (id, type) {
        let params
        if (type == 1) {
            params = {
                id: id,
            }
        } else if (type == 2) {
            params = {
                order_detail_id: id,
            }
        }
        return new Promise((resolve, reject) => {
            http.request('order-apply-data', params)
                .then((res) => {
                    this.backOrderList = true
                    resolve(res)
                })
                .catch((err) => {
                    this.backOrderList = true
                    reject(err)
                })
        })
    },
    /**
     * 商城系统配置 获取退货地址
     */
    queryRefundAddress: function () {
        return new Promise((resolve, reject) => {
            http.request('config-with-shop', {})
                .then((res) => {
                    // let data = res.filter((item) => {
                    //     return item.config_key == "SYS_RECEIVER_ADDRESS";
                    // });
                    let data = {}
                    if (res) {
                        Object.keys(res).forEach((key) => {
                            wx.setStorageSync(key, res[key])
                            if (key === 'SYS_RECEIVER_ADDRESS') {
                                data = res[key]
                            }
                        })
                    }
                    resolve(data)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 快递公司列表
     */
    queryExpressList: function () {
        return new Promise((resolve, reject) => {
            http.request('sd-company-list-all', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    /**
     * 提交退货快递信息
     */
    creatRefundExpress: function (order_apply_id, logistics_company_name, logistics_no) {
        return new Promise((resolve, reject) => {
            http.request('order-return-way', {
                order_apply_id,
                logistics_company_name,
                logistics_no,
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
     * 售后操作列表. 获取拒绝理由
     */

    queryOperateList: function (apply_id) {
        return new Promise((resolve, reject) => {
            http.request('order-apply-operate-list', { apply_id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 订单列表
    queryOrderList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('order-list', obj)
                .then((res) => {
                    this.backOrderList = false
                    resolve(res)
                })
                .catch((err) => {
                    this.backOrderList = false
                    reject(err)
                })
        })
    },

    // 代理商卖出订单列表
    queryAgentSellOrderList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('agent-order-list', obj)
                .then((res) => {
                    this.backOrderList = false
                    resolve(res)
                })
                .catch((err) => {
                    this.backOrderList = false
                    reject(err)
                })
        })
    },

    // 订单详情
    queryOrderDetail: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('order-data', obj)
                .then((res) => {
                    this.backOrderList = true
                    resolve(res)
                })
                .catch((err) => {
                    this.backOrderList = true
                    reject(err)
                })
        })
    },

    // 售后（退款）列表
    queryOrderApplyList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('order-apply-list', obj)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 代理商卖出订单  - 售后列表
    queryAgentSellOrderApplyList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('agent-order-applyList', obj)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 取消订单
    queryCancelOrder: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('order-cancel', obj)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 确认收货
    queryOrderSuccess: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('order-success', obj)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 下单前获取某张优惠卷优惠情况
    queryOrderCouponInfo: function (coupon_user_id, data) {
        return new Promise((resolve, reject) => {
            http.request('order-coupon-Info', { coupon_user_id, data })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 包邮策略查询
    queryOrderFreightInfo: function (freight_id, address_id) {
        return new Promise((resolve, reject) => {
            http.request('order-freight-info', { freight_id, address_id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 用户各状态订单数
    queryUserOrderCount: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('user-order-status-report', obj)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 代理商各状态订单数
    queryAgentOrderCount: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('admin-order-status-report', obj)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 订单sku列表查询
    queryOrderSkuList: function (obj) {
        return new Promise((resolve, reject) => {
            http.request('order-sku-list', obj)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
