// pages/share/share.js

import screenConfig from '../../utils/screen_util'

const posterModel = require('../../models/poster')

const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const screenWith = screenConfig.getWindowWidth(screenConfig.TYPE_RPX)
const navigateBarHeight = screenConfig.getSafeAreaTopPadding() + 46
const util = require('../../utils/util')
const config = require('../../config/config')
const userShopInfoModel = require('../../models/userShopInfo')

App.Page({
    data: {
        type: 0,
        imgList: [],
        selectedImg: {
            img: '',
            index: -1,
            isNative: false,
        },
        safeAreaInsetBottom: safeAreaInsetBottom,
        screenWith: screenWith,
        navigateBarHeight: navigateBarHeight,
        showSaveImageToPhotosAlbumDialog: false,
    },
    events: {
        preShareOnLoad: function (posterParams) {
            console.log(posterParams)
            this.data.posterParams = posterParams
        },
    },
    onLoad: async function (options) {
        console.log(options)
        let type = options.type || 0
        let imgList = []
        let userData = await userShopInfoModel.queryUserShopInfo()
        let userInfo = {
            nickName: userData.user_info.nick_name,
            avatarUrl: userData.user_info.avatar_url,
        }
        console.log('输出 ~ userInfo', userInfo)

        this.data.userInfo = userInfo
        let posterParams = this.data.posterParams
        wx.showLoading({
            title: '加载中',
        })
        if (type == 0) {
            posterModel
                .queryGoodsPoster(
                    posterParams.page,
                    posterParams.scene,
                    posterParams.goods_img,
                    posterParams.goods_name,
                    posterParams.goods_price,
                    this.data.userInfo.avatarUrl,
                    this.data.userInfo.nickName
                )
                .then((res) => {
                    return posterModel.getStorageImage(res.img_url)
                })
                .then((filePath) => {
                    this.setData(
                        {
                            selectedImg: {
                                type: type,
                                imgList: imgList,
                                img: filePath,
                                index: 0,
                                isNative: true,
                            },
                        },
                        function () {
                            wx.hideLoading()
                        }
                    )
                })
                .catch((err) => {
                    console.log(err)
                    wx.hideLoading()
                    this.setData({
                        type: type,
                        imgList: imgList,
                    })
                })
        } else {
            posterModel
                .queryPosterList()
                .then((posterList) => {
                    posterList.forEach((element) => {
                        imgList.push({
                            img: element.img,
                            isNative: false,
                        })
                    })
                    this.setData({
                        type: type,
                        imgList: imgList,
                    })
                    return imgList[0]
                })
                .then((poster) => {
                    return posterModel
                        .queryShopPoster(posterParams.page, posterParams.scene, userInfo.avatarUrl, poster.img)
                        .then((res) => {
                            console.log(res)
                            return posterModel.getStorageImage(res.img_url)
                        })
                        .then((filePath) => {
                            this.setData(
                                {
                                    selectedImg: {
                                        img: filePath,
                                        index: 0,
                                        isNative: true,
                                    },
                                },
                                function () {
                                    wx.hideLoading()
                                }
                            )
                        })
                })
                .catch((err) => {
                    console.log(err)
                    wx.hideLoading()
                    this.setData({
                        type: type,
                        imgList: imgList,
                    })
                })
        }
    },
    onReady: function () {},
    onShow: function () {},
    onHide: function () {},
    onUnload: function () {},
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    save: function () {
        let img = this.data.selectedImg.img
        console.log('输出 ~ img', img)
        if (img.length != '') {
            let that = this
            wx.showLoading({
                title: '保存中',
            })
            wx.saveImageToPhotosAlbum({
                filePath: img,
                success: function (data) {
                    console.log(data)
                    wx.showToast({
                        title: '已保存到相册',
                    })
                    // 埋点上报

                    let goodsId = that.data.posterParams.goods_id
                    if (goodsId) {
                        util.tracking('goodsdetail_share_poster', { goods_id: goodsId })
                    } else {
                        util.tracking('goodsdetail_share_shop_poster', { shop_id: config.shopId })
                    }
                },
                fail: function (err) {
                    console.log(err)
                    that.setData({
                        showSaveImageToPhotosAlbumDialog: true,
                    })
                },
                complete: function () {
                    wx.hideLoading()
                },
            })
        }
    },
    onOpenSetting: function (e) {
        console.log('onOpenSetting')
        if (e.detail.authSetting['scope.writePhotosAlbum']) {
            this.save()
        }
    },
    onClose: function (e) {
        console.log('onClose')
        this.setData({
            showSaveImageToPhotosAlbumDialog: false,
        })
    },
    selectProItem: function (e) {
        let index = e.currentTarget.dataset.index
        let userInfo = this.data.userInfo
        let posterParams = this.data.posterParams
        console.log(index)
        posterModel
            .queryShopPoster(posterParams.page, posterParams.scene, userInfo.avatarUrl, this.data.imgList[index].img, true)
            .then((res) => {
                return posterModel.getStorageImage(res.img_url).then((filePath) => {
                    wx.hideLoading()
                    let selectedImg = {
                        img: filePath,
                        index: index,
                        isNative: true,
                    }
                    this.setData({
                        selectedImg: selectedImg,
                    })
                    console.log(this.data)
                })
            })
            .catch((err) => {
                console.log(err)
                wx.hideLoading()
            })
    },
})
