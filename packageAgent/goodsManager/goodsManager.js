// pages/goodsManager/goodsManager.js
import screenConfig from '../../utils/screen_util'
import util from '../../utils/util'

const searchListModel = require('../../models/searchList')
const agentShelvesModel = require('../../models/agentShelves')

const navigateBarHeight = screenConfig.getSafeAreaTopPadding() + 46
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)

const app = getApp()

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        navigateBarHeight: navigateBarHeight,
        safeAreaInsetBottom: safeAreaInsetBottom,

        name: '', // 名称---搜索内容
        searchPlace: '输入商品名称搜索',
        popupShow: false,
        searchModel: false,
        showShelfConfirmDialog: false,
        shelfConfirmDialogMessage: '',
        shelfAction: 0,

        active: 0,
        loadState: [false, false],
        page: 1,
        total: 0,
        isAllLoaded: false,
        bottomLoadingShow: false,

        searchRequest: {},
        searchList: {},
        goodsCate: {},

        shelves: false,
        goodsSkus: [],
        editGoods: {},

        goodsList: [],
        currentFilterAttr: [],
        currentFilterLabel: [],
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {},
    onShow: function () {
        this.getGoodsList()
        this.getCategoryData()
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.getGoodsList(this.data.active, false, false)
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        console.log('onReachBottom')
        if (this.data.goodsList.length >= this.data.total) {
            //已加载全部的商品列表
            return
        }
        this.getGoodsList(this.data.active, false, true)
    },
    onPageScroll: util.throttle(function (res) {
        console.log(res[0].scrollTop)
    }),
    handleonShelve: function () {
        wx.navigateTo({
            url: '/packageAgent/putGoodsOnSale/putGoodsOnSale',
        })
    },
    bindClearSearch: function () {
        this.setData({
            name: '',
        })
    },
    bindSearchInput: function (e) {
        this.setData({
            name: e.detail.value,
        })
    },
    searchInputCapture: function (e) {
        if (!this.data.searchModel) {
            //非搜索模式
            this.setData({
                searchModel: true,
                backgroundColor: '#ffffff',
            })
        }
    },
    handleOnFocus: function () {},
    handleOnSearch: function () {
        if (this.data.name) {
            let history = this.selectComponent('#history')
            history.saveSearch(this.data.name)
        }
    },
    onSearchCancel() {
        this.setData({
            searchModel: false,
            backgroundColor: 'var(--divider-border-color)',
        })
    },
    goSearch(e) {
        this.setData(
            {
                searchModel: false,
                backgroundColor: 'var(--divider-border-color)',
            },
            () => {
                this.setData(
                    {
                        name: e.detail || '',
                    },
                    () => {
                        this.getGoodsList()
                    }
                )
            }
        )
        wx.nextTick(() => {
            this.setData({
                name: e.detail || '',
            })
        })
    },
    onClickFilter() {
        this.setData({
            popupShow: true,
        })
    },
    onTabChange(event) {
        let active = Number(event.detail.name)
        let loadStateKey = 'loadState[' + active + ']'
        console.log('onTabChange active:' + active)
        this.setData(
            {
                goodsList: [],
                active: active,
                [loadStateKey]: false,
            },
            () => {
                this.getGoodsList(active)
            }
        )
    },
    ClickBack() {
        if (this.data.searchModel) {
            this.onSearchCancel()
            return
        }
        let pages = getCurrentPages()
        if (pages.length === 1) {
            wx.switchTab({
                url: '../index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
    fillterPopupClose() {
        this.setData({
            popupShow: false,
        })
    },
    getFillter(e) {
        console.log(e)
        this.data.searchRequest = e.detail
        this.setData(
            {
                searchList: this.data.searchRequest.new_search,
                popupShow: false,
            },
            () => {
                this.getGoodsList()
            }
        )
    },
    fillterReset(e) {
        this.data.searchRequest = e.detail
        console.log('this.data.searchRequest.new_search', this.data.searchRequest.new_search)
        this.setData(
            {
                searchList: {},
                popupShow: false,
            },
            () => {
                this.getGoodsList()
            }
        )
    },
    navigateTo(e) {
        let index = e.currentTarget.dataset.index
        let goods = this.data.goodsList[index]
        let goodsId = goods.goods_id
        if (goodsId) {
            //有这个属性则传对应的值，没有这个属性，则传1
            let is_top = goods.is_top == 2 ? 1 : 2
            wx.navigateTo({
                url: '/packageAgent/goodsManagerDetail/goodsManagerDetail?goodsId=' + goodsId + '&goodsName=' + goods.title + '&type=' + goods.type + '&is_top=' + is_top,
            })
        }
    },
    onShelves(e) {
        let index = e.currentTarget.dataset.index
        let goods = this.data.goodsList[index]
        // this.setData({
        //   showShelfConfirmDialog: true,
        //   shelfConfirmDialogMessage: '确认上架该商品吗',
        //   shelfAction: 1,
        //   editGoods: goods,
        // })
        this.showShelvesPopup(goods)
    },

    /**
     * 置顶/取消置顶
     */
    handleOnIsTop(e) {
        let index = e.currentTarget.dataset.index
        let goods = this.data.goodsList[index]
        let shopGoodsId = goods.shop_goods_id
        let is_top = goods.is_top == 2 ? 1 : 2
        wx.showLoading({
            title: '加载中...',
        })
        agentShelvesModel
            .toggleAgentShopGoodsTop(shopGoodsId, is_top)
            .then((res) => {
                wx.hideLoading()
                this.onPullDownRefresh()
            })
            .catch((err) => {
                console.log(err)
                wx.hideLoading()
            })
    },
    /**
     * 下架
     */
    handleOnOffShelf(e) {
        let index = e.currentTarget.dataset.index
        let goods = this.data.goodsList[index]
        this.setData({
            showShelfConfirmDialog: true,
            shelfConfirmDialogMessage: '确认下架该商品吗',
            shelfAction: 2,
            editGoods: goods,
        })
    },
    /**
     * 编辑
     */
    handleOnEdit(e) {
        let index = e.currentTarget.dataset.index
        let goods = this.data.goodsList[index]
        this.showShelvesPopup(goods)
    },
    handleOnShare(e) {
        let index = e.currentTarget.dataset.index
        let goods = this.data.goodsList[index]
        this.post({
            // goods_id
            eventName: 'preShareOnLoad',
            eventParams: {
                page: 'pages/goodsDetail/goodsDetail',
                scene: 'goods_id:' + goods.goods_id,
                goods_img: goods.img,
                goods_name: goods.title,
                goods_price: (parseFloat(goods.price) / 100).toFixed(2),
            },
            isSticky: true,
        })
        wx.navigateTo({
            url: '/pages/share/share?type=0',
        })
    },
    /**
     * 上架
     */
    handleOnShelvesConfirm(e) {
        console.log(e)
        var timerOnSale
        clearTimeout(timerOnSale)
        let goods = this.data.editGoods
        let goods_id = goods.goods_id
        if (e.detail && goods_id) {
            if (e.detail.length > 0) {
                let request = {
                    goods_id: goods_id,
                    is_top: goods.is_top,
                    skus: e.detail,
                }
                console.log(request)
                wx.showLoading({
                    title: '加载中...',
                })
                agentShelvesModel
                    .getAgentGoodsOn(request)
                    .then((res) => {
                        wx.hideLoading()
                        this.setData(
                            {
                                shelves: false,
                                goodsSkus: res,
                                editGoods: {},
                            },
                            () => {
                                wx.showToast({
                                    title: '上架成功',
                                    icon: 'none',
                                    duration: 2000,
                                    mask: true,
                                })
                                timerOnSale = setTimeout(() => {
                                    this.onPullDownRefresh()
                                }, 1500)
                            }
                        )
                    })
                    .catch((err) => {
                        console.log(err)
                        wx.hideLoading()
                    })
            }
        }
    },
    onConfirmDialogClose() {
        this.setData({
            showShelfConfirmDialog: false,
        })
    },
    onShelfDialogConfirm() {
        var timerOffSale
        clearTimeout(timerOffSale)
        let goods = this.data.editGoods
        let shopGoodsId = goods.shop_goods_id
        if (shopGoodsId) {
            this.setData(
                {
                    editGoods: {},
                    showShelfConfirmDialog: false,
                },
                () => {
                    wx.showLoading({
                        title: '加载中...',
                    })
                    if (this.data.shelfAction == 1) {
                        //上架商品
                        this.showShelvesPopup(goods)
                    } else if (this.data.shelfAction == 2) {
                        //下架商品
                        agentShelvesModel
                            .getAgentGoodsDown(shopGoodsId, 1)
                            .then((res) => {
                                wx.hideLoading()
                                wx.showToast({
                                    title: '下架成功',
                                    icon: 'none',
                                    duration: 2000,
                                    mask: true,
                                })
                                timerOffSale = setTimeout(() => {
                                    this.onPullDownRefresh()
                                }, 1500)
                            })
                            .catch((err) => {
                                console.log(err)
                                wx.hideLoading()
                            })
                    }
                }
            )
        }
    },
    preventTouchMove() {},
    getGoodsList(tabActive = -1, init = true, loadMore = false) {
        let active = this.data.active
        if (tabActive !== -1) {
            active = tabActive
        }
        let loadStateKey = 'loadState[' + active + ']'
        let page = this.data.page
        if (!loadMore) {
            page = 1
            wx.showLoading({
                title: !init ? '刷新中...' : '加载中...',
            })
        } else {
            if (this.data.goodsList.length >= this.data.total) {
                return
            }
            this.setData({
                bottomLoadingShow: true,
            })
        }
        let searchRequest = this.data.searchRequest
        console.log(searchRequest)
        let name = this.data.name
        agentShelvesModel
            .getAgentShopGoodsList({
                status: active == 1 ? 1 : 2,
                page: page,
                name: name,
                ...searchRequest,
            })
            .then((res) => {
                if (!loadMore) {
                    wx.hideLoading()
                    page++
                    let isAllLoaded = false
                    if (res.lists.length <= res.total) {
                        //已获取全部列表数据
                        isAllLoaded = true
                    }
                    this.setData(
                        {
                            goodsList: res.lists,
                            [loadStateKey]: true,
                            page: page,
                            total: res.total,
                            isAllLoaded: isAllLoaded,
                            active: active,
                        },
                        () => {
                            if (!init) {
                                wx.stopPullDownRefresh()
                            }
                        }
                    )
                } else {
                    let diffData = {}
                    if (res.lists) {
                        let offset = this.data.goodsList.length
                        res.lists.forEach((value, index) => {
                            let key = 'goodsList[' + (offset + index) + ']'
                            diffData[key] = value
                        })
                    }
                    page++
                    let isAllLoaded = false
                    if (this.data.goodsList.length + res.lists.length >= res.total) {
                        //已加载全部数据
                        isAllLoaded = true
                    }
                    this.setData({
                        ...diffData,
                        [loadStateKey]: true,
                        page: page,
                        isAllLoaded: isAllLoaded,
                        bottomLoadingShow: false,
                        active: active,
                    })
                }
            })
            .catch((err) => {
                if (!loadMore) {
                    wx.hideLoading()
                    this.setData(
                        {
                            [loadStateKey]: true,
                            active: active,
                        },
                        () => {
                            if (!init && !loadMore) {
                                wx.stopPullDownRefresh()
                            }
                        }
                    )
                }
            })
    },
    getCategoryData() {
        searchListModel.queryV2GoodsCateList({}).then((res) => {
            if (res) {
                this.setData({
                    goodsCate: res,
                })
            }
        })
    },
    showShelvesPopup(goods) {
        let goodsId = goods.goods_id
        if (goodsId) {
            wx.showLoading({
                title: '加载中...',
            })
            agentShelvesModel
                .getAgentGoodsSkuList(goodsId)
                .then((res) => {
                    console.log(res)
                    wx.hideLoading()
                    this.setData({
                        shelves: true,
                        goodsSkus: res.goods_sku_data,
                        editGoods: goods,
                    })
                })
                .catch((err) => {
                    console.log(err)
                    wx.hideLoading()
                })
        }
    },
    filterTransfer(e) {
        this.setData({
            currentFilterAttr: e.detail.attr_list,
            currentFilterLabel: e.detail.label_list,
        })
    },
})
