// packageAgent/makeUp/freightFree.js
import screenConfig from '../../utils/screen_util'
const couponModel = require('../../models/coupon')
const goodsModel = require('../../models/goods')
const orderModel = require('../../models/order')
const cartModel = require('../../models/cart')
const phoneNumWatch = require('../../utils/phoneNumWatch')

const navigateBarHeight = screenConfig.getSafeAreaTopPadding() + 46
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)

const app = getApp()

App.Page({
    data: {
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        navigateBarHeight: navigateBarHeight,
        safeAreaInsetBottom: safeAreaInsetBottom,
        filterBoxHeight: screenConfig.getPX(140),
        activate: 0,
        orderSales: 0,
        orderPrice: 2,

        totalAmount: 0, // 新加商品总金额
        addGoodsTotal: 0, // 新加商品条数

        goodsList: [],
        checkGoodsList: [],

        loaded: false,
        page: 1,
        total: 0,
        isAllLoaded: false,
        bottomLoadingShow: false,

        navTitle: '凑单免运费',
        freightId: 0, // 邮费模板id
        freeType: 1, // 包邮条件 1 凑件 2 凑单
        source: 1, // 来源 1: 购物车 2: 结算页
        needNum: 0, // 包邮要求的最低金额 门槛
    },
    onLoad: function (options) {
        let source = Number(options.source) || 1 // 来源 1 购物车 2 结算页
        let freeType = Number(options.freeType) || 1 // 包邮条件 1 凑件 2凑单
        let needNum = Number(options.needNum) // 满足凑单要求的最低金额/件数
        let freightId = Number(options.freightTemplateId) || 0 // 运费模版id
        this.setData(
            {
                source: source,
                navTitle: freeType === 1 ? '凑件免运费' : '凑单免运费',
                needNum: needNum,
                freightId: freightId,
                freeType: freeType,
            },
            () => {
                this.getGoodsList()
            }
        )
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.getGoodsList(false, false)
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        if (this.data.goodsList.length >= this.data.total) {
            return
        }
        this.getGoodsList(false, true)
    },
    clickBack() {
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
    gotoOrderCheck() {
        wx.navigateBack({
            delta: 1,
        })
    },

    addGoods(e) {
        let itemIndex = e.currentTarget.dataset.index
        let goods = this.data.goodsList[itemIndex]
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

    async confirmSpec({ detail }) {
        console.log('输出 ~ detail', detail)
        // this.post({
        //     eventName: 'addGoodsFromMakeUp',
        //     eventParams: detail,
        //     isSticky: true,
        // })
        // 添加到orderModel
        let isExist = false
        for (let i = 0; i < orderModel.orderCheckList.length; i++) {
            const element = orderModel.orderCheckList[i]
            if (element.shopSkuId == detail.shopSkuId) {
                console.log('shopSkuId', element.shopSkuId)
                console.log('detail', detail.shopSkuId)
                let totalNum = element.quantity + detail.quantity
                if (totalNum > detail.stock) {
                    wx.showToast({
                        title: '购买数量已超出商品可用库存~',
                        icon: 'none',
                        duration: 2000,
                    })
                    return
                }
                if (element['tobeAdded']) {
                    element['tobeAdded'] += detail.quantity
                } else {
                    element['tobeAdded'] = detail.quantity
                }

                element.quantity += detail.quantity
                isExist = true
                break
            }
        }
        console.log('isExist', isExist)
        if (!isExist) {
            detail['tobeAdded'] = detail.quantity
            orderModel.orderCheckList.push(detail)
        }
        console.log('输出 ~ orderModel.orderCheckList', orderModel.orderCheckList)
        let needAddCart = false
        if (this.data.source === 1) {
            // 来自购物车
            console.log('来自购物车')
            console.log('detail.tobeAdded', detail.tobeAdded)
            if (detail.tobeAdded) {
                await this.addCart(detail)
                needAddCart = true
            }
            if (needAddCart) {
                wx.showToast({
                    title: '加购成功',
                    icon: 'none',
                    duration: 2000,
                })
            }
        } else {
            // 来自结算页

            wx.showToast({
                title: '添加成功',
                icon: 'none',
                duration: 2000,
            })
        }

        //更新总计金额
        let totalPrice = 0
        // this.data.checkGoodsList.forEach((goods) => {
        //     totalPrice += goods.price * goods.quantity
        // })
        let checkGoodsListKey = 'checkGoodsList[' + this.data.checkGoodsList.length + ']'
        let totalAmount = this.data.totalAmount + totalPrice + detail.price * detail.quantity
        let addGoodsTotal = this.data.addGoodsTotal + detail.quantity
        console.log('addGoodsTotal', addGoodsTotal)
        this.setData({
            [checkGoodsListKey]: detail,
            totalAmount: totalAmount,
            addGoodsTotal: addGoodsTotal,
        })
    },

    onTabChange(e) {
        let activate = e.currentTarget.dataset.activate
        if (activate == this.data.activate) {
            //排序切换
            if (activate == 0) {
                let orderPrice = 2
                if (this.data.orderPrice == 2) {
                    orderPrice = 1
                } else if (this.data.orderPrice == 1) {
                    orderPrice = 2
                }
                this.setData(
                    {
                        orderPrice: orderPrice,
                    },
                    () => {
                        this.getGoodsList(false, false)
                    }
                )
            } else {
                let orderSales = 1
                if (this.data.orderSales == 2) {
                    orderSales = 1
                } else if (this.data.orderSales == 1) {
                    orderSales = 2
                }
                this.setData(
                    {
                        orderSales: orderSales,
                    },
                    () => {
                        this.getGoodsList(false, false)
                    }
                )
            }
        } else {
            //tab页切换
            this.setData(
                {
                    activate: activate,
                    orderSales: activate == 1 ? 2 : 0,
                    orderPrice: activate == 0 ? 1 : 0,
                },
                () => {
                    this.getGoodsList(false, false)
                }
            )
        }
    },

    getGoodsList: function (init = true, loadMore = false) {
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
        goodsModel
            .queryFreightGoodsList({
                page: page,
                orderSales: this.data.orderSales,
                orderPrice: this.data.orderPrice,
                freightId: Number(this.data.freightId),
            })
            .then((res) => {
                if (!loadMore) {
                    wx.hideLoading()
                    page++
                    let isAllLoaded = false
                    if (res.lists == null) {
                        this.setData({
                            goodsList: [],
                        })
                    }
                    if (res.lists.length <= res.total) {
                        //已获取全部列表数据
                        isAllLoaded = true
                    }
                    this.setData(
                        {
                            goodsList: res.lists,
                            page: page,
                            total: res.total,
                            isAllLoaded: isAllLoaded,
                            loaded: true,
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
                        page: page,
                        isAllLoaded: isAllLoaded,
                        bottomLoadingShow: false,
                        loaded: true,
                    })
                }
            })
            .catch((err) => {
                if (!loadMore) {
                    wx.hideLoading()
                    this.setData(
                        {
                            loaded: true,
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

    addCart(specInfo) {
        console.log('输出 ~ specInfo', specInfo)
        return new Promise((resolve, reject) => {
            if (specInfo.skuId) {
                cartModel.addToCartGoods(specInfo.skuId, specInfo.goodsId, specInfo.tobeAdded, specInfo.price).then((res) => {
                    console.log('输出 ~ res', res)
                    resolve()
                })
            }
        })
    },
})
