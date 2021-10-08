// pages/cart/cart.js
import screenConfig from '../../utils/screen_util'
import loading from '../../utils/loading_util'
// import { max } from 'moment';

const cartModel = require('../../models/cart')
const promotionModel = require('../../models/promotion')
const cartAdapter = require('./cartAdapter')
const orderModel = require('../../models/order')
const goodsModel = require('../../models/goods')
const loginWatch = require('../../utils/loginWatch')
const phoneNumWatch = require('../../utils/phoneNumWatch')
const util = require('../../utils/util')

const validCartGoodsKey = 'cartGoods.validCartGoods'
const invalidCartGoodsKey = 'cartGoods.invalidCartGoods'
const invaildSkuGoodsCountKey = 'cartGoods.invaildSkuGoodsCount'
const checkedGoodsCountKey = 'cartTotal.checkedGoodsCount'
const checkedGoodsAmountKey = 'cartTotal.checkedGoodsAmount'
const freightTemplateKey = 'cartGoods.postageTemplate' // 运费模板
const promotionGoodsKey = 'cartGoods.promotionGoods' // 促销活动
const validCartGoodsCountKey = 'cartGoods.validCartGoodsCount' // 有效商品总数

const navigateBarHeight = screenConfig.getSafeAreaTopPadding() + 46
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const scrollViewHeight = screenConfig.getWindowHeight() - navigateBarHeight
const userShopInfoModel = require('../../models/userShopInfo')
App.Page({
    data: {
        isEditCart: false,
        isFirstLoad: true,
        cartGoods: {
            validCartGoods: [],
            invalidCartGoods: [],
            invaildSkuGoodsCount: 0,
            postageTemplate: [],
            promotionGoods: [],
            validCartGoodsCount: 0,
        },
        cartTotal: {
            checkedGoodsCount: 0, // 选中商品总数量
            checkedGoodsAmount: 0, // 选中商品总金额
            checkedInvalidCartGoodsCount: 0,
            checkedGoodsDiscount: 0,
        },
        showDeleteConfirmDialog: false,
        showEditBar: false,
        navigateBarHeight: navigateBarHeight,
        scrollViewHeight: scrollViewHeight,
        safeAreaInsetBottom: safeAreaInsetBottom,
        refreshState: 0,
        overlayShow: false,
        skuCountTotal: 0, //购物车总件数
        checkedAllInvalidGoods: false,
        memberDiscount: 0, // 会员折扣
    },
    //不用于数据绑定的全局数据
    tempData: {
        scrollHeight: 0,
        tempScrollTop: 0,
        touchDot: 0,
        touchEnd: 0,
        refreshState: 0,
        onHide: null,
    },
    events: {
        refreshCartList: function () {
            this.getCartGoods()
            this.tempData.onHide = false
            console.log('输出 ~ refreshCartList')
        },
    },
    onLoad: function (options) {
        console.log(this.data)
        //hook setData代码，拦截列表更新操作
        let setData = this.setData
        let that = this
        this.setData = function () {
            if (arguments[0].cartGoods) {
                //判断是否是更新列表操作
                let originalCallback = null
                if (arguments.length > 1) {
                    //是否有设置回调
                    let callback = arguments[1]
                    if (typeof callback == 'function') {
                        originalCallback = callback
                    }
                }
                setData.apply(this, [
                    arguments[0],
                    function () {
                        //更新列表后，如果原来需要执行回调，则执行该回调
                        if (originalCallback != null) {
                            originalCallback()
                        }
                        //获取列表的长度
                        var query = wx.createSelectorQuery()
                        query.select('#goods-list').boundingClientRect()
                        query.exec(function (res) {
                            //保存列表长度
                            // console.log(res)
                            if (res.length > 0 && res[0] != null) {
                                that.tempData.scrollHeight = res[0].height
                                // console.log('scrollHeight:' + that.tempData.scrollHeight)
                            }
                        })
                    },
                ])
                return
            }
            setData.apply(this, arguments)
        }
        //请求后台，初始化列表，默认全部为选中，无需同步更新价格
        loginWatch.observer(
            this,
            () => {
                if (this.lifecycler === 'onLoad') {
                    this.getCartGoods()
                }
            },
            '/pages/cart/cart',
            true
        )
    },
    onReady: function () {},
    onShow: function () {
        this.getTabBar().init()
        let onHide = this.tempData.onHide
        if (onHide == null) {
            return
        }
        if (onHide) {
            //从hide恢复过来
            this.getCartGoods()
            this.tempData.onHide = false
        }
    },
    onHide: function () {
        this.tempData.onHide = true
    },
    onUnload: function () {},
    //下拉刷新 begin
    stopRefresh: function () {
        this.tempData.refreshState = 0
        this.setData({
            refreshState: this.tempData.refreshState,
        })
    },
    touchStart: function (e) {
        if (this.tempData.refreshState == 0) {
            //idle状态才监听刷新手势
            this.tempData.touchDot = e.touches[0].pageY
        }
    },
    touchEnd: function (e) {
        if (this.tempData.refreshState == 2) {
            //更新刷新状态
            this.tempData.touchDot = -1
            this.tempData.refreshState = 3
            this.setData({
                refreshState: this.tempData.refreshState,
            })
            //刷新回调
            this.getCartGoods(() => {
                this.stopRefresh()
            }, false)
            return
        } else {
            this.stopRefresh()
        }
    },
    touchMove: function (e) {
        var touchMove = e.touches[0].pageY
        if (this.tempData.refreshState == 3 || this.tempData.touchDot == -1) {
            //刷新中，不监听手势
            return
        }
        if (touchMove - this.tempData.touchDot >= 120) {
            if (this.tempData.tempScrollTop <= 0) {
                if (this.tempData.refreshState != 2) {
                    this.tempData.refreshState = 2
                    this.setData({
                        refreshState: this.tempData.refreshState,
                    })
                }
            }
            return
        }
        if (touchMove - this.tempData.touchDot >= 60) {
            if (this.tempData.tempScrollTop <= 0) {
                if (this.tempData.refreshState != 1) {
                    this.tempData.refreshState = 1
                    this.setData({
                        refreshState: this.tempData.refreshState,
                    })
                }
            }
            return
        }
    },
    //下拉刷新 end
    scrollto: function ({ detail }) {
        let scrollTop = detail.scrollTop
        let scrollHeight = detail.scrollHeight
        if (scrollHeight - scrollTop - 20 < scrollViewHeight) {
            //认为已经滑到低栏，20为一个阀值
            this.tempData.tempScrollTop = scrollTop
            return
        }
        if (this.tempData.tempScrollTop < scrollTop) {
            //手指往上滑
            if (this.data.showEditBar) {
                //已经显示置顶编辑栏
                this.setData({
                    showEditBar: false,
                })
            }
        } else if (this.tempData.tempScrollTop > scrollTop) {
            //手指往下滑
            if (scrollTop > navigateBarHeight && !this.data.showEditBar) {
                this.setData({
                    showEditBar: true,
                })
            } else if (scrollTop == 0) {
                this.setData({
                    showEditBar: false,
                })
            }
        }
        this.tempData.tempScrollTop = scrollTop
    },
    onPullDownRefresh: function () {
        //下拉刷新
        wx.stopPullDownRefresh()
        this.getCartGoods()
    },
    onPageScroll: function (e) {
        //监听滑动事件
        let scrollTop = e.scrollTop
        let scrollHeight = this.tempData.scrollHeight
        if (scrollHeight <= 0) {
            //如果没有成功获取列表的长度，则中断
            return
        }
        this.scrollto({
            detail: {
                scrollTop: scrollTop,
                scrollHeight: scrollHeight,
            },
        })
    },
    //开启/关闭编辑模式
    openEditMode: function () {
        let isEditCart = this.data.isEditCart
        if (isEditCart) {
            //当前已是编辑模式，执行完成操作。重置失效商品的选中状态，有效货物状态保持，根据新的选中的商品更新UI
            let newCartGoodsData = {}
            this.checkAllInvalidCartGoods(newCartGoodsData, false)
            this.data.cartGoods.validCartGoods.forEach((item, index) => {
                if (item.checked && item.sku_status == 1) {
                    //恢复被选中的sku无效商品
                    item.checked = false
                    let validCartGoodsItemKey = validCartGoodsKey + '[' + index + '].checked'
                    newCartGoodsData[validCartGoodsItemKey] = false
                }
            })
            this.data.cartGoods.postageTemplate.forEach((ev, i) => {
                let num = 0
                ev.valid_goods_info.forEach((event, index) => {
                    // event.checked &&
                    if (event.sku_status == 1) {
                        //恢复被选中的sku无效商品
                        event.checked = false
                        let freightTemplateGoodsKey = freightTemplateKey + '[' + i + '].valid_goods_info[' + index + '].checked'
                        newCartGoodsData[freightTemplateGoodsKey] = false
                        num = num + 1
                    }
                })
                if (num > 0) {
                    let freightTemplateItemKey = freightTemplateKey + '[' + i + '].checked'
                    ev.checked = false
                    newCartGoodsData[freightTemplateItemKey] = false
                }
            })
            //同步促销活动商品选中状态
            this.data.cartGoods.promotionGoods.forEach((ev, i) => {
                let num = 0
                ev.valid_goods_info.forEach((event, index) => {
                    if (event.sku_status == 1) {
                        event.checked = false
                        let goodsKey = promotionGoodsKey + '[' + i + '].valid_goods_info[' + index + '].checked'
                        newCartGoodsData[goodsKey] = false
                        num = num + 1
                    }
                })
                if (num > 0) {
                    let itemKey = promotionGoodsKey + '[' + i + '].checked'
                    ev.checked = false
                    newCartGoodsData[itemKey] = false
                }
            })
            //更新UI
            this.updateCart({
                ...newCartGoodsData,
                isEditCart: !isEditCart,
            })
        } else {
            //当前非编辑模式，开启编辑模式
            this.setData({
                isEditCart: !isEditCart,
            })
        }
    },
    //删除选中列表 begin
    deleteConfirm: function (event) {
        let checkedCount = this.data.cartTotal.checkedGoodsCount
        if (checkedCount == 0) {
            return
        }
        let showDeleteConfirmDialog = this.data.showDeleteConfirmDialog
        this.setData({
            showDeleteConfirmDialog: !showDeleteConfirmDialog,
        })
    },
    onDeleteConfirm: function (event) {
        //删除选中的商品列表
        let checkedCount = this.data.cartTotal.checkedGoodsCount
        if (checkedCount == 0) {
            return
        }
        let checkedGoods = this.getCheckedGoods()
        if (checkedGoods.length == 0) {
            return
        }
        //删除的列表上报后台
        //后台返回成功后，更新本地数据，失败则中断业务，不执行后续代码
        //获取最新的列表，全部未选中，无需同步更新价格
        let shoppingCarIds = ''
        checkedGoods.forEach((element) => {
            shoppingCarIds = shoppingCarIds + element.shopping_car_id + ','
            //商品删除时，如果是加价购主商品，同时删除加购商品
            let promotionId = element.promotion_id
            if (promotionModel.barterCheckedList.has(promotionId)) {
                promotionModel.barterCheckedList.delete(promotionId)
            }
        })
        shoppingCarIds = shoppingCarIds.substring(0, shoppingCarIds.length - 1)
        loading.showLoading()
        cartAdapter
            .deleteCartGoods(shoppingCarIds)
            .then((res) => {
                return this.convertReqDataToUI(res)
            })
            .then((cartGoods) => {
                loading.hideLoading()
                this.setData({
                    cartGoods: cartGoods,
                    isEditCart: false,
                    [checkedGoodsCountKey]: 0,
                    [checkedGoodsAmountKey]: 0,
                })
            })
            .catch((err) => {
                console.log(err)
                loading.hideLoading()
            })
    },
    onDeleteConfirmDialogClose: function (event) {
        this.setData({
            showDeleteConfirmDialog: false,
        })
    },
    //删除选中列表 end
    onAllCheckBoxChangeToggle: function (event) {
        let componentId = event.currentTarget.dataset.componentId
        let component = this.selectComponent('#' + componentId)
        component.toggle()
    },
    onAllCheckBoxChange: function (event) {
        let isCheckAll = event.detail
        let newCartGoodsData = {}
        let isEditCart = this.data.isEditCart
        if (isEditCart) {
            //编辑模式
            this.checkAllValidCartGoods(newCartGoodsData, isCheckAll)
            this.checkAllInvalidCartGoods(newCartGoodsData, isCheckAll)
            let validCartGoodsCount = 0
            this.data.cartGoods.postageTemplate.forEach((ev, i) => {
                validCartGoodsCount = validCartGoodsCount + this.checkCartGoodsCount(this.data.cartGoods.postageTemplate[i].valid_goods_info)
            })
            //促销活动商品
            this.data.cartGoods.promotionGoods.forEach((ev, i) => {
                validCartGoodsCount = validCartGoodsCount + this.checkCartGoodsCount(this.data.cartGoods.promotionGoods[i].valid_goods_info)
            })
            let checkedGoodsCount = isCheckAll ? validCartGoodsCount + this.data.cartGoods.validCartGoods.length + this.data.cartGoods.invalidCartGoods.length : 0
            this.setData({
                ...newCartGoodsData,
                [checkedGoodsCountKey]: checkedGoodsCount,
                checkedAllInvalidGoods: isCheckAll,
            })
            return
        }
        this.checkAllValidCartGoods(newCartGoodsData, isCheckAll)
        this.updateCart({
            ...newCartGoodsData,
        })
    },
    catchTapDummy: function (e) {},
    //商品数量修改 bengin
    goodsNumPlus: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let tempIndex = 0
        let goodsType = e.currentTarget.dataset.goodsType // goodsType 1 模板有效商品 2 普通有效商品 3 促销活动商品
        if (Number(goodsType) === 1 || Number(goodsType) === 3) {
            tempIndex = e.currentTarget.dataset.tempIndex
        }
        this.onGoodsNumChange(itemIndex, tempIndex, goodsType)
    },
    goodsNumMinus: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let tempIndex = 0
        let goodsType = e.currentTarget.dataset.goodsType // goodsType 1 模板有效商品 2 普通有效商品 3 促销活动商品
        if (Number(goodsType) === 1 || Number(goodsType) === 3) {
            tempIndex = e.currentTarget.dataset.tempIndex
        }
        this.onGoodsNumChange(itemIndex, tempIndex, goodsType)
    },
    goodsNumOnFocus: function (e) {
        let shoppingCarId = e.currentTarget.dataset.shoppingCarId
        let stepper = this.selectComponent('#stepper_' + shoppingCarId)
        if (stepper.__proto__.primitiveOnBlur == null) {
            //保存原型中onBlur函数
            let primitiveOnBlur = stepper.__proto__.onBlur
            stepper.__proto__.primitiveOnBlur = primitiveOnBlur
        }
        //劫持stepper的原生焦点消失事件，只修改当前对象，并不是修改原型，所以不会对其他地方的stepper造成影响
        stepper.onBlur = function (event) {
            event.detail.primitiveValue = event.detail.value
            //添加参数后继续执行原生焦点事件
            stepper.primitiveOnBlur(event)
        }
    },
    goodsNumInputBlur: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let shoppingCarId = e.currentTarget.dataset.shoppingCarId
        let tempIndex = 0,
            item
        let stepper = this.selectComponent('#stepper_' + shoppingCarId)
        let goodsType = e.currentTarget.dataset.goodsType // goodsType 1 模板有效商品 2 普通有效商品 3促销商品
        if (Number(goodsType) === 1) {
            tempIndex = e.currentTarget.dataset.tempIndex
            item = this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex]
        } else if (Number(goodsType) === 2) {
            item = this.data.cartGoods.validCartGoods[itemIndex]
        } else if (Number(goodsType) === 3) {
            tempIndex = e.currentTarget.dataset.tempIndex
            item = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex]
        } else {
            item = null
        }
        if (item == null) {
            return
        }
        if (e.detail.primitiveValue == '') {
            //场景为stepper输入框内容被清空后失去焦点，恢复原始的值，并强制刷新stepper
            item.changedNum = item.sku_count
            stepper.setData({
                currentValue: stepper.format(item.changedNum),
            })
        } else {
            let changedNum = Number(e.detail.primitiveValue)
            if (changedNum > item.sku_stock) {
                //场景为stepper输入框内容数量大于库存后失去焦点，恢复设置为最大库存数量，并强制刷新stepper
                item.changedNum = item.sku_stock
                stepper.setData({
                    currentValue: stepper.format(item.changedNum),
                })
            }
        }
        this.onGoodsNumChange(itemIndex, tempIndex, goodsType)
    },
    goodsNumChange: function (e) {
        //货物数量变化事件，保存号不处理，在goodsNumPlus，goodsNumMinus，goodsNumInputBlur事件中处理
        console.log(e)
        let shoppingCarId = e.currentTarget.dataset.shoppingCarId
        let itemIndex = e.currentTarget.dataset.itemIndex
        let tempIndex = 0,
            item
        let goodsType = e.currentTarget.dataset.goodsType // goodsType 1 模板有效商品 2 普通有效商品 3 促销活动商品
        let changedNum = e.detail
        if (!Number.isInteger(changedNum)) {
            changedNum = Number.parseInt(changedNum)
        }
        if (Number(goodsType) === 1) {
            tempIndex = e.currentTarget.dataset.tempIndex
            item = this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex]
        } else if (Number(goodsType) === 2) {
            item = this.data.cartGoods.validCartGoods[itemIndex]
        } else if (Number(goodsType) === 3) {
            tempIndex = e.currentTarget.dataset.tempIndex
            item = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex]
        } else {
            item = null
        }
        console.log(item)
        if (item == null) {
            return
        }
        if (changedNum > item.sku_stock) {
            return
        }
        item.changedNum = changedNum
    },
    onGoodsNumChange: function (itemIndex, tempIndex, goodsType) {
        // goodsType 1 模板有效商品 2 普通有效商品 3 促销活动商品
        let item
        if (Number(goodsType) === 1) {
            item = this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex]
        } else if (Number(goodsType) === 2) {
            item = this.data.cartGoods.validCartGoods[itemIndex]
        } else if (Number(goodsType) === 3) {
            item = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex]
        } else {
            item = null
        }
        console.log(item)
        if (item == null) {
            return
        }
        let changedNum = item.changedNum
        if (changedNum == item.sku_count) {
            console.log('数量没有变化')
            return
        }
        //每次数量变化都需上报后台
        //请求后台，失败则恢复数量，不执行后续逻辑
        this.updateCartGoods(goodsType, tempIndex, itemIndex, item.shopping_car_id, item.sku_id, item.goods_id, changedNum, item.sku_price, item.promotion_id, item.is_exchange)
    },
    //商品数量修改 end
    //结算
    onSubmit: function (e) {
        console.log('onSubmit')
        phoneNumWatch.observer(this, () => {
            orderModel.orderCheckList = []
            this.data.cartGoods.postageTemplate.forEach((template, index) => {
                template.valid_goods_info.forEach((good, i) => {
                    if (good.checked) {
                        let max_discount_value = Math.max(this.data.memberDiscount, good.user_discount)
                        orderModel.orderCheckList.push({
                            goodsId: good.goods_id,
                            carId: good.shopping_car_id,
                            img: good.sku_img,
                            name: good.goods_name,
                            price: good.sku_price,
                            quantity: good.sku_count,
                            skuId: good.sku_id,
                            shopSkuId: good.shop_goods_sku_id,
                            attrValue: good.sku_attr_value,
                            freightId: good.freight_id,
                            user_discount: good.user_discount,
                            max_discount: max_discount_value,
                            commission_type: good.commission_type || 0,
                            commission_user_id: good.commission_user_id || 0,
                        })
                    }
                })
            })
            //促销活动商品下单
            let orderCheckPromotionSet = new Set()
            orderModel.orderCheckPromotion = []
            this.data.cartGoods.promotionGoods.forEach((promotion, index) => {
                promotion.valid_goods_info.forEach((good, i) => {
                    if (good.checked) {
                        if (!orderCheckPromotionSet.has(promotion.id)) {
                            orderCheckPromotionSet.add(promotion.id)
                            orderModel.orderCheckPromotion.push(promotion.promotion_info)
                        }
                        let max_discount_value = Math.max(this.data.memberDiscount, good.user_discount)
                        orderModel.orderCheckList.push({
                            goodsId: good.goods_id,
                            carId: good.shopping_car_id,
                            img: good.sku_img,
                            name: good.goods_name,
                            price: good.sku_price,
                            quantity: good.sku_count,
                            skuId: good.sku_id,
                            shopSkuId: good.shop_goods_sku_id,
                            attrValue: good.sku_attr_value,
                            freightId: good.freight_id,
                            user_discount: good.user_discount,
                            max_discount: max_discount_value,
                            promotion_id: good.promotion_id,
                            is_exchange: good.is_exchange,
                            commission_type: good.commission_type || 0,
                            commission_user_id: good.commission_user_id || 0,
                        })
                    }
                })
            })
            this.data.cartGoods.validCartGoods.forEach((good) => {
                if (good.checked) {
                    orderModel.orderCheckList.push({
                        goodsId: good.goods_id,
                        carId: good.shopping_car_id,
                        img: good.sku_img,
                        name: good.goods_name,
                        price: good.sku_price,
                        quantity: good.sku_count,
                        skuId: good.sku_id,
                        shopSkuId: good.shop_goods_sku_id,
                        attrValue: good.sku_attr_value,
                        freightId: good.freight_id,
                        commission_type: good.commission_type || 0,
                        commission_user_id: good.commission_user_id || 0,
                    })
                }
            })
            wx.navigateTo({
                url: '/pages/orderCheck/orderCheck',
            })
        })
    },
    // 选择sku
    confirmSpec: function ({ detail }) {
        console.log('confirmSpec')
        let newSkuId = detail.skuId
        let changedNum = detail.quantity
        let price = detail.price
        let itemIndex = detail.parameters.itemIndex
        let tempIndex = detail.parameters.tempIndex
        let goodsType = detail.parameters.goodsType
        // let item = this.data.cartGoods.validCartGoods[itemIndex]
        // console.log('this.data.cartGoods', this.data.cartGoods)
        // console.log('goodsType======546', goodsType)
        let item
        if (Number(goodsType) === 1) {
            item = this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex]
        } else if (Number(goodsType) === 2) {
            item = this.data.cartGoods.validCartGoods[itemIndex]
        } else if (Number(goodsType) === 3) {
            item = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex]
        } else {
            item = null
        }
        if (item == null) {
            return
        }
        // let item = this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex]
        // 重新选中sku完成，更新购物车
        this.updateCartGoods(goodsType, tempIndex, itemIndex, item.shopping_car_id, newSkuId, item.goods_id, changedNum, price, item.promotion_id, item.is_exchange)
    },
    closeSpec: function (e) {
        this.selectComponent('#spec').close()
    },
    openSpec: function (e) {
        let tempIndex = 0,
            item
        let itemIndex = e.currentTarget.dataset.itemIndex
        let goodsType = e.currentTarget.dataset.goodsType
        if (Number(goodsType) === 1) {
            tempIndex = e.currentTarget.dataset.tempIndex
            item = this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex]
        } else if (Number(goodsType) === 2) {
            item = this.data.cartGoods.validCartGoods[itemIndex]
        } else if (Number(goodsType) === 3) {
            tempIndex = e.currentTarget.dataset.tempIndex
            item = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex]
        } else {
            item = null
        }
        if (item == null) {
            return
        }
        loading.showLoading()
        goodsModel
            .queryGoodsDetail(item.goods_id)
            .then((res) => {
                console.log(res)
                item.attr = res.attr_info
                item.goods = res.goods_info
                item.sku = res.goods_sku_list
                let spec = this.selectComponent('#spec')
                loading.hideLoading()
                spec.setData({
                    value: item.sku_id,
                    attr: item.attr,
                    goods: item.goods,
                    sku: item.sku,
                    isShow: true,
                    quantity: Math.min(item.sku_count, item.sku_stock),
                    parameters: {
                        itemIndex: itemIndex,
                        tempIndex: tempIndex,
                        goodsType: goodsType,
                    },
                })
            })
            .catch((err) => {
                console.log(err)
                loading.hideLoading()
            })
    },
    handleChangePromotion: function (e) {
        let tempIndex = e.currentTarget.dataset.tempIndex
        let itemIndex = e.currentTarget.dataset.itemIndex
        let promotionId = this.data.cartGoods.promotionGoods[tempIndex].id
        let item = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex]
        wx.showLoading({
            title: '加载中...',
        })
        cartAdapter
            .getPromotionList([item.goods_id])
            .then((res) => {
                wx.hideLoading()
                let promotionListpopup = this.selectComponent('#promotionListpopup')
                promotionListpopup.show({
                    img: item.sku_img,
                    price: item.sku_price,
                    label: item.sku_attr_value,
                    promotionList: res,
                    promotionId: promotionId + '',
                    tag: {
                        tempIndex: tempIndex,
                        itemIndex: itemIndex,
                    },
                })
            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    onChangePromotion: function (e) {
        console.log(e)
        let promotionId = e.detail.promotionId
        let tag = e.detail.tag
        let tempIndex = tag.tempIndex
        let itemIndex = tag.itemIndex
        let item = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex]
        console.log(item)
        this.updateCartGoods(3, tempIndex, itemIndex, item.shopping_car_id, item.sku_id, item.goods_id, item.sku_count, item.sku_price, promotionId, item.is_exchange)
    },
    toggle: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let shoppingId = e.currentTarget.dataset.shoppingId
        let checkbox = this.selectComponent('#checkbox_' + shoppingId)
        checkbox.toggle()
    },
    // 模版选择框点击区域放大
    templateToggle: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let checkbox = this.selectComponent('#checkbox_template_' + itemIndex)
        checkbox.toggle()
    },
    promotionToggle: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let checkbox = this.selectComponent('#checkbox_promotion_' + itemIndex)
        checkbox.toggle()
    },

    // 所有失效商品选择框点击区域放大
    allInvalidGoodsToggle: function (e) {
        let checkbox = this.selectComponent('#checkbox_all_invalid')
        checkbox.toggle()
    },
    checkedAllInvalid: function (e) {
        let newCartGoodsData = {}
        const _blo = this.data.checkedAllInvalidGoods
        this.checkAllInvalidCartGoods(newCartGoodsData, !_blo)
        let that = this
        this.setData(
            {
                checkedAllInvalidGoods: !_blo,
            },
            () => {
                that.updateCart(
                    {
                        ...newCartGoodsData,
                    },
                    2
                )
            }
        )
    },

    // 返回选中商品数量
    backCheckedGoodsCount(type) {
        // type 1: 不包括失效 2: 包括失效
        let all_goods_count = 0,
            common_goods_count = 0, // 普通商品选中数量
            template_goods_count = 0, // 模板商品选中数量
            promotion_goods_count = 0, // 促销活动商品选中数量
            invalid_goods_count = 0 // 失效商品选中数量
        common_goods_count = this.checkCartGoodsCount(this.data.cartGoods.validCartGoods)
        invalid_goods_count = this.checkCartGoodsCount(this.data.cartGoods.invalidCartGoods)
        this.data.cartGoods.postageTemplate.forEach((ev, i) => {
            template_goods_count = template_goods_count + this.checkCartGoodsCount(this.data.cartGoods.postageTemplate[i].valid_goods_info)
        })
        this.data.cartGoods.promotionGoods.forEach((ev, i) => {
            promotion_goods_count = promotion_goods_count + this.checkCartGoodsCount(this.data.cartGoods.promotionGoods[i].valid_goods_info)
        })
        if (type === 1) {
            all_goods_count = common_goods_count + template_goods_count + promotion_goods_count
        } else if (type === 2) {
            all_goods_count = common_goods_count + template_goods_count + promotion_goods_count + invalid_goods_count
        }
        return all_goods_count
    },

    convertReqDataToUI: function (reqData) {
        console.log('reqData===>', reqData)
        let validCartGoods = reqData.valid_goods_info || []
        let invalidCartGoods = reqData.invalid_goods_info || []
        let postageTemplate = reqData.freight_goods_list || []
        let promotionGoods = reqData.promotion_goods_list || []
        let invaildSkuGoodsCount = 0

        let snapshot = cartModel.getCartGoodsCheckedSnapshot()
        console.log('snapshot:', snapshot)
        if (validCartGoods.length > 0) {
            //有效商品
            validCartGoods.forEach((good) => {
                if (good.sku_status == 1) {
                    //sku失效
                    invaildSkuGoodsCount++
                }
                //金额
                good.retail_price_str = (parseFloat(good.sku_price) / 100).toFixed(2)
                good.in_valid_reason = ''
                good.checked = snapshot.has(good.shopping_car_id)
                good.sku_img = good.sku_img + '!upyun520/fw/400'
            })
            validCartGoods[0].top = true
            validCartGoods[validCartGoods.length - 1].bottom = true
        }
        if (invalidCartGoods.length > 0) {
            //无效商品
            invalidCartGoods.forEach((good) => {
                //金额
                good.retail_price_str = (parseFloat(good.sku_price) / 100).toFixed(2)
                good.in_valid_reason = good.in_valid_reason || ''
                good.checked = false
                good.sku_img = good.sku_img + '!upyun520/fw/400'
            })
            invalidCartGoods[invalidCartGoods.length - 1].bottom = true
        }
        // 计算购物车总件数
        let skuCountTotal = validCartGoods.length
        // let skuCountTotal = validCartGoods.reduce((total, item) => total + item.sku_count, 0)
        // 邮费模板商品 valid_goods_info
        if (postageTemplate.length > 0) {
            postageTemplate.forEach((template_item, i) => {
                template_item.isMeet = false
                template_item.valid_goods_info.forEach((good) => {
                    good.checked = snapshot.has(good.shopping_car_id)
                    // skuCountTotal = skuCountTotal + good.sku_count
                })
                skuCountTotal = skuCountTotal + template_item.valid_goods_info.length
            })
        }
        // 促销活动商品
        if (promotionGoods.length > 0) {
            promotionGoods.forEach((item, i) => {
                item.valid_goods_info.forEach((good) => {
                    good.checked = snapshot.has(good.shopping_car_id)
                    // skuCountTotal = skuCountTotal + good.sku_count
                })
                //促销活动商品数加换购商品数
                skuCountTotal = skuCountTotal + item.valid_goods_info.length
            })
        }
        this.setData({ skuCountTotal })
        // 有效商品总计
        let validCartGoodsCount = validCartGoods.length
        postageTemplate.forEach((event, index) => {
            validCartGoodsCount = validCartGoodsCount + event.valid_goods_info.length
        })
        promotionGoods.forEach((event, index) => {
            validCartGoodsCount = validCartGoodsCount + event.valid_goods_info.length
        })
        this.setData({
            ['validCartGoodsCountKey']: validCartGoodsCount,
        })
        return {
            validCartGoods: validCartGoods,
            invalidCartGoods: invalidCartGoods,
            invaildSkuGoodsCount: invaildSkuGoodsCount,
            postageTemplate: postageTemplate,
            promotionGoods: promotionGoods,
            validCartGoodsCount: validCartGoodsCount,
        }
    },

    updateCart: function (checkedState, type_num) {
        let newCartGoodsData = {}
        let checkedGoodsCount = 0
        let checkedGoodsAmount = 0
        //获取之前的汇总数据
        let validCartGoodsCount = 0
        //正式更新数据并通知UI更新
        this.setData(
            {
                ...checkedState,
            },
            () => {
                this.data.cartGoods.validCartGoods.forEach((element) => {
                    if (element.checked) {
                        // validCartGoodsCount++
                        checkedGoodsAmount = checkedGoodsAmount + element.sku_price * element.sku_count
                    }
                    cartModel.updateCartGoodsCheckedSnapshot(element.shopping_car_id, element.checked)
                })
                this.data.cartGoods.postageTemplate.forEach((ev, i) => {
                    //validCartGoodsCount = validCartGoodsCount + this.checkCartGoodsCount(this.data.cartGoods.postageTemplate[i].valid_goods_info)
                    let num = this.checkCartGoodsCount(ev.valid_goods_info)
                    ev.valid_goods_info.forEach((event, index) => {
                        if (event.checked) {
                            checkedGoodsAmount = checkedGoodsAmount + event.sku_price * event.sku_count
                        }
                        cartModel.updateCartGoodsCheckedSnapshot(event.shopping_car_id, event.checked)
                    })
                    let freightTemplateItemKey = freightTemplateKey + '[' + i + '].checked'
                    if (ev.valid_goods_info.length === num) {
                        ev.checked = true
                        newCartGoodsData[freightTemplateItemKey] = true
                    } else {
                        ev.checked = false
                        newCartGoodsData[freightTemplateItemKey] = false
                    }
                })
                //更新促销商品信息
                let result = this.updatePromotionGoods(checkedGoodsAmount, newCartGoodsData)
                checkedGoodsAmount = result.checkedGoodsAmount
                let totalDiscount = result.totalDiscount
                console.log('优惠金额：' + totalDiscount)
                console.log('选中商品快照：', cartModel.getCartGoodsCheckedSnapshot())

                let checkedInvalidCartGoodsCount = this.checkCartGoodsCount(this.data.cartGoods.invalidCartGoods)
                let checkedInvalidCartGoodsCountKey = 'cartTotal.checkedInvalidCartGoodsCount'
                validCartGoodsCount = this.backCheckedGoodsCount(type_num || 1)
                let checkedGoodsDiscountKey = 'cartTotal.checkedGoodsDiscount'
                this.setData(
                    {
                        ...newCartGoodsData,
                        [checkedGoodsCountKey]: validCartGoodsCount,
                        [checkedGoodsAmountKey]: checkedGoodsAmount,
                        [checkedInvalidCartGoodsCountKey]: checkedInvalidCartGoodsCount,
                        [checkedGoodsDiscountKey]: totalDiscount,
                    },
                    () => {}
                )
            }
        )
    },
    updatePromotionGoods(checkedGoodsAmount, newCartGoodsData) {
        //促销活动商品 优惠档位以及金额计算
        let totalDiscount = 0 //促销减免金额
        this.data.cartGoods.promotionGoods.forEach((ev, i) => {
            let num = this.checkCartGoodsCount(ev.valid_goods_info)
            let tempTotalAmount = 0
            let tempTotalCheckedCount = 0
            ev.valid_goods_info.forEach((event, index) => {
                if (event.checked) {
                    tempTotalCheckedCount = tempTotalCheckedCount + event.sku_count
                    tempTotalAmount = tempTotalAmount + event.sku_price * event.sku_count
                    checkedGoodsAmount = checkedGoodsAmount + event.sku_price * event.sku_count
                }
                cartModel.updateCartGoodsCheckedSnapshot(event.shopping_car_id, event.checked)
            })

            let promotionInfo = ev.promotion_info
            let type = promotionInfo.type
            let tips = promotionInfo.originalTips
            let promotionInfoKey = promotionGoodsKey + '[' + i + '].promotion_info'
            let exchaneGoodsInfoKey = promotionGoodsKey + '[' + i + '].exchane_goods_info'
            if (tempTotalCheckedCount > 0) {
                //有商品被选中
                //计算档位
                let rules = promotionInfo.rules
                //排序
                rules.sort((a, b) => {
                    return a.needNum - b.needNum
                })
                console.log(rules)
                if (type == 1) {
                    //每满减-无上限
                    let rule = rules[0]
                    if (tempTotalAmount < rule.needNum) {
                        //不满足第一档位
                        let offset = rule.needNum - tempTotalAmount
                        let discount = rule.subNum
                        tips = '还差' + offset / 100 + '元，可减' + discount / 100 + '元'
                    } else {
                        //满足最低档位
                        let gear = parseInt(tempTotalAmount / rule.needNum)
                        let discount = gear * rule.subNum
                        let offset = (gear + 1) * rule.needNum - tempTotalAmount
                        let nextDiscount = (gear + 1) * rule.subNum
                        tips = '已减' + discount / 100 + '元，还差' + offset / 100 + '元，可减' + nextDiscount / 100 + '元'
                        totalDiscount = totalDiscount + discount
                    }
                } else if (type == 5) {
                    //加价购
                    let rule = rules[0]
                    let enableExchaneKey = promotionGoodsKey + '[' + i + '].enable_exchane'
                    if (tempTotalAmount < rule.needNum) {
                        //主商品金额不满足加价购活动
                        if (ev.exchane_goods_info.length > 0) {
                            //有换购商品,换购商品置灰
                            ev.enable_exchane = false
                            newCartGoodsData[enableExchaneKey] = false
                            ev.exchane_goods_info = []
                            newCartGoodsData[exchaneGoodsInfoKey] = []
                            promotionModel.barterCheckedList.delete(promotionInfo.id)
                        }
                    } else {
                        //满足加价购金额,计算总金额
                        ev.exchane_goods_info.forEach((event, index) => {
                            checkedGoodsAmount = checkedGoodsAmount + event.sku_price * event.sku_count
                            event.invalid = false
                        })
                        ev.enable_exchane = true
                        newCartGoodsData[enableExchaneKey] = true
                        newCartGoodsData[exchaneGoodsInfoKey] = ev.exchane_goods_info
                        if (ev.exchane_goods_info.length > 0) {
                            tips = '已满' + rule.needNum / 100 + '元，已换购'
                        } else {
                            tips = '已满' + rule.needNum / 100 + '元，可换购'
                        }
                    }
                } else {
                    //满减、满折、满件折、满券
                    let isMeetIndex = -1
                    for (let index = 0; index < rules.length; index++) {
                        const rule = rules[index]
                        if (type == 4) {
                            //满件折-件数
                            if (tempTotalCheckedCount < rule.needNum) {
                                isMeetIndex = index
                                break
                            }
                        } else {
                            //满减、满折、满券-金额
                            if (tempTotalAmount < rule.needNum) {
                                isMeetIndex = index
                                break
                            }
                        }
                    }
                    console.log('isMeetIndex:' + isMeetIndex)
                    if (isMeetIndex == -1) {
                        //已经满足最高档位
                        let rule = rules[rules.length - 1]
                        if (type == 6) {
                            //满券
                            let name = rule.objName
                            if (!name.endsWith('优惠券')) {
                                name = name + '优惠券'
                            }
                            tips = '已满' + rule.needNum / 100 + '元，获赠' + name
                        } else if (type == 4) {
                            //满件折
                            let discount = tempTotalAmount - (tempTotalAmount * rule.subNum) / 100
                            let topMoney = promotionInfo.topMoney
                            if (topMoney > 0 && discount > topMoney) {
                                //有封顶上限
                                discount = topMoney
                            }
                            tips = '已满' + rule.needNum + '件，可减' + (discount / 100).toFixed(2) + '元'
                            totalDiscount = totalDiscount + discount
                        } else {
                            //满减、满折
                            let discount = 0
                            if (type == 3) {
                                //折扣
                                discount = tempTotalAmount - (tempTotalAmount * rule.subNum) / 100
                                let topMoney = promotionInfo.topMoney
                                if (topMoney > 0 && discount > topMoney) {
                                    //有封顶上限
                                    discount = topMoney
                                }
                            } else {
                                //金额
                                discount = rule.subNum
                            }
                            tips = '已满' + rule.needNum / 100 + '元，可减' + (discount / 100).toFixed(2) + '元'
                            totalDiscount = totalDiscount + discount
                        }
                    } else if (isMeetIndex == 0) {
                        //未满足第一档位
                        let rule = rules[isMeetIndex]
                        if (type == 6) {
                            //满券
                            let name = rule.objName
                            if (!name.endsWith('优惠券')) {
                                name = name + '优惠券'
                            }
                            let offset = rule.needNum - tempTotalAmount
                            tips = '还差' + offset / 100 + '元，可获赠' + name
                        } else if (type == 4) {
                            //满件折
                            let offset = rule.needNum - tempTotalCheckedCount
                            tips = '还差' + offset + '件可打' + rule.subNum / 10 + '折'
                        } else {
                            //满减、满折
                            let offset = rule.needNum - tempTotalAmount
                            let discount = 0
                            if (type == 3) {
                                //折扣
                                discount = rule.needNum - (rule.needNum * rule.subNum) / 100
                            } else {
                                //金额
                                discount = rule.subNum
                            }
                            tips = '还差' + offset / 100 + '元可减' + (discount / 100).toFixed(2) + '元'
                        }
                    } else {
                        //处于某一档位，但是未满足该档位
                        let rule = rules[isMeetIndex]
                        let preRule = rules[isMeetIndex - 1]
                        if (type == 6) {
                            //满券
                            let nextDiscount = rule.objName
                            if (!nextDiscount.endsWith('优惠券')) {
                                nextDiscount = nextDiscount + '优惠券'
                            }
                            let discount = preRule.objName
                            if (!discount.endsWith('优惠券')) {
                                discount = discount + '优惠券'
                            }
                            let offset = rule.needNum - tempTotalAmount
                            tips = '获赠' + discount + '，还差' + offset / 100 + '元，获赠' + nextDiscount
                        } else if (type == 4) {
                            //满件折
                            let discount = tempTotalAmount - (tempTotalAmount * preRule.subNum) / 100
                            let offset = rule.needNum - tempTotalCheckedCount
                            let nextDiscount = rule.subNum
                            tips = '已打' + preRule.subNum / 10 + '折，还差' + offset + '件，可打' + nextDiscount / 10 + '折'
                            let topMoney = promotionInfo.topMoney
                            if (topMoney > 0 && discount > topMoney) {
                                //有封顶上限
                                discount = topMoney
                            }
                            if (topMoney > 0 && nextDiscount > topMoney) {
                                //有封顶上限
                                nextDiscount = topMoney
                            }
                            totalDiscount = totalDiscount + discount
                        } else {
                            //满减、满折
                            let offset = rule.needNum - tempTotalAmount
                            let discount = 0
                            let nextDiscount = 0
                            if (type == 3) {
                                //折扣
                                discount = tempTotalAmount - (tempTotalAmount * preRule.subNum) / 100
                                nextDiscount = rule.needNum - (rule.needNum * rule.subNum) / 100
                                let topMoney = promotionInfo.topMoney
                                if (topMoney > 0 && discount > topMoney) {
                                    //有封顶上限
                                    discount = topMoney
                                }
                                if (topMoney > 0 && nextDiscount > topMoney) {
                                    //有封顶上限
                                    nextDiscount = topMoney
                                }
                            } else {
                                //金额
                                discount = preRule.subNum
                                nextDiscount = rule.subNum
                            }
                            tips = '已减' + discount / 100 + '元，还差' + offset / 100 + '元，可减' + nextDiscount / 100 + '元'
                            totalDiscount = totalDiscount + discount
                        }
                    }
                }
            } else {
                //没有商品被选中
                if (type == 5) {
                    //主商品金额不满足加价购活动
                    if (ev.exchane_goods_info.length > 0) {
                        //有换购商品,清空换购商品
                        ev.exchane_goods_info = []
                        newCartGoodsData[exchaneGoodsInfoKey] = []
                        promotionModel.barterCheckedList.delete(promotionInfo.id)
                    }
                    let enableExchaneKey = promotionGoodsKey + '[' + i + '].enable_exchane'
                    ev.enable_exchane = false
                    newCartGoodsData[enableExchaneKey] = false
                }
            }
            let newPromotionInfo = {
                ...promotionInfo,
                tips: tips,
            }
            ev.promotion_info = newPromotionInfo
            newCartGoodsData[promotionInfoKey] = newPromotionInfo

            let itemKey = promotionGoodsKey + '[' + i + '].checked'
            if (ev.valid_goods_info.length === num && num > 0) {
                ev.checked = true
                newCartGoodsData[itemKey] = true
            } else {
                ev.checked = false
                newCartGoodsData[itemKey] = false
            }
        })
        //促销减免金额
        checkedGoodsAmount = checkedGoodsAmount - totalDiscount
        return {
            checkedGoodsAmount: checkedGoodsAmount,
            totalDiscount: totalDiscount,
        }
    },
    // 全选||取消全选  有效商品
    checkAllValidCartGoods: function (newCartGoodsData, isCheckAll) {
        if (isCheckAll) {
            //执行全选操作
            this.data.cartGoods.validCartGoods.forEach((item, index) => {
                let vaild = true
                if (this.data.isEditCart) {
                    vaild = true
                } else {
                    //非编辑模式需校验有效商品当前的sku是否有效
                    vaild = item.sku_status == 2
                }
                if (!item.checked && vaild) {
                    let checked = item.checked
                    item.checked = !checked
                    let validCartGoodsItemKey = validCartGoodsKey + '[' + index + '].checked'
                    newCartGoodsData[validCartGoodsItemKey] = !checked
                }
            })
            this.data.cartGoods.postageTemplate.forEach((event, index) => {
                let num = 0
                event.valid_goods_info.forEach((ev, i) => {
                    let vaild = true
                    if (this.data.isEditCart) {
                        vaild = true
                    } else {
                        //非编辑模式需校验有效商品当前的sku是否有效
                        vaild = ev.sku_status == 2
                    }
                    if (!ev.checked && vaild) {
                        num = num + 1
                        let checked = ev.checked
                        ev.checked = !checked
                        let freightTemplateGoodsKey = freightTemplateKey + '[' + index + '].valid_goods_info[' + i + '].checked'
                        newCartGoodsData[freightTemplateGoodsKey] = !checked
                    }
                })
                if (num === event.valid_goods_info.length && event.valid_goods_info.length > 0) {
                    let freightTemplateItemKey = freightTemplateKey + '[' + index + '].checked'
                    newCartGoodsData[freightTemplateItemKey] = true
                }
            })
            this.data.cartGoods.promotionGoods.forEach((event, index) => {
                let num = 0
                event.valid_goods_info.forEach((ev, i) => {
                    let vaild = true
                    if (this.data.isEditCart) {
                        vaild = true
                    } else {
                        //非编辑模式需校验有效商品当前的sku是否有效
                        vaild = ev.sku_status == 2
                    }
                    if (!ev.checked && vaild) {
                        num = num + 1
                        let checked = ev.checked
                        ev.checked = !checked
                        let goodsKey = promotionGoodsKey + '[' + index + '].valid_goods_info[' + i + '].checked'
                        newCartGoodsData[goodsKey] = !checked
                    }
                })
                if (num === event.valid_goods_info.length && event.valid_goods_info.length > 0) {
                    let itemKey = promotionGoodsKey + '[' + index + '].checked'
                    newCartGoodsData[itemKey] = true
                }
            })
        } else {
            //取消全选
            this.data.cartGoods.validCartGoods.forEach((item, index) => {
                item.checked = false
                let validCartGoodsItemKey = validCartGoodsKey + '[' + index + '].checked'
                newCartGoodsData[validCartGoodsItemKey] = false
            })
            this.data.cartGoods.postageTemplate.forEach((event, index) => {
                event.checked = false
                event.valid_goods_info.forEach((ev, i) => {
                    let freightTemplateGoodsKey = freightTemplateKey + '[' + index + '].valid_goods_info[' + i + '].checked'
                    newCartGoodsData[freightTemplateGoodsKey] = false
                })
                // let
                let freightTemplateItemKey = freightTemplateKey + '[' + index + '].checked'
                newCartGoodsData[freightTemplateItemKey] = false
            })
            this.data.cartGoods.promotionGoods.forEach((event, index) => {
                event.checked = false
                event.valid_goods_info.forEach((ev, i) => {
                    let goodsKey = promotionGoodsKey + '[' + index + '].valid_goods_info[' + i + '].checked'
                    newCartGoodsData[goodsKey] = false
                })
                // let
                let itemKey = promotionGoodsKey + '[' + index + '].checked'
                newCartGoodsData[itemKey] = false
            })
        }
    },

    // 全选||取消全选  失效商品
    checkAllInvalidCartGoods: function (newCartGoodsData, isCheckAll) {
        if (isCheckAll) {
            this.data.cartGoods.invalidCartGoods.forEach((item, index) => {
                if (!item.checked) {
                    let checked = item.checked
                    item.checked = !checked
                    let invalidCartGoodsItemKey = invalidCartGoodsKey + '[' + index + '].checked'
                    newCartGoodsData[invalidCartGoodsItemKey] = !checked
                }
            })
        } else {
            this.data.cartGoods.invalidCartGoods.forEach((item, index) => {
                item.checked = false
                let invalidCartGoodsItemKey = invalidCartGoodsKey + '[' + index + '].checked'
                newCartGoodsData[invalidCartGoodsItemKey] = false
            })
        }
    },
    // 计算选中的商品数量
    checkCartGoodsCount: function (goods) {
        let checkedCount = 0
        goods.forEach((item) => {
            if (item.checked) {
                checkedCount++
            }
        })
        return checkedCount
    },
    getCheckedGoods: function (goods) {
        let checkedList = []
        if (goods && goods.length > 0) {
            goods.forEach((item) => {
                if (item.checked) {
                    checkedList.push(item)
                }
            })
        } else {
            if (this.data.cartGoods.postageTemplate.length > 0) {
                this.data.cartGoods.postageTemplate.forEach((ev, i) => {
                    checkedList = checkedList.concat(this.getCheckedGoods(ev.valid_goods_info))
                })
            }
            if (this.data.cartGoods.promotionGoods.length > 0) {
                this.data.cartGoods.promotionGoods.forEach((ev, i) => {
                    checkedList = checkedList.concat(this.getCheckedGoods(ev.valid_goods_info))
                })
            }
            if (this.data.cartGoods.validCartGoods.length > 0) {
                checkedList = checkedList.concat(this.getCheckedGoods(this.data.cartGoods.validCartGoods))
            }
            if (this.data.cartGoods.invalidCartGoods.length > 0) {
                checkedList = checkedList.concat(this.getCheckedGoods(this.data.cartGoods.invalidCartGoods))
            }
        }
        return checkedList
    },
    getCartGoods: function (callback, showLoading = true) {
        let checkCode = util.checkToken()
        if (checkCode != 0) {
            return
        }
        if (showLoading) {
            loading.showLoading()
        }
        //先判断是否是会员
        this.getUserDiscount()
            .then((res) => {
                //促销活动版本之后数据变化较大，通过适配器进行适配、兼容，现有逻辑不做改动
                return cartAdapter.getCartGoods(this.data.memberDiscount > 0)
            })
            .then((res) => {
                console.log(res)
                return this.convertReqDataToUI(res)
            })
            .then((cartGoods) => {
                loading.hideLoading()
                this.diffOldCartGoods(cartGoods)

                if (this.data.isFirstLoad) {
                    console.log('test isFirstLoad')
                    //第一次初始化，默认全部不选，不用计算价格
                    this.updateCart({
                        isFirstLoad: false,
                        cartGoods: cartGoods,
                    })
                } else {
                    console.log('test')
                    //用户操作导致的数据更新，需保留选中状态，以及计算价格
                    this.data.cartGoods = cartGoods
                    this.updateCart({
                        isFirstLoad: false,
                        cartGoods: cartGoods,
                    })
                }
                if (callback) {
                    callback()
                }
            })
            .catch((err) => {
                console.log(err)
                loading.hideLoading()
                if (callback) {
                    callback(err)
                }
            })
    },
    updateCartGoods: function (goodsType, tempIndex, itemIndex, shoppingCarId, skuId, goodsId, changedNum, price, promotion_id, is_exchange) {
        loading.showLoading()
        this.setData({
            overlayShow: true,
        })
        cartAdapter
            .updateCartGoods({
                shopping_car_id: shoppingCarId,
                sku_id: skuId,
                goods_id: goodsId,
                count: changedNum,
                price: price,
                promotion_id: promotion_id,
                is_exchange: is_exchange,
            })
            .then((res) => {
                //同步获取最新的列表数据
                return this.convertReqDataToUI(res)
            })
            .then((cartGoods) => {
                loading.hideLoading()
                this.setData({
                    overlayShow: false,
                })
                //同步有效的选中状态，需同步更新价格
                let shopping_car_id
                if (Number(goodsType) === 1) {
                    shopping_car_id = this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex].shopping_car_id
                } else if (Number(goodsType) === 2) {
                    shopping_car_id = this.data.cartGoods.validCartGoods[itemIndex].shopping_car_id
                } else if (Number(goodsType) === 3) {
                    shopping_car_id = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex].shopping_car_id
                }

                this.diffOldCartGoods(cartGoods)
                this.data.cartGoods = cartGoods
                let item
                cartGoods.validCartGoods.forEach((good) => {
                    if (good.shopping_car_id === shopping_car_id) {
                        item = good
                    }
                })
                cartGoods.postageTemplate.forEach((template_item) => {
                    template_item.valid_goods_info.forEach((goods) => {
                        if (goods.shopping_car_id === shopping_car_id) {
                            item = goods
                        }
                    })
                })
                cartGoods.promotionGoods.forEach((promotion_item) => {
                    promotion_item.valid_goods_info.forEach((goods) => {
                        if (goods.shopping_car_id === shopping_car_id) {
                            item = goods
                        }
                    })
                })
                // let item = cartGoods.validCartGoods.find((goods) => {
                //     return goods.shopping_car_id == shopping_car_id
                // })
                if (item) {
                    //原则上不需要添加这句代码，实际情况请求成功后，新的sku_count值一定和changedNum一致的
                    item.sku_count = changedNum
                    if (item.checked) {
                        console.log('updateCartGoods 商品选中')
                    } else {
                        console.log('updateCartGoods 商品未选中')
                    }
                } else {
                    console.log('updateCartGoods 商品不存在，比如合并为同一个sku了')
                }
                this.updateCart({
                    cartGoods: cartGoods,
                })
            })
            .catch((err) => {
                console.log(err)
                loading.hideLoading()
                this.setData({
                    overlayShow: false,
                })
            })
    },
    diffOldCartGoods: function (cartGoods) {
        cartGoods.validCartGoods.forEach((newGood) => {
            this.data.cartGoods.validCartGoods.forEach((oldGood) => {
                if (newGood.shopping_car_id == oldGood.shopping_car_id) {
                    //如果返回的商品已经是选中状态，不同步状态（兼容后台保存购物车商品选中状态的逻辑）
                    if (!newGood.checked) newGood.checked = oldGood.checked
                }
            })
        })
        cartGoods.postageTemplate.forEach((newData, newI) => {
            this.data.cartGoods.postageTemplate.forEach((oldData, oldI) => {
                if (newData.templateId === oldData.templateId) {
                    newData.checked = oldData.checked
                    newData.valid_goods_info.forEach((newItem, newIndex) => {
                        oldData.valid_goods_info.forEach((oldItem, oldIndex) => {
                            if (newItem.shopping_car_id == oldItem.shopping_car_id) {
                                //如果返回的商品已经是选中状态，不同步状态（兼容后台保存购物车商品选中状态的逻辑）
                                if (!newItem.checked) newItem.checked = oldItem.checked
                            }
                        })
                    })
                }
            })
        })
        //同步促销活动商品选中状态以及信息显示
        cartGoods.promotionGoods.forEach((newData, newI) => {
            this.data.cartGoods.promotionGoods.forEach((oldData, oldI) => {
                if (newData.id === oldData.id) {
                    newData.checked = oldData.checked
                    newData.valid_goods_info.forEach((newItem, newIndex) => {
                        oldData.valid_goods_info.forEach((oldItem, oldIndex) => {
                            if (newItem.shopping_car_id == oldItem.shopping_car_id) {
                                //如果返回的商品已经是选中状态，不同步状态（兼容后台保存购物车商品选中状态的逻辑）
                                if (!newItem.checked) newItem.checked = oldItem.checked
                            }
                        })
                    })
                }
            })
        })
        let isEditCart = this.data.isEditCart
        if (isEditCart) {
            //编辑模式下刷新购物车，无效商品也需要比较
            cartGoods.invalidCartGoods.forEach((newGood) => {
                this.data.cartGoods.invalidCartGoods.forEach((oldGood) => {
                    if (newGood.shopping_car_id == oldGood.shopping_car_id) {
                        newGood.checked = oldGood.checked
                    }
                })
            })
        }
    },

    // 勾选||取消 模板 单个商品
    checkedItem: function (e) {
        //item选中事件
        let newCartGoodsData = {}
        let tempIndex = e.currentTarget.dataset.tempIndex
        let itemIndex = e.currentTarget.dataset.itemIndex
        let itemValid = e.currentTarget.dataset.itemValid
        let checkType = Number(e.currentTarget.dataset.checkType)
        // checkType  选中取消类型 1：模版商品  2：普通商品  3：失效商品 4：促销商品
        if (!this.data.isEditCart) {
            //非编辑模式
            if (itemValid) {
                let checked = false
                //失效货物过滤
                if (checkType === 1) {
                    checked = this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex].checked
                    let freightTemplateGoodsKey = freightTemplateKey + '[' + tempIndex + '].valid_goods_info[' + itemIndex + '].checked'
                    this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex].checked = !checked
                    newCartGoodsData[freightTemplateGoodsKey] = !checked
                } else if (checkType === 2) {
                    checked = this.data.cartGoods.validCartGoods[itemIndex].checked
                    let validCartGoodsItemKey = validCartGoodsKey + '[' + itemIndex + '].checked'
                    this.data.cartGoods.validCartGoods[itemIndex].checked = !checked
                    newCartGoodsData[validCartGoodsItemKey] = !checked
                } else if (checkType === 4) {
                    checked = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex].checked
                    let goodsKey = promotionGoodsKey + '[' + tempIndex + '].valid_goods_info[' + itemIndex + '].checked'
                    this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex].checked = !checked
                    newCartGoodsData[goodsKey] = !checked
                }
                //更新总UI
                this.updateCart({
                    ...newCartGoodsData,
                })
            }
        } else {
            //编辑模式，删除列表
            let newCartTotal = {}
            //有效商品
            if (itemValid) {
                let item, checked
                if (checkType === 1) {
                    item = this.data.cartGoods.postageTemplate[tempIndex].valid_goods_info[itemIndex]
                    checked = item.checked
                    let freightTemplateGoodsKey = freightTemplateKey + '[' + tempIndex + '].valid_goods_info[' + itemIndex + '].checked'
                    newCartTotal[freightTemplateGoodsKey] = !checked
                } else if (checkType === 2) {
                    item = this.data.cartGoods.validCartGoods[itemIndex]
                    checked = item.checked
                    let validCartGoodsItemKey = validCartGoodsKey + '[' + itemIndex + '].checked'
                    newCartTotal[validCartGoodsItemKey] = !checked
                } else if (checkType === 4) {
                    item = this.data.cartGoods.promotionGoods[tempIndex].valid_goods_info[itemIndex]
                    checked = item.checked
                    let goodsKey = promotionGoodsKey + '[' + tempIndex + '].valid_goods_info[' + itemIndex + '].checked'
                    newCartTotal[goodsKey] = !checked
                }
                //更新数据
                item.checked = !checked
            } else {
                //失效商品
                let item = this.data.cartGoods.invalidCartGoods[itemIndex]
                let checked = item.checked
                let invalidCartGoodsItemKey = invalidCartGoodsKey + '[' + itemIndex + '].checked'
                //更新数据
                item.checked = !checked
                newCartTotal[invalidCartGoodsItemKey] = !checked
            }
            //计算选中的商品列表个数
            let validCartGoodsSelectedCount = 0
            //包邮模版商品
            this.data.cartGoods.postageTemplate.forEach((ev, i) => {
                validCartGoodsSelectedCount = validCartGoodsSelectedCount + this.checkCartGoodsCount(this.data.cartGoods.postageTemplate[i].valid_goods_info)
                let num = this.checkCartGoodsCount(ev.valid_goods_info)
                let freightTemplateItemKey = freightTemplateKey + '[' + i + '].checked'
                if (ev.valid_goods_info.length === num) {
                    ev.checked = true
                    newCartGoodsData[freightTemplateItemKey] = true
                } else {
                    ev.checked = false
                    newCartGoodsData[freightTemplateItemKey] = false
                }
            })
            //促销活动商品
            this.data.cartGoods.promotionGoods.forEach((ev, i) => {
                validCartGoodsSelectedCount = validCartGoodsSelectedCount + this.checkCartGoodsCount(this.data.cartGoods.promotionGoods[i].valid_goods_info)
                let num = this.checkCartGoodsCount(ev.valid_goods_info)
                let itemKey = promotionGoodsKey + '[' + i + '].checked'
                if (ev.valid_goods_info.length === num) {
                    ev.checked = true
                    newCartGoodsData[itemKey] = true
                } else {
                    ev.checked = false
                    newCartGoodsData[itemKey] = false
                }
            })

            validCartGoodsSelectedCount = validCartGoodsSelectedCount + this.checkCartGoodsCount(this.data.cartGoods.validCartGoods)
            let invalidCartGoodsCount = this.checkCartGoodsCount(this.data.cartGoods.invalidCartGoods)
            let that = this
            this.setData(
                {
                    ...newCartTotal,
                    [checkedGoodsCountKey]: validCartGoodsSelectedCount + invalidCartGoodsCount,
                    ...newCartGoodsData,
                },
                () => {
                    let checkedInvalidCartGoodsCount = this.checkCartGoodsCount(this.data.cartGoods.invalidCartGoods)
                    let _blo = false
                    if (checkedInvalidCartGoodsCount === that.data.cartGoods.invalidCartGoods.length) {
                        _blo = true
                    }
                    this.setData({
                        checkedAllInvalidGoods: _blo,
                    })
                }
            )
        }
    },

    // 勾选||取消 模板全部商品
    checkedTemplate: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let templateChecked = this.data.cartGoods.postageTemplate[itemIndex].checked
        let freightTemplateItemKey = freightTemplateKey + '[' + itemIndex + '].checked'
        this.data.cartGoods.postageTemplate[itemIndex].checked = !templateChecked
        let newCartGoodsData = {}
        if (!templateChecked) {
            this.data.cartGoods.postageTemplate[itemIndex].valid_goods_info.forEach((item, index) => {
                let vaild = true
                if (this.data.isEditCart) {
                    vaild = true
                } else {
                    //非编辑模式需校验有效商品当前的sku是否有效
                    vaild = item.sku_status == 2
                }
                if (!item.checked && vaild) {
                    let checked = item.checked
                    item.checked = !checked
                    let freightTemplateGoodsKey = freightTemplateKey + '[' + itemIndex + '].valid_goods_info[' + index + '].checked'
                    newCartGoodsData[freightTemplateGoodsKey] = !checked
                }
            })
        } else {
            this.data.cartGoods.postageTemplate[itemIndex].valid_goods_info.forEach((item, index) => {
                item.checked = false
                let freightTemplateGoodsKey = freightTemplateKey + '[' + itemIndex + '].valid_goods_info[' + index + '].checked'
                newCartGoodsData[freightTemplateGoodsKey] = false
            })
        }
        newCartGoodsData[freightTemplateItemKey] = !templateChecked
        //更新总UI
        this.updateCart({
            ...newCartGoodsData,
        })
    },

    // 勾选||取消 促销活动全部商品
    checkedPromotion: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let templateChecked = this.data.cartGoods.promotionGoods[itemIndex].checked
        let itemKey = promotionGoodsKey + '[' + itemIndex + '].checked'
        this.data.cartGoods.promotionGoods[itemIndex].checked = !templateChecked
        let newCartGoodsData = {}
        if (!templateChecked) {
            this.data.cartGoods.promotionGoods[itemIndex].valid_goods_info.forEach((item, index) => {
                let vaild = true
                if (this.data.isEditCart) {
                    vaild = true
                } else {
                    //非编辑模式需校验有效商品当前的sku是否有效
                    vaild = item.sku_status == 2
                }
                if (!item.checked && vaild) {
                    let checked = item.checked
                    item.checked = !checked
                    let goodsKey = promotionGoodsKey + '[' + itemIndex + '].valid_goods_info[' + index + '].checked'
                    newCartGoodsData[goodsKey] = !checked
                }
            })
        } else {
            this.data.cartGoods.promotionGoods[itemIndex].valid_goods_info.forEach((item, index) => {
                item.checked = false
                let goodsKey = promotionGoodsKey + '[' + itemIndex + '].valid_goods_info[' + index + '].checked'
                newCartGoodsData[goodsKey] = false
            })
        }
        newCartGoodsData[itemKey] = !templateChecked
        //更新总UI
        this.updateCart({
            ...newCartGoodsData,
        })
    },
    handleGoAddPromotionOn: function (e) {
        let promotionId = e.currentTarget.dataset.promotionId
        let itemIndex = e.currentTarget.dataset.itemIndex
        console.log('promotionId:' + promotionId + 'itemIndex:' + itemIndex)
        let promotionGoods = this.data.cartGoods.promotionGoods[itemIndex]
        let promotion = promotionGoods.promotion_info
        let checkList = []
        promotionGoods.valid_goods_info.forEach((goods) => {
            if (goods.checked) {
                let max_discount_value = Math.max(this.data.memberDiscount, goods.user_discount)
                checkList.push({
                    goodsId: goods.goods_id,
                    carId: goods.shopping_car_id,
                    img: goods.sku_img,
                    name: goods.goods_name,
                    price: goods.sku_price,
                    quantity: goods.sku_count,
                    skuId: goods.sku_id,
                    shopSkuId: goods.shop_goods_sku_id,
                    attrValue: goods.sku_attr_value,
                    freightId: goods.freight_id,
                    user_discount: goods.user_discount,
                    max_discount: max_discount_value,
                    promotion_id: goods.promotion_id,
                    is_exchange: goods.is_exchange,
                })
            }
        })
        let makeUpData = {
            promotion: promotion,
            checkList: checkList,
        }
        console.log(makeUpData)
        promotionModel.makeUpData = makeUpData
        promotionModel.barterCheckedList.delete(promotion.id)
        wx.navigateTo({
            url: `/packageMainSecondary/promotionMakeUp/promotionMakeUp?from_barter=${promotionGoods.enable_exchane ? 1 : 0}`,
        })
    },
    handleGoAddOn(e) {
        // source 1 购物车 2 结算页
        // freeType 1 凑件  2 凑单
        let freightTemplateId = e.currentTarget.dataset.freightId // 运费模板id
        let needNum = e.currentTarget.dataset.needNum
        let freeType = e.currentTarget.dataset.freeType
        console.log('needNum', needNum)
        orderModel.orderCheckList = []
        wx.navigateTo({
            url: '/pages/freightFree/freightFree?source=1&freeType=' + freeType + '&freightTemplateId=' + freightTemplateId + '&needNum=' + needNum,
            success: function (e) {},
        })
    },
    getUserDiscount() {
        return userShopInfoModel.queryUserShopInfo({}).then((res) => {
            if (res['user_info']) {
                console.log('memberDiscount', res['user_info'].discount_value)
                this.setData({
                    memberDiscount: res['user_info'].discount_value || 0,
                })
            }
        })
    },
})
