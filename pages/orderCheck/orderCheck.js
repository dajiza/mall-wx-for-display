// pages/orderCheck/orderCheck.js
const orderModel = require('../../models/order')
const addressModel = require('../../models/address')
const couponModel = require('../../models/coupon')
const cartModel = require('../../models/cart')
const userShopInfoModel = require('../../models/userShopInfo')
const util = require('../../utils/util')
const tool = require('../../utils/tool')
const promotionModel = require('../../models/promotion')
const constant = require('../../config/constant')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        constant,
        showGoodsList: [], //展示用商品+加购列表
        goodsList: [],
        barterList: [],
        promotion: {},
        needPromotion: false,
        needPromotionMakeUp: false,
        totalPrice: 0,
        goodsTotalPrice: 0,
        freight: 0,
        defaultAddress: {},
        csrfToken: '',
        canUse: [],
        notUse: [],
        toAdd: [],
        active: 0,
        couponInfo: null,
        couponGoods: [],
        offMoney: 0,
        remark: '',
        remarkAutoHeight: true,
        ios: false,
        showMakeup: false, //显示运费凑单
        freeType: 0, //凑单类型 //'1按件  2按金额'
        freeNeedNum: 0, //剩余凑单数量/金额
        totalNeedNum: 0, //凑单总共所需数量/金额
        freightId: false,
        memberDiscount: 0, // 会员折扣
        memberDiscountMount: 0, // 会员折扣优惠金额
        shouldAddCart: true, //凑单来的商品 退出页面 是否加入购物车
        // 换购提示文字
        promotionTextArr: [],
        // rest: '',
        // subtotal: '',
        // capped: '',
        // top: '',
        // discountText: '',
        discountAmount: 0,
    },
    events: {
        getSelectedAddress: function (address) {
            this.setData({
                defaultAddress: address,
            })
            this.queryFreight()
        },
        updateDefaultAddress: function (defaultAddress) {
            this.setData({
                defaultAddress: defaultAddress,
            })
            this.queryFreight()
        },
        selectCouponItem: function (coupon) {
            // 优惠券列表页进来的默认选中券
            let pages = getCurrentPages()
            let view = pages[pages.length - 2]
            if (view.route == 'pages/couponsList/couponsList') {
            } else {
                coupon = null
            }

            this.setData({
                couponInfo: coupon,
            })
        },
        // 凑单
        // addGoodsFromMakeUp: function (detail) {
        //     let isExist = false
        //     for (let i = 0; i < orderModel.orderCheckList.length; i++) {
        //         const element = orderModel.orderCheckList[i]
        //         if (element.shopSkuId == detail.shopSkuId) {
        //             element.quantity += detail.quantity
        //             isExist = true
        //             break
        //         }
        //     }
        //     if (!isExist) {
        //         orderModel.orderCheckList.push(detail)
        //     }
        // },
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
        console.log('输出 ~ orderModel.orderCheckList', orderModel.orderCheckList)

        let userInfo = await userShopInfoModel.queryUserShopInfo()
        let memberDiscount = userInfo.user_info.discount_value || 0
        let discount_freight_id = userInfo.user_info.discount_freight_id || 0
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
        // 判断是否需要促销 及促销凑单
        let needPromotion = true
        if (!orderModel.orderCheckPromotion || orderModel.orderCheckPromotion.length == 0) {
            needPromotion = false
        }
        let needPromotionMakeUp = true
        if (!orderModel.orderCheckPromotion || orderModel.orderCheckPromotion.length != 1) {
            needPromotionMakeUp = false
        }
        // 生成加购列表
        let barterList = []
        if (orderModel.orderCheckPromotion) {
            for (let i = 0; i < orderModel.orderCheckPromotion.length; i++) {
                const item = orderModel.orderCheckPromotion[i]
                let list = promotionModel.barterCheckedList.get(item.id) || []
                barterList.push(...list)
            }
            barterList = barterList.map((good) => ({
                goodsId: good.goodsId,
                shopSkuId: good.shopSkuId,
                img: good.skuImg,
                name: good.title,
                price: good.exchangePrice,
                quantity: 1,
                skuId: good.skuId,
                attr: good.attr,
                promotion_id: good.promotion_id,
            }))
            this.setData({
                barterList: barterList,
            })
        }

        // 计算总价 主商品+加购
        let goodsTotalPrice = orderModel.orderCheckList.reduce(function (prev, cur) {
            return prev + cur.price * cur.quantity
        }, 0)
        let barterTotalPrice = barterList.reduce(function (prev, cur) {
            return prev + cur.price * cur.quantity
        }, 0)
        let csrfToken = await orderModel.queryCsrfToken()

        this.setData({
            goodsList: orderModel.orderCheckList,
            goodsTotalPrice: goodsTotalPrice + barterTotalPrice,
            csrfToken: csrfToken.code,
            memberDiscount,
        })

        // 促销信息生成
        if (needPromotion) {
            this.setData({
                promotion: orderModel.orderCheckPromotion,
                needPromotion,
            })
            let calcDataArr = []
            for (let i = 0; i < this.data.promotion.length; i++) {
                const item = this.data.promotion[i]
                let goodsNum = this.data.goodsList
                    .filter((e) => e.promotion_id == item.id)
                    .reduce((prev, cur) => {
                        return prev + cur.quantity
                    }, 0)
                let goodsAmount = this.data.goodsList
                    .filter((e) => e.promotion_id == item.id)
                    .reduce((prev, cur) => {
                        return prev + tool.numberMul(cur.price, cur.quantity)
                    }, 0)
                let calcData = tool.promotionCalc(item, goodsAmount, goodsNum)
                calcDataArr.push(calcData)
            }
            let discountAmount = calcDataArr.reduce((prev, cur) => {
                return prev + cur.discountAmount
            }, 0)

            this.setData({
                promotionTextArr: calcDataArr,
                discountAmount: Math.floor(discountAmount),
            })
            if (this.data.promotion.length == 1) {
            } else {
            }
        }
        // 计算运费
        let freight = await this.queryFreight(csrfToken.code)

        // 包邮查询
        if (freightIds.length > 1) {
            this.setData({
                showMakeup: false,
                freightId: false,
            })
        } else {
            let freight_id = freightIds[0]
            if (memberDiscount && discount_freight_id) {
                freight_id = discount_freight_id
            }
            this.setData({
                freightId: freight_id,
            })
            this.queryFreightInfo()
        }
        // 生成商品显示列表

        let showGoodsMap = new Map()
        for (let i = 0; i < orderModel.orderCheckList.length; i++) {
            const item = orderModel.orderCheckList[i]
            if (item.promotion_id && item.promotion_id != 0) {
                // 有促销商品
                let list = showGoodsMap.get(item.promotion_id) || []
                list.push(item)
                showGoodsMap.set(item.promotion_id, list)
            } else {
                // 无促销产品
                let list = showGoodsMap.get(0) || []
                list.push(item)
                showGoodsMap.set(0, list)
            }
        }
        console.log('输出 ~ showGoodsMap', showGoodsMap)

        let showGoodsList = []
        for (let key of showGoodsMap.keys()) {
            let mainGoods = showGoodsMap.get(key)
            let barterGoods = promotionModel.barterCheckedList.get(key) || []
            barterGoods = barterGoods.map((good) => ({
                goodsId: good.goodsId,
                shopSkuId: good.shopSkuId,
                img: good.skuImg,
                name: good.title,
                price: good.exchangePrice,
                quantity: 1,
                skuId: good.skuId,
                attr: good.attr,
                promotion_id: good.promotion_id,
            }))
            showGoodsList.push({
                goodsList: tool.deepClone(mainGoods),
                barterList: tool.deepClone(barterGoods),
            })
        }
        console.log('输出 ~ showGoodsList', showGoodsList)
        this.setData({ showGoodsList })

        // 埋点上报
        let pages = getCurrentPages()
        let view = pages[pages.length - 2] || ''
        util.tracking('ordercheck_enter_api', { source: view.route, total_price: this.data.totalPrice, goods_ids: orderModel.orderCheckList.map((item) => item.goodsId).join(',') })

        // 获取优惠券列表
        this.queryCouponList()
        this.calculatePrice()
        wx.hideLoading()
    },
    // 计算总价
    async calculatePrice() {
        let couponInfo = this.data.couponInfo
        let goodsTotalPrice = this.data.goodsTotalPrice
        let freight = this.data.freight
        let memberDiscount = this.data.memberDiscount
        let totalPrice = goodsTotalPrice
        let discountAmount = Math.floor(this.data.discountAmount)

        // let offMoney = await this.queryOrderInfo()
        // 会员折扣不计算优惠券和促销
        if (!memberDiscount) {
            if (couponInfo && couponInfo.type == 1) {
                totalPrice = totalPrice - couponInfo.coupon_amount
            } else if (couponInfo && couponInfo.type == 2) {
                if (couponInfo.discount_top == 0) {
                    totalPrice = tool.numberMul(totalPrice - discountAmount, couponInfo.coupon_amount / 100)
                } else {
                    // 存在封顶情况下
                    let discountTopPrice = totalPrice - couponInfo.discount_top - discountAmount
                    totalPrice = tool.numberMul(totalPrice - discountAmount, couponInfo.coupon_amount / 100)
                    totalPrice = totalPrice > discountTopPrice ? totalPrice : discountTopPrice
                }
            } else {
                totalPrice = totalPrice - discountAmount
            }
        }
        let memberDiscountMount = this.data.memberDiscountMount // 会员折扣优惠金额
        totalPrice = totalPrice + freight - memberDiscountMount

        this.setData({
            totalPrice,
        })
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    addCart(specInfo) {
        return new Promise((resolve, reject) => {
            if (specInfo.skuId) {
                cartModel.addToCartGoods(specInfo.skuId, specInfo.goodsId, specInfo.tobeAdded, specInfo.price).then((res) => {
                    resolve()
                })
            }
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

    closeCoupon(event) {
        this.selectComponent('#coupon').close()
    },
    openCoupon(event) {
        this.selectComponent('#coupon').show()
    },
    selectCoupon(event) {
        this.setData({
            couponInfo: event.detail,
        })

        this.calculatePrice()
    },
    // 获取总价和优惠的商品
    queryOrderInfo() {
        return new Promise((resolve, reject) => {
            let couponInfo = this.data.couponInfo
            let goodsList = this.data.goodsList
            let goodsData = goodsList.map((item) => {
                return {
                    shop_goods_sku_id: item.shopSkuId,
                    num: item.quantity,
                }
            })
            if (couponInfo) {
                orderModel.queryOrderCouponInfo(couponInfo.coupon_user_id, goodsData).then((res) => {
                    this.setData({
                        couponGoods: res.order_coupon_list,
                    })
                    resolve(res.off_money)
                })
            } else {
                resolve(0)
            }
        })
    },
    /**
     * 获取运费
     */
    queryFreight: function (csrfToken) {
        return new Promise((resolve, reject) => {
            let goodsList = this.data.goodsList
            let goodsTotalPrice = this.data.goodsTotalPrice
            let defaultAddress = this.data.defaultAddress

            // 判断地址
            if (!defaultAddress.name) {
                this.calculatePrice()
                resolve(false)
                return
            }

            // format商品列表
            let goodsData = goodsList.map((item) => {
                if (item.carId) {
                    return {
                        car_id: item.carId,
                        shop_goods_sku_id: item.shopSkuId,
                        num: item.quantity,
                    }
                } else {
                    return {
                        shop_goods_sku_id: item.shopSkuId,
                        num: item.quantity,
                    }
                }
            })

            // orderModel.queryOrderFreight(goodsData, defaultAddress.id, goodsTotalPrice).then((res) => {
            //     this.setData({
            //         freight: res,
            //     })
            //     this.calculatePrice()
            //     resolve(res)
            // })
            orderModel.queryOrderDiscount(goodsData, defaultAddress.id, csrfToken).then((res) => {
                let goods_list = this.data.goodsList
                let allDiscountMount = 0
                goods_list.forEach((goods) => {
                    goods['off_2'] = 0
                    res.detail_data.forEach((detail) => {
                        if (goods.skuId == detail.sku_id) {
                            goods['off_2'] = detail.off_2
                            goods['user_discount'] = detail.sku_discount
                        }
                    })
                    allDiscountMount = allDiscountMount + goods['off_2']
                })
                this.setData({
                    memberDiscountMount: allDiscountMount,
                    freight: res.freight_val,
                    goodsList: goods_list,
                })
                this.calculatePrice()
                resolve(res)
            })
        })
    },
    /**
     * 获取包邮策略
     */
    queryFreightInfo: function () {
        let goodsList = this.data.goodsList
        let freightId = this.data.freightId
        let freight = this.data.freight
        let defaultAddress = this.data.defaultAddress
        // 判断地址
        if (!defaultAddress.name) {
            return
        }

        orderModel.queryOrderFreightInfo(freightId, defaultAddress.id).then((res) => {
            if (res.freight_strategy_id != 0) {
                let amount = goodsList.reduce((totalPrice, item) => totalPrice + item.quantity * item.price, 0)
                let pieces = goodsList.reduce((totalPieces, item) => totalPieces + item.quantity, 0)

                this.setData({
                    showMakeup: freight == 0 ? false : true,
                    freeType: res.free_type,
                    freeNeedNum: res.free_type == 2 ? res.free_need_num - amount : res.free_need_num - pieces,
                    totalNeedNum: res.free_need_num,
                })
            } else {
                this.setData({
                    showMakeup: false,
                })
            }
            // this.setData({
            //     freight: res,
            // })
        })
    },
    // 去促销凑单
    gotoPromotionMakeUp(e) {
        let promotion = this.data.promotion[0]
        let goodsList = tool.deepClone(this.data.goodsList)
        // let barterList = tool.deepClone(this.data.barterList)
        let barterList = this.data.barterList.map((item) => {
            return {
                sku_id: item.skuId,
                shopping_car_id: item.shoppingCarId || 0,
            }
        })
        let makeUpData = {
            promotion: promotion, //促销详情
            checkList: goodsList, //已有商品列表
            barterCheckedList: barterList, //加价购 已加列表
        }
        // 传输数据
        promotionModel.makeUpData = makeUpData
        wx.redirectTo({
            url: `/packageMainSecondary/promotionMakeUp/promotionMakeUp`,
        })
    },
    // 去邮费凑单
    handleGoAddOn(e) {
        // source 1 购物车 2 结算页
        // freeType 1 凑件  2 凑单
        let freightId = this.data.freightId // 运费模板id
        let freeNeedNum = this.data.freeNeedNum // 凑单凑件剩余金额或数量
        let freeType = this.data.freeType
        wx.navigateTo({
            url: '/pages/freightFree/freightFree?source=2&freeType=' + freeType + '&freightTemplateId=' + freightId + '&needNum=' + freeNeedNum,
            success: function (e) {},
        })
    },

    /**
     * 获取可用优惠券列表
     */
    queryCouponList: function () {
        let goodsList = this.data.goodsList
        console.log('输出 ~ goodsList 获取可用优惠券列表', goodsList)
        let couponInfo = this.data.couponInfo
        let needPromotion = this.data.needPromotion
        let promotion = this.data.promotion

        // format商品列表
        let goodsData = goodsList.map((item) => {
            return {
                shop_goods_sku_id: item.shopSkuId,
                num: item.quantity,
                promotion_id: needPromotion ? item.promotion_id : 0,
            }
        })
        couponModel.queryOrderCoupun(goodsData).then((res) => {
            let active
            if (res.can_use_list.length > 0) {
                active = 0
            } else {
                active = 1
            }
            // 判断默认选中的券是否可用
            if (couponInfo) {
                var isCanUse = res.can_use_list.some((item) => item.coupon_user_id == couponInfo.coupon_user_id)
            }
            if (!isCanUse) {
                couponInfo = null
            }
            this.setData({
                couponInfo,
                active,
                canUse: res.can_use_list,
                notUse: res.not_use_list,
                toAdd: res.to_add_list,
            })
        })
    },
    /**
     * 创建订单
     */
    creatOrder: function () {
        let goodsList = this.data.goodsList
        let totalPrice = this.data.goodsTotalPrice + this.data.freight
        let defaultAddress = this.data.defaultAddress
        let csrfToken = this.data.csrfToken
        let barterList = this.data.barterList
        let couponId = this.data.couponInfo ? this.data.couponInfo.coupon_user_id : ''
        // 判断地址
        if (!defaultAddress.name) {
            wx.showToast({
                title: '请选择地址',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        // format加购列表

        let barterData = barterList.map((item) => {
            return {
                shop_goods_sku_id: item.shopSkuId,
                num: 1,
                promotion_id: item.promotion_id || 0,
                type: 1,
            }
        })
        // format商品列表

        let goodsData = goodsList.map((item) => {
            if (item.carId) {
                return {
                    car_id: item.carId,
                    shop_goods_sku_id: item.shopSkuId,
                    num: item.quantity,
                    promotion_id: item.promotion_id || 0,
                    commission_type: item.commission_type || 0,
                    commission_user_id: item.commission_user_id || 0,
                }
            } else {
                return {
                    shop_goods_sku_id: item.shopSkuId,
                    num: item.quantity,
                    promotion_id: item.promotion_id || 0,
                    commission_type: item.commission_type || 0,
                    commission_user_id: item.commission_user_id || 0,
                }
            }
        })
        goodsData.push(...barterData)
        let message = this.data.remark
        if (message.length >= 60) {
            wx.showToast({
                title: '输入的内容不能超过60个字哦~',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        this.setData({
            shouldAddCart: false,
        })
        orderModel.creatOrder(goodsData, defaultAddress.id, totalPrice, csrfToken, couponId, message).then((res) => {})
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
    onUnload: async function () {
        // 返回时添加购物车
        let goodsList = this.data.goodsList
        let shouldAddCart = this.data.shouldAddCart
        if (!shouldAddCart) {
            return
        }
        let needAddCart = false
        for (let i = 0; i < goodsList.length; i++) {
            const goods = goodsList[i]
            if (goods.tobeAdded) {
                await this.addCart(goods)
                needAddCart = true
            }
        }
        if (needAddCart) {
            this.post({
                eventName: 'refreshCartList',
            })
            wx.showToast({
                title: '已添加到购物车',
                icon: 'none',
                duration: 2000,
            })
        }
    },
    remarkBindinput(e) {
        let remark = e.detail.value || ''
        if (remark.length >= 60) {
            wx.showToast({
                title: '输入的内容不能超过60个字哦~',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        this.data.remark = e.detail.value
    },
    remarkBindblur(e) {
        if (this.data.remark.length > 40) {
            this.setData({
                remark: this.data.remark,
                remarkAutoHeight: false,
            })
        }
    },
    remarkBindfocus(e) {
        this.setData({
            remarkAutoHeight: true,
        })
    },
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
