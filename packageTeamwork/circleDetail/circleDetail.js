import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
import screenConfig from "../../utils/screen_util";
const circleModel = require("../../models/circle");
const userShopInfoModel = require('../../models/userShopInfo')
const teamworkModel = require('../../models/teamwork')
const tool = require("../../utils/tool");
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const app = getApp();
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + "px",

        isPullDown: false, // 是否下拉操作
        quest_loading: false, // 是否在请求中

        operatingIndex: -1, // 当前操作的订单index
        loading_finish: false, // 请求是否完成
        is_first: true, // 初次进入页面请求
        isTeacher: false,  // 是否是老师
        commentId: 0,
        detailInfo:{},
        showMuteDialog: false, // 禁言弹框

        muteUserId: 0, // 被禁言者id
        muteType:1,  // 禁言类型
        muteDay: '', // 禁言天数

        userId: 0,
        shopId: 0,
        courseId: 0, // 团作id
        inputFocus: false,
        commentInputBottom: 0,
        commentText: '', // 评论内容
        replyType: 1, // 1 评论 2 回复评论
        replyCommentId: 0, // 当前回复评论 comment_id
        atUserId: 0, // 被回复人id
        atUserName:'', // 被回复人昵称

        textareaPlaceholder: '说点什么吧',
        autosize:{
            maxHeight: 70,
            minHeight: 18
        },
        safeAreaInsetBottom: safeAreaInsetBottom,
        commentBoxShow: false, // 评论输入框是否显示
        muteTipShow: false, // 被禁言提示
    },
    // 不用于数据绑定的全局数据
    tempData: {
        keyboardBottom: 0 // 软键盘高度
    },
    events: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const isShopAdmin = wx.getStorageSync("isShopAdmin") || 0;
        console.log('id',Number(options.id))
        this.setData({
            commentId: options.id ? Number(options.id) : 0,
            isTeacher:  Number(isShopAdmin) === 1,
            courseId: options.courseId ? Number(options.courseId) : 0,
            userId: options.userId ? Number(options.userId) : 0,
            shopId: options.shopId ? Number(options.shopId) : 0,
            is_first: false,
        },()=>{
            // 请求数据
            wx.showLoading({
                title: '加载中...',
            })
            this.queryDetailData(0);
        });
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
    onPullDownRefresh: function () {
        this.setData({
            isPullDown: true,
            loading_finish: false,
        });
        wx.showLoading({
            title: '加载中...',
        })
        this.queryDetailData(0)
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // },

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

    preventTouchMove() {},

    /**
     * 请求消息详情
     */
    queryDetailData(typeIndex){
        //  typeIndex 0 正常 1 评论  2 点赞  3 禁言
        const params = {
            comment_id: this.data.commentId
        }
        circleModel.queryNoticeDetail(params).then((res) => {
            console.log('res====134', res)
            let info = {}
            if(res){
                info = this.handlerData(tool.deepClone(res))
            }
            wx.hideLoading()
            if(typeIndex > 1){
                wx.showToast({
                    title: "操作成功~",
                    icon: "none",
                    mask: true,
                    duration: 2000,
                });
            }
            if (this.data.isPullDown) {
                //停止下拉刷新
                wx.stopPullDownRefresh()
            }
            this.setData({
                detailInfo: info,
                isPullDown: false
            })
        }).catch(err=>{
            console.log('err', err)
            wx.navigateBack();
        })
    },

    // 格式化数据
    handlerData(obj){
        // console.log('arr====152', obj);
        if(obj.user.id){
            obj['user_id'] = obj.user.id
            obj['user_nick_name'] = obj.user.nick_name
            obj['user_avatar'] = obj.user.avatar_url
        }
        obj['son'] = [];
        obj['likesName'] = ''
        obj['showOperation']= false
        if(!obj['showMore']){
            obj['showMore'] = false
        }
        if(!obj['openBtnShow']){
            obj['openBtnShow'] = false
        }
        if(!obj['isShowAll']){
            obj['isShowAll'] = false
        }
        if(!obj['is_like']){
            obj['is_like'] = false
        }
        obj['likes'] = obj.like_users
        if(obj.like_users && obj.like_users.length > 0){ //nick_name
            let like_list = obj.like_users.map(item => item.nick_name)
            obj['likesName'] = like_list.join('，')
            const like_user_ids = obj.likes.filter(item => item.id == this.data.userId)
            if(like_user_ids.length > 0){
                obj['is_like'] = true
            }
        }
        let son_list = obj.reply_list.filter(item => {return item.root_id != 0})
        son_list.forEach((item)=>{
            if(item.parent_id == obj.comment_id){
                obj['son'].push(item)
            }
        })
        obj['time'] = obj.created_at
        // 是否禁言中
        obj['isMute'] = false
        if (obj.banned_time) {
            const bannedTime = new Date(obj.banned_time.replace(/-/g, '/')).getTime();
            const nowTime = new Date().getTime();
            if (nowTime < bannedTime) {
                obj['isMute'] = true
            }
        }
        if(obj['reply_list']){
            obj['reply_list'] = obj['reply_list'].filter(item => {return item.root_id == obj.comment_id})
        }
        if (obj.message) {
            obj['message'] = obj['message'].replace(/↵/g, '\n');
        }
        return obj
    },

    catchTapDummy: function (e) {},

    onKeyboardHeightChange(event){
        console.log('event===>', event.detail)
    },
    /**
     * 点击操作按钮 时间后面 两个点
     */
    handleOnMore(info){
        console.log('info', info.detail)
        const _id = info.detail.id;
        const _obj = this.data.detailInfo
        _obj['showOperation'] = !_obj['showOperation']

        this.setData({
            detailInfo: _obj
        })
    },
    /**
     * 回复
     * type
     */
    onComment(info) {
        // 判断是否禁言 isMute
        if(this.data.isTeacher){
            this.commentInputShow(info)
            return
        }
        const params ={
            user_id: this.data.userId, // 学生id
            course_id: this.data.courseId,// 团作id
            shop_id: this.data.shopId // 店铺id
        }

        circleModel
            .queryUserIsMute(params)
            .then((res) => {
                if(res) {
                    this.setData({
                        muteTipShow: true
                    })
                    console.log('禁言了')
                } else {
                    console.log('没有禁言')
                    this.commentInputShow(info)
                }
            })
            .catch((err)=>{})
    },

    commentInputShow(info){
        if (this.data.inputFocus) {
            return
        }
        console.log('info====>267', info.detail)
        let placeholderText = '说点什么吧'
        if (info.detail.at_user_name && info.detail.type == 2) {
            placeholderText = '回复 ' + info.detail.at_user_name
        }
        const _obj = this.data.detailInfo
        _obj['showOperation'] = false
        this.setData(
            {
                commentText:'',
                replyType: info.detail.type,
                operationId: info.detail.comment_id,
                replyCommentId: info.detail.reply_comment_id,
                atUserId: info.detail.at_user_id,
                atUserName:info.detail.at_user_name,
                textareaPlaceholder: placeholderText,
                detailInfo: _obj,
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
     * 被禁言弹窗关闭
     */
    onMuteDialogClose() {
        this.setData({
            muteTipShow: false,
        })
    },
    /**
     * 点赞
     */
    handleOnLike(info){
        if (this.data.quest_loading) {
            return;
        }
        this.setData({
            quest_loading: true,
        });
        let _platform = 2 //  2.圈子 3.作业墙 4.示范作业
        if(info.detail.grade == 1){ _platform = 4 }
        let params = {
            comment_id: this.data.commentId,
            like_type: _platform,
        }
        const _this = this;
        circleModel.queryLike(params).then((res)=>{
            const _obj = this.data.detailInfo
            _obj['showOperation'] = false

            _this.setData({
                detailInfo: _obj
            },()=>{
                _this.queryDetailData(2)
            });
            setTimeout(() => {
                _this.setData({
                    quest_loading: false
                });
            }, 300);
        }).catch(err=>{
            _this.setData({
                quest_loading: false,
            });
            console.log('err', err)
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
            textareaPlaceholder: '',
            inputFocus: false
        })
    },

    /**
     * 点击回复
     */

    handleOnComment(){
        // console.log('commentText', this.data.commentText)
        if ( !this.data.commentText) {
            return
        }
        if (this.data.quest_loading) {
            return;
        }
        this.setData({
            quest_loading: true,
        });
        let params = {
            message: this.data.commentText,
            comment_id: this.data.replyType == 2?this.data.replyCommentId:this.data.commentId,
            at_user_id: this.data.atUserId,
        }
        // console.log('params', params)
        const _this = this;
        wx.showLoading({
            title: '加载中...',
        })
        circleModel.creatCommentReply(params).then((res)=>{
            // console.log('res', res)
            const _obj = this.data.detailInfo
            _obj['showOperation'] = false

            _this.setData({
                commentText: '',
                detailInfo: _obj
            },()=>{
                _this.queryDetailData(1)
            });
            setTimeout(() => {
                _this.setData({
                    quest_loading: false,
                });
            }, 500);
        }).catch(err=>{
            _this.setData({
                quest_loading: false,
            });
            console.log('err', err)
        })

    },
    /**
     * 删除
     */
    handleOnDelete(info){
        return;
        if (this.data.quest_loading) { return }
        this.setData({
            quest_loading: true,
        });
        let params = {
            comment_id: Number(info.detail.id)
        }
        const _this = this;
        circleModel.queryDel(params).then((res)=>{
            const _obj = this.data.detailInfo
            _obj['showOperation'] = false
            wx.showToast({
                title: "删除成功~",
                icon: "none",
                mask: true,
                duration: 2000,
            });
            _this.setData({
                detailInfo: _obj
            },()=>{
                // 返回上一页
                this.post({
                    eventName: "deleteCircle",
                    eventParams: params.comment_id,
                });
            });
            setTimeout(() => {
                _this.setData({
                    quest_loading: false
                });
                wx.navigateBack();
            }, 500);
        }).catch(err=>{
            _this.setData({
                quest_loading: false,
            });
            console.log('err', err)
        })
    },

    /**
     * 禁言弹框显示
     */
    handleOnMute(info){
        console.log('info========793', info.detail)
        this.setData({
            muteUserId: info.detail.userId,
            showMuteDialog: true,
        });

    },
    handleOnMuteDayInput: function (e) {
        this.setData({
            muteDay: e.detail.value
        })
    },
    changeMuteType: function (e) {
        let muteType = e.currentTarget.dataset.type || '1'
        this.setData({
            muteType: Number(muteType)
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
            banned_type: (muteType == 1) ? 2 : 1,
        }
        if (muteType == 2) {
            let muteDay = Number(this.data.muteDay)
            params['banned_day'] = muteDay
        }
        console.log(params)
        this.setData({
            showMuteDialog: false,
        }, () => {
            this.doMute(params)
        })
    },

    // 禁言
    doMute(params) {
        wx.showLoading({
            title: '加载中...',
        })
        teamworkModel.studentBannedTalk(params)
            .then(res => {
                const _obj = this.data.detailInfo
                _obj['showOperation'] = false
                this.setData({
                    detailInfo: _obj,
                    muteDay: ''
                }, () => {
                    this.queryDetailData(3)
                })
            })
            .catch(res => {
                wx.hideLoading()
            })
    },


    /**
     * 显示展开收起全文按钮
     */
    showAllText(info){
        console.log('info.detail', info.detail)
        const _obj = this.data.detailInfo
        _obj['openBtnShow'] = true
        this.setData({
            detailInfo: _obj
        })
    },
    /**
     * 展开收起全文
     */
    openAllText(info){
        console.log('info.detail', info.detail)
        const _obj = this.data.detailInfo
        _obj['isShowAll'] = true
        this.setData({
            detailInfo: _obj
        })
    },
    /**
     * 展开收起更多操作
     */
    showMoreOperation(info){
        console.log('info.detail', info.detail)
        const _obj = this.data.detailInfo
        _obj['showMore'] = true
        this.setData({
            detailInfo: _obj
        })
    },

    /**
     * 隐藏操作框
     */
    hideOperation(){
        const _obj = this.data.detailInfo
        _obj['showOperation'] = false
        this.setData({
            detailInfo: _obj,
        })
    }
});


