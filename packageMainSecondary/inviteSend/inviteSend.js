// pages/invite/invite.js
const inviteModel = require('../../models/invite')
const userShopInfoModel = require('../../models/userShopInfo')
const posterModel = require('../../models/poster')
const loginWatch = require('../../utils/loginWatch')

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        isOverShare: true,

        navTitle: '邀请新用户',
        img: '',
        avatar: '',
        userId: '',
        nickName: '',
        showPop: false,
        showSaveImageToPhotosAlbumDialog: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.showLoading()
        loginWatch.observer(this, () => {
            this.getUserInfo().then((res) => {
                console.log('输出 ~ res', res)
                this.setData({
                    avatar: res.user_info.avatar_url,
                    userId: res.user_info.user_id,
                    nickName: res.user_info.nick_name,
                })
                wx.hideLoading()
            })
        })
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    onClose() {
        this.setData({ showPop: false })
    },
    showPopup() {
        this.setData({ showPop: true })
    },
    onClosePermission: function (e) {
        console.log('onClose')
        this.setData({
            showSaveImageToPhotosAlbumDialog: false,
        })
    },
    onOpenSetting: function (e) {
        console.log('onOpenSetting')
        if (e.detail.authSetting['scope.writePhotosAlbum']) {
            this.save()
        }
    },
    // 获取图片 打开pop
    saveAlbum: function () {
        wx.showLoading({
            title: '图片生成中',
        })

        let avatar = this.data.avatar
        let userId = this.data.userId
        let nickName = this.data.nickName
        let scene = String(userId)
        // let scene = `{"avatar":"${avatar}","user_id":${userId},"nick_name":"${nickName}"}`
        // scene = encodeURIComponent(scene)
        inviteModel
            .queryPoster(scene, avatar)
            .then((res) => {
                return posterModel.getStorageImage(res.img)
            })
            .then((filePath) => {
                this.setData(
                    {
                        img: filePath,
                    },
                    function () {
                        this.showPopup()
                        wx.hideLoading()
                    }
                )
            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    // 保存
    save: function () {
        wx.showLoading({
            title: '保存中',
        })
        let img = this.data.img
        let that = this

        wx.saveImageToPhotosAlbum({
            filePath: img,
            success: function (data) {
                console.log(data)
                wx.showToast({
                    title: '已保存到相册',
                })
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
    },
    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        return new Promise((resolve, reject) => {
            userShopInfoModel.queryUserShopInfo({}).then((res) => {
                resolve(res)
                // let _obj = {}
                // let _shopInfo = {}
                // _obj['nick_name'] = res['user_info']['nick_name']
                // _obj['avatar_url'] = res['user_info']['avatar_url']
                // _shopInfo['shop_name'] = res['shop_info']['shop_name']
                // this.setData({
                //     userInfo: _obj,
                //     shopInfo: _shopInfo,
                // })
            })
        })
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
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (res) {
        return {
            title: '分享',
            path: `/pages/inviteReceive/inviteReceive?user_id=${this.data.userId}&avatar=${this.data.avatar}&nick_name=${this.data.nickName}`,
            // imageUrl: '',
            success: function (res) {
                // 转发成功
            },
            fail: function (res) {
                // 转发失败
            },
        }
    },
})
