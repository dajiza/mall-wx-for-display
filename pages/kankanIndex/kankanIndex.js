// pages/orderCheck/orderCheck.js
const kankanModel = require('../../models/kankan')
const config = require('../../config/config')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        page: 1,
        limit: 20,
        listL: [],
        listR: [],
        loading: [],

        listArr: [], //本次请求的数据,分割后的数组
        oddCount: 0, //奇数计数
    },
    events: {
        getKankanIndexRefresh: function () {
            console.log('输出 ~ getTeamworkIndexRefresh 刷新')
            this.setData({
                listL: [],
                listR: [],
                listArr: [],
                oddCount: 0,
                page: 1,
            })
            this.generateList()
        },
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        this.generateList()
    },

    onShow: function () {
        this.getTabBar().init()
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.setData({
            listL: [],
            listR: [],
            listArr: [],
            oddCount: 0,
            page: 1,
        })
        this.generateList()
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        console.log('输出 ~ onReachBottom')

        let loading = this.data.loading

        if (!loading) {
            this.setData({
                loading: true,
            })
            this.generateList()
        }
    },
    getList() {
        return new Promise((resolve, reject) => {
            let page = this.data.page
            let limit = this.data.limit
            kankanModel
                .queryTutorialRandList(page)
                .then((res) => {
                    // 分割数组
                    let newArr = []
                    for (let i = 0; i < res.list.length; ) {
                        //注意：这里与for循环不太一样的是，没有i++
                        newArr.push(res.list.slice(i, (i += limit)))
                    }
                    this.setData({
                        page: page + 1,
                        listArr: newArr,
                    })
                    resolve(true)
                })
                .catch((err) => {
                    reject(false)
                })
        })
    },
    async generateList() {
        wx.showLoading({
            title: '加载中...',
        })
        let listL = this.data.listL
        let listR = this.data.listR
        let listArr = this.data.listArr
        let oddCount = this.data.oddCount

        if (listArr.length == 0) {
            await this.getList()
            listArr = this.data.listArr
        }

        let listCurrent = listArr.shift()
        console.log('输出 ~ listCurrent', listCurrent.length)
        if (listCurrent.length % 2 != 0) {
            oddCount++
        }
        let newArrR, newArrL
        if (oddCount > 0 && oddCount % 2 == 0) {
            newArrR = listCurrent.filter((item, index) => index % 2 == 0)
            newArrL = listCurrent.filter((item, index) => index % 2 != 0)
        } else {
            newArrL = listCurrent.filter((item, index) => index % 2 == 0)
            newArrR = listCurrent.filter((item, index) => index % 2 != 0)
        }

        listL.push(...newArrL)
        listR.push(...newArrR)
        this.setData({
            listL,
            listR,
            oddCount,
            listArr: listArr,
            loading: false,
        })
        wx.stopPullDownRefresh()
        wx.hideLoading()
    },
    handlePublish: function () {
        this.getOrderList((isBought) => {
            if (!isBought) {
                wx.showModal({
                    title: '',
                    content: '抱歉~无法发布因为您还没有购买过商品',
                    confirmText: '知道了',
                    showCancel: false,
                    success(res) {
                        if (res.confirm) {
                            console.log('用户点击确定')
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    },
                })
                return
            }
            wx.navigateTo({
                url: '/packageKanKan/mine/mine',
            })
        })
    },
    onPop: function (e) {
        let pages = getCurrentPages()
        if (pages.length == 1) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },

    // 判断是否下过单
    getOrderList(callback) {
        let params = {
            shop_id: config.shopId,
            page_size: 1,
            page_index: 1,
            status: [1, 2, 3, 5, 6, 10, 11],
        }
        kankanModel
            .queryOrderSkuList(params)
            .then((res) => {
                let isBought = res.list.length > 0 ? true : false
                callback(isBought)
            })
            .catch((err) => {})
    },
    handleAuthorDetail: function (e) {
        let item = e.currentTarget.dataset.item
        wx.navigateTo({
            url: '/packageKanKan/mine/mine?user_id=' + item.author.user_id,
        })
    },
})
