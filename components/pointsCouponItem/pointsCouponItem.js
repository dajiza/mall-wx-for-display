// components/couponItem/couponItem.js
import moment from 'moment'
const pointsModel = require('../../models/points')

App.Component({
    /**
     * 页面的初始数据
     */
    properties: {
        /**
         * type 1 满减 2 折扣
         */
        detail: {
            type: Object,
            value: {},
            observer: function (newVal, oldVal) {
                if (!newVal) {
                    return
                }
                let detail = newVal.coupon
                // 和当前时间比较
                let now = new Date()
                let notStart = moment(now).isBefore(detail.start_time)
                // 格式化
                detail.start = detail.valid_start_time_txt && moment(detail.valid_start_time_txt).format('YYYY.MM.DD')
                detail.end = detail.valid_end_time_txt && moment(detail.valid_end_time_txt).format('YYYY.MM.DD')

                this.setData({
                    info: detail,
                    notStart,
                })
            },
        },
        // 是否跳转
        needJump: {
            type: Boolean,
            value: true,
        },
    },

    data: {
        info: {},
        notStart: false,
        bg: '../../assets/images/coupon-points.png',
    },
    lifetimes: {
        ready: function () {},
        detached: function () {
            // 在组件实例被从页面节点树移除时执行
        },
    },

    methods: {
        gotoDetail() {
            if (!this.data.needJump) {
                return
            }
            pointsModel.orderCoupon = this.data.detail
            wx.navigateTo({
                url: `/packagePoints/pointsCouponOrderCheck/pointsCouponOrderCheck`,
            })
        },
    },
})
