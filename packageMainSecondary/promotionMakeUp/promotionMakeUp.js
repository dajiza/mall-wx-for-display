// packageAgent/makeUp/makeUp.js
import screenConfig from '../../utils/screen_util'
const goodsModel = require('../../models/goods')
const cartModel = require('../../models/cart')
const orderModel = require('../../models/order')
const phoneNumWatch = require('../../utils/phoneNumWatch')
const promotionModel = require('../../models/promotion')
const tool = require('../../utils/tool')

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

        // useGoodsType: 0,
        // couponId: 0,
        // couponType: 0,
        // withAmount: 0,
        // couponAmount: 0,
        // discountTop: 0,
        // minAmount: 0, //凑单要求的最低金额 门槛/优惠金额 取最大值

        // totalAmount: 0,
        // discountAmount: 0,

        // goodsList: [],
        checkGoodsList: [],
        ruleName: '', //规则显示
        // 统计
        isBarter: '',
        promotion: '',
        promotionId: '',
        promotionType: '',
        goodsNum: '',
        goodsAmount: '',
        // 商品列表
        page: 1,
        limit: 20,
        total: 0,
        loading: false,
        pageTotal: 0,
        list: [],
        barterList: [], //加价购列表
        barterCheckedList: [], //加价购初始已加列表
        barterTotal: 0,
        checkedBarterNum: 0, //选中的换购数量
        fromOrderCheck: false, //是否从订单确认页来
        // 换购提示文字
        rest: '',
        subtotal: '',
        capped: '',
        top: '',
        // 换购
        isShowBarter: false,
        from_barter: false, //是否来自购物车去换购/重新换购
    },
    onLoad: function (options) {
        let from_barter = options.from_barter || false
        if (from_barter == 1) {
            this.openBarter()
        }
        let makeUpData = promotionModel.makeUpData

        let promotionId = makeUpData.promotion.id || 0
        let promotionType = makeUpData.promotion.type || 0
        let barterCheckedList = promotionModel.barterCheckedList.get(promotionId) || []
        let fromOrderCheck = makeUpData.fromOrderCheck || false
        let goodsNum = makeUpData.checkList.reduce((prev, cur) => {
            return prev + cur.quantity
        }, 0)
        let goodsAmount = makeUpData.checkList.reduce((prev, cur) => {
            return prev + tool.numberMul(cur.price, cur.quantity)
        }, 0)
        let ruleName = tool.formatPromotion(makeUpData.promotion)
        //优惠金额
        this.setData(
            {
                from_barter,
                promotionId,
                promotionType,
                goodsNum,
                goodsAmount,
                barterCheckedList,
                promotion: makeUpData.promotion,
                ruleName: ruleName,
            },
            () => {
                this.queryGoods()
                let calcData = tool.promotionCalc(this.data.promotion, goodsAmount, goodsNum)
                this.setData({
                    ...calcData,
                })
                this.queryBarterList()
            }
        )
    },
    // 获取商品列表
    queryGoods: function () {
        wx.showLoading({
            title: '加载中...',
        })
        let page = this.data.page
        let limit = this.data.limit
        let list = this.data.list
        let orderSales = this.data.orderSales
        let orderPrice = this.data.orderPrice
        let promotionId = this.data.promotionId
        let params = {
            page: page,
            limit: limit,
            order_sales: orderSales,
            order_price: orderPrice,
            promotion_id: promotionId,
        }
        promotionModel
            .queryPromotionMakeUp(params)
            .then((res) => {
                let newArr = res.lists || []
                list.push(...newArr)
                this.setData({
                    list,
                    page: page + 1,
                    total: res.total,
                    pageTotal: res.pages,
                    loading: false,
                })
                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },
    // 获取加价购列表
    queryBarterList() {
        let promotionId = this.data.promotionId
        let barterCheckedList = this.data.barterCheckedList
        promotionModel
            .queryPromotionBarter(promotionId)
            .then((res) => {
                let barterList = res.list.map((item) => {
                    let attr = ''
                    attr += item.attrBrand ? item.attrBrand + ';' : ''
                    attr += item.attrColor ? item.attrColor + ';' : ''
                    attr += item.attrMaterial ? item.attrMaterial + ';' : ''
                    attr += item.attrOrigin ? item.attrOrigin + ';' : ''
                    attr += item.attrPattern ? item.attrPattern + ';' : ''
                    attr += item.attrSize ? item.attrSize + ';' : ''
                    item.attr = attr
                    let checkedItem = barterCheckedList.find((e) => e.skuId == item.skuId)
                    item.checked = checkedItem ? true : false
                    item.shoppingCarId = item.checked ? checkedItem.shopping_car_id : 0
                    return item
                })
                this.setData({
                    barterList: barterList,
                    barterTotal: res.total,
                })
            })

            .catch((err) => {})
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
        this.queryGoods()
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
            this.queryGoods()
        }
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
    async gotoCart() {
        let checkGoodsList = promotionModel.makeUpData.checkList
        let barterList = this.data.barterList
        let promotionId = this.data.promotionId

        wx.showLoading()
        // 主商品加购物车
        for (let i = 0; i < checkGoodsList.length; i++) {
            const item = checkGoodsList[i]
            if (item.tobeAdded) {
                await cartModel.addToCartGoods(item.skuId, item.goodsId, item.tobeAdded, item.price, promotionId)
            }
        }
        // // 加购商品加购物车
        // let newCheckedList = barterList.filter((item) => item.shoppingCarId == 0 && item.checked)
        // let oldCheckedList = barterList.filter((item) => item.shoppingCarId != 0)
        // // 新添加加购商品加购物车
        // for (let i = 0; i < newCheckedList.length; i++) {
        //     const item = newCheckedList[i]
        //     await cartModel.addToCartGoods(item.skuId, item.goodsId, 1, item.price, promotionId, 1)
        // }
        // // 原有加购商品判断并删除
        // let deleteIds = oldCheckedList
        //     .filter((item) => !item.checked)
        //     .map((item) => item.shoppingCarId)
        //     .join(',')
        // if (deleteIds) {
        //     await cartModel.deleteCartGoods(deleteIds)
        // }

        // 存储加价购列表
        let barterCheckedList = barterList
            .filter((item) => item.checked)
            .map((item) => {
                item.promotion_id = promotionId
                return item
            })
        console.log('输出 ~ barterCheckedList', barterCheckedList)
        promotionModel.barterCheckedList.set(promotionId, barterCheckedList)

        wx.hideLoading()
        wx.switchTab({
            url: '/pages/cart/cart',
        })
    },
    gotoOrderCheck() {
        let checkGoodsList = promotionModel.makeUpData.checkList
        let barterList = this.data.barterList.filter((item) => item.checked)
        let promotionId = this.data.promotionId

        // checkGoodsList = checkGoodsList.map((item) => {
        //     item.promotion_id = this.data.promotionId
        //     return item
        // })
        // barterList = barterList.map((good) => ({
        //     goodsId: good.goodsId,
        //     img: good.skuImg,
        //     name: good.title,
        //     price: good.price,
        //     quantity: 1,
        //     skuId: good.skuId,
        //     attr: good.attr,
        //     promotion_id: this.data.promotionId,
        // }))

        let promotion = [this.data.promotion]

        orderModel.orderCheckList = checkGoodsList
        // orderModel.orderCheckBarterList = barterList || []
        orderModel.orderCheckPromotion = promotion

        // 存储加价购列表
        let barterCheckedList = barterList
            .filter((item) => item.checked)
            .map((item) => {
                item.promotionId = promotionId
                return item
            })
        promotionModel.barterCheckedList.set(promotionId, barterCheckedList)

        let pageId = this.getPageId()
        let page = getCurrentPages().find((page) => page && page.getPageId() == pageId)
        phoneNumWatch.observer(page, () => {
            wx.redirectTo({
                url: '/pages/orderCheck/orderCheck',
            })
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
                        list: [],
                        page: 1,
                        loading: true,
                        orderPrice: orderPrice,
                    },
                    () => {
                        this.queryGoods()
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
                        list: [],
                        page: 1,
                        loading: true,
                        orderSales: orderSales,
                    },
                    () => {
                        this.queryGoods()
                    }
                )
            }
        } else {
            //tab页切换
            this.setData(
                {
                    list: [],
                    page: 1,
                    loading: true,
                    activate: activate,
                    orderSales: activate == 1 ? 2 : 0,
                    orderPrice: activate == 0 ? 1 : 0,
                },
                () => {
                    this.queryGoods()
                }
            )
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
    confirmSpec({ detail }) {
        let checkList = promotionModel.makeUpData.checkList
        let promotion = this.data.promotion
        let barterList = this.data.barterList
        let isExist = false
        for (let i = 0; i < checkList.length; i++) {
            const element = checkList[i]
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
            checkList.push(detail)
        }

        wx.showToast({
            title: '加购成功',
            icon: 'none',
            duration: 2000,
        })

        let totalAmount = this.data.goodsAmount + detail.price * detail.quantity
        let totalNum = this.data.goodsNum + detail.quantity
        let calcData = tool.promotionCalc(promotion, totalAmount, totalNum, barterList)

        this.setData({
            ...calcData,
            goodsAmount: totalAmount,
            goodsNum: totalNum,
        })
    },

    openBarter() {
        this.setData({
            isShowBarter: true,
        })
    },
    onCloseBarter() {
        this.setData({
            isShowBarter: false,
        })
    },
    // 确定加购商品
    confirmBarter() {
        let from_barter = this.data.from_barter
        if (from_barter == 1) {
            this.gotoCart()
        } else {
            this.onCloseBarter()
        }
    },
    toggle: function (e) {
        console.log('输出 ~ e', e)
        let id = e.currentTarget.dataset.id
        console.log('输出 ~ id', id)
        let checkbox = this.selectComponent('#checkbox_' + id)
        console.log('输出 ~ checkbox', checkbox)
        checkbox.toggle()
    },
    catchTapDummy: function (e) {},

    checkedItem: function (e) {
        let goodsAmount = this.data.goodsAmount
        let goodsNum = this.data.goodsNum
        let barterList = this.data.barterList
        let promotion = this.data.promotion
        let itemIndex = e.currentTarget.dataset.itemIndex
        barterList[itemIndex].checked = !barterList[itemIndex].checked
        this.setData({
            barterList,
        })
        let calcData = tool.promotionCalc(promotion, goodsAmount, goodsNum, barterList)
        this.setData({
            ...calcData,
        })
        // console.log(e)
        // let submitData = {}
        // let itemIndex = e.currentTarget.dataset.itemIndex
        // let val = e.detail
        // let key = 'list' + '[' + itemIndex + '].checked'
        // submitData[key] = val
        // this.setData(
        //     {
        //         ...submitData,
        //     },
        //     () => {
        //         let checkedGoodsCount = 0
        //         this.data.list.forEach((value, index) => {
        //             if (value.checked) {
        //                 checkedGoodsCount++
        //             }
        //         })
        //         this.setData({
        //             checkedGoodsCount: checkedGoodsCount,
        //         })
        //     }
        // )
    },
})
