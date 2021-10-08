import screenConfig from '../../utils/screen_util'

const commentModel = require("../../models/comment");
const tool = require("../../utils/tool");
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const app = getApp();
App.Page({
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + "px",
        safeAreaInsetBottom: safeAreaInsetBottom,
        showGoodsInfo: false,
        id: -1,
        userName: '',

        commentText: '', // 评论内容
        likes: 30,
        showSendButton: false,
        placeholder: '说点什么呗~',
        detailInfo: {},
        replyList: [],
        commentInputBottom: 0,
        commentInputFocus: false
    },
    tempData: {
        keyboardHeight: 0,
        atUserId: 0, // 被回复者id
        commentId: 0, // 评论id
        quest_loading: false // 是否在请求中
    },
    onLoad: function (options) {
        let id = options.id || '-1'
        let show_goods = options.show_goods || '0'
        this.setData({
            id: Number(id),
            showGoodsInfo: Number(show_goods) == 1,
        }, () => {
            wx.showLoading({
                title: '加载中...',
            })
            this.getCommentDetail(0)
        })
    },
    onReady: function () {
    },
    onShow: function () {
    },
    onHide: function () {
    },
    onPullDownRefresh: function () {
        console.log('onPullDownRefresh')
        this.setData(
            {
                isPullDown: true,
                loading_finish: false,
            },
            () => {
                wx.showLoading({
                    title: '刷新中...',
                })
                // 请求列表 typeIndex 1 正常请求
                this.getCommentDetail(0)
            }
        )
    },
    onReachBottom: function () {
    },
    onChange: function (event) {
    },
    onItemClick: function (e) {
        console.log(e)
    },
    onLikeClick: function (e) {
        let id = e.currentTarget.dataset.id || -1
        let comment_id = this.data.id
        let type = 3 //  3 点赞层主 4 点赞其他评论者
        if (id == -1) {
            //点赞层主
        } else {
            //点赞其他评论者
            comment_id = id
            type = 4
        }
        this.commentLike(comment_id, type)
    },
    /**
     * 点赞
     */
    commentLike(id, type) {
        if (this.tempData.quest_loading) {
            return
        }
        this.tempData.quest_loading = true
        wx.showLoading({
            title: '加载中...',
        })
        let params = {
            like_type: 1,
            comment_id: id
        }
        commentModel
            .queryCommentLike(params)
            .then((res) => {
                this.getCommentDetail(type)
            })
            .catch(err => {
                console.log('err', err)
                this.tempData.quest_loading = false
            })
    },
    commentClick: function (e) {
        if (this.data.showSendButton) {
            return
        }
        if (this.data.commentInputFocus) {
            return
        }
        let id = Number(e.currentTarget.dataset.id)
        let index = Number(e.currentTarget.dataset.index)
        let user_id = Number(e.currentTarget.dataset.userId)
        this.tempData.commentId = id
        this.tempData.atUserId = user_id
        let placeholder_text = '说点什么呗~'
        if (index >= 0) {
            let user_name = this.data.replyList[index].user_nick_name
            placeholder_text = '回复 ' + user_name + '：'
        }
        this.setData({
            placeholder: placeholder_text,
            showSendButton: true
        }, () => {
            this.setData({
                commentInputFocus: true
            })
        })
    },
    commentSend: function (e) {
        if (this.tempData.quest_loading) {
            return
        }
        if (!this.data.commentText) {
            return
        }
        this.tempData.quest_loading = true

        let params = {
            atUserId: this.tempData.atUserId,
            message: this.data.commentText,
            commentId: this.tempData.commentId,
        }
        wx.showLoading({
            title: '加载中...',
        })
        commentModel
            .queryCommentReply(params)
            .then((res) => {
                console.log('res====112', res)
                this.tempData.quest_loading = false
                this.getCommentDetail(1)
            })
            .catch(err => {
                console.log('err', err)
                this.tempData.quest_loading = false
                this.setData({
                    placeholder: '说点什么呗~',
                    showSendButton: false,
                    commentText: '',
                    commentInputFocus: false
                })
            })
        console.log(e)
    },
    /**
     * 输入框高度变化
     */
    onKeyboardHeightChange(event) {
        console.log('软键盘高度', event.detail.height)
        console.log('commentInputBottom=====before', this.data.commentInputBottom)
    },
    inputFocus: function (event) {
        console.log('-----------获得焦点', event.detail)
        if (event.detail.height > 0 && this.data.commentInputBottom < 1){
            // safeAreaInsetBottom +
            const height_rpx = screenConfig.getRPX(event.detail.height)
            this.tempData.keyboardHeight = height_rpx
            this.setData(
                {
                    commentInputBottom: height_rpx,
                }
            )
        }
    },

    inputBlur: function (e) {
        setTimeout(() => {
            console.log('-----------失去焦点', Date.parse(new Date()))
            this.tempData.atUserId = this.data.detailInfo.user_id
            this.tempData.commentId = this.data.detailInfo.comment_id
            this.setData({
                showSendButton: false,
                commentText: '',
                placeholder: '说点什么呗~',
                commentInputFocus: false
            })
        }, 100)
    },

    bindReplaceInput() {

    },
    ClickBack() {
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
// 格式化数据
    handlerData(obj) {
        const _time = new Date(obj.created_at)
        obj['created_time'] = _time.format('yyyy-MM-dd hh:mm:ss')
        return obj
    },
    getCommentDetail(typeIndex) {
//  typeIndex 0 正常 1 评论  3 点赞层主 4 点赞其他评论者
        const params = {
            commentId: this.data.id
        }
        commentModel.queryCommentDetail(params).then((res) => {
            let info = {}
            let reply_list = []
            if (res) {
                info = this.handlerData(tool.deepClone(res))
                this.tempData.atUserId = info.user_id // 被回复者id
                this.tempData.commentId = info.comment_id  // 评论id
                reply_list = info.reply_list
                if (reply_list.length > 0) {
                    reply_list.forEach((ev) => {
                        const _time = new Date(ev.created_at)
                        ev['created_time'] = _time.format('yyyy-MM-dd hh:mm:ss')
                    })
                }
                if(typeIndex > 0 && typeIndex != 4){
                    this.post({
                        eventName: "commentDetailSuccess",
                        eventParams: {
                            comment_id: params.commentId,
                            like_count: info.like_count,
                            root_count: info.root_count,
                            my_like: info.my_like,
                        },
                    });
                }
            }
            if (typeIndex > 1) {
                wx.showToast({
                    title: "操作成功~",
                    icon: "none",
                    mask: true,
                    duration: 2000,
                });
            }
            this.hideToast()
            this.tempData.quest_loading = false
            this.setData({
                detailInfo: info,
                replyList: reply_list,
                isPullDown: false,
                placeholder: '说点什么呗~',
                showSendButton: false,
                commentText: ''
            })
        }).catch(err => {
            console.log('err', err)
            this.tempData.quest_loading = false
            setTimeout(() => {
                this.hideToast()
                wx.navigateBack();
            }, 1500)
        })
    },
    hideToast() {
        wx.hideLoading()
        if (this.data.isPullDown) {
            //停止下拉刷新
            wx.stopPullDownRefresh()
        }
    },
})