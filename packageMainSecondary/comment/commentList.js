import screenConfig from '../../utils/screen_util'

const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const commentModel = require("../../models/comment");
const tool = require("../../utils/tool");
const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        safeAreaInsetBottom: safeAreaInsetBottom,
        list: [],
        limit: 20,
        page: 1,
        currentPage: 1,
        active: 1,
        total: 0, // 指定商品评论数量
        notEvaluatedTotal: 0, // 其它商品评论数量
        isPullDown: false,
        loading_finish: false,
        bottomLoadingShow: false,
        is_all: false, // 已经是全部了哦
    },
    // 不用于数据绑定的全局数据
    tempData: {
        otherList: [],
        currentPage: 1,
        delInPage: 1,
        isFirst: true
    },
    events: {
        // 商品评价成功
        commentSuccess: function (_id) {
            // type 2 圈子 3 作业墙
            console.log('_id', _id)
            console.log('商品评价成功，刷新列表???')
            let _list = tool.deepClone(this.data.list)
            let _length = _list.filter(item =>{return item.goods_sku.id == _id}).length
            if(_length < 1){
                return
            }
            // 删除成功 通知列表修改
            // 获取 被删除数据 所在页 当前加载页
            let del_in_page = 1
            _list.forEach((ev, i) => {
                if (ev.goods_sku.id == _id) {
                    if (i > this.data.limit) {
                        if (i % this.data.limit == 0) {
                            del_in_page = i / this.data.limit
                        } else {
                            del_in_page = Math.ceil(i / this.data.limit)
                        }
                    }
                }
            })
            let new_list = _list.filter(item =>{return item.id !== _id})
            console.log('new_list', new_list)
            this.tempData.delInPage = del_in_page
            this.setData({
                list: new_list
            },()=>{
                this.getListData(2)
            })
        },
    },
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中...',
        })
        this.getListData(1)
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
                list:[]
            },
            () => {
                wx.showLoading({
                    title: '刷新中...',
                })
                // 请求列表 typeIndex 1 正常请求
                this.getListData(1)
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
                    this.getListData(1)
                }
            )
        }
    },
    onChange(event) {
        if (!this.tempData.isFirst) {
            this.setData({
                page: 1,
                currentPage: 1,
                is_all: false,
                active: Number(event.detail.name),
                list: [],
            })
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 300,
            })
            this.getListData(1)
        }
    },
    /**
     * 评论详情
     * show_goods 1  显示 商品信息 0 不显示商品信息
     */
    navigation: function (e) {
        if (this.data.active > 0) {
            return
        }
        // comment_id
        let itemIndex = e.currentTarget.dataset.itemIndex
        let _id = e.currentTarget.dataset.id
        console.log(itemIndex)
        wx.navigateTo({
            url: '/packageMainSecondary/commentDetail/commentDetail?id=' + _id + '&show_goods=1',
        })
    },
    ClickBack() {
        wx.switchTab({
            url: '/pages/my/my',
        })
        // let pages = getCurrentPages()
        // if (pages.length === 1) {
        //     wx.switchTab({
        //         url: '../index/index',
        //     })
        // } else {
        //     wx.navigateBack({
        //         delta: 1,
        //     })
        // }
    },
    getListData(typeIndex) {
        let params = {
            pi: this.data.page,
            ps: this.data.limit,
            isComment: this.data.active == 0,
        }
        if(this.data.page > 1 && typeIndex == 2){ // 删除某条数据
            let del_in_page = this.tempData.delInPage
            if (del_in_page == 1) {
                params['pi'] = 1
                params['ps'] = this.data.limit * this.tempData.currentPage
            } else if (del_in_page > 1) {
                params['pi'] = del_in_page - 1
                params['ps'] = this.data.limit * (this.tempData.currentPage - (del_in_page - 1))
            }
        }
        const _this = this
        let isAll = false
        commentModel.queryMyComment(params).then((res) => {
            console.log('输出 ~ res', res)
            let oldGoodsList = []

            let diffData = {},
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
            this.tempData.currentPage = this.data.page
            if (res && res.list) {
                const lists = res.list
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

            if(typeIndex != 2){
                // 隐藏loading 提示框
                _this.hideToast()
            }
            let _total = this.data.total,
                other_total = this.data.notEvaluatedTotal
            if (_this.data.active > 0) {
                other_total = res.total
            } else {
                _total = res.total
            }
            console.log('isAll', isAll)
            console.log('diffData', diffData)
            _this.setData(
                {
                    ...diffData,
                    bottomLoadingShow: false,
                    page: newPage,
                    isPullDown: false,
                    is_all: isAll,
                    total: _total,
                    notEvaluatedTotal: other_total,
                },
                () => {
                    console.log('this.data.list',this.data.list)
                }
            )
            this.tempData.isFirst = false
        })
    },
    /**
     * 待评价条数
     */
    queryOtherTotal(params) {
        commentModel
            .queryMyComment(params)
            .then((other_res) => {
                if (other_res && other_res.list) {
                    this.setData({
                        notEvaluatedTotal: other_res.total,
                    })
                }
                this.hideToast()
            })
            .catch(() => {
                this.hideToast()
            })
    },
    hideToast() {
        wx.hideLoading()
        if (this.data.isPullDown) {
            //停止下拉刷新
            wx.stopPullDownRefresh()
        }
    },

    // 去评价
    handleGoReview(res) {
        const _index = Number(res.currentTarget.dataset.index)
        const _obj = this.data.list[_index]
        console.log('_index', _index)
        console.log('_obj', _obj)
        const _id = _obj.goods_sku.id

        commentModel.commentParams = {
            order_id: _obj.goods_sku.orderDetailId,
            order_no: _obj.goods_sku.orderNo,
            goodsId: _obj.goods_sku.goodsId,
            skuId: _obj.goods_sku.skuId,
            skuName: _obj.goods_sku.skuName,
            skuImg: _obj.goods_sku.skuImg,
            skuAttr: _obj.goods_sku.skuAttr,
            skuPrice: _obj.goods_sku.price,
        }
        console.log('_id', _id)
        wx.navigateTo({
            url: '/packageMainSecondary/reviewPublish/reviewPublish?orderDetailId='+_id,
        })
    },
    handleOnGoodsDetail(res) {
        const goods_id = Number(res.currentTarget.dataset.id)
        wx.navigateTo({
            url: '/pages/goodsDetail/goodsDetail' + '?goodsId=' + goods_id,
        })
    },
})
