// pages/goodsManager/goodsManager.js
import screenConfig from '../../utils/screen_util'
import util from '../../utils/util'

const teamworkModel = require('../../models/teamwork')
const searchListModel = require('../../models/searchList')
const goodsModel = require('../../models/goods')

const navigateBarHeight = screenConfig.getSafeAreaTopPadding() + 46
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const tool = require('../../utils/tool')

const app = getApp()

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        id: '',
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        navigateBarHeight: navigateBarHeight,
        safeAreaInsetBottom: safeAreaInsetBottom,

        name: '', // 名称---搜索内容
        searchPlace: '输入商品名称搜索',
        popupShow: false,
        searchModel: false,

        active: 0,
        page: 1,
        limit: 20,
        total: 0,
        isAllLoaded: false,
        bottomLoadingShow: false,

        searchRequest: {},
        searchList: {},
        goodsCate: {},

        shelves: false,
        goodsSkus: [],
        editGoods: {},

        goodsList: [],
        currentFilterAttr: [],
        currentFilterLabel: [],
        selectedNum: 0,
        checkedAll: false,
        loading: false,
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let id = options.id || ''
        this.setData({ id })
        this.getGoodsList()
        this.getCategoryData()
    },
    onShow: function () {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        this.setData({
            page: 1,
            goodsList: [],
        })
        this.getGoodsList()
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        let page = this.data.page
        let loading = this.data.loading
        let pageTotal = this.data.pageTotal
        if (page <= pageTotal && !loading) {
            this.setData({
                loading: true,
            })
            this.getGoodsList()
        }
    },
    onPageScroll: util.throttle(function (res) {
        // console.log(res[0].scrollTop)
    }),
    handleonShelve: function () {
        wx.navigateTo({
            url: '/packageAgent/putGoodsOnSale/putGoodsOnSale',
        })
    },
    bindClearSearch: function () {
        this.setData(
            {
                name: '',
                goodsList: [],
                page: 1,
            },
            () => {
                this.getGoodsList()
            }
        )
    },
    bindSearchInput: function (e) {
        this.setData({
            name: e.detail.value,
        })
    },
    searchInputCapture: function (e) {
        if (!this.data.searchModel) {
            //非搜索模式
            this.setData({
                searchModel: true,
                backgroundColor: '#ffffff',
            })
        }
    },
    handleOnFocus: function () {},
    handleOnSearch: function () {
        if (this.data.name) {
            let history = this.selectComponent('#history')
            history.saveSearch(this.data.name)
        }
    },
    onSearchCancel() {
        this.setData({
            searchModel: false,
            backgroundColor: 'var(--divider-border-color)',
        })
    },
    goSearch(e) {
        this.setData(
            {
                searchModel: false,
                backgroundColor: 'var(--divider-border-color)',
            },
            () => {
                this.setData(
                    {
                        goodsList: [],
                        page: 1,
                        name: e.detail || '',
                    },
                    () => {
                        this.getGoodsList()
                    }
                )
            }
        )
        wx.nextTick(() => {
            this.setData({
                name: e.detail || '',
            })
        })
    },
    onClickFilter() {
        this.setData({
            popupShow: true,
        })
    },

    ClickBack() {
        if (this.data.searchModel) {
            this.onSearchCancel()
            return
        }
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
    fillterPopupClose() {
        this.setData({
            popupShow: false,
        })
    },
    getFillter(e) {
        console.log('输出 ~ e', e)
        let detail = e.detail
        let otherCateId = e.detail.new_search.otherCateId
        let selectedType = e.detail.new_search.selectedType
        detail.other_id = otherCateId != -1 ? otherCateId : selectedType

        this.data.searchRequest = detail
        this.setData({
            searchList: this.data.searchRequest.new_search,
            popupShow: false,
            page: 1,
            goodsList: [],
        })
        this.getGoodsList()
    },
    fillterReset(e) {
        console.log('输出 ~ fillterReset')
        this.data.searchRequest = e.detail
        this.setData({
            searchList: {},
            popupShow: false,
            name: '',
            page: 1,
            goodsList: [],
        })
        this.getGoodsList()
    },
    navigateTo(e) {
        // let index = e.currentTarget.dataset.index
        // let goods = this.data.goodsList[index]
        // let goodsId = goods.goods_id
        // if (goodsId) {
        //     //有这个属性则传对应的值，没有这个属性，则传1
        //     let is_top = goods.is_top == 2 ? 1 : 2
        //     wx.navigateTo({
        //         url: '/packageAgent/goodsManagerDetail/goodsManagerDetail?goodsId=' + goodsId + '&goodsName=' + goods.title + '&type=' + goods.type + '&is_top=' + is_top,
        //     })
        // }
    },

    getGoodsList() {
        wx.showLoading({
            title: '加载中',
        })
        let searchRequest = this.data.searchRequest
        let name = this.data.name
        let page = this.data.page
        let limit = this.data.limit
        let list = this.data.goodsList
        let params = {
            shop_goods_status: 2,
            sku_is_store_shortage: 1,
            goods_name: name,
            page,
            limit,
            ...searchRequest,
        }
        goodsModel
            .queryShopGoodsList(params)
            .then((res) => {
                let newArr = res.lists.map((item) => {
                    let exist = teamworkModel.recGoods.findIndex((e) => e.id == item.id)

                    return {
                        id: item.id,
                        title: item.goods_title,
                        img: item.goods_img,
                        price: item.price,
                        commission: item.commission,
                        display_sales: item.real_sales,
                        status: 2,
                        checked: exist != -1,
                        disabled: exist != -1,
                    }
                })
                list.push(...newArr)
                this.setData({
                    goodsList: list,
                    page: page + 1,
                    total: res.total,
                    pageTotal: res.pages,
                    loading: false,
                })
                wx.hideLoading()
            })
            .catch((err) => {})
    },
    getCategoryData() {
        searchListModel.queryV2GoodsCateList({}).then((res) => {
            if (res) {
                this.setData({
                    goodsCate: res,
                })
            }
        })
    },

    filterTransfer(e) {
        this.setData({
            currentFilterAttr: e.detail.attr_list,
            currentFilterLabel: e.detail.label_list,
        })
    },
    toggle: function (e) {
        console.log('输出 ~ toggle', e)
        let id = e.currentTarget.dataset.id
        let checkbox = this.selectComponent('#checkbox_' + id)
        checkbox.toggle()
    },
    catchTapDummy: function (e) {},
    checkedItem: function (e) {
        console.log('输出 ~ checkedItem', e)
        //item选中事件
        let goodsItem = e.currentTarget.dataset.goodsItem
        let goodsList = this.data.goodsList
        // goodsList.forEach((ev) => {
        //     if (ev.goods_id === goodsItem.goods_id) {
        //         ev['checked'] = !goodsItem.checked
        //     }
        // })
        let index = goodsList.findIndex((item) => item.id == goodsItem.id)
        this.setData({
            ['goodsList[' + index + '].checked']: !goodsItem.checked,
            // goodsList,
        })
        this.checkCartGoodsCount()
    },
    // 计算选中的商品数量
    checkCartGoodsCount: function () {
        let goodsList = this.data.goodsList
        let count = 0
        for (let i = 0; i < goodsList.length; i++) {
            const goods = goodsList[i]
            if (goods.checked && !goods.disabled) {
                count++
            }
        }
        this.setData({
            selectedNum: count,
        })
    },
    // 全选
    checkedAll(e) {
        let goodsList = this.data.goodsList
        for (let i = 0; i < goodsList.length; i++) {
            const goods = goodsList[i]
            goods.checked = e.detail
        }
        this.setData({
            checkedAll: e.detail,
            goodsList,
        })
        this.checkCartGoodsCount()
    },
    // 提交数据
    submitGoods(e) {
        let id = Number(this.data.id)
        let goodsList = this.data.goodsList
        // 列表check置灰
        goodsList = goodsList.map((item) => {
            if (item.checked) {
                item.disabled = true
            }
            return item
        })
        // 筛选选中数据
        let list = goodsList.filter((item) => item.checked)

        // 去重并加入缓存
        let newGoodsIds = []
        for (let i = 0; i < list.length; i++) {
            const element = list[i]
            let exist = teamworkModel.recGoods.findIndex((item) => item.id == element.id)
            if (exist == -1) {
                teamworkModel.recGoods.push(element)
                newGoodsIds.push(element.id)
            }
        }
        this.setData({
            goodsList,
        })
        if (id) {
            teamworkModel.addCourseGoods(id, newGoodsIds).then((res) => {
                wx.showToast({
                    title: '添加成功',
                    icon: 'none',
                    duration: 2000,
                })
                this.post({
                    eventName: 'queryCorseRecGoods',
                    eventParams: '',
                })
            })
        } else {
            wx.showToast({
                title: '添加成功',
                icon: 'none',
                duration: 2000,
            })
        }
        this.checkCartGoodsCount()
    },
    // 刷新选中
    // refreshChecked() {
    //     let goodsList = this.data.goodsList
    //     let list = teamworkModel.recGoods
    //     for (let i = 0; i < list.length; i++) {
    //         const element = list[i];
    //         let exist=

    //     }
    // },
})
