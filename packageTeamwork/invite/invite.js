import moment from 'moment'

const app = getApp()

const userShopInfoModel = require('../../models/userShopInfo')
const teamworkModel = require('../../models/teamwork')

Page({
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46,
        list: [],
        loaded: false,
    },
    onLoad: function (options) {
        console.log('输出 ~ options', options)
        let id = Number(options.id || '0')
        if (id > 0) {
            wx.showLoading({
                title: '加载中...',
            })
            userShopInfoModel
                .queryUserShopInfo({})
                .then((res) => {
                    let userInfo = res['user_info']
                    if (userInfo) {
                        let inviteCode = userInfo.invite_code || ''
                        this.setData({
                            inviteCode: inviteCode,
                        })
                    }
                    return teamworkModel.courseInviteList(id)
                })
                .then((res) => {
                    wx.hideLoading()
                    let list = res || []
                    let newList = list.map((ev) => {
                        let showTime = ev.created_at_txt ? moment(ev.created_at_txt).format('YYYY.MM.DD') : ''
                        return {
                            ...ev,
                            showTime: showTime,
                        }
                    })
                    this.setData({
                        list: newList,
                        loaded: true,
                    })
                })
                .catch((err) => {
                    wx.hideLoading()
                    this.setData({
                        loaded: true,
                    })
                })
            this.getCourseDetail(id)
        }
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
    // 获取详情
    getCourseDetail(id) {
        teamworkModel
            .queryCourseDetailStudent(id)
            .then((res) => {
                this.setData({
                    cash_back_money: res.cash_back_money,
                })
            })
            .catch((err) => {})
    },
})
