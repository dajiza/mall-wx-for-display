import loading from "../../utils/loading_util";

const tool = require('../../utils/tool')
const config = require('../../config/config')
const util = require('../../utils/util')
const constant = require('../../config/constant')
import screenConfig from '../../utils/screen_util'
const loginWatch = require('../../utils/loginWatch')

const tutorialModel = require('../../models/tutorial')
const goodsModel = require('../../models/goods')
const userShopInfoModel = require('../../models/userShopInfo')
const orderModel = require('../../models/order')
const cartModel = require('../../models/cart')
const app = getApp()
App.Page({
    data: {
        bannerHeight: screenConfig.getRPX(Number(app.globalData.statusBarHeight) + 46) + 548,
        title: '',
        indicatorDots: false,
        opacity: 0,
        autoplay: true,
        duration: 500,
        bannerList: [],
        tutorialId: 0,
        materialList: [],
        courseList: [],
        images: [],
        tutorialInfo: {},
        authorInfo: {}, // 作者
        showGuide: false,
        mainBannerCurrent: 0,
        scrollLeft: 0,
        isPullDown: false,
        memberDiscount: 0,  // 会员折扣
        userId: 0,
        like_status: false, // 收藏状态 > 0 收藏
        commission_user_id: 0, // 推荐人ID
        commission_type: 2, // 推荐类型 0无推荐 2看看分享推荐
        isOverShare: true,
        detailQueryEnd: false,
        mark: 'default'
    },
    // 不用于数据绑定的全局数据
    tempData: {
        like_loading: false,
        pageScrollTop: 0,
        bannerHeightPX: 0
    },
    onLoad: function (options) {
        // this.getUserDiscount()
        let id = Number(options.id) || null
        if (!id) {
            wx.showToast({
                title: '看看不存在或已隐藏,正在返回上一页',
                icon: 'none',
                duration: 1000,
            })
            let that = this
            setTimeout(function () {
                that.ClickBack()
            }, 1000)
            return
        }
        this.setData({
            tutorialId: id,
        })
        loginWatch.observer(
            this,
            () => {
                this.getData(id)
            }
        )
    },
    onShow: function (options) {
        let query = wx.createSelectorQuery();
        query.select('#KanKanBanner').boundingClientRect(rect=>{
            this.tempData.bannerHeightPX = rect.height;
            this.setAutoPlay()
        }).exec();
    },
    onHide: function() {
        this.setData({
            autoplay: false
        })
    },
    onPageScroll: function (e) {
        this.tempData.pageScrollTop = e.scrollTop
        this.setAutoPlay()
    },
    setAutoPlay() {
        if (this.tempData.pageScrollTop > this.tempData.bannerHeightPX) {
            if (this.data.autoplay) {
                this.setData({
                    autoplay: false
                })
            }
        } else {
            if (!this.data.autoplay) {
                this.setData({
                    autoplay: true
                })
            }
        }
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        // this.setData({
        //     isPullDown: true,
        // })
        // this.getDetailInfo(this.data.tutorialId)
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        // console.log('this.data.tutorialInfo.summary', this.data.tutorialInfo.summary)
        // console.log('this.data.tutorialInfo.cover_img_url', this.data.tutorialInfo.cover_img_url)
        return {
            title: this.data.tutorialInfo.summary,
            path: '/packageKanKan/detail/detail?id='+ this.data.tutorialId +'&commission_user_id=' + this.data.authorInfo.user_id,
            imageUrl: this.data.tutorialInfo.cover_img_url,
            // success: function (res) {
            //     // 转发成功
            //     console.log('转发成功', res)
            // },
            // fail: function (res) {
            //     // 转发失败
            //     console.log('转发失败', res)
            // },
        }
    },
    ClickBack: function () {
        let pages = getCurrentPages();
        if (pages.length === 1) {
            wx.switchTab({
                url: "/pages/index/index",
            });
        } else {
            wx.navigateBack({
                delta: 1,
            });
        }
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    getData(id) {
        console.log('id', id)
        this.getUserDiscount()
        this.getDetailInfo(id)
    },
    getDetailInfo(id) {
        wx.showLoading({
            title: '加载中...',
        })
        let that = this
        tutorialModel.tutorialDetail(id)
            .then(res => {
                wx.hideLoading()
                if (this.data.isPullDown) {
                    //停止下拉刷新
                    wx.stopPullDownRefresh()
                }
                let materialList = res.material_list || []
                materialList.forEach((ev)=>{
                    ev['sku_img'] = ''
                    ev['sku_name'] = ''
                    ev['price'] = 0
                })
                let images = res.show_img_list || []
                let steps = res.steps || []
                let tutorial = res.tutorial,
                    authorInfo = res.author
                //介绍以及状态
                let data = {
                    introduceContent: tutorial.summary,
                    approveStatus: tutorial.approve_status,
                }
                //成品图排序
                images.sort((a, b) => {
                    return a.sort - b.sort
                })
                //转换
                images = images.map(ev => {
                    return {
                        ...ev,
                        id: ev.id + "_" + ev.img_url,
                        url: ev.img_url
                    }
                })
                //教程排序
                steps.sort((a, b) => {
                    return a.sort - b.sort
                })
                //转换
                let courseList = steps.map(ev => {
                    return {
                        ...ev,
                        img: ev.img_url,
                        description: ev.summary.replace(/↵/g, '\n')
                    }
                })
                this.setData({
                    ...data,
                    authorInfo,
                    commission_user_id: authorInfo.user_id,
                    tutorialInfo: tutorial,
                    bannerList: images,
                    materialList: materialList,
                    courseList: courseList,
                    showGuide: false,
                    isPullDown: false,
                    like_status: res.like_status > 0,
                    detailQueryEnd: true
                },()=>{
                    if (materialList.length > 0) {
                        const sku_ids = materialList.map(item => {return item.sku_id})
                        this.getSkuList(sku_ids)
                    }
                })
            })
            .catch(err => {
                console.log(err)
                // that.ClickBack()
                wx.hideLoading()
            })
    },
    getSkuList(ids) {
        tutorialModel.querySkuList(ids)
            .then(res => {
                const sku_list = res || []
                let new_material_list = tool.deepClone(this.data.materialList)
                sku_list.forEach((ev, i)=>{
                    new_material_list.forEach((item, index)=>{
                        if (ev.sku_id == item.sku_id) {
                            item['sku_img'] = ev.sku_img
                            item['sku_name'] = ev.sku_name
                            item['price'] = ev.price
                            item['status'] = ev.status
                        }
                    })
                })

                this.setData({
                    materialList: new_material_list
                },()=>{
                    // console.log('materialList', this.data.materialList)
                })
            })
            .catch(err => {
                console.log(err)
            })
    },
    swiperChange: function (e) {
        // console.log(e)
        let current = e.detail.current
        this.setData({
            mainBannerCurrent: current,
        })
    },
    XScroll() {

    },
    // 获取会员折扣
    getUserDiscount() {
        userShopInfoModel.queryUserShopInfo({}).then((res) => {
            if (res['user_info']) {
                console.log('memberDiscount', res['user_info'].discount_value)
                this.setData({
                    userId: res['user_info'].user_id || 0,
                    memberDiscount: res['user_info'].discount_value || 0,
                })
            }
        })
    },
    // 跳转到作者简介
    handleGoUserDesc(res) {
        const user_ids = res.currentTarget.dataset.id
        wx.navigateTo({
            url: '/packageKanKan/mine/mine?user_id=' + user_ids,
        })
    },
    // 收藏、取消收藏
    handleOnLike() {
        let params = {
            status: this.data.like_status ? 1 : 2,
            tutorial_id: this.data.tutorialId
        }
        if (!this.tempData.like_loading) {
            this.tempData.like_loading = true
            tutorialModel
                .tutorialLike(params)
                .then(res=>{
                    console.log('res', res)
                    const bol = !this.data.like_status
                    const _title = bol ? '收藏成功': '取消收藏'
                    // this.setData({
                    //     like_status: bol
                    // })
                    tutorialModel.tutorialDetail(this.data.tutorialId)
                        .then(res => {
                            let tutorial = res.tutorial
                            this.setData({
                                tutorialInfo: tutorial,
                                like_status: res.like_status > 0
                            })
                        })
                        .catch(err => {
                            console.log(err)
                        })
                    wx.showToast({
                        title: _title,
                        icon: 'none',
                        duration: 2000,
                    })
                    setTimeout(()=>{
                        this.tempData.like_loading = false
                    },1000)
                })
                .catch()
        }
    },
    // 打开sku选择框
    openSpec(e) {
        let item =  e.currentTarget.dataset.item
        if (!item.goods_id) {
            return
        }
        if (item.status !== 2) {
            wx.showToast({
                title: '材料已下架',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        loading.showLoading()
        goodsModel
            .queryGoodsDetail(item.goods_id)
            .then((res) => {
                console.log(res)
                item.attr = res.attr_info
                item.goods = res.goods_info
                item.sku = res.goods_sku_list
                console.log('item=====249', item)
                loading.hideLoading()
                if (res.goods_sku_list.length < 1) {
                    wx.showToast({
                        title: '暂无可用sku',
                        icon: 'none',
                        duration: 2000,
                    })
                    return
                }
                let spec = this.selectComponent('#spec')
                spec.setData({
                    value: item.sku_id,
                    attr: item.attr,
                    goods: item.goods,
                    sku: item.sku,
                    isShow: true,
                    quantity: 1,
                    parameters: {
                        itemIndex: 0,
                        commission_user_id: this.data.commission_user_id || 0, // 推荐人ID
                        commission_type: this.data.commission_type || 0, // 推荐类型 0无推荐 2看看分享推荐
                    },
                })
            })
            .catch((err) => {
                console.log(err)
                loading.hideLoading()
            })
    },
    // 加入购物车
    async confirmSpec({ detail }) {
        console.log('confirmSpec', detail)
        return
        // let checkList = promotionModel.makeUpData.checkList
        let isExist = false
        let needAddCart = false
        if (!isExist) {
            detail['tobeAdded'] = detail.quantity
            // checkList.push(detail)
        }
        if (detail.tobeAdded) {
            await this.addCart(detail)
            needAddCart = true
        }
        if (needAddCart) {
            wx.showToast({
                title: '加购成功',
                icon: 'none',
                duration: 2000,
            })
        }
    },
    // 关闭选择框
    closeSpec: function (e) {
        this.selectComponent('#spec').close()
    },

    addCart(specInfo) {
        console.log('输出 ~ specInfo', specInfo)
        return new Promise((resolve, reject) => {
            if (specInfo.skuId) {
                cartModel.addToCartGoods(specInfo.skuId, specInfo.goodsId, specInfo.tobeAdded, specInfo.price).then((res) => {
                    console.log('输出 ~ res', res)
                    resolve()
                })
            }
        })
    },

    // 预览图片
    previewImage: function (e) {
        // 获取data-src
        let type = e.currentTarget.dataset.type  // 1 轮播图 2 步骤
        console.log('type', type)
        let src = e.currentTarget.dataset.src + '!upyun520/fw/3000'
        // 获取data-list
        let imgList = []
        console.log('this.data.bannerList', this.data.bannerList)
        if (type > 1) {
            this.data.courseList.forEach((ev)=>{
                if (ev.img) {
                    imgList.push(ev.img + '!upyun520/fw/3000')
                }
            })
        } else {
            this.data.bannerList.forEach((ev)=>{
                if (ev.url) {
                    imgList.push(ev.url + '!upyun520/fw/3000')
                }
            })
        }

        console.log('src', src)
        console.log('imgList', imgList)
        wx.previewImage({
            current: src, // 当前显示图片的http链接
            urls: imgList, // 需要预览的图片http链接列表
            success: function (res) {},
            fail: function (res) {},
        })
    },
})