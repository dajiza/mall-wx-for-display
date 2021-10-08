import screenConfig from '../../utils/screen_util'
import loading from '../../utils/loading_util'
const config = require('../../config/config')

const loginWatch = require('../../utils/loginWatch')
const phoneNumWatch = require('../../utils/phoneNumWatch')
const cartModel = require('../../models/cart')
const orderModel = require('../../models/order')
const goodsModel = require('../../models/goods')
const util = require('../../utils/util')

const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const app = getApp()

App.Page({
    data: {
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        navTitle: '扫码下单',
        topHeight: '',
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        scanTop: Number(app.globalData.statusBarHeight) + 46 + 25 + 'px',
        safeAreaInsetBottom: safeAreaInsetBottom,
        page: 1,
        limit: 20,
        is_all: false, // 已经是全部了哦
        isPullDown: false, // 上拉刷新操作
        bottomLoadingShow: false,
        loading_finish: false, // 请求完成
        isEdit: false,
        goodsPopShow: false,

        isFirstLoad: true,
        validCartGoods: [], // 有效商品列表
        invalidCartGoods: [], // 失效商品列表
        invalidSkuGoodsCount: 0, // 有效商品 当前不可用sku
        checkedGoodsCount: 0, // 选中商品总数量
        checkedGoodsAmount: 0, // 选中商品总金额
        checkedInvalidCartGoodsCount: 0, // 选中失效商品总数量
        cartTotal: {
            checkedGoodsCount: 0, // 选中商品总数量
            checkedGoodsAmount: 0, // 选中商品总金额
        },
        showDeleteConfirmDialog: false,
        scan_goods_id: 0, // 扫码商品id
        scan_goods_info: {}, // 扫码商品详情
        scan_sku_info: {}, // 扫码商品sku详情
        skuCountTotal: 0, // 口袋总件数
    },
    //不用于数据绑定的全局数据
    tempData: {
        refreshState: 0,
        onHide: null,
        fromScan: false,
    },
    events: {},
    onLoad: function (options) {
        const rem = 750 / wx.getSystemInfoSync().windowWidth
        let topHeight = Number(app.globalData.statusBarHeight * rem) + Number(46 * rem) + 336 + 'rpx'
        // 获取状态 是否第一次打开
        this.setData({
            topHeight: topHeight,
        })
        loginWatch.observer(
            this,
            () => {
                if (this.lifecycler === 'onLoad') {
                    // 获取口袋商品列表
                    this.getPocketGoods()
                }
            },
            '/pages/codeOrder/codeOrder',
            true
        )
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        let onHide = this.tempData.onHide
        console.log('onShow onHide:' + onHide)
        console.log('onShow fromScan:' + this.tempData.fromScan)
        if (onHide == null) {
            return
        }
        if (this.tempData.fromScan) {
            this.tempData.fromScan = false
            return
        }
        if (onHide) {
            //从hide恢复过来
            this.getPocketGoods()
            this.tempData.onHide = false
        }
    },
    onHide: function () {
        console.log('onHide')
        this.tempData.onHide = true
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        this.setData(
            {
                isPullDown: true,
                page: 1,
                is_all: false,
            },
            () => {
                // 获取口袋商品列表
                this.getPocketGoods()
            }
        )
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        // 到底喽～
    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // },

    /**
     * 页面滚动
     */
    onPageScroll: function (e) {},
    /**
     * 返回箭头
     */
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

    /**
     * 点击商品-前往商品详情
     */
    handleGoGoodsDetail(res) {
        const goods_id = Number(res.currentTarget.dataset.id)
        wx.navigateTo({
            url: '../goodsDetail/goodsDetail' + '?goodsId=' + goods_id,
        })
    },

    /**
     * 扫码
     */
    scanCode(res) {
        let that = this
        that.tempData.fromScan = true
        console.log('that.tempData.fromScan', that.tempData.fromScan)
        wx.scanCode({
            success(res) {
                if (res.result && that.isJson(res.result)) {
                    let _obj = JSON.parse(res.result)
                    if (_obj.type === 1 && _obj.code) {
                        wx.showLoading({
                            title: '正在识别...',
                        })
                        let product_code = that.backProductCode(_obj.code)
                        // 请求商品
                        cartModel
                            .queryCodeSearchGoods(product_code)
                            .then((res) => {
                                goodsModel
                                    .queryGoodsDetail(res.goods_id)
                                    .then((detail_res) => {
                                        let sku_info = {}
                                        detail_res.goods_sku_list.forEach((ev) => {
                                            if (ev.sku_id === res.sku_id) {
                                                sku_info = ev
                                            }
                                        })
                                        let skuAttrValue = that.backSkuValue(sku_info.sku_attr)
                                        let scan_goods_info = {
                                            goods_id: res.goods_id,
                                            sku_id: res.sku_id,
                                            goods_name: detail_res.goods_info.goods_name,
                                            sku_attr_value: skuAttrValue,
                                            sku_price: sku_info.sku_price,
                                            sku_img: sku_info.sku_img,
                                            sku_count: 1,
                                            sku_stock: sku_info.stock_value,
                                        }
                                        that.setData({
                                            scan_goods_id: Number(res.goods_id),
                                            scan_goods_info: scan_goods_info,
                                            scan_sku_info: sku_info,
                                            goodsPopShow: true,
                                        })
                                        wx.hideLoading()
                                    })
                                    .catch(() => {})
                            })
                            .catch((err) => {
                                // wx.hideLoading()
                                // 搜索商品失败、商品未上架、商品失效
                            })
                    } else {
                        wx.showToast({
                            title: '抱歉，无法识别',
                            icon: 'none',
                            duration: 2000,
                        })
                    }
                } else {
                    wx.showToast({
                        title: '抱歉，无法识别',
                        icon: 'none',
                        duration: 2000,
                    })
                }
            },
        })
    },
    isJson($string) {
        try {
            if (typeof JSON.parse($string) == 'object') return true
            return false
        } catch (e) {
            console.log(e)
            return false
        }
    },
    backProductCode(code) {
        if (code.indexOf('-') > -1) {
            return code.split('-')[0]
        } else {
            return code
        }
    },
    backSkuValue(sku_attr) {
        let sku_value = ''
        let sku_value_arr = []
        sku_attr.forEach((ev) => {
            sku_value_arr.push(ev.value)
        })
        sku_value = sku_value_arr.join(' ')
        return sku_value
    },

    /**
     * 请求口袋商品列表
     */
    getPocketGoods: function (callback, showLoading = true) {
        let checkCode = util.checkToken()
        if (checkCode != 0) {
            return
        }
        if (this.data.isPullDown) {
            wx.showLoading({
                title: '刷新中...',
            })
        } else {
            wx.showLoading({
                title: '加载中...',
            })
        }
        cartModel
            .getPocketGoods()
            .then((res) => {
                return this.convertReqDataToUI(res)
            })
            .then((pocketGoods) => {
                //隐藏导航条加载动画
                wx.hideLoading()
                wx.hideNavigationBarLoading()
                if (this.data.isPullDown) {
                    //停止下拉刷新
                    wx.stopPullDownRefresh()
                }
                this.diffOldCartGoods(pocketGoods)
                if (this.data.isFirstLoad) {
                    //第一次初始化，默认全部不选，不用计算价格
                    this.setData(
                        {
                            isFirstLoad: false,
                            validCartGoods: pocketGoods.validCartGoods,
                            invalidCartGoods: pocketGoods.invalidCartGoods,
                        },
                        () => {
                            console.log('validCartGoods', this.data.validCartGoods)
                        }
                    )
                } else {
                    //用户操作导致的数据更新，需保留选中状态，以及计算价格
                    this.updateCart({
                        isFirstLoad: false,
                        validCartGoods: pocketGoods.validCartGoods,
                        invalidCartGoods: pocketGoods.invalidCartGoods,
                    })
                }
                this.setData({
                    isPullDown: false,
                    loading_finish: true,
                })
                if (callback) {
                    callback()
                }
            })
            .catch((err) => {
                wx.hideLoading()
                if (callback) {
                    callback(err)
                }
            })
    },

    toggle: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let itemValid = e.currentTarget.dataset.itemValid
        if (itemValid) {
            let checkbox = this.selectComponent('#checkbox_' + itemIndex)
            checkbox.toggle()
        }
    },

    // 勾选||取消 模板 单个商品
    checkedItem: function (e) {
        //item选中事件
        let newCartGoodsData = {}
        let itemIndex = Number(e.currentTarget.dataset.itemIndex)
        let itemValid = e.currentTarget.dataset.itemValid
        let itemType = Number(e.currentTarget.dataset.itemType)
        let checked
        if (itemType === 2) {
            // 失效
            checked = this.data.invalidCartGoods[itemIndex].checked
            let invalidCartGoodsItemKey = 'invalidCartGoods' + '[' + itemIndex + '].checked'
            this.data.invalidCartGoods[itemIndex].checked = !checked
            newCartGoodsData[invalidCartGoodsItemKey] = !checked
        } else {
            // 有效
            checked = this.data.validCartGoods[itemIndex].checked
            let validCartGoodsItemKey = 'validCartGoods' + '[' + itemIndex + '].checked'
            this.data.validCartGoods[itemIndex].checked = !checked
            newCartGoodsData[validCartGoodsItemKey] = !checked
        }

        //更新UI
        this.setData(
            {
                ...newCartGoodsData,
            },
            () => {
                this.backCheckedCount()
            }
        )
    },
    catchTapDummy: function (e) {},

    handleOnEdit() {
        let isEdit = this.data.isEdit
        if (isEdit) {
            //当前已是编辑模式，执行完成操作。重置失效商品的选中状态，有效货物状态保持，根据新的选中的商品更新UI
            let newCartGoodsData = {}
            this.data.validCartGoods.forEach((item, index) => {
                if (item.checked && item.sku_status == 1) {
                    //恢复被选中的sku无效商品
                    item.checked = false
                    let validCartGoodsItemKey = 'validCartGoods' + '[' + index + '].checked'
                    newCartGoodsData[validCartGoodsItemKey] = false
                }
            })
            this.data.invalidCartGoods.forEach((item, index) => {
                item.checked = false
                let invalidCartGoodsItemKey = 'invalidCartGoods' + '[' + index + '].checked'
                newCartGoodsData[invalidCartGoodsItemKey] = false
            })
            //更新UI
            this.updateCart({
                ...newCartGoodsData,
                isEdit: !isEdit,
            })
        } else {
            //当前非编辑模式，开启编辑模式
            this.setData({
                isEdit: !isEdit,
            })
        }
    },

    //商品数量修改 bengin
    goodsNumPlus: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        this.onGoodsNumChange(itemIndex)
    },
    goodsNumMinus: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        this.onGoodsNumChange(itemIndex)
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
        let stepper = this.selectComponent('#stepper_' + shoppingCarId)
        let item = this.data.validCartGoods[itemIndex]
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
            if (changedNum === 0) {
                stepper.setData({
                    currentValue: 1,
                })
            }
        }
        this.onGoodsNumChange(itemIndex)
    },
    goodsNumChange: function (e) {
        //货物数量变化事件，保存号不处理，在goodsNumPlus，goodsNumMinus，goodsNumInputBlur事件中处理
        let shoppingCarId = e.currentTarget.dataset.shoppingCarId
        let itemIndex = e.currentTarget.dataset.itemIndex
        let changedNum = e.detail
        if (!Number.isInteger(changedNum)) {
            changedNum = Number.parseInt(changedNum)
        }
        let item = this.data.validCartGoods[itemIndex]
        if (changedNum > item.sku_stock) {
            return
        }
        item.changedNum = changedNum
    },
    onGoodsNumChange: function (itemIndex) {
        let item = this.data.validCartGoods[itemIndex]
        let changedNum = item.changedNum
        if (changedNum == item.sku_count) {
            console.log('数量没有变化')
            return
        }
        //每次数量变化都需上报后台
        //请求后台，失败则恢复数量，不执行后续逻辑
        this.updatePocketGoods(itemIndex, item.shopping_car_id, item.sku_id, item.goods_id, changedNum, item.sku_price)
    },

    preventTouchMove() {},

    handleGoodsPopupCancel() {
        this.setData({
            goodsPopShow: false,
        })
    },

    // 展开选sku弹框
    openSpec: function (e) {
        // goodsType 1 扫码商品  2 有效商品 3 失效商品
        let item
        let itemIndex = Number(e.currentTarget.dataset.itemIndex)
        let goodsType = Number(e.currentTarget.dataset.goodsType)
        if (goodsType === 1) {
            // 扫码商品
            item = this.data.scan_goods_info
        } else if (goodsType === 2) {
            item = this.data.validCartGoods[itemIndex]
        } else if (goodsType === 3) {
            item = this.data.invalidCartGoods[itemIndex]
        }
        loading.showLoading()
        goodsModel
            .queryGoodsDetail(item.goods_id)
            .then((res) => {
                console.log(res)
                // item.attr = res.attr_info
                // item.goods = res.goods_info
                // item.sku = res.goods_sku_list
                let spec = this.selectComponent('#spec')
                loading.hideLoading()
                spec.setData({
                    value: item.sku_id,
                    attr: res.attr_info,
                    goods: res.goods_info,
                    sku: res.goods_sku_list,
                    isShow: true,
                    quantity: Math.min(item.sku_count, item.sku_stock),
                    parameters: {
                        itemIndex: itemIndex,
                        goodsType: goodsType,
                    },
                })
            })
            .catch((err) => {
                console.log(err)
                loading.hideLoading()
            })
    },
    // 选择sku
    confirmSpec: function ({ detail }) {
        let newSkuId = detail.skuId
        let changedNum = detail.quantity
        let price = detail.price
        let itemIndex = detail.parameters.itemIndex
        let goodsType = detail.parameters.goodsType
        let item
        if (goodsType === 1) {
            // 扫码
            // 重新赋值
            let skuAttrValue = this.backSkuValue(detail.attr)
            let scan_goods_info = {
                goods_id: detail.goodsId,
                sku_id: detail.skuId,
                goods_name: detail.name,
                sku_attr_value: skuAttrValue,
                sku_price: price,
                sku_img: detail.img,
                sku_count: changedNum,
            }
            this.setData({
                scan_goods_info: scan_goods_info,
            })
        } else if (goodsType === 2) {
            item = this.data.validCartGoods[itemIndex]
            // 重新选中sku完成，更新 列表
            this.updatePocketGoods(itemIndex, item.shopping_car_id, newSkuId, item.goods_id, changedNum, price)
        } else if (goodsType === 3) {
            item = this.data.invalidCartGoods[itemIndex]
            // 重新选中sku完成，更新 列表
            this.updatePocketGoods(itemIndex, item.shopping_car_id, newSkuId, item.goods_id, changedNum, price)
        }
    },
    // 关闭sku选择框
    closeSpec: function (e) {
        this.selectComponent('#spec').close()
    },

    //删除选中列表 begin
    deleteConfirm: function (event) {
        let checkedCount = this.data.checkedGoodsCount
        if (checkedCount == 0) {
            return
        }
        let showDeleteConfirmDialog = this.data.showDeleteConfirmDialog
        this.setData({
            showDeleteConfirmDialog: !showDeleteConfirmDialog,
        })
    },
    // 确定删除
    onDeleteConfirm: function (event) {
        //删除选中的商品列表
        let checkedCount = this.data.checkedGoodsCount
        console.log('checkedCount', checkedCount)
        if (checkedCount == 0) {
            return
        }
        let checkedGoods = this.data.validCartGoods
            .filter((item) => {
                return item.checked
            })
            .concat(
                this.data.invalidCartGoods.filter((item) => {
                    return item.checked
                })
            )
        if (checkedGoods.length == 0) {
            return
        }
        //删除的列表上报后台
        //后台返回成功后，更新本地数据，失败则中断业务，不执行后续代码
        //获取最新的列表，全部未选中，无需同步更新价格
        let shoppingCarIds = ''
        checkedGoods.forEach((element) => {
            shoppingCarIds = shoppingCarIds + element.shopping_car_id + ','
        })
        shoppingCarIds = shoppingCarIds.substring(0, shoppingCarIds.length - 1)
        loading.showLoading()
        cartModel
            .deletePocketGoods(shoppingCarIds)
            .then((res) => {
                // 渲染ui
                return this.convertReqDataToUI(res)
            })
            .then((pocketGoods) => {
                loading.hideLoading()
                this.setData({
                    validCartGoods: pocketGoods.validCartGoods,
                    invalidCartGoods: pocketGoods.invalidCartGoods,
                    isEdit: false,
                    checkedGoodsCount: 0,
                    checkedGoodsAmount: 0,
                })
            })
            .catch((err) => {
                console.log(err)
                loading.hideLoading()
            })
    },
    // 关闭确认删除弹框
    onDeleteConfirmDialogClose: function (event) {
        this.setData({
            showDeleteConfirmDialog: false,
        })
    },

    backCheckedCount() {
        let checkedGoodsCount = 0,
            checkedGoodsAmount = 0
        checkedGoodsCount = this.checkCartGoodsCount(this.data.validCartGoods)
        this.data.validCartGoods.forEach((ev) => {
            if (ev.checked) {
                checkedGoodsAmount = checkedGoodsAmount + ev.sku_price * ev.sku_count
            }
        })
        if (this.data.isEdit) {
            checkedGoodsCount = checkedGoodsCount + this.checkCartGoodsCount(this.data.invalidCartGoods)
        }
        this.setData({
            checkedGoodsCount: checkedGoodsCount,
            checkedGoodsAmount: checkedGoodsAmount,
        })
    },
    // 全选
    onAllCheckBoxChangeToggle: function (event) {
        let component = this.selectComponent('#checkbox_all')
        component.toggle()
    },

    onAllCheckBoxChange: function (event) {
        let isCheckAll = event.detail
        let newCartGoodsData = {}
        this.checkAllGoods(newCartGoodsData, isCheckAll)
        this.setData(
            {
                ...newCartGoodsData,
            },
            () => {
                this.backCheckedCount()
            }
        )
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
    checkAllGoods(newCartGoodsData, isCheckAll) {
        if (isCheckAll) {
            // 是否编辑
            let isEdit = this.data.isEdit
            if (isEdit) {
                this.data.validCartGoods.forEach((item, index) => {
                    item.checked = true
                    let validCartGoodsItemKey = 'validCartGoods' + '[' + index + '].checked'
                    newCartGoodsData[validCartGoodsItemKey] = true
                })
                this.data.invalidCartGoods.forEach((item, index) => {
                    item.checked = true
                    let invalidCartGoodsItemKey = 'invalidCartGoods' + '[' + index + '].checked'
                    newCartGoodsData[invalidCartGoodsItemKey] = true
                })
            } else {
                this.data.validCartGoods.forEach((item, index) => {
                    let vaild = true
                    vaild = item.sku_status == 2 && item.sku_count <= item.sku_stock
                    if (vaild) {
                        item.checked = true
                        let validCartGoodsItemKey = 'validCartGoods' + '[' + index + '].checked'
                        newCartGoodsData[validCartGoodsItemKey] = true
                    }
                })
            }
        } else {
            //取消全选
            this.data.validCartGoods.forEach((item, index) => {
                item.checked = false
                let validCartGoodsItemKey = 'validCartGoods' + '[' + index + '].checked'
                newCartGoodsData[validCartGoodsItemKey] = false
            })
            this.data.invalidCartGoods.forEach((item, index) => {
                item.checked = false
                let invalidCartGoodsItemKey = 'invalidCartGoods' + '[' + index + '].checked'
                newCartGoodsData[invalidCartGoodsItemKey] = false
            })
        }
    },
    // 更改口袋商品
    updatePocketGoods: function (itemIndex, shoppingCarId, skuId, goodsId, changedNum, price) {
        loading.showLoading()
        this.setData({
            overlayShow: true,
        })
        cartModel
            .updatePocketGoods({
                shopping_car_id: shoppingCarId,
                sku_id: skuId,
                goods_id: goodsId,
                count: changedNum,
                price: price,
            })
            .then((res) => {
                //同步获取最新的列表数据
                return this.convertReqDataToUI(res)
            })
            .then((pocketGoods) => {
                loading.hideLoading()
                this.setData({
                    overlayShow: false,
                })
                //同步有效的选中状态，需同步更新价格
                let shopping_car_id = this.data.validCartGoods[itemIndex].shopping_car_id
                this.diffOldCartGoods(pocketGoods)
                let item
                pocketGoods.validCartGoods.forEach((good) => {
                    if (good.shopping_car_id === shopping_car_id) {
                        item = good
                    }
                })
                // let item = cartGoods.validCartGoods.find((goods) => {
                //     return goods.shopping_car_id == shopping_car_id
                // })
                if (item) {
                    //原则上不需要添加这句代码，实际情况请求成功后，新的sku_count值一定和changedNum一致的
                    item.sku_count = changedNum
                    if (item.checked) {
                        console.log('updatePocketGoods 商品选中')
                    } else {
                        console.log('updatePocketGoods 商品未选中')
                    }
                } else {
                    console.log('updatePocketGoods 商品不存在，比如合并为同一个sku了')
                }
                this.updateCart({
                    validCartGoods: pocketGoods.validCartGoods,
                    invalidCartGoods: pocketGoods.invalidCartGoods,
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
    diffOldCartGoods: function (pocketGoods) {
        pocketGoods.validCartGoods.forEach((newGood) => {
            this.data.validCartGoods.forEach((oldGood) => {
                if (newGood.shopping_car_id == oldGood.shopping_car_id) {
                    newGood.checked = oldGood.checked
                }
            })
        })
        let isEdit = this.data.isEdit
        if (isEdit) {
            //编辑模式下刷新购物车，无效商品也需要比较
            pocketGoods.invalidCartGoods.forEach((newGood) => {
                this.data.invalidCartGoods.forEach((oldGood) => {
                    if (newGood.shopping_car_id == oldGood.shopping_car_id) {
                        newGood.checked = oldGood.checked
                    }
                })
            })
        }
    },

    updateCart: function (checkedState) {
        let checkedGoodsCount = 0
        let checkedGoodsAmount = 0
        //获取之前的汇总数据
        //正式更新数据并通知UI更新
        this.setData(
            {
                ...checkedState,
            },
            () => {
                this.data.validCartGoods.forEach((element) => {
                    if (element.checked) {
                        checkedGoodsAmount = checkedGoodsAmount + element.sku_price * element.sku_count
                    }
                })
                let checkedInvalidCartGoodsCount = this.checkCartGoodsCount(this.data.invalidCartGoods)
                checkedGoodsCount = this.backCheckedGoodsCount()
                this.setData(
                    {
                        checkedGoodsCount: checkedGoodsCount,
                        checkedGoodsAmount: checkedGoodsAmount,
                        checkedInvalidCartGoodsCount: checkedInvalidCartGoodsCount,
                    },
                    () => {}
                )
            }
        )
    },

    convertReqDataToUI: function (reqData) {
        let validCartGoods = reqData.valid_goods_info || []
        let invalidCartGoods = reqData.invalid_goods_info || []
        let invalidSkuGoodsCount = 0
        if (validCartGoods.length > 0) {
            //有效商品
            validCartGoods.forEach((good) => {
                if (good.sku_status == 1) {
                    //sku失效
                    invalidSkuGoodsCount++
                }
                //金额
                good.retail_price_str = (parseFloat(good.sku_price) / 100).toFixed(2)
                good.in_valid_reason = ''
                good.checked = false
                good.sku_img = good.sku_img + '!upyun520/fw/400'
            })
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
        }
        // 计算口袋总件数
        let skuCountTotal = validCartGoods.reduce((total, item) => total + item.sku_count, 0)

        this.setData({ skuCountTotal })
        // 有效商品总计
        let validCartGoodsCount = validCartGoods.length
        this.setData({
            ['validCartGoodsCountKey']: validCartGoodsCount,
        })
        return {
            validCartGoods: validCartGoods,
            invalidCartGoods: invalidCartGoods,
            invalidSkuGoodsCount: invalidSkuGoodsCount,
            validCartGoodsCount: validCartGoodsCount,
        }
    },

    // 返回选中商品数量
    backCheckedGoodsCount() {
        let all_goods_count = 0,
            common_goods_count = 0, // 普通商品选中数量
            invalid_goods_count = 0 // 失效商品选中数量
        common_goods_count = this.checkCartGoodsCount(this.data.validCartGoods)
        invalid_goods_count = this.checkCartGoodsCount(this.data.invalidCartGoods)
        if (this.data.isEdit) {
            all_goods_count = common_goods_count + invalid_goods_count
        } else {
            all_goods_count = common_goods_count
        }
        return all_goods_count
    },
    // 加入口袋
    handleJoinPocket() {
        let specInfo = this.data.scan_goods_info
        cartModel
            .addToPocketGoods(specInfo.sku_id, specInfo.goods_id, specInfo.sku_count, specInfo.sku_price)
            .then((res) => {
                wx.showToast({
                    title: '加入口袋成功',
                    icon: 'none',
                    duration: 2000,
                })
                // 刷新列表
                this.getPocketGoods()
                this.setData(
                    {
                        goodsPopShow: false,
                    },
                    () => {}
                )
            })
            .catch(() => {})
    },

    // 重新扫码
    scanCodeAgain() {
        this.setData(
            {
                goodsPopShow: false,
            },
            () => {
                this.scanCode()
            }
        )
    },

    // 去结算
    onSubmit: function (e) {
        if (this.data.checkedGoodsAmount > 0 && this.data.checkedGoodsCount > 0) {
            phoneNumWatch.observer(this, () => {
                orderModel.orderCheckList = []
                this.data.validCartGoods.forEach((good) => {
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
                        })
                    }
                })
                wx.navigateTo({
                    url: '/pages/orderCheck/orderCheck',
                })
            })
        }
    },
})
