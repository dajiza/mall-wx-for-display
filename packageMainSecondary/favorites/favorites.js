import screenConfig from '../../utils/screen_util'
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const goodsModel = require('../../models/goods')
const kankanModel = require('../../models/kankan')
const userShopInfoModel = require('../../models/userShopInfo')

const app = getApp()

Page({
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        safeAreaInsetBottom: safeAreaInsetBottom,
        checkedGoodsCount: 0,
        list: [],
        isEditModel: false,

        total: 0,
        searType: 1,
        loading: false,
        tabIndex: 1,
        // 看看
        listKKL: [],
        listKKR: [],
        page: 1,
        limit: 6,
        userId: '',
        pageTotal: 0,
    },
    onLoad: async function (options) {
        await this.getUserInfo()
        this.queryList()
    },
    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        return new Promise((resolve, reject) => {
            userShopInfoModel.queryUserShopInfo({}).then((res) => {
                console.log('输出 ~ res', res)
                this.setData({
                    userId: res.user_info.user_id,
                })
                resolve(res)
            })
        })
    },
    queryList() {
        wx.showLoading()
        let list = this.data.list
        let params = {
            searType: 1, // 1全部 2有优惠
        }

        goodsModel.queryFavoriteList(params).then((res) => {
            console.log('输出 ~ res', res)
            let list = res.list.map((item) => {
                item.checked = false
                return item
            })
            this.setData({
                list,
                total: res.total,
                loading: false,
            })
            wx.hideLoading()
        })
    },
    queryListKK() {
        wx.showLoading()
        let listKKL = this.data.listKKL
        let listKKR = this.data.listKKR
        let params = {
            user_id: this.data.userId,
            page_size: this.data.limit,
            page_index: this.data.page,
        }

        kankanModel.queryTutorialLikeList(params).then((res) => {
            console.log('输出 ~ res', res)

            let newArr = res.list || []
            let newArrL = newArr.filter((item, index) => index % 2 == 0)
            let newArrR = newArr.filter((item, index) => index % 2 != 0)
            listKKL.push(...newArrL)
            listKKR.push(...newArrR)
            this.setData({
                listKKL,
                listKKR,
                page: this.data.page + 1,
                total: res.total,
                pageTotal: Math.ceil(res.total / this.data.limit),
                loading: false,
            })
            wx.hideLoading()
        })
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        console.log('输出 ~ onReachBottom')
        let page = this.data.page
        let limit = this.data.limit
        let total = this.data.total
        let loading = this.data.loading
        if (loading || this.data.tabIndex == 1) {
        }
        let pageTotal = Math.ceil(total / limit)
        if (page <= pageTotal && !loading) {
            this.setData({
                loading: true,
            })
            this.queryList()
        }
    },
    onReady: function () {},
    onShow: function () {},
    onUnload: function () {},
    onPullDownRefresh: function () {},
    onChange: function (event) {
        console.log('输出 ~ event', event)
        if (this.data.isEditModel) {
            this.handleEdit()
        }
        this.setData({
            tabIndex: event.detail.name,
        })
        //切换，重新请求数据
        if (event.detail.name == 1) {
            this.setData({
                list: [],
            })
            this.queryList()
        } else {
            this.setData({
                listKK: [],
            })
            this.queryListKK()
        }
    },
    toggle: function (e) {
        let goodsId = e.currentTarget.dataset.goodsId
        let checkbox = this.selectComponent('#checkbox_' + goodsId)
        checkbox.toggle()
    },
    catchTapDummy: function () {},
    checkedItem: function (e) {
        console.log(e)
        let submitData = {}
        let itemIndex = e.currentTarget.dataset.itemIndex
        let val = e.detail
        let key = 'list' + '[' + itemIndex + '].checked'
        submitData[key] = val
        this.setData(
            {
                ...submitData,
            },
            () => {
                let checkedGoodsCount = 0
                this.data.list.forEach((value, index) => {
                    if (value.checked) {
                        checkedGoodsCount++
                    }
                })
                this.setData({
                    checkedGoodsCount: checkedGoodsCount,
                })
            }
        )
    },
    handleEdit() {
        let submitData = {}
        if (this.data.isEditModel == false) {
            this.data.list.forEach((value, index) => {
                if (value.checked) {
                    let key = 'list' + '[' + index + '].checked'
                    submitData[key] = false
                }
            })
        }
        this.setData({
            ...submitData,
            checkedGoodsCount: 0,
            isEditModel: !this.data.isEditModel,
        })
    },
    onAllCheckBoxChangeToggle(event) {
        let componentId = event.currentTarget.dataset.componentId
        let component = this.selectComponent('#' + componentId)
        component.toggle()
    },
    onAllCheckBoxChange(e) {
        console.log(e)
        let val = e.detail
        let checkedGoodsCount = 0
        let submitData = {}
        this.data.list.forEach((value, index) => {
            let key = 'list' + '[' + index + '].checked'
            submitData[key] = val
            if (val) {
                checkedGoodsCount++
            }
        })
        this.setData({
            ...submitData,
            checkedGoodsCount: checkedGoodsCount,
        })
    },
    deleteConfirm() {
        wx.showLoading()
        let ids = this.data.list.filter((item) => item.checked).map((item) => item.favoriteId)

        goodsModel.deleteFavorite(ids).then((res) => {
            wx.showToast({
                title: '删除成功',
                icon: 'none',
                duration: 2000,
            })
            // 重新拉取列表数据
            let params = {
                searType: 1, // 1全部 2有优惠
            }
            goodsModel
                .queryFavoriteList(params)
                .then((res) => {
                    let list = res.list.map((item) => {
                        item.checked = false
                        return item
                    })
                    this.setData({
                        list,
                        loading: false,
                        total: res.total,
                        checkedGoodsCount: 0,
                    })
                    wx.hideLoading()
                })
                .catch(() => {
                    reject()
                })
        })
    },
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
    gotoDetail(e) {
        let id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/goodsDetail/goodsDetail?goodsId=${id}`,
        })
    },
})
