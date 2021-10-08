// pages/goodsDetail/goodsDetail.js
const pointsModel = require('../../models/points')
const tool = require('../../utils/tool')
const config = require('../../config/config')
const userShopInfoModel = require('../../models/userShopInfo')

const loginWatch = require('../../utils/loginWatch')
const util = require('../../utils/util')
const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        title: '',
        goods: {},
        authorizeShow: false, //授权显示
        current: 0,
        goodsId: '',
        points: '',
        tabShow: false,
        autoplay: true,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        // isOverShare: true,

        // showBuy: false,
        goodsNum: 1,
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
        this.getUserInfo()
        let goodsId = Number(options.goodsId)
        pointsModel.queryPointsGoodsDetail(goodsId).then(async (res) => {
            console.log('输出 ~ res', res)
            if (res.goodsId == 0) {
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

            // 图片排序
            res.medias = res.medias.sort((a, b) => a.sort - b.sort)
            res.attrs = res.attrs ? JSON.parse(res.attrs) : []

            this.setData({
                goods: res,
            })

            wx.hideLoading()
        })
    },
    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        wx.showLoading({
            title: '加载中...',
        })
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                console.log('输出 ~ res', res)
                this.setData({
                    points: res.user_info.points,
                })
                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

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
        })
    },

    // 预览图片
    previewImage: function (e) {
        // 获取data-src
        var src = e.currentTarget.dataset.src
        // 获取data-list
        var imgList = this.data.goods.medias.map((item) => item.link)
        wx.previewImage({
            current: src, // 当前显示图片的http链接
            urls: imgList, // 需要预览的图片http链接列表
            success: function (res) {
                console.log('success')
            },
            fail: function (res) {
                console.log('fail')
            },
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

    // spec显示

    // 弹出授权去弹窗 隐藏标题
    authorizeTrigger(e) {
        this.setData({
            authorizeShow: e.detail,
        })
    },

    // 立即购买
    openBuyDialog(event) {
        let myPoints = this.data.points
        let goodsPoints = this.data.goods.points
        let stock = this.data.goods.stockQty

        if (goodsPoints > myPoints || stock <= 0) {
            wx.showToast({
                title: '积分不足或无库存',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        this.setData({
            showBuy: true,
        })
    },
    buyConfirm(event) {
        let stock = this.data.goods.stockQty
        let num = this.data.goodsNum
        pointsModel.orderGoods = this.data.goods
        pointsModel.orderGoods.quantity = num
        if (num > 0 && stock > 0) {
            wx.navigateTo({
                url: `/packagePoints/pointsGoodsOrderCheck/pointsGoodsOrderCheck`,
            })
        } else {
            wx.showToast({
                title: '积分不足或无库存',
                icon: 'none',
                duration: 2000,
            })
        }
    },
    onCloseBuy(event) {
        this.setData({
            showBuy: false,
        })
    },
    // 数量加
    numPlus() {
        let stock = this.data.goods.stockQty
        let myPoints = this.data.points
        let goodsPoints = this.data.goods.points
        let limitNum = Math.floor(myPoints / goodsPoints)
        let maxBuyNum = stock > limitNum ? limitNum : stock
        let num = this.data.goodsNum
        if (num >= maxBuyNum) {
            return
        }
        this.setData({
            goodsNum: ++num,
        })
    },
    numMinus() {
        let num = this.data.goodsNum
        if (num <= 0) {
            return
        }
        this.setData({
            goodsNum: --num,
        })
    },
    onChangeInput() {
        let stock = this.data.goods.stockQty
        let myPoints = this.data.points
        let goodsPoints = this.data.goods.points
        let limitNum = Math.floor(myPoints / goodsPoints)
        let maxBuyNum = stock > limitNum ? limitNum : stock
        let num = this.data.goodsNum
        let setNum = num
        if (num >= maxBuyNum) {
            setNum = maxBuyNum
        }
        if (num <= 0) {
            setNum = 0
        }
        this.setData({
            goodsNum: setNum,
        })
    },

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
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},
})
