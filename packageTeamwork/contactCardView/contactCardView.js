const config = require('../../config/config')
const teamworkModel = require('../../models/teamwork')
const userShopInfoModel = require('../../models/userShopInfo')

Page({
    data: {
        isAdmin: false,
        creat_user_id: false, //创建团作的用户
        user_id: false, //当前用户的id
        nickName: '',
        avatar: '',
        wxAccount: '',
        qrcode: '',
        contactList: [],
        shopName: config.shopName,
        showSaveImageToPhotosAlbumDialog: false,
        showOfficialName: true, //是否显示公众号名称 在公众号组件不显示的情况下
    },
    onLoad: function (options) {
        let admin = Number(options.admin || '0')
        let courseId = Number(options.course_id || '-1')
        if (courseId == -1) {
            return
        }
        this.data.courseId = courseId
        this.setData({
            isAdmin: admin == 1,
        })
        this.getUserInfo()
        this.getUserId()
    },
    getUserInfo() {
        let cacheUserCardInfo = teamworkModel.cacheUserCardInfo()
        if (cacheUserCardInfo == null) {
            wx.showLoading({
                title: '加载中...',
            })
            teamworkModel
                .userCardInfo({
                    course_id: this.data.courseId,
                })
                .then((res) => {
                    wx.hideLoading()
                    this.initData(res)
                })
                .catch((err) => {
                    wx.hideLoading()
                })
        } else {
            this.initData(cacheUserCardInfo)
        }
    },
    /**
     * 网络请求，获取用户信息数据
     */
    getUserId() {
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                this.setData({
                    user_id: res.user_info.user_id,
                })
            })

            .catch((err) => {})
    },
    initData(userCardInfo) {
        let contactList = []
        if (userCardInfo.wb_nick_name && userCardInfo.wb_nick_name.length > 0) {
            contactList.push({
                contactWay: '微博：' + userCardInfo.wb_nick_name,
                type: 'weibo',
                icon: '../static/ic_weibo.png',
                content: userCardInfo.wb_nick_name,
            })
        }
        if (userCardInfo.xhs_nick_name && userCardInfo.xhs_nick_name.length > 0) {
            contactList.push({
                contactWay: '小红书：' + userCardInfo.xhs_nick_name,
                type: 'redbook',
                icon: '../static/ic_redbook.png',
                content: userCardInfo.xhs_nick_name,
            })
        }
        if (userCardInfo.dy_nick_name && userCardInfo.dy_nick_name.length > 0) {
            contactList.push({
                contactWay: '抖音：' + userCardInfo.dy_nick_name,
                type: 'tiktok',
                icon: '../static/ic_tiktok.png',
                content: userCardInfo.dy_nick_name,
            })
        }
        if (userCardInfo.wx_official && userCardInfo.wx_official.length > 0) {
            contactList.push({
                contactWay: '公众号：' + userCardInfo.wx_official,
                type: 'wx_official',
                icon: '../static/ic_weixin.png',
                content: userCardInfo.wx_official,
            })
        }
        this.setData({
            show_official: userCardInfo.show_official,
            nickName: userCardInfo.nick_name,
            avatar: userCardInfo.avatar_url,
            wxAccount: userCardInfo.wx_account,
            qrcode: userCardInfo.wx_qr_url,
            contactList: contactList,
            creat_user_id: userCardInfo.user_id,
        })
    },
    //复制联系方式
    handleConractWayCopy: function (e) {
        console.log(e)
        let index = e.currentTarget.dataset.index
        let content = ''
        if (index == -1) {
            //复制微信号
            content = this.data.wxAccount
        } else {
            let contact = this.data.contactList[index]
            content = contact.content
        }
        wx.setClipboardData({
            data: content,
            success(res) {},
        })
    },
    ///编辑名片
    handleContactCardEdit: function (e) {
        let that = this
        wx.navigateTo({
            url: '/packageTeamwork/contactCardEdit/contactCardEdit?course_id=' + this.data.courseId + '&edit=1',
            events: {
                updateContactCard: function () {
                    let cacheUserCardInfo = teamworkModel.cacheUserCardInfo()
                    console.log(cacheUserCardInfo)
                    that.initData(cacheUserCardInfo)
                },
            },
        })
    },
    ///保存二维码
    handleSaveContactCard: function () {
        let url = this.data.qrcode
        if (url.length == 0) {
            return
        }
        wx.showLoading({
            title: '保存中',
        })
        let isExist = false
        let storage = wx.getStorageSync('contactCardQRCode')
        if (storage && storage.web_path == url) {
            //存在缓存
            try {
                const fileSystem = wx.getFileSystemManager()
                fileSystem.accessSync(storage.local_path)
                //图片存在
                isExist = true
            } catch (error) {
                console.log(err)
                //图片不存在,清空缓存
                wx.removeStorageSync('contactCardQRCode')
            }
        }
        let imagePromise
        if (isExist) {
            wx.hideLoading()
            imagePromise = Promise.resolve(storage.local_path)
        } else {
            //图片不存在，下载二维码图片
            imagePromise = new Promise((resolve, reject) => {
                wx.downloadFile({
                    url: url,
                    success: function (res) {
                        let filePath = res.tempFilePath
                        let storage = {
                            web_path: url,
                            local_path: filePath,
                        }
                        wx.setStorageSync('contactCardQRCode', storage)
                        console.log('下载图片并缓存 filePath:' + filePath)
                        console.log(storage)
                        wx.hideLoading()
                        resolve(filePath)
                    },
                    fail: function (err) {
                        console.log(err)
                        reject(err)
                    },
                })
            })
        }
        imagePromise
            .then((res) => {
                let that = this
                wx.saveImageToPhotosAlbum({
                    filePath: res,
                    success: function (data) {
                        wx.showToast({
                            title: '已保存到相册',
                        })
                    },
                    fail: function (err) {
                        console.log(err)
                        if (err.errMsg != 'saveImageToPhotosAlbum:fail cancel') {
                            that.setData({
                                showSaveImageToPhotosAlbumDialog: true,
                            })
                        }
                    },
                })
            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    onOpenSetting: function (e) {
        console.log('onOpenSetting')
        if (e.detail.authSetting['scope.writePhotosAlbum']) {
            this.handleSaveContactCard()
        }
    },
    onClose: function (e) {
        console.log('onClose')
        this.setData({
            showSaveImageToPhotosAlbumDialog: false,
        })
    },
    ClickBack() {
        let pages = getCurrentPages()
        if (pages.length === 1) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
    // 左上角 进入团作
    gotoDetail() {
        wx.navigateTo({
            url: `/packageTeamwork/courseDetail/courseDetail?course_id=${this.data.courseId}`,
        })
    },
    // official-account开放组件事件
    officialLoad(e) {
        if (e.status == 0) {
            this.setData({
                showOfficialName: false,
            })
        }
    },
})
