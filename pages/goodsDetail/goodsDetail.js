// pages/goodsDetail/goodsDetail.js
const goodsModel = require('../../models/goods')
const promotionModel = require('../../models/promotion')
const tool = require('../../utils/tool')
const config = require('../../config/config')
const userShopInfoModel = require('../../models/userShopInfo')
const commentModel = require('../../models/comment')

const loginWatch = require('../../utils/loginWatch')
const util = require('../../utils/util')
const constant = require('../../config/constant')

const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        constant,
        title: '',
        activeTab: 0,
        tabShow: false,
        scrollNow: false,
        topArr: [0],
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        isOverShare: true,
        current: 0,
        goodsId: '',
        specInfo: {}, //选中的规格信息
        selectedList: [], //选中的规格值信息
        cartNum: 0, //购物车数量
        isLogin: true,
        isShowShare: false,
        attr: [],
        goods: {},
        sku: [],
        specList: [],
        attrList: [],
        selectedSku: [],
        showName: true,
        specShow: false, //spec显示
        authorizeShow: false, //授权显示

        mark: '', //标记 添加购物车/立即购买
        weightList: [],
        brandList: [],
        colorList: [],
        materialList: [],
        originList: [],
        patternList: [],
        unitList: [],
        sizeList: [],
        widthList: [],
        pieceList: [],
        defaultSkuId: 0, //默认选中的sku 目前从图片搜索进来
        maxDiscount: 0, // 用户购买商品 能享受的最大折扣
        member_discount_value: 0, // 会员折扣
        sku_discount: 0, // 商品sku 折扣
        autoplay: true, // banner-swiper自动播放
        htmlSnip: '', //详情
        favoritesId: 0, //收藏id 大于0 收藏  等于0 未收藏
        // 不用于数据绑定的全局数据 评论
        userId: '',
        commentList: [],
        commentListThis: [], //本商品评论
        commentListOther: [], //其他商品评论
        total: 0,
        otherTotal: 0,
        filterNavIndex: 2, //评论tab
        scrollTop: '',

        isShowPreference: false, // 促销弹框
        promotionList: [], //促销详情

        maxPrice: 0,
        minPrice: 0,
    },
    checkLogin: tool.checkLogin,
    gotoLogin: tool.gotoLogin,
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中...',
        })
        let isLogin = this.checkLogin()
        this.setData({
            isLogin,
        })
        let goodsId = 0
        if (options.scene) {
            const scene = decodeURIComponent(options.scene)
            let args = scene.split(':')
            if (args.length > 1) {
                goodsId = args[1]
            }
        }
        if (options.skuId) {
            this.setData({
                defaultSkuId: options.skuId,
            })
        }
        if (goodsId == 0) {
            goodsId = options.goodsId
        }
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                console.log('输出 ~ res', res)
                let memberDiscountValue = 0,
                    maxDiscountValue = 0
                if (res['user_info']) {
                    this.data.userId = res['user_info'].user_id || 0
                    memberDiscountValue = res['user_info'].discount_value || 0
                    maxDiscountValue = res['user_info'].discount_value || 0
                }
                goodsModel.queryGoodsDetail(goodsId, this.data.userId).then(async (res) => {
                    // res.goods_info.goods_img_list.unshift({
                    //     img_url: res.goods_info.goods_img,
                    // });
                    if (res.goods_info.goods_id == 0) {
                        wx.showToast({
                            title: '商品不存在或已下架,正在返回上一页',
                            icon: 'none',
                            duration: 1000,
                        })
                        let that = this
                        setTimeout(function () {
                            that.onPop()
                        }, 1000)
                        return
                    }
                    // 详情
                    let detail = res.goods_info.detail
                    // if (!detail) {
                    //     detail = await goodsModel.queryGoodsDefaultDetail()
                    // }
                    // 图片排序
                    res.goods_info.goods_img_list = res.goods_info.goods_img_list.sort((a, b) => a.sort - b.sort)
                    this.generateSpec(res.goods_sku_list, res.attr_info)
                    // 生成属性列表
                    let brandList = []
                    let colorList = []
                    let materialList = []
                    let originList = []
                    let patternList = []
                    let unitList = []
                    let sizeList = []
                    let widthList = []
                    let pieceList = []
                    let weightList = []

                    for (let i = 0; i < res.all_attr_list.length; i++) {
                        const element = res.all_attr_list[i]
                        let index = brandList.indexOf(element.attr_brand)
                        if (index == -1 && element.attr_brand) {
                            brandList.push(element.attr_brand)
                        }
                        index = weightList.indexOf(element.attr_weight)
                        if (index == -1 && element.attr_weight) {
                            weightList.push(element.attr_weight)
                        }
                        index = colorList.indexOf(element.attr_color)
                        if (index == -1 && element.attr_color) {
                            colorList.push(element.attr_color)
                        }
                        index = materialList.indexOf(element.attr_material)
                        if (index == -1 && element.attr_material) {
                            materialList.push(element.attr_material)
                        }
                        index = originList.indexOf(element.attr_origin)
                        if (index == -1 && element.attr_origin) {
                            originList.push(element.attr_origin)
                        }
                        index = patternList.indexOf(element.attr_pattern)
                        if (index == -1 && element.attr_pattern) {
                            patternList.push(element.attr_pattern)
                        }
                        index = unitList.indexOf(element.attr_unit)
                        if (index == -1 && element.attr_unit) {
                            unitList.push(element.attr_unit)
                        }
                        index = sizeList.indexOf(element.attr_size)
                        if (index == -1 && element.attr_size) {
                            sizeList.push(element.attr_size)
                        }
                        index = widthList.indexOf(element.attr_width)
                        if (index == -1 && element.attr_width) {
                            widthList.push(element.attr_width)
                        }
                        index = pieceList.indexOf(element.attr_piece)
                        if (index == -1 && element.attr_piece) {
                            pieceList.push(element.attr_piece)
                        }
                    }
                    // 如果都为0 则不显示片数
                    let isPiece = pieceList.some((item) => item > 0)
                    if (!isPiece) {
                        pieceList = []
                    }
                    weightList = weightList.map((item) => {
                        return item + 'g'
                    })
                    if (res.goods_sku_list.length) {
                        let no_discount_sku_length = res.goods_sku_list.filter((ev) => {
                            return ev.user_discount == 1
                        }).length
                        if (res.goods_sku_list.length == no_discount_sku_length) {
                            maxDiscountValue = 0
                        } else {
                            let sku_discount_list = res.goods_sku_list.filter((ev) => {
                                return ev.user_discount !== 1
                            })
                            let discount_list = sku_discount_list.map((ev) => {
                                return ev.user_discount
                            })
                            discount_list.push(memberDiscountValue)
                            maxDiscountValue = Math.max(...discount_list)
                        }
                    }
                    // 生成最低价-最高价
                    let priceList = res.goods_sku_list.map((item) => item.sku_price)
                    let maxPrice = Math.max(...priceList)
                    let minPrice = Math.min(...priceList)
                    this.setData({
                        goodsId,
                        attr: res.attr_info,
                        goods: res.goods_info,
                        sku: res.goods_sku_list,
                        attrList: res.all_attr_list,
                        brandList,
                        weightList,
                        colorList,
                        materialList,
                        originList,
                        patternList,
                        unitList,
                        sizeList,
                        widthList,
                        pieceList,
                        isShopAdmin: wx.getStorageSync('isShopAdmin') || 0,
                        member_discount_value: memberDiscountValue,
                        maxDiscount: maxDiscountValue,
                        htmlSnip: detail,
                        favoritesId: res.goods_info.favorite_id,
                        maxPrice,
                        minPrice,
                    })

                    // 获取评论 促销
                    this.queryComments()
                    this.queryPromotion()
                    // 埋点上报
                    let pages = getCurrentPages()
                    let view = pages[pages.length - 2] || ''
                    util.tracking('detail_enter_api', { source: view.route, goods_id: goodsId, share_method: '' })
                    // 初始化spec 使之默认选中一个sku
                    this.selectComponent('#spec').onEnter()
                    wx.hideLoading()
                })
            })
            .catch((err) => {})

        this.countCart()
    },
    // getGoodsDetail: function () {},

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},
    // 获取促销详情
    async queryPromotion() {
        let checkCode = util.checkToken()
        if (checkCode != 0) {
            return
        }
        let goodsId = [Number(this.data.goodsId)]
        // 获取全场通用
        promotionModel.queryGoodsPromotion(goodsId).then((res) => {
            res = res || []
            res = res.map((item) => {
                item.name = tool.formatPromotion(item)
                return item
            })
            this.setData({
                promotionList: res,
            })
        })
    },
    // 获取评论
    queryComments() {
        let checkCode = util.checkToken()
        if (checkCode != 0) {
            return
        }
        let params = {
            shopId: config.shopId,
            goodsId: Number(this.data.goodsId),
            pi: 1,
            ps: 2,
            sortType: 1,
            isCurrent: true,
        }
        // 评价列表 本商品
        let commentThis = new Promise((reslove, reject) => {
            commentModel
                .queryShopCommentList(params)
                .then((res) => {
                    let index = 1
                    if (res.total == 0) {
                        index = 2
                    }
                    this.setData({
                        filterNavIndex: index,
                        total: res.total,
                        commentListThis: this.handlerData(res.list),
                    })
                    reslove(res.total)
                })
                .catch(() => {
                    reject()
                })
        })

        // 评价列表 其他
        let params2 = {
            shopId: config.shopId,
            goodsId: Number(this.data.goodsId),
            pi: 1,
            ps: 2,
            sortType: 1,
            isCurrent: false,
        }
        let commentOther = new Promise((reslove, reject) => {
            commentModel
                .queryShopCommentList(params2)
                .then((res) => {
                    this.setData({
                        otherTotal: res.total,
                        commentListOther: this.handlerData(res.list),
                    })
                    reslove(res.total)
                })
                .catch(() => {
                    reject()
                })
        })
        Promise.all([commentThis, commentOther])
            .then((result) => {
                this.setData({
                    commentList: result[0] > 0 ? this.data.commentListThis : this.data.commentListOther,
                })
                this.creatObserver()
            })
            .catch((error) => {
                console.log(error)
            })
    },
    // 评论商品跳转
    handleOnGoodsDetail(res) {
        const goods_id = Number(res.currentTarget.dataset.id)
        wx.navigateTo({
            url: '../goodsDetail/goodsDetail' + '?goodsId=' + goods_id,
        })
    },
    /**
     * 切换筛选条件
     */
    onClickCommentTab(res) {
        const index = Number(res.currentTarget.dataset.index)
        this.setData({
            filterNavIndex: index,
            commentList: index == 1 ? this.data.commentListThis : this.data.commentListOther,
        })

        this.creatObserver()
    },
    // 格式化列表数据
    handlerData(arr) {
        if (!arr) {
            return []
        }
        arr.forEach((ev) => {
            const _time = new Date(ev.created_at)
            ev['created_time'] = _time.format('yyyy-MM-dd hh:mm:ss')
        })
        return arr
    },
    onPop: function (e) {
        let pages = getCurrentPages()
        if (pages.length == 1) {
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
     * 页面滚动
     */
    onPageScroll: function (e) {
        let tabShow = this.data.tabShow
        let title = this.data.title
        let topArr = this.data.topArr

        // 计算显示tabbar
        if (e.scrollTop > 80 && !tabShow) {
            tabShow = true
            title = '商品详情'
        } else if (e.scrollTop <= 80 && tabShow) {
            tabShow = false
            title = ''
        }
        this.setData({
            tabShow,
            title,
            scrollTop: e.scrollTop,
        })
        // tab导航切换
        if (this.data.scrollNow) {
            return
        }
        let index = -1
        for (let i = 0; i < topArr.length; i++) {
            const top = topArr[i]
            if (e.scrollTop <= top) {
                break
            }
            index++
        }
        this.setData({
            activeTab: index,
        })
    },
    // 获取各节点高度
    creatObserver: function () {
        var query = wx.createSelectorQuery()
        let that = this
        let scrollTop = this.data.scrollTop
        //获取到顶部的距离
        query
            .select('.comment')
            .boundingClientRect(function (res) {
                that.data.topArr[1] = scrollTop + res.top - 130
            })
            .exec()
        query
            .select('.information')
            .boundingClientRect(function (res) {
                that.data.topArr[2] = scrollTop + res.top - 130
            })
            .exec()
    },
    // tab点击事件
    onClickTab(e) {
        let topArr = this.data.topArr
        let index = e.detail.index
        this.data.scrollNow = true
        wx.pageScrollTo({
            scrollTop: topArr[index],
            duration: 300,
            success: (res) => {
                this.data.scrollNow = false
            },
        })
    },
    // 生成商品信息规格列表
    generateSpec: function (sku, attr) {
        let specList = []
        for (let i = 0; i < attr.length; i++) {
            const element = attr[i]
            specList.push({
                title: element,
                list: [],
            })
        }
        for (let j = 0; j < sku.length; j++) {
            const skuItem = sku[j]
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
        }
        this.setData({
            specList,
        })
    },
    // 预览图片
    previewImage: function (e) {
        // 获取data-src
        var src = e.currentTarget.dataset.src
        // 获取data-list
        var imgList = this.data.goods.goods_img_list.map((item) => item.img_url)
        wx.previewImage({
            current: src, // 当前显示图片的http链接
            urls: imgList, // 需要预览的图片http链接列表
            success: function (res) {},
            fail: function (res) {},
        })
    },

    // 自定义dots
    swiperChange: function (e) {
        var that = this
        // if (e.detail.source == 'touch') {
        // }
        that.setData({
            current: e.detail.current,
        })
    },
    closeSpec(event) {
        this.selectComponent('#spec').close()
    },
    openSpec(event) {
        this.selectComponent('#spec').show()
        this.setData({
            specShow: true,
        })
    },
    // 分享
    onClickShare(event) {
        this.setData({
            isShowShare: true,
        })
    },
    // 分享关闭
    onCloseShare(event) {
        this.setData({
            isShowShare: false,
        })
    },
    shareGoods() {
        loginWatch.observer(this, () => {
            let that = this
            let goods = this.data.goods
            this.post({
                // goods_id
                eventName: 'preShareOnLoad',
                eventParams: {
                    page: 'pages/goodsDetail/goodsDetail',
                    scene: 'goods_id:' + goods.goods_id,
                    goods_img: goods.goods_img,
                    goods_name: goods.goods_name,
                    goods_id: goods.goods_id,
                    goods_price: (parseFloat(goods.goods_min_price) / 100).toFixed(2),
                },
                isSticky: true,
            })
            wx.navigateTo({
                url: '/pages/share/share?type=0',
                success: function (e) {
                    that.onCloseShare()
                },
            })
        })
    },
    shareShop() {
        loginWatch.observer(this, () => {
            let that = this
            this.post({
                eventName: 'preShareOnLoad',
                eventParams: {
                    page: 'pages/index/index',
                    scene: 'index',
                },
                isSticky: true,
            })
            wx.navigateTo({
                url: '/pages/share/share?type=1',
                success: function (e) {
                    that.onCloseShare()
                },
            })
        })
    },
    afterAddCard(event) {
        let specInfo = event.detail
        let attrList = this.data.attrList
        // 生成属性信息
        let selectedSku = attrList.filter((item) => {
            return item.sku_id == specInfo.skuId
        })
        // 生成已选信息
        let selectedList = specInfo.attr.map((item) => item.value)
        this.countCart()

        this.setData({
            selectedSku: selectedSku[0],
            specInfo: specInfo,
            selectedList: selectedList,
        })
    },

    // 统计购物车数量
    countCart(event) {
        let checkCode = util.checkToken()
        if (checkCode == 0) {
            goodsModel.queryCartNum().then((res) => {
                this.setData({
                    cartNum: res,
                })
            })
        }
    },
    openDefaultSpec(event) {
        this.setData({
            mark: 'default',
        })
        this.openSpec()
    },
    // spec显示
    onSpecClose(event) {
        this.setData({
            specShow: false,
        })
    },
    // 弹出授权去弹窗 隐藏标题
    authorizeTrigger(e) {
        this.setData({
            authorizeShow: e.detail,
        })
    },

    // 选中sku 回显数据
    selectSpec(event) {
        let specInfo = event.detail
        let attrList = this.data.attrList
        // 生成属性信息
        let selectedSku = attrList.find((item) => {
            return item.sku_id == specInfo.skuId
        })
        // 生成已选信息
        let selectedList = specInfo.attr.map((item) => item.value)
        this.countCart()
        let max_discount = this.data.member_discount_value
        if (specInfo.max_discount > 0) {
            max_discount = specInfo.max_discount
        }
        this.setData({
            selectedSku: selectedSku,
            specInfo: specInfo,
            selectedList: selectedList,
            maxDiscount: max_discount,
            defaultSkuId: specInfo.skuId,
        })
        console.log('输出 ~ selectedSku', selectedSku)
    },
    // 加入购物车
    addCart(event) {
        loginWatch.observer(this, () => {
            this.setData({
                mark: 'cart',
            })
            this.openSpec()
        })
    },
    // 立即购买
    buyNow(event) {
        loginWatch.observer(this, () => {
            this.setData({
                mark: 'buy',
            })
            this.openSpec()
        })
    },
    gotoCart(event) {
        loginWatch.observer(this, () => {
            wx.switchTab({
                url: '/pages/cart/cart',
            })
        })
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.closeSpec()
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {},

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},
    onPlay: function (e) {
        this.setData({
            autoplay: false,
        })
    },
    // banner视频播放暂停 轮播继续
    onPause: function (e) {
        this.setData({
            autoplay: true,
        })
    },
    // 添加 删除收藏 大于0收藏  等于0未收藏
    putFavorites: function () {
        let id = Number(this.data.goods.shop_goods_id)
        let favoritesId = Number(this.data.favoritesId)
        if (favoritesId == 0) {
            // 添加
            goodsModel
                .createFavorite(id)
                .then((res) => {
                    wx.showToast({
                        title: '收藏成功',
                        icon: 'none',
                        duration: 2000,
                    })
                    this.setData({
                        favoritesId: res,
                    })
                })
                .catch(() => {
                    reject()
                })
        } else {
            // 删除
            goodsModel
                .deleteFavorite([favoritesId])
                .then((res) => {
                    wx.showToast({
                        title: '取消收藏成功',
                        icon: 'none',
                        duration: 2000,
                    })
                    this.setData({
                        favoritesId: 0,
                    })
                })
                .catch(() => {
                    reject()
                })
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (res) {
        let goodsId = this.data.goodsId
        // 埋点上报
        util.tracking('goodsdetail_share_card', { goods_id: goodsId })
        return {
            title: this.data.goods.goods_name,
            path: '/pages/goodsDetail/goodsDetail?goodsId=' + goodsId,
            imageUrl: this.data.goods.goods_img,
            // success: function (res) {
            //     // 转发成功
            // },
            // fail: function (res) {
            //     // 转发失败
            // },
        }
        // if (res.from === 'button') {
        //     return {
        //         title: this.data.goods.goods_name,
        //         path: '/pages/goodsDetail/goodsDetail?goodsId=' + goodsId,
        //         imageUrl: this.data.goods.goods_img,
        //         success: function (res) {
        //             // 转发成功
        //         },
        //         fail: function (res) {
        //             // 转发失败
        //         },
        //     }
        // }
        // //通过右上角菜单触发
        // return {
        //     title: this.data.goods.goods_name,
        //     path: '/pages/goodsDetail/goodsDetail?goodsId=' + goodsId,
        //     imageUrl: this.data.goods.goods_img,
        // }
    },
    goShopComment() {
        wx.navigateTo({
            url: '/packageMainSecondary/shopComment/shopComment' + '?goodsId=' + Number(this.data.goodsId),
        })
    },
    openPreference() {
        this.setData({
            isShowPreference: true,
        })
    },
    onClosePreference() {
        this.setData({
            isShowPreference: false,
        })
    },
    gotoMakeUp(e) {
        let specInfo = this.data.specInfo
        if (JSON.stringify(specInfo) == '{}') {
            wx.showToast({
                title: '请先选择sku',
                icon: 'none',
                duration: 2000,
            })
            this.onClosePreference()
            this.openDefaultSpec()
            return
        }
        let index = e.currentTarget.dataset.index
        let promotion = this.data.promotionList[index]
        specInfo.tobeAdded = specInfo.quantity

        let makeUpData = {
            promotion: promotion, //促销详情
            checkList: [specInfo], //已有商品列表
            barterCheckedList: [
                // {
                //     sku_id: 198,
                //     shopping_car_id: 1,
                // },
                // {
                //     sku_id: 200,
                //     shopping_car_id: 1,
                // },
            ], //加价购 已加列表
        }
        // 传输数据
        promotionModel.makeUpData = makeUpData
        wx.navigateTo({
            url: `/packageMainSecondary/promotionMakeUp/promotionMakeUp`,
        })
    },
})
