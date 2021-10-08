import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'
const circleModel = require('../../models/circle')
const userShopInfoModel = require('../../models/userShopInfo')
const tool = require('../../utils/tool')
const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',

        bottomLoadingShow: false,
        is_all: false,
        isPullDown: false, // 是否下拉操作
        is_query: false, // 是否在请求中

        loading_finish: false, // 请求是否完成

        is_first: true, // 初次进入页面请求
        isTeacher: false, // 是否是老师
        listData: [],
        userId: 0,
        shopId: 0,
        courseId: 0, // 团作id
    },
    events: {},

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log('options.courseId', options.courseId)
        const isShopAdmin = wx.getStorageSync('isShopAdmin') || 0
        this.setData(
            {
                isTeacher: Number(isShopAdmin) === 1,
                courseId: Number(options.courseId),
                userId: Number(options.userId),
                shopId: Number(options.shopId),
                is_first: false,
            },
            () => {
                // 请求数据
                this.queryListData()
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
        })
        this.queryListData()
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},

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
            wx.navigateBack({
                delta: 1,
            })
        }
    },

    preventTouchMove() {},

    // 预览图片
    previewImage: function (e) {
        let type = e.currentTarget.dataset.type
        const item = e.currentTarget.dataset.item
        // 获取data-src
        let src = e.currentTarget.dataset.src
        let imgList = []
        // 获取data-list
        imgList.push(e.currentTarget.dataset.src)
        wx.previewImage({
            current: src, // 当前显示图片的http链接
            urls: imgList, // 需要预览的图片http链接列表
            success: function (res) {
                console.log('success')
            },
            fail: function (res) {
                console.log('fail')
            },
        })
    },

    /**
     * 视频错误回调
     */
    videoErrorCallback() {
        console.log('err')
    },

    /**
     * 查看详情
     */
    viewCircleDetail(e) {
        const comment_id = e.currentTarget.dataset.id
        const root_id = e.currentTarget.dataset.root
        let _id = comment_id
        if(root_id > 0){
            _id = root_id
        }
        console.log('_id', _id)
        wx.navigateTo({
            url: '/packageTeamwork/circleDetail/circleDetail?id=' + _id + '&courseId=' + this.data.courseId + '&userId=' + this.data.userId + '&shopId=' + this.data.shopId,
        })
    },
    /**
     * 请求消息通知列表
     */
    queryListData() {
        wx.showLoading({
            title: '加载中...',
        })
        circleModel
            .queryNoticeList({ notice_type: 1, course_id: this.data.courseId })
            .then((res) => {
                console.log('res', res)
                wx.hideLoading()
                let _list = res || []
                _list.forEach((ev) => {
                    const _time = new Date(ev.created_at)
                    console.log('time', _time.format('yyyy-MM-dd hh:mm:ss'))
                    ev['time'] = _time.format('yyyy-MM-dd hh:mm:ss')
                })
                if (this.data.isPullDown) {
                    //停止下拉刷新
                    wx.stopPullDownRefresh()
                }
                this.setData(
                    {
                        isPullDown: false,
                        listData: res || [],
                    },
                    () => {
                        // 删除消息通知
                        const id_list = res.map((item) => item.id)
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
                )
            })
            .catch((err) => {
                console.log('err', err)
            })
    },
})
