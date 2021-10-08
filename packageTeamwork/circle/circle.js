import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'
import screenConfig from '../../utils/screen_util'
const circleModel = require('../../models/circle')
const userShopInfoModel = require('../../models/userShopInfo')
const teamworkModel = require('../../models/teamwork')
const tool = require('../../utils/tool')
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        navTitle: '圈子',
        active: 0,
        limit: 10,
        page: 1,
        currentPage: 1,
        bottomLoadingShow: false,
        is_all: false,
        isPullDown: false, // 是否下拉操作
        quest_loading: false, // 是否在请求中

        courseId: 0, // 团作id
        courseType: 0, // 团作类型 1免费 2付费 3押金',
        dialogShow: false, // 弹框是否显示
        operatingIndex: -1, // 当前操作的订单index
        loading_finish: false, // 请求是否完成
        tabsShow: false,
        is_first: true, // 初次进入页面请求
        isTeacher: false, // 是否是老师
        newsCount: 0, // 消息条数
        listData: [],
        muteTipShow: false, // 被禁言提示
        ratingDialogShow: false,
        showMuteDialog: false, // 禁言弹框
        muteUserId: 0, // 被禁言者id
        muteType: 1, // 禁言类型
        muteDay: '', // 禁言天数

        rateIndex: 3,
        reviewsContent: '', // 老师点评
        showInCircle: false, // 是否同步到圈子
        refundDeposit: false, // 是否退押金，
        is_refund: 1, // 1 不退 2 退

        publishPopupShow: false, // 发布弹出
        commentInputBottom: 0,
        inputFocus: false,
        inputCloneFocus: false,
        userId: 0,
        shopId: 0,
        commentText: '', // 评论内容
        replyType: 1, // 1 评论 2 回复评论
        replyCommentId: 0, // 当前回复评论 comment_id
        atUserId: 0, // 被回复人id
        atUserName: '', // 被回复人昵称
        textareaPlaceholder: '说点什么吧',
        operationId: 0, // 当前操作圈子comment_id
        autosize: {
            maxHeight: 70,
            minHeight: 18,
        },
        safeAreaInsetBottom: safeAreaInsetBottom,
        commentBoxShow: false, // 评论输入框是否显示
        delInPage: 1, // 被删除数据所在页
        ratePlaceholderText: '请输入文字内容',
        studentId: 0, // 学生id
        isIOS: false, // 是否IOS系统
    },
    tempData: {
        keyboardHeight: 0
    },
    events: {
        publishCircle: function (type) {
            // type 2 圈子 3 作业墙
            console.log('type', type)
            console.log('新增圈子成功怎么办，刷新列表???')
            if (this.data.navTitle == '圈子') {
                this.setData(
                    {
                        page: 1,
                        currentPage: 1,
                        active: 1,
                    },
                    () => {
                        this.queryListData(1)
                    }
                )
            }
        },
        deleteCircle: function (id) {
            console.log('params', id)
            //
            const ids_arr = this.data.listData.filter((item) => {
                return item.comment_id == id
            })
            // 还没刷到删除的圈子 那没事了
            if (ids_arr.length < 1) {
                return
            }
            // console.log('详情页删除圈子成功怎么办，刷新列表???')
            // 删除成功 通知列表修改
            // 获取 被删除数据 所在页 当前加载页
            let del_in_page = 1
            this.data.listData.forEach((ev, i) => {
                if (ev.comment_id == id) {
                    if (i > this.data.limit) {
                        if (i % this.data.limit == 0) {
                            del_in_page = i / this.data.limit
                        } else {
                            del_in_page = Math.ceil(i / this.data.limit)
                        }
                    }
                }
            })
            const _list = this.data.listData
            _list.forEach((ev, i) => {
                if (ev.comment_id == params.comment_id) {
                    ev['showOperation'] = false
                    _list.splice(i, 1)
                }
            })
            this.setData(
                {
                    listData: _list,
                    delInPage: del_in_page,
                },
                () => {
                    this.queryListData(2)
                }
            )
        },
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // console.log('safeAreaInsetBottom', safeAreaInsetBottom)
        const isShopAdmin = wx.getStorageSync('isShopAdmin') || 0
        let navTitle = '圈子'
        if (options.type == 2) {
            navTitle = '作业墙'
        }
        let course_id = 0
        if (options.courseId) {
            course_id = Number(options.courseId)
        }
        this.setData(
            {
                navTitle: navTitle,
                courseId: course_id,
                isTeacher: Number(isShopAdmin) === 1,
            },
            () => {
                userShopInfoModel
                    .queryUserShopInfo({})
                    .then((res) => {
                        let _obj = res['user_info']
                        this.setData(
                            {
                                userId: _obj.user_id,
                                shopId: _obj.shop_id,
                                is_first: false,
                            },
                            () => {
                                // 请求团作详情
                                let id = Number(options.courseId)
                                teamworkModel.queryCourseDetailStudent(id).then((res) => {
                                    this.setData({
                                        courseType: res.type,
                                    })
                                    // 请求列表 typeIndex 1 正常请求
                                    this.queryListData(1)
                                })
                            }
                        )
                    })
                    .catch((err) => {
                        console.log('err', err)
                    })
            }
        )
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.queryNoticeCount() // 消息条数
        this.deleteNotice() // 删除新增圈子、作业消息及新发团作消息
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {},

    /**
     * 页面相关事件处理函数--监听用户下拉刷新动作
     */
    onPullDownRefresh: function () {
        this.setData(
            {
                isPullDown: true,
                page: 1,
                currentPage: 1,
                is_all: false,
                loading_finish: false,
            },
            () => {
                // 请求列表 typeIndex 1 正常请求
                this.queryListData(1)
                this.queryNoticeCount()
            }
        )
    },

    /**
     * 页面上拉加载更多
     */
    onReachBottom: function () {
        // 到底喽～
        if (!this.data.is_all) {
            this.setData({
                bottomLoadingShow: true,
            })
            // 请求列表 typeIndex 1 正常请求 2
            this.queryListData(1)
        }
    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // },

    ClickBack() {
        let pages = getCurrentPages()
        if (pages.length === 1) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        } else {
            this.post({
                eventName: 'backFromCircle',
                eventParams: '',
            })
            wx.navigateBack({
                delta: 1,
            })
        }
    },

    // 格式化列表数据
    handlerData(arr) {
        // console.log('arr====152', arr);
        let _list = arr.filter((item) => {
            return item.root_id == 0
        })
        _list.forEach((ev) => {
            ev['showOperation'] = false
            ev['likesName'] = ''
            if (!ev['showMore']) {
                ev['showMore'] = false
            }
            if (!ev['openBtnShow']) {
                ev['openBtnShow'] = false
            }
            if (!ev['isShowAll']) {
                ev['isShowAll'] = false
            }
            ev['is_like'] = false
            if (ev.likes && ev.likes.length > 0) {
                let like_list = ev.likes.map((item) => item.nick_name)
                ev['likesName'] = like_list.join('，')
                const like_user_ids = ev.likes.filter((item) => item.user_id == this.data.userId)
                if (like_user_ids.length > 0) {
                    ev['is_like'] = true
                }
            }
            const _time = new Date(ev.created_at)
            ev['time'] = _time.format('yyyy-MM-dd hh:mm:ss')

            // 是否禁言中
            ev['isMute'] = false
            if (ev.banned_time) {
                const time11 = Date.parse(new Date(ev.banned_time))
                const nowTime = Date.parse(new Date())
                if (nowTime < time11) {
                    console.log('禁言中')
                    ev['isMute'] = true
                }
            }
            if (ev['reply_list']) {
                ev['reply_list'] = ev['reply_list'].filter((item) => {
                    return item.root_id == ev.comment_id
                })
            }
            if (ev.message) {
                ev['message'] = ev['message'].replace(/↵/g, '\n');
            }
        })

        // console.log('_list--------160', _list)
        return _list
    },

    // 处理详情数据
    handlerDetailData(obj) {
        const filter_list = this.data.listData.filter((item) => {
            return item.comment_id == obj.comment_id
        })
        let old_obj = {}
        if (filter_list.length > 0) {
            old_obj = filter_list[0]
        }
        if (obj.user.id) {
            obj['user_id'] = obj.user.id
            obj['user_nick_name'] = obj.user.nick_name
            obj['user_avatar'] = obj.user.avatar_url
        }
        obj['likesName'] = ''
        obj['showOperation'] = false
        obj['showMore'] = old_obj['showMore']
        obj['openBtnShow'] = old_obj['openBtnShow']
        obj['isShowAll'] = old_obj['isShowAll']
        obj['is_like'] = false
        obj['likes'] = obj.like_users
        console.log('obj.comment_id', obj.comment_id)
        if (obj.like_users && obj.like_users.length > 0) {
            //nick_name
            let like_list = obj.like_users.map((item) => item.nick_name)
            obj['likesName'] = like_list.join('，')
            const like_user_ids = obj.likes.filter((item) => item.id == this.data.userId)
            if (like_user_ids.length > 0) {
                obj['is_like'] = true
            }
        }
        obj['time'] = obj.created_at
        // 是否禁言中
        obj['isMute'] = false
        if (obj.banned_time) {
            const bannedTime = new Date(obj.banned_time.replace(/-/g, '/')).getTime()
            const nowTime = new Date().getTime()
            console.log('bannedTime', bannedTime)
            console.log('nowTime', nowTime)
            if (nowTime < bannedTime) {
                obj['isMute'] = true
            }
        }
        if (obj['reply_list']) {
            obj['reply_list'] = obj['reply_list'].filter((item) => {
                return item.root_id == obj.comment_id
            })
        }
        if (obj.message) {
            obj['message'] = obj['message'].replace(/↵/g, '\n');
        }
        return obj
    },

    /*tab切换*/
    onChange(event) {
        if (!this.data.is_first) {
            this.setData({
                page: 1,
                currentPage: 1,
                is_all: false,
                active: Number(event.detail.name),
                listData: [],
            })
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 300,
            })
            // 请求列表 typeIndex 1 正常请求 2
            this.queryListData(1)
        }
    },

    /**
     * 请求列表数据
     */
    queryListData(typeIndex) {
        // typeIndex ==  2 进行了删除操作 重新获取删除数据页及之后页的数据
        const del_in_page = this.data.delInPage
        let _pi = this.data.page,
            _ps = this.data.limit
        if (this.data.page > 1 && typeIndex == 2) {
            console.log('')
            if (del_in_page == 1) {
                _pi = 1
                _ps = this.data.limit * this.data.currentPage
            } else if (del_in_page > 1) {
                _pi = del_in_page - 1
                _ps = this.data.limit * (this.data.currentPage - (del_in_page - 1))
            }
        }
        let params = {
            pi: _pi,
            ps: _ps,
            course_id: this.data.courseId,
        }
        if (this.data.isPullDown) {
            wx.showLoading({
                title: '刷新中...',
            })
        } else if (!this.data.bottomLoadingShow && typeIndex == 1) {
            wx.showLoading({
                title: '加载中...',
            })
        }
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        if (this.data.navTitle == '作业墙') {
            params['is_note'] = this.data.active > 0 ? 2 : 1
            this.queryWork(params, typeIndex)
        } else {
            params['user_id'] = this.data.active > 0 ? this.data.userId : 0
            this.queryCircle(params, typeIndex)
        }
    },

    // 圈子列表
    queryCircle(params, typeIndex) {
        const _this = this
        let diffData = {}, // 下拉刷新新增数据
            isAll = false,
            old_arr = [],
            offset = 0
        circleModel
            .queryCircleList(params)
            .then((res) => {
                /**
                 * 如果是
                 */
                if (params.pi > 1) {
                    old_arr = this.data.listData
                    offset = this.data.listData.length
                }
                let new_arr = [],
                    new_page = this.data.page,
                    current_page = this.data.page
                if (res && res.list) {
                    const lists = this.handlerData(res.list)
                    lists.forEach((item, index) => {
                        item['checked'] = false
                        let key = 'listData[' + (offset + index) + ']'
                        diffData[key] = item
                    })
                    new_arr = old_arr.concat(lists)
                    if (new_arr.length < res.total) {
                        new_page = Number(this.data.page) + 1
                    } else {
                        isAll = true
                    }
                } else {
                    isAll = true
                }
                // console.log('bottomLoadingShow', _this.data.bottomLoadingShow)
                //隐藏loading 提示框
                if (!_this.data.bottomLoadingShow) {
                    wx.hideLoading()
                }
                //隐藏导航条加载动画
                wx.hideNavigationBarLoading()
                if (this.data.isPullDown) {
                    //停止下拉刷新
                    wx.stopPullDownRefresh()
                }
                if (typeIndex == 2) {
                    wx.showToast({
                        title: '操作成功~',
                        icon: 'none',
                        mask: true,
                        duration: 2000,
                    })
                }

                _this.setData({
                    ...diffData,
                    page: new_page,
                    currentPage: current_page,
                    is_all: isAll,
                    bottomLoadingShow: false,
                    quest_loading: false,
                    isPullDown: false,
                    loading_finish: true,
                })
                if (!res) {
                    listData: []
                }
            })
            .catch((err) => {
                console.log('err', err)
            })
    },

    // 作业墙列表
    queryWork(params, typeIndex) {
        const _this = this
        let diffData = {}, // 下拉刷新新增数据
            isAll = false,
            old_arr = [],
            offset = 0
        circleModel
            .queryWorkList(params)
            .then((res) => {
                if (params.pi > 1) {
                    old_arr = this.data.listData
                    offset = this.data.listData.length
                }
                let new_arr = [],
                    new_page = this.data.page,
                    current_page = this.data.page
                if (res && res.list) {
                    const lists = this.handlerData(res.list)
                    lists.forEach((item, index) => {
                        item['checked'] = false
                        let key = 'listData[' + (offset + index) + ']'
                        diffData[key] = item
                    })
                    new_arr = old_arr.concat(lists)
                    if (new_arr.length < res.total) {
                        new_page = Number(this.data.page) + 1
                    } else {
                        isAll = true
                    }
                } else {
                    new_arr = old_arr
                    isAll = true
                }
                // console.log('bottomLoadingShow', _this.data.bottomLoadingShow)
                //隐藏loading 提示框
                if (!_this.data.bottomLoadingShow) {
                    wx.hideLoading()
                }
                //隐藏导航条加载动画
                wx.hideNavigationBarLoading()
                if (this.data.isPullDown) {
                    //停止下拉刷新
                    wx.stopPullDownRefresh()
                }
                if (typeIndex == 2) {
                    wx.showToast({
                        title: '操作成功~',
                        icon: 'none',
                        mask: true,
                        duration: 2000,
                    })
                }
                _this.setData({
                    ...diffData,
                    page: new_page,
                    currentPage: current_page,
                    is_all: isAll,
                    bottomLoadingShow: false,
                    quest_loading: false,
                    isPullDown: false,
                    loading_finish: true,
                })
            })
            .catch((err) => {
                console.log('err', err)
            })
    },

    /**
     * 请求圈子详情
     */
    queryDetailData(id, typeIndex) {
        // typeIndex 1 评论 2 点赞 3 禁言 4 老师评价
        const params = {
            comment_id: id,
        }
        circleModel
            .queryNoticeDetail(params)
            .then((res) => {
                let info = {}
                if (res) {
                    info = this.handlerDetailData(tool.deepClone(res))
                }
                wx.hideLoading()
                if(typeIndex > 1){
                    wx.showToast({
                        title: '操作成功~',
                        icon: 'none',
                        mask: true,
                        duration: 2000,
                    })
                }
                const _list = this.data.listData
                let diffData = {}
                this.data.listData.forEach((ev, i) => {
                    if (ev.comment_id == id) {
                        let key = 'listData[' + i + ']'
                        diffData[key] = info
                    }
                })
                console.log('diffData==========493', diffData)
                this.setData({
                    ...diffData,
                })
            })
            .catch((err) => {
                console.log('err', err)
            })
    },

    /**
     * 请求消息列表 删除 团作、新发圈子消息
     */
    deleteNotice() {
        circleModel
            .queryNoticeList({ notice_type: 3, course_id: this.data.courseId })
            .then((res) => {
                console.log('res', res)
                let list = []
                if (res) {
                    list = res.filter((item) => {
                        return item.notice_type == 4 || (item.notice_type == 3 && item.comment_id == this.data.courseId)
                    })
                    console.log('list', list)
                    // 删除消息通知
                    if (list.length > 0) {
                        const id_list = list.map((item) => item.id)
                        // console.log('id_list', id_list)
                        const request = {
                            notice_ids: id_list,
                        }
                        circleModel
                            .delNoticeList(request)
                            .then((res) => {
                                this.post({
                                    eventName: 'getTeamworkIndexRefresh',
                                    eventParams: '',
                                })
                                console.log('res', res)
                            })
                            .catch((err) => {
                                console.log('err', err)
                            })
                    }
                }
            })
            .catch((err) => {})
    },

    /**
     * 请求消息通知数量
     */
    queryNoticeCount() {
        circleModel
            .queryNoticeCount({ search_type: 1, course_id: this.data.courseId })
            .then((res) => {
                // console.log('res======217', res)
                this.setData({
                    newsCount: res,
                })
            })
            .catch((err) => {
                console.log('err', err)
            })
    },

    preventTouchMove() {},

    // 发布
    handleOnAdd() {
        // 是否禁言
        const params = {
            user_id: this.data.userId, // 学生id
            course_id: this.data.courseId, // 团作id
            shop_id: this.data.shopId, // 店铺id
        }
        circleModel
            .queryUserIsMute(params)
            .then((res) => {
                if (res) {
                    this.setData({
                        muteTipShow: true,
                    })
                    console.log('禁言了')
                } else {
                    console.log('没有禁言')
                    this.setData({
                        publishPopupShow: true,
                    })
                }
            })
            .catch((err) => {})
    },
    // 发布-取消
    onPublishCancel() {
        this.setData({
            publishPopupShow: false,
        })
    },
    // 点击 图片或视频
    handleOnPublish(e) {
        const _type = Number(e.currentTarget.dataset.type) // 1 视频 2 图片
        this.setData(
            {
                publishPopupShow: false,
            },
            () => {
                wx.navigateTo({
                    url: '/packageTeamwork/circlePublish/circlePublish?type=' + _type + '&courseId=' + this.data.courseId + '&userId=' + this.data.userId + '&shopId=' + this.data.shopId,
                })
            }
        )
    },
    /**
     * 禁言弹窗关闭
     */
    onMuteDialogClose() {
        this.setData({
            muteTipShow: false,
        })
    },

    /**
     * 打开老师评价弹框
     */
    onRating(e) {
        const _id = Number(e.currentTarget.dataset.id)
        const student_id = Number(e.currentTarget.dataset.student)
        let _grade = {}
        // console.log('this.data.active', this.data.active)
        _grade = e.currentTarget.dataset.grade
        if (this.data.active > 0) {
            // console.log('_grade', _grade)
            this.setData(
                {
                    ratingDialogShow: true,
                    reviewsContent: '  ',
                    showInCircle: _grade.is_show == 2,
                    refundDeposit: _grade.is_refund == 2,
                    is_refund: _grade.is_refund == 2 ? 2 : 1,
                    operationId: _id,
                    rateIndex: _grade.grade,
                    studentId: student_id,
                },
                () => {
                    setTimeout(() => {
                        this.setData({
                            reviewsContent: _grade.content,
                        })
                    }, 60)
                }
            )
        } else {
            this.setData(
                {
                    ratingDialogShow: true,
                    showInCircle: false,
                    refundDeposit: false,
                    is_refund: _grade.is_refund == 2 ? 2 : 1,
                    reviewsContent: '  ',
                    operationId: _id,
                    rateIndex: 3,
                    studentId: student_id,
                },
                () => {
                    setTimeout(() => {
                        this.setData({
                            reviewsContent: '',
                        })
                    }, 60)
                }
            )
        }
    },
    /**
     * 评级弹窗关闭
     */
    onRatingClose() {
        this.setData({
            ratingDialogShow: false,
        })
    },
    /**
     * 评级弹窗确定
     */
    onRatingConfirm() {
        if (this.data.quest_loading) {
            return
        }
        this.setData({
            quest_loading: true,
        })
        console.log('reviewsContent', this.data.reviewsContent)
        const params = {
            comment_id: this.data.operationId,
            grade: this.data.rateIndex, // 评级
            content: this.data.reviewsContent, // 评价
            is_show: this.data.showInCircle ? 2 : 1, // 是否同步到圈子 2 同步 1 不同步
            is_refund: this.data.is_refund == 2 && this.data.active > 0 ? false : this.data.refundDeposit, // 是否退押金
            kind: this.data.active > 0 ? 2 : 1,
            user_id: this.data.studentId,
            shop_id: this.data.shopId,
            course_id: this.data.courseId,
        }
        console.log('params', params)
        const _this = this
        wx.showLoading({
            title: '操作中...',
        })
        circleModel
            .queryCommentGrade(params)
            .then((res) => {
                console.log('res', res)
                // 成功后
                if (this.data.active > 0) {
                    // 修改成功 刷新
                    _this.queryDetailData(params.comment_id, 4)
                } else {
                    // 评价成功 通知列表修改
                    // 获取 被评价数据 所在页 当前加载页
                    let del_in_page = 1
                    this.data.listData.forEach((ev, i) => {
                        if (ev.comment_id == params.comment_id) {
                            if (i > this.data.limit) {
                                if (i % this.data.limit == 0) {
                                    del_in_page = i / this.data.limit
                                } else {
                                    del_in_page = Math.ceil(i / this.data.limit)
                                }
                            }
                        }
                    })
                    const _list = this.data.listData
                    _list.forEach((ev, i) => {
                        if (ev.comment_id == params.comment_id) {
                            ev['showOperation'] = false
                            _list.splice(i, 1)
                        }
                    })
                    this.setData(
                        {
                            listData: _list,
                            delInPage: del_in_page,
                            reviewsContent: '  ',
                        },
                        () => {
                            if (this.data.active > 0) {
                                _this.queryListData(1)
                            } else {
                                _this.queryListData(2)
                            }
                        }
                    )
                }

                setTimeout(() => {
                    _this.setData({
                        quest_loading: false,
                    })
                }, 500)
            })
            .catch((err) => {
                _this.setData({
                    quest_loading: false,
                })
                console.log('err', err)
            })
    },
    onChooseRate(e) {
        // 2.优秀 3.良好 4.及格 5.不及格
        const itemIndex = Number(e.currentTarget.dataset.index)
        console.log('itemIndex', itemIndex)
        this.setData({
            rateIndex: itemIndex,
        })
    },
    catchTapDummy: function (e) {},
    checkedIsSync() {
        this.setData({
            showInCircle: !this.data.showInCircle,
        })
    },
    checkedIsRefund() {
        this.setData({
            refundDeposit: !this.data.refundDeposit,
        })
    },
    toggle: function (e) {
        let checkType = e.currentTarget.dataset.checkType
        let checkbox = this.selectComponent('#checkbox_' + checkType)
        console.log(checkbox)
        checkbox.toggle()
    },
    /**
     * 查看详情
     */
    viewCircleDetail(e) {
        const detailInfo = e.currentTarget.dataset.detail
        wx.navigateTo({
            url: '/packageTeamwork/circleDetail/circleDetail?info=' + JSON.stringify(detailInfo),
        })
    },
    /**
     * 查看消息
     */
    viewNews(e) {
        wx.navigateTo({
            url: '/packageTeamwork/circleNews/circleNews?courseId=' + this.data.courseId + '&userId=' + this.data.userId + '&shopId=' + this.data.shopId,
        })
    },

    /**
     * 点击操作按钮 时间后面 两个点
     */
    handleOnMore(info) {
        console.log('info', info.detail)
        const _id = info.detail.id
        const _list = this.data.listData
        _list.forEach((ev) => {
            if (ev.comment_id == _id) {
                ev['showOperation'] = !ev['showOperation']
            } else {
                ev['showOperation'] = false
            }
        })
        console.log('_list', _list)
        this.setData({
            listData: _list,
            operationId: _id,
        })
    },
    bindReplaceInput() {
        if(this.data.commentText && this.data.textareaPlaceholder){
            this.setData({
                textareaPlaceholder:''
            })
        }
    },
    replaceBlur() {
        console.log('-----------失去焦点', Date.parse(new Date()))
        this.setData({
            commentBoxShow: false,
            textareaPlaceholder:'',
            inputFocus: false
        })
    },
    /**
     * 点击回复 或 其它评论 升起输入框
     * type
     */
    onComment(info) {
        console.log('info====>609', info.detail)
        // 判断是否禁言 isMute
        if (this.data.isTeacher) {
            this.commentInputShow(info)
            return
        }
        const params = {
            user_id: this.data.userId, // 学生id
            course_id: this.data.courseId, // 团作id
            shop_id: this.data.shopId, // 店铺id
        }
        circleModel
            .queryUserIsMute(params)
            .then((res) => {
                if (res) {
                    this.setData({
                        muteTipShow: true,
                    })
                    console.log('禁言了')
                } else {
                    console.log('没有禁言')
                    this.commentInputShow(info)
                }
            })
            .catch((err) => {})
    },

    //
    commentInputShow(info) {
        if (this.data.inputFocus) {
            return
        }
        let placeholderText = '说点什么吧'
        if (info.detail.at_user_name && info.detail.type == 2) {
            placeholderText = '回复 ' + info.detail.at_user_name
        }
        const _list = this.data.listData
        _list.forEach((ev) => {
            if (ev.comment_id == info.detail.comment_id) {
                console.log('ev', ev)
                ev['showOperation'] = false
            }
        })
        this.setData(
            {
                commentText: '',
                replyType: info.detail.type,
                operationId: info.detail.comment_id,
                replyCommentId: info.detail.reply_comment_id,
                atUserId: info.detail.at_user_id,
                atUserName: info.detail.at_user_name,
                textareaPlaceholder: placeholderText,
                listData: _list,
                commentBoxShow: true,
            },
            () => {
                this.setData({
                    inputFocus: true,
                })
            }
        )
    },
    replaceInputFocus(event) {
        console.log('输入框获得焦点', event.detail)
        if (event.detail.height > 0 && this.data.commentInputBottom < 1){
            // safeAreaInsetBottom +
            const height_rpx = screenConfig.getRPX(event.detail.height)
            this.setData(
                {
                    commentInputBottom: height_rpx,
                }
            )
        }
    },
    /**
     * 输入框高度变化
     */
    onKeyboardHeightChange(event) {
        console.log('软键盘高度', event.detail.height)
        console.log('commentInputBottom==>', this.data.commentInputBottom)

    },
    /**
     * 点赞
     */
    handleOnLike(info) {
        if (this.data.quest_loading) {
            return
        }
        this.setData({
            quest_loading: true,
        })
        let _platform = 3 //  2.圈子 3.作业墙 4.示范作业
        if (this.data.navTitle == '圈子') {
            _platform = 2
            // if(info.detail.grade == 1){
            //     _platform = 4
            // }
        }
        let params = {
            comment_id: info.detail.id,
            like_type: _platform,
        }
        const _this = this
        wx.showLoading({
            title: '操作中...',
        })
        circleModel
            .queryLike(params)
            .then((res) => {
                const _list = this.data.listData
                _list.forEach((ev) => {
                    if (ev.comment_id == params.comment_id) {
                        ev['showOperation'] = false
                    }
                })
                _this.setData(
                    {
                        listData: _list,
                        operationId: params.comment_id,
                    },
                    () => {
                        // 点赞成功 请求该条圈子详情 覆盖原有数据
                        _this.queryDetailData(params.comment_id, 2)
                        _this.queryNoticeCount() // 消息条数
                    }
                )
                setTimeout(() => {
                    _this.setData({
                        quest_loading: false,
                    })
                }, 300)
            })
            .catch((err) => {
                _this.setData({
                    quest_loading: false,
                })
                console.log('err', err)
            })
    },

    /**
     * 发表回复
     */
    handleOnComment() {
        console.log('this.data.operationId', this.data.operationId)
        console.log('this.data.commentText', this.data.commentText)
        if (!this.data.commentText) {
            return
        }
        if (this.data.quest_loading) {
            return
        }
        this.setData({
            quest_loading: true,
        })
        let params = {
            message: this.data.commentText,
            comment_id: this.data.replyType == 2 ? this.data.replyCommentId : this.data.operationId,
            at_user_id: this.data.atUserId,
        }
        console.log('params', params)
        const _this = this
        wx.showLoading({
            title: '操作中...',
        })
        circleModel
            .creatCommentReply(params)
            .then((res) => {
                console.log('res', res)
                const _list = this.data.listData
                _list.forEach((ev) => {
                    if (ev.comment_id == this.data.operationId) {
                        ev['showOperation'] = false
                    }
                })
                _this.setData(
                    {
                        commentText: '',
                        listData: _list,
                    },
                    () => {
                        // 评论成功 请求该条圈子详情 覆盖原有数据
                        _this.queryDetailData(this.data.operationId, 1)
                        _this.queryNoticeCount() // 消息条数
                    }
                )
                setTimeout(() => {
                    _this.setData({
                        quest_loading: false,
                    })
                }, 500)
            })
            .catch((err) => {
                _this.setData({
                    quest_loading: false,
                })
                console.log('err', err)
            })
    },

    /**
     * 显示展开收起全文按钮
     */
    showAllText(info) {
        console.log('info.detail', info.detail)
        const _list = this.data.listData
        _list.forEach((ev) => {
            if (ev.comment_id == info.detail.id) {
                ev['openBtnShow'] = true
            }
        })
        this.setData({
            listData: _list,
        })
    },
    /**
     * 展开收起全文
     */
    openAllText(info) {
        console.log('info.detail', info.detail)
        const _list = this.data.listData
        _list.forEach((ev) => {
            if (ev.comment_id == info.detail.id) {
                ev['isShowAll'] = info.detail.bol
            }
        })
        this.setData({
            listData: _list,
        })
    },
    /**
     * 展开收起更多操作
     */
    showMoreOperation(info) {
        console.log('info.detail', info.detail)
        const _list = this.data.listData
        _list.forEach((ev) => {
            if (ev.comment_id == info.detail.id) {
                ev['showMore'] = info.detail.bol
            }
        })
        this.setData({
            listData: _list,
        })
    },
    bindlinechange(event) {
        console.log('event.detail', event.detail)
    },
    /**
     * 删除
     */
    handleOnDelete(info) {
        if (this.data.quest_loading) {
            return
        }
        this.setData({
            quest_loading: true,
        })
        let params = {
            comment_id: Number(info.detail.id),
        }
        const _this = this
        circleModel
            .queryDel(params)
            .then((res) => {
                // 删除成功 通知列表修改
                // 获取 被删除数据 所在页 当前加载页
                let del_in_page = 1
                this.data.listData.forEach((ev, i) => {
                    if (ev.comment_id == params.comment_id) {
                        if (i > this.data.limit) {
                            if (i % this.data.limit == 0) {
                                del_in_page = i / this.data.limit
                            } else {
                                del_in_page = Math.ceil(i / this.data.limit)
                            }
                        }
                    }
                })
                const _list = this.data.listData
                _list.forEach((ev, i) => {
                    if (ev.comment_id == params.comment_id) {
                        ev['showOperation'] = false
                        _list.splice(i, 1)
                    }
                })
                _this.setData(
                    {
                        listData: _list,
                        operationId: params.comment_id,
                        delInPage: del_in_page,
                    },
                    () => {
                        _this.queryListData(2)
                        _this.queryNoticeCount() // 消息条数
                    }
                )
                setTimeout(() => {
                    _this.setData({
                        quest_loading: false,
                    })
                }, 1000)
            })
            .catch((err) => {
                _this.setData({
                    quest_loading: false,
                })
                console.log('err', err)
            })
    },

    /**
     * 禁言弹框显示
     */
    handleOnMute(info) {
        console.log('info========793', info.detail)

        this.setData({
            operationId: info.detail.id,
            muteUserId: info.detail.userId,
            showMuteDialog: true,
        })
    },
    handleOnMuteDayInput: function (e) {
        this.setData({
            muteDay: e.detail.value,
        })
    },
    changeMuteType: function (e) {
        let muteType = e.currentTarget.dataset.type || '1'
        this.setData({
            muteType: Number(muteType),
        })
    },

    // 禁言取消 开启了异步关闭，手动关闭
    handleOnMuteCancel: function (e) {
        e.detail.dialog.stopLoading()
        setTimeout(() => {
            this.setData({
                showMuteDialog: false,
            })
        }, 0)
    },

    // 禁言确定 开启了异步关闭，手动关闭
    handleOnMuteConfirm: function (e) {
        e.detail.dialog.stopLoading()
        if (this.data.currentIndex == -1) {
            return
        }
        let muteType = this.data.muteType
        if (muteType == 2) {
            //择期禁言，判断天数
            if (this.data.muteDay == '') {
                wx.showToast({
                    icon: 'none',
                    title: '请输入天数',
                })
                return
            }
        }
        let userId = this.data.muteUserId
        let params = {
            course_id: this.data.courseId,
            user_id: userId,
            banned_type: muteType == 1 ? 2 : 1,
        }
        if (muteType == 2) {
            let muteDay = Number(this.data.muteDay)
            params['banned_day'] = muteDay
        }
        console.log(params)
        this.setData(
            {
                showMuteDialog: false,
            },
            () => {
                this.doMute(params)
            }
        )
    },

    /*禁言*/
    doMute(params) {
        wx.showLoading({
            title: '操作中...',
        })
        teamworkModel
            .studentBannedTalk(params)
            .then((res) => {
                const _list = this.data.listData
                _list.forEach((ev) => {
                    if (ev.comment_id == params.comment_id) {
                        ev['showOperation'] = false
                    }
                })
                this.setData(
                    {
                        listData: _list,
                        muteDay: '',
                    },
                    () => {
                        // 禁言成功 请求该条圈子详情 覆盖原有数据
                        this.queryDetailData(this.data.operationId, 3)
                    }
                )
            })
            .catch((res) => {
                wx.hideLoading()
            })
    },

    hideOperation() {
        const _list = this.data.listData
        _list.forEach((ev) => {
            ev['showOperation'] = false
        })
        this.setData({
            listData: _list,
        })
    },
    bindReviewsInput(e) {
        let text = e.detail.value
        console.log('text', text)
        this.setData({
            reviewsContent: text,
        })
    },
    getSystemPlatform:function(){
        let that = this;
        let is_ios = false
        wx.getSystemInfo({
            success:function(res){
                console.log('res===1422====>', res)
                if(res.platform == "devtools"){ // PC
                    console.log('PC')
                }else if(res.platform == "ios"){ // IOS
                    is_ios = true
                    console.log('IOS')
                }else if(res.platform == "android"){ // android
                    is_ios = true
                    console.log('android')
                }
                that.setData({
                    isIOS: is_ios
                })
            }
        })
    },
})
