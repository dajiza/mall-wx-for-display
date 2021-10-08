// pages/orderCheck/orderCheck.js
const teamworkModel = require('../../models/teamwork')
const userShopInfoModel = require('../../models/userShopInfo')
const payModel = require('../../models/pay')
const loginWatch = require('../../utils/loginWatch')
const phoneNumWatch = require('../../utils/phoneNumWatch')
import moment from 'moment'
const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        active: '2', //2全部 1我的/草稿
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        hiddenSub: true,
        page: 1,
        limit: 20,
        total: 0,
        loading: false,
        list: [],

        pageTotal: 0, //数据总页数
        isShopAdmin: 0, //是否管理员/老师 2普通用户 1管理员
        subState: 1, //订阅状态   1未订阅 2已订阅

        toAuditNum: 0,
    },
    tempData: {
        formOther: false,
    },
    events: {
        getTeamworkIndexActive: function (active) {
            this.tempData.formOther = true
            this.setData({ active })
            // this.selectComponent('#tabs').setLine()
        },
        // getTeamworkIndexRefresh: function () {
        //     console.log('输出 ~ getTeamworkIndexRefresh 刷新')
        //     this.setData({
        //         page: 1,
        //         list: [],
        //     })
        //     this.getData()
        // },
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {},
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        loginWatch.observer(
            this,
            () => {
                this.getTabBar().init()
                let hiddenSub = wx.getStorageSync('hiddenSub') ? false : true
                wx.setStorageSync('hiddenSub', true)
                this.getUserInfo()
                const isShopAdmin = wx.getStorageSync('isShopAdmin') || 0
                // const isShopAdmin = 2
                this.setData({
                    hiddenSub,
                    isShopAdmin,
                })
                this.setData({
                    page: 1,
                    list: [],
                })
                let active = this.data.active
                if (active != 3 && isShopAdmin == 1) {
                    teamworkModel.courseApplyAttachmentList().then((res) => {
                        let toAuditNum = (res.list || []).length
                        this.setData({
                            toAuditNum: toAuditNum,
                        })
                    })
                }
                this.getData()
                this.delNotice()
            },
            '/pages/teamworkIndex/teamworkIndex',
            true
        )
        // this.setData({
        //     page: 1,
        //     list: [],
        // })
        // this.getData()
        // this.selectComponent('#tabs').setLine()
    },
    onReady: function () {
        // this.selectComponent('#tabs').setLine()
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        this.setData({
            page: 1,
            list: [],
        })
        this.getData()
        this.delNotice()
    },
    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        // const _this = this
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                let subState = res.user_info.course_sub
                this.setData({
                    subState,
                })
            })

            .catch((err) => {})
    },
    // 关闭新用户提醒
    closeNewTip: function () {
        this.setData({
            hiddenSub: false,
        })
    },

    /*tab切换 学生*/
    onTapChange(event) {
        this.setData({
            active: event.detail.name,
            page: 1,
            loading: true,
            list: [],
        })
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 300,
        })
        this.getData()
    },

    /*tab切换 管理员*/
    onChange(event) {
        console.log('输出 ~ event', event)
        let active = event.currentTarget.dataset.name
        this.setData(
            {
                active: active,
                page: 1,
                loading: true,
                list: [],
            },
            () => {
                this.getData()
            }
        )
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 300,
        })
        // if (!this.data.is_first) {
        //     this.setData({
        //         page: 1,
        //         is_all: false,
        //         active: Number(event.detail.name),
        //     })
        //     wx.pageScrollTo({
        //         scrollTop: 0,
        //         duration: 300,
        //     })
        //     this.queryListData()
        // }
    },
    /*获取列表数据*/
    getData(event) {
        let page = this.data.page
        let limit = this.data.limit
        let is_draft = this.data.active
        console.log('输出 ~ is_draft', is_draft)
        let list = this.data.list
        let isShopAdmin = this.data.isShopAdmin
        console.log('输出 ~ isShopAdmin', isShopAdmin)
        if (!this.tempData.formOther) {
            wx.showLoading({
                title: '加载中...',
            })
        }
        if (is_draft == 1 && isShopAdmin == 2) {
            // 学生 全部
            teamworkModel
                .queryCourseListMy(page, limit)
                .then((res) => {
                    let newArr = res.lists
                    // 格式化显示时间
                    for (let i = 0; i < newArr.length; i++) {
                        const element = newArr[i]
                        element.start_time_txt = element.start_time_txt ? moment(element.start_time_txt).format('YYYY-MM-DD') : ''
                        element.end_time_txt = element.end_time_txt ? moment(element.end_time_txt).format('YYYY-MM-DD') : ''
                        let start = moment().isAfter(element.start_time, 'second')
                        let end = moment().isBefore(element.end_time, 'second')
                        if (start && end) {
                            element.processing = true
                        } else {
                            element.processing = false
                        }
                    }
                    list.push(...newArr)
                    this.setData({
                        list,
                        page: page + 1,
                        total: res.total,
                        pageTotal: res.pages,
                        loading: false,
                    })
                    wx.stopPullDownRefresh()
                    if (!this.tempData.formOther) {
                        wx.hideLoading()
                    }
                    this.tempData.formOther = false
                })
                .catch((err) => {
                    console.log('err', err)
                    this.tempData.formOther = false
                })
        } else if (is_draft == 2 && isShopAdmin == 2) {
            // 学生 我的
            teamworkModel
                .queryCourseListStudent(page, limit)
                .then((res) => {
                    let newArr = res.lists
                    // 格式化显示时间
                    for (let i = 0; i < newArr.length; i++) {
                        const element = newArr[i]
                        element.start_time_txt = element.start_time_txt ? moment(element.start_time_txt).format('YYYY-MM-DD') : ''
                        element.end_time_txt = element.end_time_txt ? moment(element.end_time_txt).format('YYYY-MM-DD') : ''
                        let start = moment().isAfter(element.start_time, 'second')
                        let end = moment().isBefore(element.end_time, 'second')
                        if (start && end) {
                            element.processing = true
                        } else {
                            element.processing = false
                        }
                    }
                    list.push(...newArr)
                    this.setData({
                        list,
                        page: page + 1,
                        total: res.total,
                        pageTotal: res.pages,
                        loading: false,
                    })
                    wx.stopPullDownRefresh()
                    if (!this.tempData.formOther) {
                        wx.hideLoading()
                        this.tempData.formOther = false
                    }
                })
                .catch((err) => {
                    console.log('err', err)
                    this.tempData.formOther = false
                })
        } else {
            if (is_draft == 3) {
                //审核
                teamworkModel
                    .courseApplyAttachmentList()
                    .then((res) => {
                        let data = res.list || []
                        let toAuditNum = data.length
                        this.setData({
                            loading: false,
                            toAuditNum: toAuditNum,
                            list: data,
                        })
                        wx.stopPullDownRefresh()
                        if (!this.tempData.formOther) {
                            wx.hideLoading()
                        }
                        this.tempData.formOther = false
                    })
                    .catch((err) => {
                        if (!this.tempData.formOther) {
                            wx.hideLoading()
                        }
                        this.tempData.formOther = false
                    })
                return
            }
            // 老师 全部+草稿
            teamworkModel
                .queryCourseList(is_draft, page, limit)
                .then((res) => {
                    let newArr = res.lists
                    // 格式化显示时间
                    for (let i = 0; i < newArr.length; i++) {
                        const element = newArr[i]
                        element.start_time_txt = element.start_time_txt ? moment(element.start_time_txt).format('YYYY-MM-DD') : ''
                        element.end_time_txt = element.end_time_txt ? moment(element.end_time_txt).format('YYYY-MM-DD') : ''
                        let start = moment().isAfter(element.start_time, 'second')
                        let end = moment().isBefore(element.end_time, 'second')
                        if (start && end) {
                            element.processing = true
                        } else {
                            element.processing = false
                        }
                    }
                    list.push(...newArr)
                    this.setData({
                        list,
                        page: page + 1,
                        total: res.total,
                        pageTotal: res.pages,
                        loading: false,
                    })
                    wx.stopPullDownRefresh()
                    if (!this.tempData.formOther) {
                        wx.hideLoading()
                    }
                    this.tempData.formOther = false
                })
                .catch((err) => {
                    console.log('err', err)
                    this.tempData.formOther = false
                })
        }
    },
    // 订阅/取消 是否订阅团作 1不订阅 2订阅
    updateSubState: function () {
        let subState = this.data.subState == 1 ? 2 : 1
        teamworkModel.updateCourseSub(subState).then((res) => {
            wx.showToast({
                title: (subState == 1 ? '取消' : '') + '订阅成功',
                icon: 'none',
                duration: 2000,
            })
            this.setData({
                subState,
            })
        })
        this.closeNewTip()
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        let page = this.data.page
        let limit = this.data.limit
        let total = this.data.total
        let loading = this.data.loading
        let pageTotal = this.data.pageTotal
        // let pageTotal = Math.ceil(total / limit)
        if (page <= pageTotal && !loading) {
            this.setData({
                loading: true,
            })
            this.getData()
        }
    },
    // 左上角 创建团作
    gotoCreat: function () {
        wx.navigateTo({
            url: `/packageTeamwork/createTeamwork/createTeamwork`,
        })
    },
    // 去圈子
    gotoCircle: function (e) {
        let id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: '/packageTeamwork/circle/circle?type=1&courseId=' + id,
        })
    },
    // 去编辑/详情
    gotoDetail: function (e) {
        let active = this.data.active
        let isShopAdmin = this.data.isShopAdmin //2普通用户 1管理员
        let id = e.currentTarget.dataset.id
        let apply = e.currentTarget.dataset.apply //0未报名
        let status = e.currentTarget.dataset.status //1.无效（未支付）2有效
        let attachment = e.currentTarget.dataset.attachment //审核状态 0无凭证 1待审核 2审核通过 3审核拒绝
        let type = e.currentTarget.dataset.type //团作模式：1免费 2付费 3押金 11免费-需凭证 21付费-凭证返现 22 付费-邀请返现

        if (isShopAdmin == 1 && active == 1) {
            // 老师 草稿箱
            wx.navigateTo({
                url: `/packageTeamwork/createTeamwork/createTeamwork?id=${id}`,
            })
        } else if (isShopAdmin == 1 && active == 2) {
            // 老师 全部
            wx.navigateTo({
                url: `/packageTeamwork/teamworkDetail/teamworkDetail?id=${id}`,
            })
        } else {
            if (apply == 0) {
                // 未报名
                wx.navigateTo({
                    url: `/packageTeamwork/teamworkDetail/teamworkDetail?id=${id}`,
                })
            } else {
                // 已报名
                if (type == 11 && (attachment == 1 || attachment == 3)) {
                    // 去团作详情  11免费-需凭证/1待审核/3审核拒绝
                    wx.navigateTo({
                        url: `/packageTeamwork/teamworkDetail/teamworkDetail?id=${id}`,
                    })
                } else if ((type == 2 || type == 3 || type == 21 || type == 22) && status == 1) {
                    // 2付费 3押金 21付费-凭证返现 22付费-邀请返现 未付费
                    wx.showLoading()
                    let total_fee = e.currentTarget.dataset.price
                    let source = 2
                    let order_no = e.currentTarget.dataset.orderno
                    payModel.courseId = this.data.id //缓存课程id
                    payModel.teamworkType = type //缓存课程类型
                    payModel
                        .queryPayInfoTeamwork(total_fee, order_no, source, this)
                        .then((res) => {})
                        .catch((err) => {
                            console.log('输出 ~ err', err)
                        })
                } else {
                    wx.navigateTo({
                        url: `/packageTeamwork/courseDetail/courseDetail?course_id=${id}`,
                    })
                }
            }

            // // 学生 我的+全部
            // if (apply && status == 2) {
            //     // 已报名 且付款
            //     if (attachment == 0 || attachment == 3) {
            //         // 审核通过 无需审核
            //         wx.navigateTo({
            //             url: `/packageTeamwork/courseDetail/courseDetail?course_id=${id}`,
            //         })
            //     } else {
            //         // 待审核 审核拒绝
            //         wx.navigateTo({
            //             url: `/packageTeamwork/teamworkDetail/teamworkDetail?id=${id}`,
            //         })
            //     }
            // } else if (apply && status == 1) {
            //     // 已报名 未付款  去支付
            //     wx.showLoading()
            //     let total_fee = e.currentTarget.dataset.price
            //     let source = 2
            //     let order_no = e.currentTarget.dataset.orderno
            //     payModel.courseId = this.data.id //缓存课程id
            //     payModel
            //         .queryPayInfoTeamwork(total_fee, order_no, source, this)
            //         .then((res) => {})
            //         .catch((err) => {
            //             console.log('输出 ~ err', err)
            //         })
            // } else {
            // }
        }
    },
    gotoAudit: function (e) {
        let id = e.currentTarget.dataset.id
        let applyId = e.currentTarget.dataset.applyId
        wx.navigateTo({
            url: '/packageTeamwork/audit/audit?id=' + id + '&apply_id=' + applyId,
        })
    },
    // 删除新团作通知
    delNotice() {
        teamworkModel
            .deleteTeamWorkNotice({})
            .then((res) => {
                // this.post({
                //     eventName: 'getTeamworkIndexRefresh',
                //     eventParams: '',
                // })
                console.log('res', res)
            })
            .catch((err) => {
                console.log('err', err)
            })
    },
})
