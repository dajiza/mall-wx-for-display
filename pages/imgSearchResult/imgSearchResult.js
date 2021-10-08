const searchListModel = require('../../models/searchList')

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

        page: 0,
        loading: false,
        img: '',
        goodsEntire: [],
        goodsList: [],
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中',
        })
        let img = options.img
        this.setData({
            img,
        })
        this.queryGoods()
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
    onPullDownRefresh: function () {},

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
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        let goodsEntire = this.data.goodsEntire
        let page = this.data.page
        let loading = this.data.loading

        if (page < goodsEntire.length && !loading) {
            this.setData({
                loading: true,
            })
            this.queryGoodsDetail()
        }
    },
    /**
     * 请求搜索结果
     */
    queryGoods() {
        let pic_url = this.data.img
        searchListModel.queryGoodsIdByImg(pic_url).then((res) => {
            console.log('输出 ~ res', res)
            // let aa = []
            // for (let i = 0; i < 50; i++) {
            //     aa.push(...res)
            // }
            // res = aa
            var submin = []
            for (var i = 0, len = res.length; i < len; i += 6) {
                submin.push(res.slice(i, Math.min(i + 6, len)))
            }
            console.log('submin', submin)

            this.setData({
                goodsEntire: submin,
            })
            if (res.length > 0) {
                this.queryGoodsDetail()
            } else {
                wx.hideLoading()
            }
        })
    },
    /**
     * 获取商品详情
     */
    queryGoodsDetail() {
        wx.showLoading({
            title: '加载中',
        })
        let goodsEntire = this.data.goodsEntire
        let page = this.data.page
        let goodsList = this.data.goodsList

        let addArray = goodsEntire[page]
        goodsList.push(...addArray)

        this.setData({
            goodsList,
            page: page + 1,
            loading: false,
        })
        wx.hideLoading()
    },
    // queryGoodsDetail() {
    //     wx.showLoading({
    //         title: '加载中',
    //     })
    //     let goodsIds = this.data.goodsIds
    //     let page = this.data.page
    //     let goodsList = this.data.goodsList

    //     searchListModel
    //         .queryGoodsDetailByIds(goodsIds[page])
    //         .then((res) => {
    //             console.log('输出 ~ res', res)
    //             goodsList.push(...res)

    //             this.setData({
    //                 goodsList,
    //                 page: page + 1,
    //                 loading: false,
    //             })
    //             wx.hideLoading()
    //         })
    //         .catch((err) => {
    //             wx.hideLoading()
    //             this.setData({
    //                 loading: false,
    //             })
    //         })
    // },

    /**
     * 点击商品-前往商品详情
     */
    handleGoGoodsDetail(res) {
        const goods_id = Number(res.currentTarget.dataset.id)
        const sku_id = Number(res.currentTarget.dataset.skuid)
        wx.navigateTo({
            url: `../goodsDetail/goodsDetail?goodsId=${goods_id}&skuId=${sku_id}`,
        })
    },
})
