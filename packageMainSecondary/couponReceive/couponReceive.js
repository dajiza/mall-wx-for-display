// pages/orderCheck/orderCheck.js
const couponModel = require('../../models/coupon')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        disabledShare: true,

        id: '',
        state: 5, //5立即领取 6去使用 3已使用
        detail: {
            // coupon_amount: 80,
            // coupon_user_id: 222,
            // discount_top: 500,
            // end_time: '2021-05-22T00:00:00+08:00',
            // end_time_txt: '2021-05-22 00:00:00',
            // id: 52,
            // start_time: '2021-05-17T16:53:42+08:00',
            // start_time_txt: '2021-05-17 16:53:42',
            // title: '8折优惠券活动测试',
            // type: 1,
            // un_start: 1,
            // use_goods_type: 3,
            // use_status: 1,
            // with_amount: 1000,
            // user_coupon_count: 0, //1已领取 0未领取
            // user_coupon_used_count: 0, //1已使用 0未使用
        },
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        let id = Number(options.id) || ''
        this.data.id = id
        couponModel.queryCoupunSingle(id).then((res) => {
            console.log('输出 ~ res', res)
            let coupon = res.coupon_data
            coupon['start_time'] = coupon['valid_start_time_txt']
            coupon['end_time'] = coupon['valid_end_time_txt']
            // PersonGetCount 可领取数量 0不限制
            let state = 0

            if (coupon.PersonGetCount == 0) {
                if (res.user_coupon_used_count < res.user_coupon_count) {
                    state = 6
                } else {
                    state = 5
                }
            }
            if (coupon.PersonGetCount > 0) {
                if (res.user_coupon_used_count >= coupon.PersonGetCount) {
                    state = 3
                } else if (res.user_coupon_used_count < res.user_coupon_count) {
                    state = 6
                } else {
                    state = 5
                }
            }

            this.setData({
                detail: coupon,
                state: state,
            })
        })
    },
    onPop: function (e) {
        let pages = getCurrentPages()
        if (pages.length == 1) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
    receiveCoupon: function (e) {
        couponModel.getCoupunSingle(this.data.id).then((res) => {
            wx.showToast({
                title: '领取成功',
                icon: 'none',
                duration: 2000,
            })
            this.setData({
                state: 6,
            })
        })
    },
    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {
    //     return {}
    // },
})
