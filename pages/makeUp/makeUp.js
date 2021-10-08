// packageAgent/makeUp/makeUp.js
import screenConfig from '../../utils/screen_util'
const couponModel = require('../../models/coupon')
const goodsModel = require('../../models/goods')
const orderModel = require('../../models/order')
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

        useGoodsType: 0,
        couponId: 0,
        couponType: 0,
        withAmount: 0,
        couponAmount: 0,
        discountTop: 0,
        minAmount: 0, //凑单要求的最低金额 门槛/优惠金额 取最大值

        totalAmount: 0,
        discountAmount: 0,

        goodsList: [],
        checkGoodsList: [],

        loaded: false,
        page: 1,
        total: 0,
        isAllLoaded: false,
        bottomLoadingShow: false,
    },
    onLoad: function (options) {
        let useGoodsType = Number(options.use_goods_type) || 0
        let couponId = Number(options.coupon_id) || 0
        let couponType = Number(options.type) || 0
        let withAmount = Number(options.with_amount) || 0
        let couponAmount = Number(options.coupon_amount) || 0
        let discountTop = Number(options.discount_top) || 0
        let totalAmount = Number(options.total_amount) || 0

        let minAmount
        if (couponType == 1) {
            minAmount = withAmount > couponAmount ? withAmount : couponAmount
        } else {
            minAmount = withAmount
        }

        if (!(couponType == 1 || couponType == 2) || couponId == 0 || useGoodsType == 0) {
            wx.showToast({
                title: '折扣券类型错误',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        //优惠金额
        let discountAmount = this.calcDiscountAmount(totalAmount, minAmount, couponAmount, couponType, discountTop)
        this.setData(
            {
                minAmount,
                totalAmount: totalAmount,
                withAmount: withAmount,
                discountAmount: discountAmount,
                useGoodsType: useGoodsType,
                couponId: couponId,
                couponType: couponType,
                couponAmount: couponAmount,
                discountTop: discountTop,
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
    gotoOrderCheck() {
        if (this.data.searchModel) {
            this.onSearchCancel()
            return
        }
        let totalAmount = this.data.totalAmount
        // let pages = getCurrentPages()
        // if (pages.length === 1) {
        //     wx.switchTab({
        //         url: '../index/index',
        //     })
        // } else {
        // }
        let pages = getCurrentPages()
        let view = pages[pages.length - 2]
        if (view.route == 'pages/couponsList/couponsList' || view.route == 'packageMainSecondary/couponReceive/couponReceive') {
            if (totalAmount == 0) {
                wx.showToast({
                    title: '未选择商品',
                    icon: 'none',
                    duration: 2000,
                })
                return
            }
            let pageId = this.getPageId()
            let page = getCurrentPages().find((page) => page && page.getPageId() == pageId)
            phoneNumWatch.observer(page, () => {
                wx.redirectTo({
                    url: '/pages/orderCheck/orderCheck',
                })
            })
            // wx.redirectTo({
            //     url: '/pages/orderCheck/orderCheck',
            // })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
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
    confirmSpec({ detail }) {
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
        if (!isExist) {
            detail['tobeAdded'] = detail.quantity
            orderModel.orderCheckList.push(detail)
        }
        console.log('输出 ~ orderModel.orderCheckList', orderModel.orderCheckList)

        wx.showToast({
            title: '加购成功',
            icon: 'none',
            duration: 2000,
        })
        //更新总计金额
        let totalPrice = 0
        // this.data.checkGoodsList.forEach((goods) => {
        //     totalPrice += goods.price * goods.quantity
        // })
        let checkGoodsListKey = 'checkGoodsList[' + this.data.checkGoodsList.length + ']'
        let totalAmount = this.data.totalAmount + totalPrice + detail.price * detail.quantity
        let discountAmount = this.calcDiscountAmount(totalAmount, this.data.minAmount, this.data.couponAmount, this.data.couponType, this.data.discountTop)
        this.setData({
            [checkGoodsListKey]: detail,
            totalAmount: totalAmount,
            discountAmount: discountAmount,
        })
    },
    calcDiscountAmount(totalAmount, minAmount, couponAmount, couponType, discountTop) {
        //优惠金额
        let discountAmount = this.data.discountAmount

        if (totalAmount >= minAmount) {
            //已经满足门槛
            discountAmount = couponAmount
            if (couponType == 2) {
                //折扣，重新计算优惠金额
                discountAmount = (totalAmount * (100 - couponAmount)) / 100
                if (discountTop != 0 && discountAmount > discountTop) {
                    //封顶
                    discountAmount = discountTop
                }
            }
        }
        return discountAmount
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
        couponModel
            .orderCouponGoodsList({
                page: page,
                orderSales: this.data.orderSales,
                orderPrice: this.data.orderPrice,
                couponId: Number(this.data.couponId),
                useGoodsType: Number(this.data.useGoodsType),
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
})
