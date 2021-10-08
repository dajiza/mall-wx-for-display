// pages/orderCheck/orderCheck.js
const orderModel = require('../../models/order')
const pointsModel = require('../../models/points')
const addressModel = require('../../models/address')
const userShopInfoModel = require('../../models/userShopInfo')
const util = require('../../utils/util')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        goodsList: [],
        totalPoints: 0,
        freight: 0,
        defaultAddress: {},
        csrfToken: '',
    },
    events: {
        getSelectedAddress: function (address) {
            this.setData({
                defaultAddress: address,
            })
        },
        updateDefaultAddress: function (defaultAddress) {
            this.setData({
                defaultAddress: defaultAddress,
            })
        },
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function () {
        //调用方法获取机型
        let phone = wx.getSystemInfoSync()
        if (phone.platform == 'ios') {
            this.setData({
                ios: true,
            })
        }
    },
    onShow: async function (options) {
        // let userInfo = await userShopInfoModel.queryUserShopInfo()
        // console.log('userInfo', userInfo);
        // let memberDiscount = userInfo.user_info.discount_value || 0
        // let discount_freight_id = userInfo.user_info.discount_freight_id || 0
        let defaultAddress = this.data.defaultAddress
        wx.showLoading({
            title: '加载中...',
        })
        // 获取地址
        if (!defaultAddress.name) {
            // 获取默认地址
            let defaultAddress = await addressModel.getDefaultAddress()
            this.setData({
                defaultAddress: defaultAddress ? defaultAddress : false,
            })
        }
        let freightIds = orderModel.orderCheckList.map((item) => item.freightId)
        freightIds = Array.from(new Set(freightIds))
        // 计算总价
        let totalPoints = pointsModel.orderGoods.points * pointsModel.orderGoods.quantity

        this.setData({
            goodsList: [pointsModel.orderGoods],
            totalPoints,
        })

        wx.hideLoading()
    },

    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    submitOrder: function () {
        wx.showLoading({
            title: '订单生成中',
            icon: 'loading',
            mask: true,
        })
        util.debounce(this.creatOrder())
    },

    /**
     * 创建订单
     */
    creatOrder: function () {
        let goodsList = this.data.goodsList
        let defaultAddress = this.data.defaultAddress
        // 判断地址
        if (!defaultAddress.name) {
            wx.showToast({
                title: '请选择地址',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        let params = {
            address_id: defaultAddress.id,
            id: goodsList[0].relationId,
            num: Number(goodsList[0].quantity),
        }

        pointsModel.creatPointsOrder(params).then((res) => {
            wx.showToast({
                title: '兑换成功，请等待收货',
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
    /**
     * 生命周期函数--监听页面显示
     */
    // onShow: function () {
    //     // this.queryCouponList()
    // },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: async function () {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {},

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // }
})
