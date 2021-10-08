// components/couponItem/couponItem.js
import moment from 'moment'
const orderModel = require('../../models/order')

App.Component({
    /**
     * 页面的初始数据
     */
    properties: {
        // 选中
        selected: {
            type: Boolean,
            value: false,
        },
        // 金额 凑单用
        amount: {
            type: Number,
            value: 0,
        },
        /**
         * type 1 满减 2 折扣
         */
        detail: {
            type: Object,
            value: {},
            observer: function (newVal, oldVal) {
                let detail = newVal
                // 和当前时间比较
                let now = new Date()
                let notStart = moment(now).isBefore(detail.start_time)
                // 格式化
                detail.start = detail.start_time && moment(detail.start_time).format('YYYY.MM.DD')
                detail.end = detail.end_time && moment(detail.end_time).format('YYYY.MM.DD')

                this.setData({
                    info: detail,
                    notStart,
                })
            },
        },
        /**
         * 列表来源
         * 1优惠券包 2订单
         */
        listType: {
            type: String,
            value: 1,
        },
        /**
         * 样式type
         * 1可凑单/未使用 2可用 3已使用 4不可用/已过期 5立即领取-领取页面 6去使用-领取页面
         */
        type: {
            type: String,
            value: '',
            observer: function (newVal, oldVal) {
                let bg = ''
                let bgList = this.data.bgList
                switch (newVal) {
                    case '1':
                        bg = bgList[0]
                        break
                    case '2':
                        bg = bgList[0]
                        break
                    case '3':
                        bg = bgList[1]
                        break
                    case '4':
                        bg = bgList[2]
                        break
                    case '5':
                        bg = bgList[0]
                        break
                    case '6':
                        bg = bgList[3]
                        break
                }
                this.setData({
                    bg,
                })
            },
        },
    },

    data: {
        info: {},
        notStart: false,
        bg: '',
        bgList: ['../../assets/images/coupon-active.png', '../../assets/images/coupon-used.png', '../../assets/images/coupon-invalid.png', '../../assets/images/coupon-receive.png'],
    },
    lifetimes: {
        ready: function () {},
        detached: function () {
            // 在组件实例被从页面节点树移除时执行
        },
    },

    methods: {
        async touse() {
            let listType = this.data.listType
            let notStart = this.data.notStart
            let info = this.data.info
            let couponInfo = this.data.detail

            let amount = 0
            if (notStart) {
                return
            }
            // 1优惠券包 2订单
            this.post({
                eventName: 'selectCouponItem',
                eventParams: couponInfo,
                isSticky: true,
            })
            if (listType == 1) {
                orderModel.orderCheckList = []
                amount = 0
            } else {
                amount = await this.queryOrderInfo()
            }
            wx.navigateTo({
                url: `/pages/makeUp/makeUp?use_goods_type=${info.use_goods_type}&coupon_id=${info.id}&type=${info.type}&with_amount=${info.with_amount}&coupon_amount=${info.coupon_amount}&discount_top=${info.discount_top}&total_amount=${amount}`,
            })
        },
        // 获取总价和优惠的商品
        queryOrderInfo() {
            return new Promise((resolve, reject) => {
                let couponInfo = this.data.detail
                let goodsList = orderModel.orderCheckList
                let goodsData = goodsList.map((item) => {
                    return {
                        shop_goods_sku_id: item.shopSkuId,
                        num: item.quantity,
                    }
                })
                if (couponInfo) {
                    orderModel.queryOrderCouponInfo(couponInfo.coupon_user_id, goodsData).then((res) => {
                        console.log('输出 ~ res', res)
                        // this.setData({
                        //     couponGoods: res.order_coupon_list,
                        // })
                        resolve(res.sum_price)
                    })
                } else {
                    resolve(0)
                }
            })
        },
        // 单张详情页领取
        receive() {
            this.triggerEvent('receiveCoupon')
        },
    },
})
