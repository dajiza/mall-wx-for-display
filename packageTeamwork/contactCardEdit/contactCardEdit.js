import screenConfig from '../../utils/screen_util'
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const teamworkModel = require('../../models/teamwork')
const userShopInfoModel = require('../../models/userShopInfo')
Page({
    data: {
        courseId: '',
        safeAreaInsetBottom: safeAreaInsetBottom,
        nickName: '',
        avatar: '',
        wxAccount: '',
        qrcode: '',
        qrcodeShow: '',
        weibo: '',
        redBook: '',
        tikTok: '',
        wx_official: '',
        isShow: '',
    },
    onLoad: function (options) {
        let courseId = Number(options.course_id || '-1')
        this.setData({
            courseId,
        })
        if (courseId == -1) {
            return
        }
        this.data.courseId = courseId
        //是否来自名片编辑
        let isEdit = Number(options.edit || '0')
        this.data.isEdit = isEdit
        this.getUserInfo()
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
    initData(userCardInfo) {
        let card_id = userCardInfo.card_id || 0
        this.setData({
            isShow: userCardInfo.show_official ? 1 : 2,
            wx_official: userCardInfo.wx_official,
            nickName: userCardInfo.nick_name,
            avatar: userCardInfo.avatar_url,
            wxAccount: userCardInfo.wx_account,
            qrcode: userCardInfo.wx_qr_url,
            qrcodeShow: userCardInfo.qr_url,
            weibo: userCardInfo.wb_nick_name,
            redBook: userCardInfo.xhs_nick_name,
            tikTok: userCardInfo.dy_nick_name,
            card_id: card_id,
        })
        if (!userCardInfo.avatar_url) {
            console.log('未获取到头像')
            userShopInfoModel
                .queryUserShopInfo({})
                .then((res) => {
                    this.setData({
                        avatar: res.user_info.avatar_url,
                    })
                })
                .catch((err) => {})
        }
    },
    handleSave: function () {
        let is_show_official = this.data.isShow == 1 ? true : false
        let params = {
            wx_account: this.data.wxAccount,
            wx_qr_url: this.data.qrcode,
            qr_url: this.data.qrcodeShow,
            wb_nick_name: this.data.weibo,
            xhs_nick_name: this.data.redBook,
            dy_nick_name: this.data.tikTok,
            card_id: this.data.card_id,
            is_show_official: is_show_official,
            wx_official: this.data.wx_official,
        }
        wx.showLoading({
            title: '保存中...',
        })
        teamworkModel
            .userCardEdit(params)
            .then((res) => {
                //编辑后及时更新缓存
                return teamworkModel.userCardInfo({
                    course_id: this.data.courseId,
                })
            })
            .then((res) => {
                wx.hideLoading()
                if (this.data.isEdit) {
                    //来自名片的编辑
                    const eventChannel = this.getOpenerEventChannel()
                    if (eventChannel) {
                        eventChannel.emit('updateContactCard')
                    }
                    setTimeout(() => {
                        wx.navigateBack({
                            delta: 1,
                        })
                    }, 10)
                } else {
                    //完善名片信息后跳转到名片
                    setTimeout(() => {
                        wx.redirectTo({
                            url: '/packageTeamwork/contactCardView/contactCardView?course_id=' + this.data.courseId + '&admin=1',
                        })
                    }, 10)
                }
            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    handleOnInput: function (e) {
        let type = e.currentTarget.dataset.type
        let value = e.detail.value
        if (type == 'weibo') {
            this.setData({
                weibo: value,
            })
        } else if (type == 'redBook') {
            this.setData({
                redBook: value,
            })
        } else if (type == 'tikTok') {
            this.setData({
                tikTok: value,
            })
        } else if (type == 'wxAccount') {
            this.setData({
                wxAccount: value,
            })
        } else if (type == 'wx_official') {
            this.setData({
                wx_official: value,
            })
        }
    },
    handleOnUploadQRCode: function () {
        let that = this
        let avatar = this.data.avatar
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album'],
            success(res) {
                console.log(res)
                if (res.errMsg == 'chooseImage:ok') {
                    let tempFilePath = res.tempFilePaths[0]
                    wx.showLoading({
                        title: '上传中...',
                    })
                    teamworkModel
                        .wxQRUpload(tempFilePath, avatar)
                        .then((res) => {
                            console.log('输出 ~ res', res)
                            let result = JSON.parse(res)
                            wx.hideLoading()
                            if (result.code == 200) {
                                that.setData({
                                    qrcode: result.data.wx_qr_url,
                                    qrcodeShow: result.data.qr_url,
                                })
                            } else {
                                wx.showToast({
                                    title: result.error || '图片上传失败',
                                    icon: 'none',
                                    duration: 2000,
                                })
                            }
                        })
                        .catch((err) => {
                            wx.hideLoading()
                        })
                }
            },
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
    // 公众号展示隐藏
    checkOfficialStatus(e) {
        let key = e.target.dataset.key
        let isShow = key == 1 ? true : false

        this.setData({
            isShow: key,
        })
    },
})
