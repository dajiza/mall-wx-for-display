// component/stepper/stepper.js
const adj = require('../../utils/adjacency')
const cartModel = require('../../models/cart')
const orderModel = require('../../models/order')
const tool = require('../../utils/tool')

const loginWatch = require('../../utils/loginWatch')
const phoneNumWatch = require('../../utils/phoneNumWatch')

Component({
    properties: {
        attr: {
            type: Object,
        },
        goods: {
            type: Object,
        },
        sku: {
            type: Object,
        },
        quantity: {
            type: Number,
            value: 1,
        },
        //指定sku_id，不为0时，强制显示sku_id对应的sku内容
        value: {
            type: Number,
            value: 0,
        },
        //透传参数，原封不动返回
        parameters: {
            type: Object,
        },
        // 添加购物车 还是 立即购买 'cart'默认添加购物车 'buy'立即购买
        mark: {
            type: String,
            value: 'default',
        },
        // 会员折扣
        memberDiscount: {
            type: Number,
            value: 0,
        },
        // 看看分享用
        commissionType: {
            type: Number,
            value: 0,
        },
        // 看看分享用
        commissionUserId: {
            type: Number,
            value: 0,
        },
    },
    options: {
        styleIsolation: 'shared',
    },
    data: {
        specList: [], //生成规格列表
        goodsAttr: [], //生成商品信息规格列表
        specOption: [], //可选的规格
        listChecked: [], //选中的规格
        sizeText: [], //规格显示文字
        isAddCard: true, //加入购物车按钮禁用 true 禁用 false 启用

        // quantity: 1, //购物车数量
        isShow: false, //组件整体显示

        initSku: {}, //没选中时显示的sku
        checkedSku: {}, //当前选中的sku
        safeAreaInsetBottom: 0,
        previewList: [],
        previewIndex: 0,
        maxDiscount: 0,
        memberDiscountValue: 0,

        skuIdChecked: 0, //选中的skuid
        maxPrice: 0,
        minPrice: 0,
    },
    methods: {
        checkLogin: tool.checkLogin,
        gotoLogin: tool.gotoLogin,
        onBeforeEnter() {
            let systemInfo = wx.getSystemInfoSync()
            let windowHeight = systemInfo.windowHeight
            let safeArea = systemInfo.safeArea
            let safeAreaInsetBottom = windowHeight - safeArea.bottom
            this.setData({
                safeAreaInsetBottom: safeAreaInsetBottom,
            })
        },

        onEnter() {
            // 生成规格信息列表
            let attr = this.data.attr
            let goods = this.data.goods
            let sku = this.data.sku
            let value = this.data.value
            let listChecked = []
            let quantity = this.data.quantity

            if (value != 0) {
                //指定sku_id，不为0时，强制显示sku_id对应的sku内容
                listChecked = []
                this.setData({
                    skuIdChecked: value,
                })
            }
            // if (value == 0 && listChecked.length == 0) {
            //     //第一次弹出sku选择框，找到第一个库存不为零的sku
            //     let firstSku = sku.find((item) => item.stock_value > 0)
            //     value = firstSku ? firstSku.sku_id : 0
            // }
            let specList = []
            let stock = 0
            for (let i = 0; i < attr.length; i++) {
                const element = attr[i]
                specList.push({
                    title: element,
                    list: [],
                })
            }
            let listCheckedData = {}
            for (let j = 0; j < sku.length; j++) {
                const skuItem = sku[j]
                stock += skuItem.stock_value
                for (let k = 0; k < skuItem.sku_attr.length; k++) {
                    const skuAttrItem = skuItem.sku_attr[k]
                    for (let m = 0; m < specList.length; m++) {
                        const specItem = specList[m]
                        if (specItem.title == skuAttrItem.title) {
                            if (specItem.list.indexOf(skuAttrItem.value) == -1) {
                                specItem.list.push(skuAttrItem.value)
                            }
                        }
                    }
                }
                if (skuItem.sku_id == value) {
                    skuItem.sku_attr.forEach((attr) => {
                        specList.forEach((spec) => {
                            if (spec.title == attr.title) {
                                let index = spec.list.indexOf(attr.value)
                                if (index != -1) {
                                    listCheckedData[attr.title] = index
                                    // listChecked.push(index);
                                }
                            }
                        })
                    })
                }
            }

            if (value != 0) {
                this.checkSkuBySkuId(value)
            }
            // 生成最低价-最高价
            let priceList = sku.map((item) => item.sku_price)
            let maxPrice = Math.max(...priceList)
            let minPrice = Math.min(...priceList)
            // 生成商品信息规格列表
            let goodsAttr = []
            for (let i = 0; i < sku.length; i++) {
                const skuItem = sku[i]
                let specs = []
                for (let j = 0; j < skuItem.sku_attr.length; j++) {
                    const attrItem = skuItem.sku_attr[j]
                    specs.push(attrItem.value)
                }
                goodsAttr.push({
                    skuId: skuItem.sku_id,
                    shopSkuId: skuItem.shop_sku_id,
                    img: skuItem.sku_img,
                    price: skuItem.sku_price,
                    stock: skuItem.stock_value,
                    specs: specs,
                })
            }

            // 初始化规格矩阵
            let adjFun = new adj.ShopAdjoin(specList, goodsAttr)
            let specOption = adjFun.querySpecsOption([])

            // 设置未选中sku信息
            let unit = ''
            if (sku.length > 0) {
                unit = sku[0].unit
            }
            let initSku = {
                skuId: null,
                img: goods.goods_img,
                price: goods.goods_min_price,
                stock: stock,
                unit: unit,
            }
            // 生成listChecked空列表
            if (listChecked.length == 0) {
                for (let i = 0; i < attr.length; i++) {
                    listChecked.push(-1)
                }
            }
            // 生成预览规格图片列表
            let previewList = sku.filter((item) => item.stock_value > 0)
            this.setData({
                previewList,
                specList: specList,
                goodsAttr: goodsAttr,
                adjFun: adjFun,
                specOption: specOption,
                checkedSku: initSku,
                initSku: initSku,
                listChecked: listChecked,
                quantity: quantity,
                maxPrice,
                minPrice,
            })
            let stepper = this.selectComponent('#stepper')
            stepper.setData({
                currentValue: stepper.format(quantity),
            })
            // 清空选中列表
            // this.setData({
            //     listChecked: [],
            //     isAddCard: true,
            //     num: 1,
            // });
            // 生成可选规格
            this.generateOption()
            this.checkIsCard()
        },
        show() {
            this.setData({
                isShow: true,
            })
        },
        close() {
            this.checkIsCard()
            this.setData({
                isShow: false,
                skuIdChecked: 0,
                sizeText: [],
            })
            this.triggerEvent('onSpecClose')
        },
        closePreview(event) {
            this.selectComponent('#preview').close()
        },
        openPreview(e) {
            let skuId = e.currentTarget.dataset.skuid || this.data.checkedSku.skuId
            let previewList = this.data.previewList
            for (let i = 0; i < previewList.length; i++) {
                const element = previewList[i]
                if (element.sku_id == skuId) {
                    this.setData({
                        previewIndex: i,
                    })
                    break
                }
            }
            this.selectComponent('#preview').show()
        },
        preventTouchMove() {},
        // 选中规格操作
        singleTag(e) {
            // 生成选中列表
            let listChecked = this.data.listChecked

            let specList = this.data.specList
            let optionList = this.data.specOption

            let indexFather = e.currentTarget.dataset.indexFather
            let indexSon = e.currentTarget.dataset.indexSon
            let tag = e.currentTarget.dataset.tag
            // 判断是否不可选
            if (optionList.indexOf(tag) == -1) {
                return
            }
            // 判断是否已选择 选中/取消选中
            if (this.data.listChecked[indexFather] == indexSon) {
                this.setData({
                    ['listChecked[' + indexFather + ']']: -1,
                })
            } else {
                this.setData({
                    ['listChecked[' + indexFather + ']']: indexSon,
                })
            }
            // 生成规格文字
            this.generateSizeText(specList, listChecked)
            // 生成可选规格
            this.generateOption()
            this.checkIsCard()
        },
        // 根据skuId选中规格
        // checkSkuBySkuId(skuId) {
        //     let sku = this.data.sku
        //     let specList = this.data.specList
        //     let listChecked = []
        //     let value = skuId
        //     let listCheckedData = {}
        //     for (let j = 0; j < sku.length; j++) {
        //         const skuItem = sku[j]
        //         for (let k = 0; k < skuItem.sku_attr.length; k++) {
        //             const skuAttrItem = skuItem.sku_attr[k]
        //             for (let m = 0; m < specList.length; m++) {
        //                 const specItem = specList[m]
        //                 if (specItem.title == skuAttrItem.title) {
        //                     if (specItem.list.indexOf(skuAttrItem.value) == -1) {
        //                         specItem.list.push(skuAttrItem.value)
        //                     }
        //                 }
        //             }
        //         }
        //         if (skuItem.sku_id == value) {
        //             skuItem.sku_attr.forEach((attr) => {
        //                 specList.forEach((spec) => {
        //                     if (spec.title == attr.title) {
        //                         let index = spec.list.indexOf(attr.value)
        //                         if (index != -1) {
        //                             listCheckedData[attr.title] = index
        //                             // listChecked.push(index);
        //                         }
        //                     }
        //                 })
        //             })
        //         }
        //     }

        //     //指定sku_id，不为0时，强制显示sku_id对应的sku内容
        //     this.data.attr.forEach((item) => {
        //         listChecked.push(listCheckedData[item])
        //     })
        //     // 生成规格文字
        //     this.generateSizeText(specList, listChecked)
        //     this.setData({
        //         listChecked: listChecked,
        //     })
        //     // 生成可选规格
        //     this.generateOption()
        //     // 生成sku显示
        //     this.checkIsCard()
        // },
        // 根据skuId选中规格
        checkSkuBySkuId(skuId) {
            console.log('输出 ~ skuId', skuId)
            let sku = this.data.sku
            let specList = this.data.specList
            let listChecked = []
            let listCheckedData = {}

            let skuChecked = sku.find((item) => item.sku_id == skuId)
            if (skuChecked.stock_value == 0) {
                wx.showToast({
                    title: '商品库存不足',
                    icon: 'none',
                    duration: 2000,
                })
                return
            }
            this.setData({
                skuIdChecked: skuId,
            })

            // 生成规格文字
            this.generateSizeText(skuChecked)
            this.setData({
                listChecked: listChecked,
            })
            // 生成可选规格
            this.generateOption()
            // 生成sku显示
            this.checkIsCard()
        },
        getPreviewData(e) {
            this.checkSkuBySkuId(e.detail)
        },

        // 生成规格文字
        generateSizeText(skuChecked) {
            var sizeText = skuChecked.sku_attr.map((item) => item.value)

            this.setData({
                sizeText: sizeText,
            })
        },
        // 生成可选规格
        generateOption() {
            // let listChecked = this.data.listChecked
            // let specList = this.data.specList
            // let checkedText = []
            // for (let i = 0; i < listChecked.length; i++) {
            //     const checkedItem = listChecked[i]
            //     if (checkedItem > -1) {
            //         checkedText.push(specList[i].list[checkedItem])
            //     }
            // }
            // let specOption = this.data.adjFun.querySpecsOption(checkedText)
            // this.setData({
            //     specOption: specOption,
            // })
        },

        // 判断加入购物车按钮是否可按 并生成sku显示
        // checkIsCard() {
        //     // 判断是否所有规格都选了
        //     let sign = false

        //     let length = this.data.specList.length
        //     let listChecked = this.data.listChecked
        //     let specList = this.data.specList
        //     let sku = this.data.sku
        //     let goods = this.data.goods
        //     if (listChecked.length == length && listChecked.every((item) => item > -1)) {
        //         sign = false
        //         // 寻找选中的sku
        //         for (let i = 0; i < listChecked.length; i++) {
        //             const checkedItem = listChecked[i]
        //             const skuTitle = specList[i].title
        //             const skuValue = specList[i].list[checkedItem]
        //             var newSku = sku.filter((item) => {
        //                 for (let j = 0; j < item.sku_attr.length; j++) {
        //                     const attrItem = item.sku_attr[j]
        //                     if (attrItem.title == skuTitle) {
        //                         return attrItem.value == skuValue
        //                     }
        //                 }
        //             })
        //             sku = newSku
        //         }
        //         if (!newSku) {
        //             return
        //         }
        //         let max_discount_value = Math.max(this.data.memberDiscount, newSku[0].user_discount)
        //         // 赋值sku属性
        //         var checkedSku = {
        //             id: newSku[0].sku_id,
        //             skuId: newSku[0].sku_id,
        //             shopSkuId: newSku[0].shop_sku_id,
        //             img: newSku[0].sku_img,
        //             price: newSku[0].sku_price,
        //             stock: newSku[0].stock_value,
        //             unit: newSku[0].unit,
        //             attr: newSku[0].sku_attr,
        //             user_discount: newSku[0].user_discount,
        //             max_discount: max_discount_value,
        //             goodsId: goods.goods_id,
        //         }
        //     } else {
        //         sign = true
        //         var checkedSku = this.data.initSku
        //     }
        //     let max_discount = Math.max(this.data.memberDiscount, checkedSku.user_discount)
        //     this.setData({
        //         isAddCard: sign,
        //         checkedSku: checkedSku,
        //         maxDiscount: max_discount,
        //         memberDiscountValue: this.data.memberDiscount,
        //     })
        //     this.selectSpec()
        // },
        checkIsCard() {
            // 判断是否所有规格都选了
            let sign = false

            let specList = this.data.specList
            let sku = this.data.sku
            let skuIdChecked = this.data.skuIdChecked
            let goods = this.data.goods
            if (skuIdChecked) {
                sign = false
                // 寻找选中的sku
                var newSku = sku.find((item) => item.sku_id == skuIdChecked)
                if (!newSku) {
                    return
                }
                let max_discount_value = Math.max(this.data.memberDiscount, newSku.user_discount)
                // 赋值sku属性
                var checkedSku = {
                    id: newSku.sku_id,
                    skuId: newSku.sku_id,
                    shopSkuId: newSku.shop_sku_id,
                    img: newSku.sku_img,
                    price: newSku.sku_price,
                    stock: newSku.stock_value,
                    unit: newSku.unit,
                    attr: newSku.sku_attr,
                    user_discount: newSku.user_discount,
                    max_discount: max_discount_value,
                    goodsId: goods.goods_id,
                }
            } else {
                sign = true
                var checkedSku = this.data.initSku
            }
            let max_discount = Math.max(this.data.memberDiscount, checkedSku.user_discount)
            this.setData({
                isAddCard: sign,
                checkedSku: checkedSku,
                maxDiscount: max_discount,
                memberDiscountValue: this.data.memberDiscount,
            })
            this.selectSpec()
        },
        onChangeStep(event) {
            this.setData({
                quantity: event.detail,
            })
        },
        // 加入购物车/直接购买
        confirmSpec(event) {
            let pageId = this.getPageId()

            let page = getCurrentPages().find((page) => page && page.getPageId() == pageId)
            loginWatch.observer(page, () => {
                let mark = this.data.mark
                if (mark == 'default' && event.currentTarget.dataset.mark) {
                    mark = event.currentTarget.dataset.mark
                }
                let skuInfo = this.data.checkedSku
                let goods = this.data.goods
                if (this.data.isAddCard) {
                    return
                }
                if (skuInfo.stock == 0) {
                    wx.showToast({
                        title: '商品库存不足',
                        icon: 'none',
                        duration: 2000,
                    })
                    return
                }
                // this.setData({
                //     ["goods.spec"]: this.data.listChecked,

                //     ["goods.num"]: this.data.num,
                // });

                skuInfo.quantity = this.data.quantity
                skuInfo.name = goods.goods_name
                skuInfo.goodsId = goods.goods_id
                skuInfo.freightId = goods.freight_id
                //返回透传参数
                skuInfo.parameters = this.data.parameters

                if (mark == 'buy') {
                    this.buyNow(skuInfo)
                } else if (mark == 'confirm') {
                    //不做任何业务处理，只是返回对应的sku相关信息，交由外部自行处理业务逻辑
                    this.triggerEvent('confirm', skuInfo)
                    this.close()
                } else if (mark == 'cart') {
                    this.addCart(skuInfo)
                    this.close()
                }
            })
        },
        // 只选中规格 不做其他操作
        selectSpec(event) {
            // let pageId = this.getPageId()
            // let page = getCurrentPages().find((page)=>page.getPageId()==pageId);
            // let mark = this.data.mark;
            // if (mark == "default" && event.currentTarget.dataset.mark) {
            //     mark = event.currentTarget.dataset.mark;
            // }
            // console.log(mark);
            let skuInfo = this.data.checkedSku
            let goods = this.data.goods
            if (this.data.isAddCard) {
                return
            }
            if (skuInfo.stock == 0) {
                wx.showToast({
                    title: '商品库存不足',
                    icon: 'none',
                    duration: 2000,
                })
                return
            }

            skuInfo.quantity = this.data.quantity
            skuInfo.name = goods.goods_name
            //返回透传参数
            skuInfo.parameters = this.data.parameters
            //不做任何业务处理，只是返回对应的sku相关信息，交由外部自行处理业务逻辑
            this.triggerEvent('selectSpec', skuInfo)
        },
        addCart(specInfo) {
            // let specInfo = this.data.specInfo
            let pageId = this.getPageId()
            let page = getCurrentPages().find((page) => page && page.getPageId() == pageId)
            loginWatch.observer(page, () => {
                let goods = this.data.goods
                if (specInfo.skuId) {
                    // specInfo.
                    cartModel
                        .getCartGoods()
                        .then((res) => {
                            let validCartGoods = res.valid_goods_info
                            if (validCartGoods) {
                                let cartGoods = validCartGoods.find((item) => {
                                    return specInfo.skuId == item.sku_id && goods.goods_id == item.goods_id
                                })
                                if (cartGoods) {
                                    //购物车已有同样的商品
                                    if (cartGoods.sku_count + specInfo.quantity > cartGoods.sku_stock) {
                                        //本次添加将超出商品最大库存，中断
                                        return false
                                    }
                                }
                            }
                            return true
                        })
                        .then((result) => {
                            if (result) {
                                return cartModel
                                    .addToCartGoods(specInfo.skuId, goods.goods_id, specInfo.quantity, specInfo.price, 0, 0, this.data.commissionType, this.data.commissionUserId)
                                    .then((res) => {
                                        wx.showToast({
                                            title: '添加成功~',
                                            icon: 'none',
                                            duration: 2000,
                                        })
                                        this.triggerEvent('addCard', specInfo)
                                    })
                            } else {
                                wx.showToast({
                                    title: '购买数量已超出商品可用库存~',
                                    icon: 'none',
                                    duration: 2000,
                                })
                            }
                        })
                }
            })
        },

        // 立即购买
        buyNow(specInfo) {
            // let specInfo = this.data.specInfo
            specInfo['commission_type'] = this.data.commissionType
            specInfo['commission_user_id'] = this.data.commissionUserId
            let skuList = []
            skuList.push(specInfo)
            orderModel.orderCheckList = skuList
            // 直接购买无促销信息
            orderModel.orderCheckPromotion = []
            let pageId = this.getPageId()
            let page = getCurrentPages().find((page) => page && page.getPageId() == pageId)

            phoneNumWatch.observer(page, () => {
                wx.navigateTo({
                    url: '/pages/orderCheck/orderCheck',
                })
            })
        },
        // 新版sku选中

        chooseSku(e) {
            console.log('输出 ~ e', e)
            let skuId = e.currentTarget.dataset.skuid
            this.checkSkuBySkuId(skuId)
        },
    },
})
