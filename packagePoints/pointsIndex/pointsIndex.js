// pages/orderCheck/orderCheck.js
const pointsModel = require('../../models/points')
const userShopInfoModel = require('../../models/userShopInfo')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        activeTab: 1,
        points: '',
        page: 1,
        limit: 20,
        total: 0,
        loading: false,
        list: [],
        pageTotal: '',
        discount_value: 0, //判断是否是会员
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.queryGoods()
    },

    onShow: function () {
        this.getUserInfo()
    },

    onPop: function (e) {
        let pages = getCurrentPages()
        if (pages.length == 1) {
            wx.switchTab({
                url: '/pages/my/my',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
    checkTab: function (e) {
        this.setData({
            page: 1,
            loading: true,
            list: [],
            activeTab: e.currentTarget.dataset.index,
        })
        let activeTab = this.data.activeTab
        if (activeTab == 1) {
            this.queryGoods()
        } else {
            this.queryCoupon()
        }
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        console.log('输出 ~ onReachBottom')
        let page = this.data.page
        let limit = this.data.limit
        let total = this.data.total
        let loading = this.data.loading
        let pageTotal = this.data.pageTotal
        let activeTab = this.data.activeTab

        // let pageTotal = Math.ceil(total / limit)
        if (page <= pageTotal && !loading) {
            this.setData({
                loading: true,
            })
            if (activeTab == 1) {
                this.queryGoods()
            } else {
                this.queryCoupon()
            }
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
                this.setData({
                    points: res.user_info.points,
                    discount_value: res.user_info.discount_value,
                })
                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },
    /**
     * 获取积分商品列表
     */
    queryGoods() {
        wx.showLoading({
            title: '加载中...',
        })
        let page = this.data.page
        let limit = this.data.limit
        let list = this.data.list
        pointsModel
            .queryPointsGoodsList(page, limit)
            .then((res) => {
                let newArr = res.list || []
                list.push(...newArr)
                this.setData({
                    list,
                    page: page + 1,
                    total: res.total,
                    pageTotal: Math.ceil(res.total / limit),
                    loading: false,
                })
                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },
    /**
     * 获取积分商品列表
     */
    queryCoupon() {
        wx.showLoading({
            title: '加载中...',
        })
        let page = this.data.page
        let limit = this.data.limit
        let list = this.data.list
        pointsModel
            .queryPointsCouponList(page, limit)
            .then((res) => {
                let newArr = res.list || []
                list.push(...newArr)
                this.setData({
                    list,
                    page: page + 1,
                    total: res.total,
                    pageTotal: Math.ceil(res.total / limit),
                    loading: false,
                })
                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },
    gotoList() {
        wx.navigateTo({
            url: `/packagePoints/pointsDetails/pointsDetails`,
        })
    },
    gotoLog() {
        wx.navigateTo({
            url: `/packagePoints/pointsExchangeRecord/pointsExchangeRecord`,
        })
    },
})
