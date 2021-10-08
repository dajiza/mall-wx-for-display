// pages/goodsManager/goodsManager.js
import screenConfig from '../../utils/screen_util'
import util from '../../utils/util'

const teamworkModel = require('../../models/teamwork')

const navigateBarHeight = screenConfig.getSafeAreaTopPadding() + 46
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)

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

        goodsList: [],
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中',
        })

        setTimeout(function () {
            wx.hideLoading()
        }, 1000)

        let id = options.id || ''
        this.setData({ id })
    },
    onShow: function () {
        let goodsList = teamworkModel.recGoods
        this.setData({ goodsList })
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        // this.getGoodsList(this.data.active, false, false)
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        // console.log('onReachBottom')
        // if (this.data.goodsList.length >= this.data.total) {
        //     //已加载全部的商品列表
        //     return
        // }
        // this.getGoodsList(this.data.active, false, true)
    },
    onPageScroll: util.throttle(function (res) {
        console.log(res[0].scrollTop)
    }),

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
    addGoods(e) {
        wx.navigateTo({
            url: `/packageTeamwork/recommendPickout/recommendPickout?id=${this.data.id}`,
        })
    },

    getGoodsList() {
        let name = this.data.name
        let page = this.data.page
        let list = this.data.goodsList
        let params = {
            page: 1,
            limit: 1,
            course_id: 210,
        }
        teamworkModel
            .getAgentShopGoodsList({
                status: 1,
                page: page,
                name: name,
            })
            .then((res) => {
                let newArr = res.lists
                for (let i = 0; i < newArr.length; i++) {
                    const element = newArr[i]
                    element['checked'] = false
                }
                list.push(...newArr)
                this.setData({
                    goodsList: list,
                    page: page + 1,
                    total: res.total,
                    pageTotal: res.pages,
                    loading: false,
                })
            })
            .catch((err) => {})
    },
    deleteGodds(e) {
        let id = Number(this.data.id)
        let goodsId = e.currentTarget.dataset.id
        let index = teamworkModel.recGoods.findIndex((item) => item.id == goodsId)
        teamworkModel.recGoods.splice(index, 1)
        this.setData({ goodsList: teamworkModel.recGoods })
        if (id) {
            teamworkModel.deleteCourseGoods(id, [goodsId]).then((res) => {
                wx.showToast({
                    title: '删除成功',
                    icon: 'none',
                    duration: 2000,
                })
                this.post({
                    eventName: 'queryCorseRecGoods',
                    eventParams: '',
                })
            })
        }
        console.log('输出 ~ goodsId', goodsId)
    },
})
