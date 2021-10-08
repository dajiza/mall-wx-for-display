// pages/orderCheck/orderCheck.js
const pointsModel = require('../../models/points')
const userShopInfoModel = require('../../models/userShopInfo')
import moment from 'moment'

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        info: '',
        coupon: '',
        points: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        let detail = pointsModel.orderCoupon
        console.log('输出 ~ detail', detail)
        // 格式化
        detail.coupon.start = detail.coupon.valid_start_time_txt && moment(detail.coupon.valid_start_time_txt).format('YYYY.MM.DD')
        detail.coupon.end = detail.coupon.valid_end_time_txt && moment(detail.coupon.valid_end_time_txt).format('YYYY.MM.DD')

        this.setData({
            coupon: detail,
            info: pointsModel.orderCoupon.coupon,
        })
        this.getUserInfo()

        console.log('输出 ~ pointsModel.orderCoupon', pointsModel.orderCoupon)
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
    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        wx.showLoading({
            title: '加载中...',
        })
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                console.log('输出 ~ res', res)
                this.setData({
                    points: res.user_info.points,
                })
                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },
    buyCoupon() {
        let points = this.data.points
        let coupon = this.data.coupon
        if (points < coupon.points) {
            return
        }
        let params = {
            address_id: '',
            id: coupon.id,
            num: 1,
        }

        pointsModel.creatPointsOrder(params).then((res) => {
            wx.showToast({
                title: '兑换成功，请在我的--优惠券包查看',
                icon: 'none',
                duration: 5000,
                mask: true,
            })
            setTimeout(() => {
                wx.reLaunch({
                    url: `/packagePoints/pointsIndex/pointsIndex`,
                })
            }, 1000)
        })
    },
    gotoList() {
        let coupon = this.data.coupon
        wx.navigateTo({
            url: `/packagePoints/pointsMakeup/pointsMakeup?coupon_id=${coupon.couponId}&type=${coupon.coupon.type}&use_goods_type=${coupon.coupon.use_goods_type}`,
        })
    },
})
