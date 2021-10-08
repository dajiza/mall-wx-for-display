import screenConfig from '../../utils/screen_util'

const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const app = getApp()
const userShopInfoModel = require('../../models/userShopInfo')
const commentModel = require('../../models/comment')
const tool = require('../../utils/tool')
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        safeAreaInsetBottom: safeAreaInsetBottom,
        toDoCount: 0,
        list: [],
        page: 1,
        limit: 20,
        is_all: false, // 已经是全部了哦
        other_is_all: false,
        isPullDown: false, // 上拉刷新操作
        bottomLoadingShow: false,
        filterNavIndex: 1, // 1 本宝贝 2 其他宝贝
        sortTypeIndex: 1, // 1 默认排序（点赞数）2 最新
        total: 0, // 指定商品评论数量
        otherTotal: 0, // 其它商品评论数量
    },
    // 不用于数据绑定的全局数据
    tempData: {
        userId: 0,
        shopId: 0,
        goodsId: 0,
        otherList: [],
        quest_loading: false,
        currentPage: 1
    },
    events: {
        // 商品详情点赞评价成功
        commentDetailSuccess: function (params) {
            console.log('params', params.comment_id)
            console.log('商品点赞评价成功，更新点赞评论数量???')
            let _list = tool.deepClone(this.data.list)
            let _length = _list.filter(item =>{return item.comment_id == params.comment_id}).length
            if(_length < 1){
                return
            }
            _list.forEach((ev, i) => {
                if (ev.comment_id == params.comment_id) {
                    ev['like_count'] = params.like_count
                    ev['root_count'] = params.root_count
                    ev['my_like'] = params.my_like
                }
            })
            console.log('_list', _list)
            this.setData({
                list: _list
            })

        },
    },
    onLoad: function (options) {
        console.log('options', options.goodsId, typeof options.goodsId)
        const _this = this
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                let _obj = res['user_info']
                this.tempData.userId = _obj.user_id
                this.tempData.shopId = _obj.shop_id
                if (options.goodsId) {
                    this.tempData.goodsId = Number(options.goodsId)
                }
                let params = {
                    shopId: this.tempData.shopId,
                    goodsId: this.tempData.goodsId,
                    pi: 1,
                    ps: this.data.limit,
                    sortType: this.data.sortTypeIndex,
                    isCurrent: true
                }
                if (this.tempData.goodsId > 0) {
                    wx.showLoading({
                        title: '加载中...',
                    })
                    // 指定商品评价列表
                    commentModel
                        .queryShopCommentList(params)
                        .then((res) => {
                            params['isCurrent'] = false
                            let isAll = false,
                                newPage = 1
                            if (res && res.list) {
                                if (res.list.length < res.total) {
                                    newPage++
                                } else {
                                    isAll = true
                                }
                                this.setData({
                                    page: newPage,
                                    is_all: isAll,
                                    total: res.total,
                                    list: _this.handlerData(res.list),
                                })
                                // 其它商品评价列表
                                this.queryOtherTotal(params)
                            } else {
                                // 请求 其它商品评价列表
                                this.setData(
                                    {
                                        total: 0,
                                        filterNavIndex: 2,
                                    },
                                    () => {
                                        this.getListData()
                                    }
                                )
                            }
                        })
                        .catch(() => {
                            this.hideToast()
                        })
                } else {
                    // 直接请求 其它商品评价列表
                    this.setData(
                        {
                            total: 0,
                            filterNavIndex: 2,
                        },
                        () => {
                            wx.showLoading({
                                title: '加载中...',
                            })
                            this.getListData()
                        }
                    )
                }
            })
            .catch((err) => {
                console.log('err', err)
            })
    },
    onReady: function () {
    },
    onShow: function () {
    },
    onHide: function () {
    },
    onPullDownRefresh: function () {
        this.setData(
            {
                isPullDown: true,
                page: 1,
                currentPage: 1,
                is_all: false,
                loading_finish: false,
                list: []
            },
            () => {
                wx.showLoading({
                    title: '刷新中...',
                })
                // 请求列表 typeIndex 1 正常请求
                this.getListData()
            }
        )
    },
    onReachBottom: function () {
        // 到底喽～
        if (!this.data.is_all) {
            this.setData(
                {
                    bottomLoadingShow: true,
                },
                () => {
                    wx.showLoading({
                        title: '加载中...',
                    })

                    this.getListData()
                }
            )
        }
    },
    /**
     * 页面滚动
     */
    onPageScroll: function (e) {
    },
    onChange: function (event) {
    },
    navigation: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        console.log(itemIndex)
        wx.navigateTo({
            url: '/packageMainSecondary/commentDetail/commentDetail?id=1&show_goods=1',
        })
    },
    ClickBack() {
        let pages = getCurrentPages()
        if (pages.length === 1) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
    hideToast() {
        wx.hideLoading()
        if (this.data.isPullDown) {
            //停止下拉刷新
            wx.stopPullDownRefresh()
        }
    },
    // 格式化列表数据
    handlerData(arr) {
        arr.forEach((ev) => {
            const _time = new Date(ev.created_at)
            ev['created_time'] = _time.format('yyyy-MM-dd hh:mm:ss')
            console.log('goods_sku.skuAttr', ev.goods_sku.skuAttr)
        })
        return arr
    },
    /**
     * 指定商品评价列表
     * typeIndex
     */
    getListData(typeIndex) {
        const params = {
            shopId: this.tempData.shopId,
            goodsId: this.tempData.goodsId,
            pi: this.data.page,
            ps: this.data.limit,
            sortType: this.data.sortTypeIndex,
            isCurrent: this.data.filterNavIndex == 1
        }
        const _this = this
        let isAll = false
        if(typeIndex == 2){
            params['pi'] = 1
            params['ps'] = this.tempData.currentPage * this.data.limit
        }
        commentModel.queryShopCommentList(params).then((res) => {
            console.log('输出 ~ res', res)
            let oldGoodsList = [],
                diffData = {},
                offset = 0,
                newGoodsList = []
            if (_this.data.isPullDown) {
                oldGoodsList = []
            }
            if (params.pi > 1) {
                oldGoodsList = _this.data.list
                offset = this.data.list.length
            }
            let newPage = this.data.page
            if(typeIndex == 2) {
                newPage = this.tempData.currentPage
            }
            this.tempData.currentPage = this.data.page
            if (res && res.list) {
                const lists = this.handlerData(res.list)
                lists.forEach((item, index) => {
                    let key = 'list[' + (offset + index) + ']'
                    diffData[key] = item
                })
                newGoodsList = oldGoodsList.concat(res.list)
                if (newGoodsList.length < res.total) {
                    newPage++
                } else {
                    isAll = true
                }
            } else {
                isAll = true
                _this.setData({
                    list: [],
                })
            }
            // 隐藏loading 提示框
            _this.hideToast()
            let _total = this.data.total,
                other_total = this.data.otherTotal
            if (_this.data.filterNavIndex > 1) {
                other_total = res.total
            } else {
                _total = res.total
            }
            _this.setData(
                {
                    ...diffData,
                    bottomLoadingShow: false,
                    page: newPage,
                    isPullDown: false,
                    is_all: isAll,
                    total: _total,
                    otherTotal: other_total,
                }, () => {
                }
            )
            this.tempData.quest_loading = false
        })
    },

    queryOtherTotal(params) {
        commentModel
            .queryShopCommentList(params)
            .then((other_res) => {
                if (other_res && other_res.list) {
                    this.setData({
                        otherTotal: other_res.total,
                    })
                }
                this.hideToast()
            })
            .catch(() => {
                this.hideToast()
            })
    },
    /**
     * 切换筛选条件
     */
    onClickTab(res) {
        const _index = Number(res.currentTarget.dataset.index)
        console.log('_index', _index)
        if (this.data.filterNavIndex == _index) {
            return
        }
        this.setData(
            {
                filterNavIndex: _index,
                list: [],
                page: 1,
                sortType: 1,
                is_all: false
            },
            () => {
                wx.showLoading({
                    title: '加载中...',
                })
                this.getListData()
            }
        )
    },
    /**
     * 排序方式
     */
    sortChange(res) {
        const _index = Number(res.currentTarget.dataset.index)
        this.setData(
            {
                sortTypeIndex: _index,
                list: [],
                page: 1,
                is_all: false
            },
            () => {
                wx.showLoading({
                    title: '加载中...',
                })
                this.getListData()
            }
        )
    },
    handleOnGoodsDetail(res) {
        const goods_id = Number(res.currentTarget.dataset.id)
        wx.navigateTo({
            url: '/pages/goodsDetail/goodsDetail' + '?goodsId=' + goods_id,
        })
    },
    /**
     * 评论详情
     * show_goods 1 显示 商品信息 0 不显示商品信息
     */
    handleOnDetail(res) {
        const comment_id = Number(res.currentTarget.dataset.id)
        const showGoods = this.data.filterNavIndex == 2 ? 1 : 0
        wx.navigateTo({
            url: '/packageMainSecondary/commentDetail/commentDetail' + '?id=' + comment_id + '&show_goods=' + showGoods,
        })
    },

    /**
     * 点赞
     */
    handleOnLike(e) {
        const id = Number(e.currentTarget.dataset.id)
        const isLike = e.currentTarget.dataset.isLike
        console.log('isLike', isLike)
        if (this.tempData.quest_loading) {
            return
        }
        this.tempData.quest_loading = true
        wx.showLoading({
            title: '加载中...',
        })
        let params = {
            like_type: 1,
            comment_id: id
        }
        commentModel
            .queryCommentLike(params)
            .then((res) => {
                // 取消还是点赞 返回成功 直接 渲染数据
                let _list = tool.deepClone(this.data.list)
                _list.forEach((ev)=>{
                    if(ev.comment_id == id) {
                        ev['isLike'] = !isLike
                        if (isLike){
                            ev['like_count']--
                        } else {
                            ev['like_count']++
                        }
                        ev['my_like'] = !ev.my_like
                    }
                })

                this.getListData(2)
                // this.setData({
                //     list: _list
                // })
                // setTimeout(()=>{
                //     wx.hideLoading()
                //     this.tempData.quest_loading = false
                // },300)
            })
            .catch(err => {
                console.log('err', err)
                this.tempData.quest_loading = false
            })
    },
})
