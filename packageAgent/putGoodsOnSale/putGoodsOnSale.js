const searchListModel = require('../../models/searchList')
const agentGoodsModel = require('../../models/agentGoods')
const agentShelvesModel = require('../../models/agentShelves')
import screenConfig from '../../utils/screen_util'
const tool = require('../../utils/tool')
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const http = require('../../utils/util')

const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        safeAreaInsetBottom: safeAreaInsetBottom,
        searchList: {
            otherCateId: -1,
            selectedType: -1,
            list: [],
        },
        navTitle: '',
        goodsList: [],
        filterNavIndex: 0,
        popupShow: false,
        attr_list: [], // 筛选 属性
        label_list: [],
        filterList: [], // 筛选选中的属性、标签列表
        is_other: false, // 是布还是其它
        is_other_name: '', // 从分类-其它 点击进入时的 其它分类名称
        name: '', // 名称---搜索内容
        order_sales: 0, // 销量排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
        order_time: 0, // 时间排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
        limit: 5,
        page: 1,
        current_page: 1,
        bottomLoadingShow: false,
        is_all: false,
        isPullDown: false, // 是否下拉操作
        is_query: false, // 是否在请求中
        loading_finish: false, // 请求完成
        goodsCate: {}, // 筛选数据
        isBatch: false, // 是否开启批量上架
        searchModel: false,
        selectedAll: false,
        selectedNum: 0,
        changeChangeMax: 0,
        shelves: false,
        goodsSkus: {},
        batchPopupShow: false,
        pricePercent: 0, // 批量上架价格调整比例
        searchRequest: {},
        editGoods: {},
        AgentGoodsOn: false, // 上架
        quest_loading: false,
        currentFilterAttr: [],
        currentFilterLabel: [],
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const _this = this
        this.getCategoryData() // 获取分类
        this.getGoodsListData(1) // 获取商品列表
        http.request('config-with-shop', {})
            .then((res) => {
                let data = {}
                if (res) {
                    Object.keys(res).forEach((key) => {
                        if (key === 'ORDER_MONEY_CHANGE_MAX') {
                            data = res[key]
                            _this.setData({
                                changeChangeMax: data,
                            })
                        }
                    })
                }
            })
            .catch((err) => {})
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {},

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
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        this.setData({
            isPullDown: true,
            page: 1,
            is_all: false,
        })
        this.getGoodsListData(1)
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        // 到底喽～
        if (!this.data.is_all) {
            this.setData({
                bottomLoadingShow: true,
            })
            this.getGoodsListData(1)
        }
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
     * 返回上一页
     */
    ClickBack() {
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
     * 输入框input事件
     */
    bindSearchInput: function (e) {
        this.setData({
            name: e.detail.value,
        })
        if (e.detail.value === '') {
            this.setData({
                page: 1,
                is_all: false,
            })
        }
    },

    /**
     * 清空搜索内容
     */
    bindClearSearch: function () {
        this.setData(
            {
                name: '',
                page: 1,
                is_all: false,
            },
            () => {
                this.getGoodsListData(1)
            }
        )
    },

    /**
     * 点击软键盘搜索按钮
     */
    handleOnSearch: function () {
        if (this.data.name) {
            let history = this.selectComponent('#history')
            history.saveSearch(this.data.name)
        }
    },

    /**
     * 切换筛选条件
     */
    onClickTab(res) {
        let priceSortTypeIndex = 0
        let salesSortTypeIndex = 0
        let timeSortTypeIndex = 0
        if (Number(res.currentTarget.dataset.index) === 0) {
            timeSortTypeIndex = 1
            if (this.data.filterNavIndex === 0 && this.data.order_time === 1) {
                timeSortTypeIndex = 2
            }
        } else if (Number(res.currentTarget.dataset.index) === 1) {
            salesSortTypeIndex = 1
            if (this.data.filterNavIndex === 1 && this.data.order_sales === 1) {
                salesSortTypeIndex = 2
            }
        }
        this.setData(
            {
                filterNavIndex: Number(res.currentTarget.dataset.index),
                order_sales: salesSortTypeIndex,
                order_time: timeSortTypeIndex,
                page: 1,
                loading_finish: false,
            },
            () => {
                if (!this.data.is_query) {
                    wx.pageScrollTo({
                        scrollTop: 0,
                        duration: 300,
                    })
                    this.getGoodsListData(1)
                }
            }
        )
    },

    /**
     * 点击展开筛选
     */
    onClickFilter() {
        this.setData({
            popupShow: true,
        })
    },

    /**
     * 网络请求，获取分类数据
     */
    getCategoryData() {
        searchListModel.queryV2GoodsCateList({}).then((res) => {
            if (res) {
                this.setData({
                    goodsCate: res,
                })
            }
        })
    },

    //
    /**
     * 网络请求，获取商品列表数据
     */
    getGoodsListData(typeIndex) {
        // typeIndex 1 正常 2 上架后
        let searchRequest = this.data.searchRequest
        // console.log('this.data.current_page', this.data.current_page)
        const params = {
            name: this.data.name, // 名称
            order_sales: this.data.order_sales, // 销量排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
            order_time: this.data.order_time, // 价格排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
            limit: typeIndex == 1 ? this.data.limit : this.data.limit * this.data.current_page,
            page: typeIndex == 1 ? this.data.page : 1,
            ...searchRequest,
        }
        // console.log('params', params);
        const _this = this
        let isAll = false
        this.setData({
            is_query: true,
        })
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        if (this.data.isPullDown) {
            wx.showLoading({
                title: '刷新中...',
            })
        } else if (!this.data.bottomLoadingShow) {
            wx.showLoading({
                title: '加载中...',
            })
        }
        let diffData = {} // 下拉刷新新增数据
        agentShelvesModel.getAgentToOnGoodsList(params).then((res) => {
            let old_arr = []
            let offset = 0
            if (params.page > 1) {
                old_arr = this.data.goodsList
                offset = this.data.goodsList.length
            }
            let new_arr = []
            let new_page = this.data.page
            let current_page = this.data.page
            if (res.lists) {
                const lists = res.lists
                lists.forEach((item, index) => {
                    item['checked'] = false
                    let key = 'goodsList[' + (offset + index) + ']'
                    diffData[key] = item
                })
                new_arr = old_arr.concat(lists)
                if (new_arr.length < res.total) {
                    new_page = Number(this.data.page) + 1
                } else {
                    isAll = true
                }
                console.log('diffData', diffData)
            } else {
                new_arr = old_arr
                isAll = true
            }
            //隐藏loading 提示框
            if (!_this.data.bottomLoadingShow) {
                wx.hideLoading()
            }
            //隐藏导航条加载动画
            wx.hideNavigationBarLoading()
            if (this.data.isPullDown) {
                //停止下拉刷新
                wx.stopPullDownRefresh()
            }
            if (params.page > 1) {
                _this.setData({
                    ...diffData,
                    page: new_page,
                    current_page: current_page,
                    is_all: isAll,
                    bottomLoadingShow: false,
                    is_query: false,
                    isPullDown: false,
                    loading_finish: true,
                })
            } else {
                _this.setData({
                    goodsList: new_arr,
                    page: new_page,
                    is_all: isAll,
                    bottomLoadingShow: false,
                    is_query: false,
                    isPullDown: false,
                    loading_finish: true,
                })
            }
        })
    },

    preventTouchMove() {},

    /**
     * 上架
     */
    onShelves(e) {
        let index = e.currentTarget.dataset.index
        let goods = this.data.goodsList[index]
        const goodsId = e.currentTarget.dataset.goodsId
        const _this = this
        const params = {
            goods_id: Number(goodsId),
        }
        agentGoodsModel
            .queryGoodsSKUList(params)
            .then((res) => {
                _this.setData({
                    shelves: true,
                    goodsSkus: res.goods_sku_data || [],
                    editGoods: goods,
                })
            })
            .catch((err) => {})
    },
    /**
     * 确认上架 - 修改价格后
     */
    handleOnShelvesConfirm(e) {
        // console.log(e)
        let goods = this.data.editGoods
        let goods_id = goods.goods_id
        if (!this.data.quest_loading) {
            var timeOnShelves
            clearTimeout(timeOnShelves)
            this.setData({
                quest_loading: true,
            })
            if (e.detail && goods_id) {
                if (e.detail.length > 0) {
                    let request = {
                        goods_id: goods_id,
                        is_top: goods.is_top,
                        skus: e.detail,
                    }
                    wx.showLoading({
                        title: '加载中...',
                    })
                    agentShelvesModel
                        .getAgentGoodsOn(request)
                        .then((res) => {
                            wx.hideLoading()
                            wx.showToast({
                                title: '上架成功',
                                icon: 'none',
                                mask: true,
                                duration: 2000,
                            })
                            const _list = this.data.goodsList
                            _list.forEach((ev, i) => {
                                if (ev.goods_id == request.goods_id) {
                                    _list.splice(i, 1)
                                }
                            })
                            this.setData(
                                {
                                    goodsList: _list,
                                    shelves: false,
                                    goodsSkus: res,
                                    editGoods: {},
                                },
                                () => {
                                    // console.log('上架成功')
                                    // console.log('shelves', this.data.shelves)
                                    timeOnShelves = setTimeout(() => {
                                        // 上架成功
                                        this.getGoodsListData(2)
                                        this.setData({
                                            quest_loading: false,
                                        })
                                    }, 1500)
                                }
                            )
                        })
                        .catch((err) => {
                            console.log(err)
                            wx.hideLoading()
                        })
                }
            }
        }
    },

    /**
     * 批量上架/完成
     */
    onBatchShelves() {
        const isBatch = this.data.isBatch
        let goodsList = this.data.goodsList
        if (goodsList.length) {
            goodsList.forEach((ev) => {
                ev['checked'] = false
            })
            this.setData({
                goodsList: goodsList,
                isBatch: !isBatch,
                selectedAll: false,
                selectedNum: 0,
            })
        } else {
            wx.showToast({
                title: '暂无商品',
                icon: 'none',
                duration: 2000,
            })
        }
    },

    /**
     * 去搜索
     */
    goSearch(e) {
        console.log(e.detail)
        // if(!e.detail){
        //     return
        // }
        this.setData(
            {
                page: 1,
                searchModel: false,
                backgroundColor: 'var(--divider-border-color)',
            },
            () => {
                this.setData({
                    name: e.detail || '',
                    isBatch: false,
                })
                this.getGoodsListData(1)
            }
        )
    },

    /**
     * 取消搜索
     */
    onSearchCancel() {
        this.setData({
            searchModel: false,
            backgroundColor: 'var(--divider-border-color)',
        })
    },

    /**
     * 显示搜索历史
     */
    searchInputCapture: function (e) {
        console.log(e)
        if (!this.data.searchModel) {
            //非搜索模式
            this.setData({
                searchModel: true,
                backgroundColor: '#ffffff',
            })
        }
    },

    handleOnFocus: function () {},

    /**
     * 侧边弹出框 关闭筛选
     */
    filterPopupClose() {
        this.setData({
            popupShow: false,
        })
    },

    getFilter(e) {
        this.data.searchRequest = e.detail
        console.log('this.data.searchRequest', this.data.searchRequest)
        this.setData(
            {
                searchList: this.data.searchRequest.new_search,
                popupShow: false,
                page: 1,
                isBatch: false,
                is_all: false,
            },
            () => {
                this.getGoodsListData(1)
            }
        )
    },

    /**
     * 侧边弹出框 重置
     */
    filterReset(e) {
        // console.log(e.detail)
        this.data.searchRequest = e.detail
        this.setData(
            {
                searchList: {
                    otherCateId: -1,
                    selectedType: '布料',
                    list: [],
                },
                popupShow: false,
                page: 1,
                is_all: false,
                isBatch: false,
            },
            () => {
                this.getGoodsListData(1)
            }
        )
    },

    toggle: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let checkbox = this.selectComponent('#checkbox_' + itemIndex)
        console.log(checkbox)
        checkbox.toggle()
    },

    catchTapDummy: function (e) {},

    checkedItem: function (e) {
        //item选中事件
        let itemIndex = e.currentTarget.dataset.itemIndex
        let itemValid = e.currentTarget.dataset.itemValid
        let goodsItem = e.currentTarget.dataset.goodsItem
        let goodsList = this.data.goodsList
        goodsList.forEach((ev) => {
            // console.log('ev====>', ev);
            if (ev.goods_id === goodsItem.goods_id) {
                ev['checked'] = !goodsItem.checked
            }
        })
        const checkedCount = this.checkCartGoodsCount(goodsList)
        let chooseAll = false
        if (checkedCount > 0 && checkedCount === this.data.goodsList.length) {
            chooseAll = true
        }
        this.setData({
            selectedNum: checkedCount,
            goodsList: goodsList,
            selectedAll: chooseAll,
        })
    },

    /**
     * 批量上架 -全选 （当前列表全选，勾选后加载的列表不勾选）
     */
    selectedAll() {
        let checkbox = this.selectComponent('#checkbox_all')
        // console.log(checkbox);
        checkbox.toggle()
    },
    checkedAll(e) {
        const chooseAll = this.data.selectedAll
        let goodsList = this.data.goodsList
        goodsList.forEach((ev) => {
            ev['checked'] = !chooseAll
        })
        const checkedCount = this.checkCartGoodsCount(goodsList)
        this.setData({
            selectedNum: checkedCount,
            goodsList: goodsList,
            selectedAll: !chooseAll,
        })
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

    /**
     * 批量上架- 修改价格
     */
    sureBatchShelves() {
        if (this.data.selectedNum > 0) {
            // 选择的商品信息
            this.setData({
                batchPopupShow: true,
            })
        } else {
            wx.showToast({
                title: '请选择要上架的商品',
                icon: 'none',
                duration: 2000,
            })
        }
    },

    onBatchPriceChange(e) {
        let price = Number(e.detail)
        // console.log('price', price);
        this.setData({
            pricePercent: price,
        })
    },

    onOverLimit: function (e) {
        console.log('出错', e)
        if (e.detail === 'inputMinus') {
            wx.showToast({
                title: '不能低于官方指导价~',
                icon: 'none',
                duration: 2000,
            })
        }
    },
    stepperPlus: function (e) {
        console.log('点击+', e)
    },
    stepperMinus: function (e) {
        console.log('点击-', e)
    },
    /**
     * 批量上架-修改价格-确定
     */
    handleOnConfirm: function () {
        let checkedGoodsIds = []
        this.data.goodsList.forEach((item) => {
            if (item.checked) {
                checkedGoodsIds.push(item.goods_id)
            }
        })
        const params = {
            goods_ids: checkedGoodsIds,
            price_percent: this.data.pricePercent,
        }
        if (!this.data.quest_loading) {
            var timerBatch
            clearTimeout(timerBatch)
            this.setData({
                quest_loading: true,
            })
            agentGoodsModel
                .batchAgentGoods(params)
                .then((res) => {
                    console.log('res', res)
                    wx.showToast({
                        title: '上架成功',
                        icon: 'none',
                        mask: true,
                        duration: 2000,
                    })

                    const _list = tool.deepClone(this.data.goodsList)
                    _list.forEach((ev, i) => {
                        if (ev.checked) {
                            _list.splice(i, 1)
                        }
                    })
                    this.setData(
                        {
                            goodsList: _list,
                            batchPopupShow: false,
                            pricePercent: 0,
                            isBatch: false,
                        },
                        () => {
                            timerBatch = setTimeout(() => {
                                this.setData({
                                    quest_loading: false,
                                })
                                // 批量上架成功
                                this.getGoodsListData(2)
                            }, 1500)
                        }
                    )
                })
                .catch((err) => {})
        }
    },
    /**
     * 关闭批量调整弹窗
     */
    handleOnCancel() {
        this.setData({
            batchPopupShow: false,
            pricePercent: 0,
        })
    },

    /**
     * 跳转到商品详情
     */
    goGoodsDetail(e) {
        // console.log('跳转到商品详情', e);
        let index = e.currentTarget.dataset.index
        let goods = this.data.goodsList[index]
        let goodsId = goods.goods_id
        if (goodsId) {
            wx.navigateTo({
                url: '/packageAgent/goodsManagerDetail/goodsManagerDetail?goodsId=' + goodsId + '&goodsName=' + goods.title + '&type=' + goods.type,
            })
        }
    },
    filterTransfer(e) {
        this.setData({
            currentFilterAttr: e.detail.attr_list,
            currentFilterLabel: e.detail.label_list,
        })
    },
})
