// packageAgent/makeUp/makeUp.js
import screenConfig from '../../utils/screen_util'
const goodsModel = require('../../models/goods')

const tool = require('../../utils/tool')

const navigateBarHeight = screenConfig.getSafeAreaTopPadding() + 46
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)

const app = getApp()

App.Page({
    data: {
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        navigateBarHeight: navigateBarHeight,
        safeAreaInsetBottom: safeAreaInsetBottom,
        filterBoxHeight: screenConfig.getPX(30),

        // 商品列表
        page: 1,
        limit: 20,
        total: 0,
        loading: false,
        pageTotal: 0,
        list: [],

        description: '',
        title: '',

        goodsIds: [],
        groupId: '',
        sort_type: '',
    },
    onLoad: function (options) {
        let id = options.id

        this.setData({
            id,
        })
        this.queryGoods()
    },
    // 获取商品列表
    queryGoods: function () {
        let id = Number(this.data.id)

        let params = {
            id: id,
        }
        goodsModel
            .queryGroupGoods(params)
            .then((res) => {
                this.setData({
                    description: res.goods_group.remark,
                    title: res.goods_group.title,
                    goodsIds: res.shop_goods_ids,
                    groupId: res.goods_group.id,
                    sort_type: res.goods_group.sort_type,
                })
                this.queryGoodsDetail()
            })

            .catch((err) => {})
    },
    queryGoodsDetail: function () {
        wx.showLoading({
            title: '加载中...',
        })
        let page = this.data.page
        let limit = this.data.limit
        let goodsIds = this.data.goodsIds
        let groupId = this.data.groupId
        let list = this.data.list
        let sort_type = this.data.sort_type
        let params = {
            shop_goods_ids: goodsIds,
            sort: sort_type,
            group_id: groupId,
            limit: limit,
            page: page,
            shop_goods_status: 2,
        }
        goodsModel
            .queryGroupGoodsList(params)
            .then((res) => {
                let newArr = res.list || []
                list.push(...newArr)
                this.setData({
                    list,
                    page: page + 1,
                    total: res.total,
                    pageTotal: Math.ceil(res.total / this.data.limit),
                    loading: false,
                })
                wx.hideLoading()
            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.setData({
            list: [],
            page: 1,
            loading: true,
        })
        this.queryGoodsDetail()
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        let page = this.data.page
        let loading = this.data.loading
        let pageTotal = this.data.pageTotal

        // let pageTotal = Math.ceil(total / limit)
        if (page <= pageTotal && !loading) {
            this.setData({
                loading: true,
            })
            this.queryGoodsDetail()
        }
    },
    clickBack() {
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

    addGoods(e) {
        let itemIndex = e.currentTarget.dataset.index
        let goods = this.data.list[itemIndex]
        wx.showLoading({
            title: '加载中...',
        })
        goodsModel
            .queryGoodsDetail(goods.id)
            .then((res) => {
                let attr = res.attr_info
                let goods = res.goods_info
                let sku = res.goods_sku_list
                wx.hideLoading({
                    success: (res) => {
                        let spec = this.selectComponent('#spec')
                        spec.setData({
                            attr: attr,
                            goods: goods,
                            sku: sku,
                            isShow: true,
                            quantity: 1,
                            parameters: {
                                itemIndex: itemIndex,
                            },
                        })
                    },
                })
            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    gotoDetail(res) {
        const goods_id = Number(res.currentTarget.dataset.id)
        console.log('输出 ~ goods_id', goods_id)
        wx.navigateTo({
            url: '/pages/goodsDetail/goodsDetail' + '?goodsId=' + goods_id,
        })
    },
})
