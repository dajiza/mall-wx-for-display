// pages/orderCheck/orderCheck.js
const teamworkModel = require('../../models/teamwork')
const payModel = require('../../models/pay')
const loginWatch = require('../../utils/loginWatch')

import moment from 'moment'

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        isOverShare: true,
        id: '',

        // 上传字段
        title: '',
        start_time: '',
        end_time: '',
        limit_num: '',
        type: '', //1免费 2付费 3押金
        course_price: '',
        poster_link: '',
        introduction: '',
        is_draft: '', //\n1 是\n2 不是,
        apply_payment_order_no: '', //支付参数
        apply_status: '', //1.无效（未支付）2有效
        apply_id: '', //0未报名
        isShopAdmin: 0, //是否管理员/老师 2普通用户 1管理员
        showDialog: false,
        dialogContent: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        let id = 0
        // 获取扫码进入的id
        if (options.scene) {
            const scene = decodeURIComponent(options.scene)
            console.log(scene)
            let args = scene.split(':')
            if (args.length > 1) {
                id = args[1]
            }
        }
        // 页面跳转的id
        if (id == 0) {
            id = Number(options.id)
        }
        const isShopAdmin = wx.getStorageSync('isShopAdmin') || 0
        // const isShopAdmin = 2
        this.setData({
            isShopAdmin,
        })
        loginWatch.observer(
            this,
            () => {
                if (isShopAdmin == 2) {
                    teamworkModel.queryCourseDetailStudent(id).then((res) => {
                        // btnState 学生状态下 判断按钮显示 0立即报名 1报名已满 2报名结束 3待审核 4审核失败 5已报名
                        // attachment_status 审核状态 0无凭证 1待审核 2审核通过 3审核拒绝

                        let btnState = 0
                        if (res.apply_id == 0) {
                            // 未报名
                            if (res.join_num >= res.limit_num && res.limit_num != 0) {
                                btnState = 1
                            }
                            if (!moment().isBefore(res.end_time_txt, 'second')) {
                                btnState = 2
                            }
                        } else {
                            if (res.apply_attachment_status == 1) {
                                btnState = 3
                            } else if (res.apply_attachment_status == 3) {
                                btnState = 4
                            } else {
                                btnState = 5
                            }
                        }

                        this.setData({
                            title: res.title,
                            start_time: res.start_time_txt ? moment(res.start_time_txt).format('YYYY-MM-DD') : '',
                            end_time: res.end_time_txt ? moment(res.end_time_txt).format('YYYY-MM-DD') : '',
                            limit_num: res.limit_num,
                            join_num: res.join_num,
                            type: res.type,
                            course_price: res.course_price,
                            poster_link: res.poster_link,
                            introduction: res.introduction,
                            is_draft: res.is_draft,
                            apply_payment_order_no: res.apply_payment_order_no,
                            apply_status: res.apply_status,
                            apply_id: res.apply_id,
                            btnState,
                        })
                        if (res.applt_notic == 1 && res.apply_attachment_status == 3) {
                            this.setData({
                                showDialog: true,
                                dialogContent: res.apply_attachment_reason,
                            })
                            teamworkModel.updateNoticRead(res.apply_id)
                        }
                    })
                } else {
                    teamworkModel.queryCourseDetail(id).then((res) => {
                        // 管理员

                        this.setData({
                            title: res.title,
                            start_time: res.start_time_txt ? moment(res.start_time_txt).format('YYYY-MM-DD') : '',
                            end_time: res.end_time_txt ? moment(res.end_time_txt).format('YYYY-MM-DD') : '',
                            limit_num: res.limit_num,
                            join_num: res.join_num,
                            type: res.type,
                            course_price: res.course_price,
                            poster_link: res.poster_link,
                            introduction: res.introduction,
                            is_draft: res.is_draft,
                        })
                    })
                }

                this.setData({
                    id,
                })
            },
            '/packageTeamwork/teamworkDetail/teamworkDetail?id=' + id
        )
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        // // 1 获取当前的小程序的页面栈-数组 长度最大是10页面
        // let pages = getCurrentPages()
        // // 2 数组中 索引最大的页面就是当前页面
        // let currentPage = pages[pages.length - 1]
        // // 3 获取url上的type参数
        // const id = Number(currentPage.options.id)
    },
    onPop: function (e) {
        let pages = getCurrentPages()
        if (pages.length == 1) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },

    // 老师 进入团作
    gotoDetail: function (e) {
        let id = this.data.id
        wx.navigateTo({
            url: `/packageTeamwork/courseDetail/courseDetail?course_id=${id}`,
        })
    },
    // 学生 立即报名
    gotoApply: function (e) {
        let id = this.data.id
        let apply_status = this.data.apply_status
        let apply_id = this.data.apply_id
        // 去报名
        if (apply_id == 0) {
            wx.navigateTo({
                url: `/packageTeamwork/signUp/signUp?id=${id}`,
            })
            return
        }
        // 去支付
        if (apply_id != 0 && apply_status == 1) {
            wx.showLoading()
            let total_fee = this.data.course_price
            let source = 2
            let order_no = this.data.apply_payment_order_no
            payModel.courseId = this.data.id //缓存课程id
            payModel
                .queryPayInfoTeamwork(total_fee, order_no, source, this)
                .then((res) => {})
                .catch((err) => {
                    console.log('输出 ~ err', err)
                })
        } else {
            // 已报名已支付
            wx.showToast({
                title: '您已报名,正在跳转',
                icon: 'none',
                duration: 2000,
            })
            setTimeout(() => {
                wx.navigateTo({
                    url: `/packageTeamwork/courseDetail/courseDetail?course_id=${id}`,
                })
            }, 800)
        }
    },

    /**
     * 用户点击分享
     */
    onShareAppMessage: function (res) {
        return {
            title: this.data.title,
            path: '/packageTeamwork/teamworkDetail/teamworkDetail?id=' + this.data.id,
            imageUrl: this.data.poster_link,
        }
    },
    preventTouchMove() {},
    // 图片预览
    previewImage: function (e) {
        let url = this.data.poster_link ? (this.data.poster_link + '!upyun520/fw/3000') : ''
        if (url.length > 0) {
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
        }
    },
})
