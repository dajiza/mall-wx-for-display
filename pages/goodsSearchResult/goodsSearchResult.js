const searchListModel = require('../../models/searchList')
const util = require('../../utils/util')

const app = getApp()
Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        searchShowList: [],
        navTitle: '',
        goodsList: [],
        filterNavIndex: 0,
        popupShow: false,
        attr_list: [], // 筛选 属性
        cloth_list: [],
        other_list: [],
        finished_cloth_list: [], // 布组属性
        label_list: [],
        cloth_tag_list: [], // 布料标签数据
        finished_tag_list: [], // 布组标签数据
        filterList: [], // 筛选选中的属性、标签列表
        is_other: false, // 是布还是其它
        is_other_name: '', // 从分类-其它/布组  点击进入时的 其它分类名称
        goodsCateId: 0, // 0 布料 1 其它 2 布组
        other_id: -1, // 其它id/布组id
        order_sales: 0, // 销量排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
        order_price: 0, // 价格排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
        limit: 20,
        page: 1,
        bottomLoadingShow: false,
        is_all: false,
        isPullDown: false, // 是否下拉操作
        is_query: false, // 是否在请求中
        loading_finish: false, // 请求完成
        searchPlace: '输入想搜索的信息',
        searchKey: '', // 搜索关键字
        goodsCate: {}, // 筛选数据
        // label_list: [],
        // filterList: [], // 筛选选中的属性、标签列表
        searchList: {
            otherCateId: -1,
            selectedType: -1,
            list: [],
            attr_list: [],
            tag_list: [],
        },
        searchRequest: {},
        attr_show_list: [],
        tag_show_list: [],
        finished_cloth_cate: [], // +
        other_cate: [], // +
        cloth_tag_info: [], // +
        other_tag_info: [], // +

        ob: '', //曝光方法监听对象
        exposureList: [], //曝光商品id列表
        currentFilterAttr: [],
        currentFilterLabel: [],
        allData: []
    },

    // 不用于数据绑定的全局数据
    tempData: {
        tempOptions: {}, // 传递的参数
        isOnLoad: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.tempData.tempOptions = options
        this.tempData.isOnLoad = true
        let _goodsCateId = 0 // 大分类 0: 布料 ; > 0
        if (options.cate_id) {
            _goodsCateId = Number(options.cate_id)
        }
        let _navTitle = '商品搜索'
        if (options.searchType === 'select') {
            _navTitle = '商品分类'
        }
        let new_searchRequest = {}
        new_searchRequest = { ...new_searchRequest, ...this.data.searchRequest }
        new_searchRequest['brand'] = options.brand || ''
        new_searchRequest['color'] = options.color || ''
        new_searchRequest['material'] = options.material || ''
        new_searchRequest['origin'] = options.origin || ''
        new_searchRequest['pattern'] = options.pattern || ''
        new_searchRequest['size'] = options.size || ''
        new_searchRequest['other_id'] = options.other_id ? Number(options.other_id) : -1
        new_searchRequest['tag_id'] = options.tag_id || ''
        if (options.attrName) {
            new_searchRequest[options.attrName] = options.attrValue
        }
        let attrList = []
        const attr_arr = ['brand', 'color', 'material', 'origin', 'pattern', 'size']
        attr_arr.forEach((item) => {
            const _arr = new_searchRequest[item].split('||')
            _arr.forEach((ev) => {
                if (ev) {
                    attrList.push(ev)
                }
            })
        })
        let show_tag = [] // 筛选的 标签 id 集合
        if (options.tag_id) {
            const select_tag = options.tag_id.split('||')
            select_tag.forEach((ev) => {
                show_tag.push(Number(ev))
            })
        }
        let new_searchList = {}
        new_searchList = { ...new_searchList, ...this.data.searchList }
        new_searchList['selectedType'] = _goodsCateId > 0 ? _goodsCateId : -1
        new_searchList['attr_list'] = attrList
        this.setData({
            navTitle: _navTitle,
            name: options.name || '',
            attr_show_list: attrList,
        })
        const _this = this

        // 获取分类 V2
        searchListModel.queryV2GoodsCateList({}).then((res) => {
            if (res) {
                let tag_show_arr = []
                const cloth_tag_info = res.tag.cloth_tag_info
                const other_tag_info = res.tag.other_tag_info
                show_tag.forEach((ev) => {
                    cloth_tag_info.forEach((ev_c) => {
                        if (ev_c.tag_id === ev) { tag_show_arr.push(ev_c) }
                    })
                    other_tag_info.forEach((ev_o) => {
                        if (ev_o.tag_id === ev) { tag_show_arr.push(ev_o) }
                    })
                })
                new_searchList['tag_list'] = tag_show_arr

                // 分类
                let otherName = '', otherId = -1
                const categoryAll = res.category;
                if (options.other_id) {
                    categoryAll.forEach((ev) => {
                        if(ev.sons && ev.sons.length > 0) {
                            ev.sons.forEach((son)=>{
                                if (son.id === Number(options.other_id)) {
                                    otherName = son.name
                                    otherId = son.id
                                }
                            })
                        }
                    })
                }
                new_searchList['otherCateId'] = otherId
                _this.setData({
                    goodsCate: res,
                    tag_show_list: tag_show_arr,
                    searchList: new_searchList,
                    searchRequest: new_searchRequest,
                    is_other_name: otherName,
                    goodsCateId: otherId,
                })
                // 获取商品列表
                _this.setParams()
            }
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        wx.reportAnalytics('test_ss', {
            aa: 'dvfsvf',
        })
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        if(this.tempData.isOnLoad){
            this.tempData.isOnLoad = false;
        }else {
            console.log('this.tempData.tempOptions', this.tempData.tempOptions)
            const _this = this
            // 获取分类 V2
            searchListModel.queryV2GoodsCateList({}).then((res) => {
                if (res) {
                    _this.setData({
                        goodsCate: res,
                    })
                }
            })
        }
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {},

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
                order_sales: 0,
                order_price: 0,
                filterNavIndex: 0,
            },
            () => {
                this.getGoodsListData()
            }
        )
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
            this.getGoodsListData()
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
            this.setParams()
        }
    },

    /**
     * 清空搜索内容
     */
    bindClearSearch: function () {
        this.setData({
            name: '',
            page: 1,
            is_all: false,
        })
        this.setParams()
    },

    /**
     * 点击软键盘搜索按钮
     */
    handleOnSearch: function () {
        if (this.data.name) {
            this.saveSearch()
            this.setData({
                page: 1,
                is_all: false,
            })
            this.setParams()
        }
    },

    /**
     * 存储搜索内容
     */
    saveSearch() {
        const _this = this
        //把获取的input值插入数组里面
        let historySearchArr = [] // 搜索历史记录
        wx.getStorage({
            key: 'historySearchKey',
            success(res) {
                historySearchArr = res.data
                let arrIndex = historySearchArr.indexOf(_this.data.name)
                if (arrIndex !== -1) {
                    // 删除已存在后重新插入至数组
                    historySearchArr.splice(arrIndex, 1)
                    historySearchArr.unshift(_this.data.name)
                } else {
                    historySearchArr.unshift(_this.data.name)
                }
                wx.setStorage({
                    key: 'historySearchKey',
                    data: historySearchArr,
                })
            },
            fail: (res) => {
                historySearchArr.unshift(_this.data.name)
                wx.setStorage({
                    key: 'historySearchKey',
                    data: historySearchArr,
                })
            },
        })
    },

    /**
     * 删除选中筛选内容 - 属性
     */
    handleDeleteLabel(res) {
        const str = res.currentTarget.dataset.name
        const _index = Number(res.currentTarget.dataset.index)
        let searchArr = this.data.attr_show_list
        searchArr.splice(_index, 1)
        let newSearchList = {}
        newSearchList = { ...newSearchList, ...this.data.searchList }
        newSearchList['list'] = searchArr
        newSearchList['attr_list'] = searchArr
        let new_searchRequest = {}
        new_searchRequest = { ...new_searchRequest, ...this.data.searchRequest }
        let arr_brand = new_searchRequest['brand'].split('||'),
            arr_color = new_searchRequest['color'].split('||'),
            arr_material = new_searchRequest['material'].split('||'),
            arr_origin = new_searchRequest['origin'].split('||'),
            arr_pattern = new_searchRequest['pattern'].split('||'),
            arr_size = new_searchRequest['size'].split('||')
        arr_brand.forEach((ev, i) => {
            if (ev === str) {
                arr_brand.splice(i, 1)
            }
        })
        arr_color.forEach((ev, i) => {
            if (ev === str) {
                arr_color.splice(i, 1)
            }
        })
        arr_material.forEach((ev, i) => {
            if (ev === str) {
                arr_material.splice(i, 1)
            }
        })
        arr_origin.forEach((ev, i) => {
            if (ev === str) {
                arr_origin.splice(i, 1)
            }
        })
        arr_pattern.forEach((ev, i) => {
            if (ev === str) {
                arr_pattern.splice(i, 1)
            }
        })
        arr_size.forEach((ev, i) => {
            if (ev === str) {
                arr_size.splice(i, 1)
            }
        })
        new_searchRequest['brand'] = arr_brand.join('||')
        new_searchRequest['color'] = arr_color.join('||')
        new_searchRequest['material'] = arr_material.join('||')
        new_searchRequest['origin'] = arr_origin.join('||')
        new_searchRequest['pattern'] = arr_pattern.join('||')
        new_searchRequest['size'] = arr_size.join('||')
        let _this = this
        this.setData(
            {
                searchRequest: new_searchRequest,
                searchList: newSearchList,
                attr_show_list: searchArr,
                loading_finish: false,
                page: 1,
            },
            () => {
                // 请求商品列表数据
                _this.setParams()
            }
        )
    },

    /**
     * 删除选中筛选内容 - 标签
     */
    handleDeleteTag(res) {
        const str = res.currentTarget.dataset.name
        const del_id = res.currentTarget.dataset.id
        const _index = Number(res.currentTarget.dataset.index)
        let searchArr = JSON.parse(JSON.stringify(this.data.tag_show_list))

        searchArr.splice(_index, 1)
        let newSearchList = {}
        newSearchList = { ...newSearchList, ...this.data.searchList }
        newSearchList['tag_list'] = searchArr
        let new_searchRequest = {}
        new_searchRequest = { ...new_searchRequest, ...this.data.searchRequest }
        let arr_tag = []
        searchArr.forEach((ev, i) => {
            arr_tag.push(ev.tag_id)
        })
        new_searchRequest['tag_id'] = arr_tag.join('||')
        let _this = this
        this.setData(
            {
                searchRequest: new_searchRequest,
                searchList: newSearchList,
                tag_show_list: searchArr,
                loading_finish: false,
                page: 1,
            },
            () => {
                // 请求商品列表数据
                _this.setParams()
            }
        )
    },

    setSearchVal() {},

    /**
     * 删除其它/布组
     */
    handleDeleteOther() {
        let new_searchList = {}
        new_searchList = { ...new_searchList, ...this.data.searchList }
        new_searchList['otherCateId'] = -1
        new_searchList['selectedType'] = -1
        let new_searchRequest = {}
        new_searchRequest = { ...new_searchRequest, ...this.data.searchRequest }
        new_searchRequest['other_id'] = -1
        let _this = this
        this.setData(
            {
                searchList: new_searchList,
                searchRequest: new_searchRequest,
                is_other: false,
                is_other_name: '',
                other_id: -1,
                goodsCateId: 0,
                loading_finish: false,
                page: 1,
            },
            () => {
                // 判断有无筛选条件 然后 请求商品列表数据
                _this.setParams()
            }
        )
    },

    /**
     * 切换筛选条件
     */
    onClickTab(res) {
        let priceSortTypeIndex = 0
        let salesSortTypeIndex = 0
        if (Number(res.currentTarget.dataset.index) === 2) {
            priceSortTypeIndex = 1
            if (this.data.filterNavIndex === 2 && this.data.order_price === 1) {
                priceSortTypeIndex = 2
            }
        } else if (Number(res.currentTarget.dataset.index) === 1) {
            salesSortTypeIndex = 1
            if (this.data.filterNavIndex === 1 && this.data.order_sales === 1) {
                salesSortTypeIndex = 2
            }
        }
        this.setData({
            filterNavIndex: Number(res.currentTarget.dataset.index),
            order_sales: salesSortTypeIndex,
            order_price: priceSortTypeIndex,
            page: 1,
            loading_finish: false,
        })
        if (!this.data.is_query) {
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 300,
            })
            this.getGoodsListData()
        }
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
     * 关闭筛选
     */
    onClosePopup() {
        this.setData({
            popupShow: false,
        })
    },

    /**
     * 网络请求，获取分类数据
     */
    getCategoryData() {
        searchListModel.queryGoodsCateList({}).then((res) => {
            this.setData({
                goodsCate: res,
            })
        })
    },

    //
    /**
     * 网络请求，获取商品列表数据
     */
    getGoodsListData() {
        let searchRequest = this.data.searchRequest
        const params = {
            ...searchRequest,
            name: this.data.name || this.data.searchKey,
            order_sales: this.data.order_sales, // 销量排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
            order_price: this.data.order_price, // 价格排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
            limit: this.data.limit,
            page: this.data.page,
        }
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

        searchListModel.queryGoodsSearchList(params).then((res) => {
            let old_arr = []
            if (params.page > 1) {
                old_arr = this.data.goodsList
            }
            let new_arr = []
            let new_page = this.data.page
            if (_this.data.isPullDown) {
                old_arr = []
            }
            if (res.lists) {
                new_arr = old_arr.concat(res.lists)
                if (new_arr.length < res.total) {
                    new_page = Number(this.data.page) + 1
                } else {
                    isAll = true
                }
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
            _this.setData(
                {
                    goodsList: new_arr,
                    page: new_page,
                    is_all: isAll,
                    bottomLoadingShow: false,
                    is_query: false,
                    isPullDown: false,
                    loading_finish: true,
                },
                () => {
                    this.creatObserver()
                }
            )
        })
    },

    /**
     * 设置请求参数
     */
    setParams() {
        this.setData({
            loading_finish: false,
        })
        this.getGoodsListData()
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

    preventTouchMove() {},


    // 格式化数据
    handlerData(arr) {
        let obj = {},
            data
        if (arr) {
            arr.forEach((item, index) => {
                let { tag_category_id } = item
                if (!obj[tag_category_id]) {
                    obj[tag_category_id] = {
                        tag_category_id,
                        tag_category_name: item.tag_category_name,
                        list: [],
                    }
                }
                obj[tag_category_id].list.push(item)
            })
            data = Object.values(obj)
        } else {
            data = []
        }
        // 最终输出
        return data
    },

    /**
     * 侧边弹出框 关闭筛选
     */
    filterPopupClose() {
        this.setData({
            popupShow: false,
        })
    },

    /**
     * 筛选 - 确定
     */
    getFilter(e) {
        this.data.searchRequest = e.detail
        let searchShowArr = this.data.searchRequest.new_search.list || []
        this.setData(
            {
                searchShowList: searchShowArr,
                searchList: this.data.searchRequest.new_search,
                attr_show_list: this.data.searchRequest.new_search.attr_list || [],
                tag_show_list: this.data.searchRequest.new_search.tag_list || [],
                is_other_name: this.data.searchRequest.other_name,
                goodsCateId: this.data.searchRequest.other_id || -1,
                other_id: this.data.searchRequest.other_id || -1,
                popupShow: false,
                page: 1,
                is_all: false,
            },
            () => {
                this.getGoodsListData()
            }
        )
    },

    /**
     * 侧边弹出框 重置
     */
    filterReset(e) {
        this.data.searchRequest = e.detail
        this.setData(
            {
                searchList: {
                    otherCateId: -1,
                    selectedType: -1,
                    list: [],
                    attr_list: [],
                    tag_list: [],
                },
                attr_show_list: [],
                tag_show_list: [],
                searchShowList: [],
                popupShow: false,
                is_other_name: '',
                goodsCateId: -1,
                other_id: -1,
                page: 1,
                is_all: false,
            },
            () => {
                this.getGoodsListData()
            }
        )
    },
    // 图片上传
    afterRead(event) {
        wx.showLoading({
            title: '上传中',
        })
        console.log('输出 ~ event', event)
        // const { file } = event.detail;
        const file = event.detail.file

        util.uploadFile(file.path)
            .then((res) => {
                console.log('输出 ~ res', res)
                let result = JSON.parse(res)
                wx.hideLoading()
                if (result.code == 200) {
                    wx.navigateTo({
                        url: '/pages/imgSearchResult/imgSearchResult?img=' + result.data.file_url,
                    })
                    // this.setData({
                    //     file: result.data.file_url,
                    // })
                } else {
                    wx.showToast({
                        title: '图片上传失败',
                        icon: 'none',
                        duration: 2000,
                    })
                }
            })
            .catch((err) => {
                // reject(err)
                wx.hideLoading()
            })
    },
    // 图片超出限制
    oversize(event) {
        wx.showToast({
            title: '图片大小请在10M以下',
            icon: 'none',
            duration: 2000,
        })
    },
    // 曝光获取方法
    creatObserver: function () {
        let ob = this.data.ob
        let exposureList = this.data.exposureList
        if (ob) {
            ob.disconnect()
        }
        // 创建实例
        ob = this.createIntersectionObserver({
            // 阈值设置少，避免触发过于频繁导致性能问题
            thresholds: [1],
            // 监听多个对象
            observeAll: true,
        })
        // 相对于文档视窗监听
        ob.relativeToViewport().observe('.goods-item-box', (res) => {
            if (exposureList.indexOf(res.dataset.id) == -1) {
                exposureList.push(res.dataset.id)
            }
        })
        this.setData({
            ob,
            exposureList,
        })
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        // 埋点上报
        let pages = getCurrentPages()
        let view = pages[pages.length - 1]
        if (this.data.exposureList.length == 0) {
            return
        }
        util.tracking('goods_exposure', { goods_id: this.data.exposureList, page: view.route }, true)
        this.setData({
            exposureList: [],
        })
    },
    onUnload: function () {
        // 埋点上报
        let pages = getCurrentPages()
        let view = pages[pages.length - 1]
        if (this.data.exposureList.length == 0) {
            return
        }
        util.tracking('goods_exposure', { goods_id: this.data.exposureList, page: view.route }, true)
        this.setData({
            exposureList: [],
        })
    },
    filterTransfer(e){
        console.log('filterTransfer=====920', e.detail);
        this.setData({
            currentFilterAttr: e.detail.attr_list,
            currentFilterLabel: e.detail.label_list
        })
    }
})
