import screenConfig from '../../utils/screen_util'
const navigateBarHeight = screenConfig.getSafeAreaTopPadding() + 46
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const barrierHeight = screenConfig.getPX(522)
const app = getApp()
const goodsModel = require('../../models/goods')
const teamworkModel = require('../../models/teamwork')
const circleModel = require('../../models/circle')
App.Page({
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        safeAreaInsetBottom: safeAreaInsetBottom,
        barrierHeight: barrierHeight + navigateBarHeight + safeAreaInsetBottom,
        popupOffsetTop: navigateBarHeight + screenConfig.getPX(422),
        courseId: -1,
        bannerType: 1,
        bannerUrl: '',
        isAdmin: false,
        course: {
            video: [],
            image: [],
        },
        courseImagePopupShow: false,
        courseVideoPopupShow: false,
        initialize: false,
        contactCardConfirm: false,
        noticeShow: false,
        recGoods: [], //推荐商品列表
        activeTab: 0,
        videoIndex: 0, //当前播放视频index
        showDialog: false,
        studentMoreFeatures: [],
        dialogContent: '', //审核拒绝理由
        dialogTitle: '', //提示标题
    },
    events: {
        queryCorseRecGoods: function () {
            let courseDetailPromise
            if (this.data.isAdmin) {
                courseDetailPromise = teamworkModel.queryCourseDetail(this.data.courseId)
            } else {
                courseDetailPromise = teamworkModel.queryCourseDetailStudent(this.data.courseId)
            }
            courseDetailPromise.then((res) => {
                let shop_goods_ids = JSON.parse(res.shop_goods_ids)
                this.queryGoodsDetail(shop_goods_ids)
            })
        },
        // backFromCircle: function () {
        //     this.setData({
        //         activeTab: 0,
        //     })
        // },
    },
    onLoad: function (options) {
        const isShopAdmin = wx.getStorageSync('isShopAdmin') || 0
        this.setData({
            isAdmin: Number(isShopAdmin) === 1,
        })
        let courseId = Number(options.course_id || '-1')
        if (courseId >= 0) {
            this.data.courseId = courseId
            let courseDetailPromise
            if (this.data.isAdmin) {
                courseDetailPromise = teamworkModel.queryCourseDetail(courseId)
            } else {
                courseDetailPromise = teamworkModel.queryCourseDetailStudent(courseId)
            }
            courseDetailPromise.then((res) => {
                let studentMoreFeatures = []
                if (res.type == 22) {
                    //付费邀请返现
                    studentMoreFeatures.push({
                        icon: '../static/ic_course_invite.png',
                        handle: 'handleOnInvite',
                        title: '邀请好友',
                    })
                }
                let shop_goods_ids = JSON.parse(res.shop_goods_ids)
                this.queryGoodsDetail(shop_goods_ids)
                this.setData({
                    studentMoreFeatures: studentMoreFeatures,
                    bannerUrl: res.poster_link,
                    bannerType: 1,
                })
                if (res.applt_notic == 1 && res.type == 21) {
                    if (res.apply_attachment_status == 2) {
                        // 审核通过
                        this.setData({
                            showDialog: true,
                            dialogTitle: '您提交的凭证审核通过,返现金额将原路退还',
                        })
                        teamworkModel.updateNoticRead(res.apply_id)
                    } else if (res.apply_attachment_status == 3) {
                        // 审核拒绝
                        this.setData({
                            showDialog: true,
                            dialogTitle: '抱歉！您提交的凭证未通过',
                            dialogContent: res.apply_attachment_reason,
                        })
                        teamworkModel.updateNoticRead(res.apply_id)
                    }
                }
                this.loadCourseMedia()
            })
            setTimeout(() => {
                teamworkModel
                    .userCardInfo({
                        course_id: this.data.courseId,
                    })
                    .then((res) => {})
            }, 10)
        }
    },
    // 获取商品详情
    queryGoodsDetail: function (ids) {
        if (!ids || ids.length == 0) {
            this.setData({
                recGoods: [],
            })
            return
        }
        let params = {
            page: 1,
            limit: ids.length,
            shop_goods_ids: ids,
        }
        goodsModel
            .queryShopGoodsList(params)
            .then((res) => {
                teamworkModel.recGoods = res.lists.map((item) => ({
                    id: item.id,
                    title: item.goods_title,
                    img: item.goods_img,
                    price: item.price,
                    commission: item.commission,
                    display_sales: item.real_sales,
                    status: 2,
                }))
                this.setData({
                    recGoods: res.lists,
                })
                console.log('输出 ~ res.lists', res.lists)
            })
            .catch((err) => {})
    },
    onReady: function () {},
    onShow: function () {
        this.queryCommitCount()
    },
    onPullDownRefresh: function () {},
    onReachBottom: function () {},
    /**
     * 网络请求，获取团作消息数量/显示圈子红点
     */
    queryCommitCount() {
        circleModel
            .queryNoticeList({ notice_type: 3, course_id: this.data.courseId })
            .then((res) => {
                let count = 0
                if (res) {
                    count = res.filter((item) => {
                        return item.notice_type == 1 || item.notice_type == 2 || item.notice_type == 4
                    }).length
                }
                this.setData({
                    noticeShow: count > 0,
                })
            })
            .catch((err) => {})
    },
    ///获取课件信息
    loadCourseMedia: function (typeIndex) {
        if (typeIndex != 2) {
            wx.showLoading({
                title: '加载中...',
            })
        }

        let params = {
            course_id: this.data.courseId,
        }
        teamworkModel
            .courseMediaList(params)
            .then((res) => {
                if (typeIndex != 2) {
                    wx.hideLoading()
                }
                let videos = []
                let images = []
                const list = res.sort(function (a, b) {
                    return a.sort - b.sort
                })
                console.log('list', list)
                list.forEach((element) => {
                    if (element.type == 1) {
                        let size = this.formatDuring(element.size)
                        videos.push({
                            id: element.id,
                            thumbnail: element.video_img_url,
                            url: element.link,
                            title: element.title,
                            size: '时长：' + size,
                            old_size: element.size
                        })
                    } else if (element.type == 2) {
                        let size = this.conver(element.size)
                        images.push({
                            id: element.id,
                            url: element.link,
                            size: size,
                            name: element.title,
                            old_size: element.size
                        })
                    }
                })
                let course = {
                    video: videos,
                    image: images,
                    videoFull: videos,
                    imageFull: images,
                }
                this.setData({
                    course: course,
                    initialize: true,
                })
            })
            .catch((err) => {
                if (typeIndex != 2) {
                    wx.hideLoading()
                }
                this.setData({
                    initialize: true,
                })
            })
    },
    ///播放视频
    handleOnCourseVideo: function (e) {
        let index = e.currentTarget.dataset.index
        let url = this.data.course.video[index].url || ''
        let videoContext = wx.createVideoContext('myVideo')
        if (url.length > 0 && videoContext) {
            this.setData(
                {
                    bannerType: 2,
                    bannerUrl: url,
                    videoIndex: index,
                },
                () => {
                    videoContext.play()
                }
            )
        }
    },
    //预览课件图片
    previewImage: function (e) {
        let index = e.currentTarget.dataset.index
        let size = e.currentTarget.dataset.size
        console.log('size', size)
        let url = e.currentTarget.dataset.src ? (e.currentTarget.dataset.src + '!upyun520/fw/3000') : ''
        if (size > 1024*1024*5) {
            url = e.currentTarget.dataset.src + '!upyun520/fw/2000'
        }
        if (url.length > 0) {
            let urls = []
            this.data.course.image.forEach((ev)=>{
                if (ev.url) {
                    if (ev.old_size > 1024 * 1024 * 4) {
                        urls.push(ev.url + '!upyun520/fw/2000')
                    }else {
                        urls.push(ev.url + '!upyun520/fw/3000')
                    }
                }
            })
            console.log('urls', urls)
            wx.previewImage({
                current: url, // 当前显示图片的http链接
                urls: urls, // 需要预览的图片http链接列表
                success: function (res) {
                    console.log('success')
                },
                fail: function (res) {
                    console.log(res)
                },
            })
        }
    },
    onTabChange: function (e) {
        console.log(e)
        const _this = this
        if (e.detail.index != 1 && e.detail.index != 2) {
            this.setData({
                activeTab: e.detail.index,
            })
        }
        if (e.detail.index == 2) {
            //名片 or 联系老师
            //维护一个缓存，优化体验
            let cacheUserCardInfo = teamworkModel.cacheUserCardInfo()
            if (this.data.isAdmin) {
                //名片
                //缓存不存在，请求后台并缓存
                if (cacheUserCardInfo == null) {
                    wx.showLoading({
                        title: '加载中...',
                    })
                    teamworkModel
                        .userCardInfo({
                            course_id: this.data.courseId,
                        })
                        .then((res) => {
                            console.log(res)
                            wx.hideLoading()
                            this.navigateToContactCard(res)
                        })
                        .catch((err) => {
                            console.log(err)
                            wx.hideLoading()
                        })
                } else {
                    //缓存存在，直接使用缓存
                    this.navigateToContactCard(cacheUserCardInfo)
                    setTimeout(() => {
                        teamworkModel.userCardInfo({ course_id: this.data.courseId }).then((res) => {})
                    }, 50)
                }
            } else {
                //联系老师
                if (cacheUserCardInfo && cacheUserCardInfo.wx_account && cacheUserCardInfo.wx_qr_url && cacheUserCardInfo.wx_account.length > 0 && cacheUserCardInfo.wx_qr_url.length > 0) {
                    //名片必填信息已完善，前往联系老师页面
                    wx.navigateTo({
                        url: '/packageTeamwork/contactCardView/contactCardView?course_id=' + this.data.courseId + '&admin=0',
                        success(res) {
                            //跳转成功后后台更新名片信息缓存
                            teamworkModel.userCardInfo({ course_id: _this.data.courseId }).then((res) => {})
                        },
                    })
                } else {
                    //缓存中数据中，名片必填信息未完善，获取最新名片数据，并更新缓存
                    wx.showLoading({
                        title: '加载中...',
                    })
                    teamworkModel
                        .userCardInfo({
                            course_id: this.data.courseId,
                        })
                        .then((res) => {
                            console.log(res)
                            wx.hideLoading()
                            this.navigateToContactCard(res)
                        })
                        .catch((err) => {
                            console.log(err)
                            wx.hideLoading()
                        })
                }
            }
        } else if (e.detail.index == 1) {
            //圈子
            wx.navigateTo({
                url: '/packageTeamwork/circle/circle?type=1&courseId=' + this.data.courseId,
            })
        }
    },
    navigateToContactCard(userCardInfo) {
        //判断必填信息是否已经填写
        if (userCardInfo.wx_account && userCardInfo.wx_qr_url && userCardInfo.wx_account.length > 0 && userCardInfo.wx_qr_url.length > 0) {
            //必填信息已完善
            let admin = this.data.isAdmin ? 1 : 0
            wx.navigateTo({
                url: '/packageTeamwork/contactCardView/contactCardView?course_id=' + this.data.courseId + '&admin=' + admin,
            })
        } else {
            //必填信息未完善
            if (this.data.isAdmin) {
                //老师，编辑名片
                this.setData({
                    contactCardConfirm: true,
                })
            } else {
                //学员，提示名片信息不全，无法查看
                wx.showToast({
                    title: '老师未设置名片',
                })
            }
        }
    },
    //发布课程
    handleOnCourseEdit: function () {
        let that = this
        wx.navigateTo({
            url: '/packageTeamwork/coursePublish/coursePublish?course_id=' + this.data.courseId,
            events: {
                updateCourseMedia: function () {
                    that.loadCourseMedia(2)
                },
            },
        })
    },
    //作业墙
    handleOnWorkWall: function () {
        // wx.showToast({
        //   title: '作业墙',
        // })
        wx.navigateTo({
            url: '/packageTeamwork/circle/circle?type=2&courseId=' + this.data.courseId,
        })
    },
    //编辑团作
    handleOnTeamWorkEdit: function () {
        wx.navigateTo({
            url: `/packageTeamwork/createTeamwork/createTeamwork?id=${this.data.courseId}`,
        })
    },
    //学员管理
    handleOnStudent: function () {
        wx.navigateTo({
            url: '/packageTeamwork/student/student?course_id=' + this.data.courseId,
        })
    },
    //生成海报
    handleOnPoster: function () {
        wx.navigateTo({
            url: '/packageTeamwork/coursePoster/coursePoster?course_id=' + this.data.courseId,
        })
    },
    //推荐商品
    handleOnRecGoods: function () {
        wx.navigateTo({
            url: `/packageTeamwork/recommend/recommend?id=${this.data.courseId}`,
        })
    },
    //邀请好友
    handleOnInvite: function () {
        wx.navigateTo({
            url: `/packageTeamwork/invite/invite?id=${this.data.courseId}`,
        })
    },
    showCourseImage: function (e) {
        console.log(e)
        this.setData({
            courseImagePopupShow: true,
        })
    },
    showCourseVideo: function () {
        this.setData({
            courseVideoPopupShow: true,
        })
    },
    hideCourseImagePopup: function () {
        this.setData({
            courseImagePopupShow: false,
        })
    },
    hideCourseVideoPopup: function () {
        this.setData({
            courseVideoPopupShow: false,
        })
    },
    onConfirmDialogClose: function () {
        this.setData({
            contactCardConfirm: false,
        })
    },
    handleOnConfirm: function () {
        setTimeout(() => {
            wx.navigateTo({
                url: '/packageTeamwork/contactCardEdit/contactCardEdit?course_id=' + this.data.courseId,
            })
        }, 10)
    },
    handleOnCancel: function () {},
    bannerImageClick: function (e) {
        console.log(e)
        if (!this.data.bannerUrl) {
            return
        }
        let url = this.data.bannerUrl + '!upyun520/fw/3000'
        let urls = [url]
        wx.previewImage({
            current: url, // 当前显示图片的http链接
            urls: urls, // 需要预览的图片http链接列表
            success: function (res) {
                console.log('success')
            },
            fail: function (res) {
                console.log(res)
            },
        })
    },
    preventTouchMove: function (e) {
        console.log(e)
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
    formatDuring(millisecond) {
        var hours = parseInt((millisecond % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        var minutes = parseInt((millisecond % (1000 * 60 * 60)) / (1000 * 60))
        var seconds = (millisecond % (1000 * 60)) / 1000
        if (hours > 0) {
            return hours + ' 小时 ' + minutes + ' 分钟 ' + seconds + ' 秒 '
        }
        if (minutes > 0) {
            return minutes + ' 分钟 ' + seconds + ' 秒 '
        }
        return seconds + ' 秒 '
    },
    conver(limit) {
        var size = ''
        if (limit < 0.1 * 1024) {
            //如果小于0.1KB转化成B
            size = limit.toFixed(2) + 'B'
        } else if (limit < 0.1 * 1024 * 1024) {
            //如果小于0.1MB转化成KB
            size = (limit / 1024).toFixed(2) + 'KB'
        } else if (limit < 0.1 * 1024 * 1024 * 1024) {
            //如果小于0.1GB转化成MB
            size = (limit / (1024 * 1024)).toFixed(2) + 'MB'
        } else {
            //其他转化成GB
            size = (limit / (1024 * 1024 * 1024)).toFixed(2) + 'GB'
        }
        var sizestr = size + ''
        var len = sizestr.indexOf('.')
        var dec = sizestr.substr(len + 1, 2)
        if (dec == '00') {
            //当小数点后为00时 去掉小数部分
            return sizestr.substring(0, len) + sizestr.substr(len + 3, 2)
        }
        return sizestr
    },
    // 当播放到末尾时触发
    onEnd(e) {
        console.log('输出 ~ onEnd')
        let index = this.data.videoIndex
        let length = this.data.course.video ? this.data.course.video.length : 0
        if (index >= length - 1) {
            return
        }
        index++
        let url = this.data.course.video[index].url || ''
        let videoContext = wx.createVideoContext('myVideo')
        if (url.length > 0 && videoContext) {
            this.setData(
                {
                    bannerType: 2,
                    bannerUrl: url,
                    videoIndex: index,
                },
                () => {
                    videoContext.play()
                }
            )
        }
    },
})
