// pages/orderCheck/orderCheck.js
const teamworkModel = require('../../models/teamwork')
const payModel = require('../../models/pay')
const tool = require('../../utils/tool')
const util = require('../../utils/util')
import moment from 'moment'

App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        id: '',
        type: '',
        course_price: '',
        cash_back_money: '', //返现金额
        comment: '', //要求

        name: '',
        phone: '',
        inviter_code: '',
        fileList: [],
        checkCodeTimes: 0,
        checkStatus: 3,
        unlockTime: '', //解封时间
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let id = Number(options.id)
        this.setData({
            id,
        })
        teamworkModel.queryCourseDetailStudent(id).then((res) => {
            this.setData({
                type: res.type,
                course_price: res.course_price,
                cash_back_money: res.cash_back_money,
                comment: res.comment,
            })
        })
        this.queryCourseLastInfo()
    },

    queryCourseLastInfo() {
        teamworkModel.queryCourseLastInfo().then((res) => {
            console.log('输出 ~ res', res)
            this.setData({
                phone: res.user_phone || '',
            })
        })
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    signUp: function (e) {
        let that = this
        let fileList = this.data.fileList
        let id = this.data.id
        let name = this.data.name
        let phone = this.data.phone
        let type = this.data.type

        if (name.length < 1 || name.length > 100) {
            wx.showToast({
                title: '请输入正确姓名',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        // 验证手机 1开头11位数字
        var pattern = /^1[0-9]{10}$/
        let verify = pattern.test(phone)
        if (!verify) {
            wx.showToast({
                title: '请输入正确手机号',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        // 验证图片
        if (type == 11 && fileList.length == 0) {
            wx.showToast({
                title: '请上传凭证',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        if (type == 3) {
            wx.showModal({
                title: '',
                content: '押金将在发布作业后退还',
                confirmText: '去付款',
                cancelText: '再想想',
                success(res) {
                    if (res.confirm) {
                        that.apply()
                    } else if (res.cancel) {
                        console.log('用户点击取消')
                    }
                },
            })
        } else {
            this.apply()
        }
    },
    // 图片上传
    afterRead(event) {
        const file = event.detail.file

        let fileList = this.data.fileList
        var index = 0
        for (let i = fileList.length; i < 6; i++) {
            util.uploadFile(file[index].path)
                .then((res) => {
                    let result = JSON.parse(res)
                    fileList.push({
                        url: result.data.file_url,
                        deletable: true,
                    })
                    this.setData({
                        fileList,
                    })
                })
                .catch((err) => {
                    // reject(err)
                })
            index++
            if (index >= file.length) {
                break
            }
        }
    },
    // 图片删除
    deleteImg(event) {
        let fileList = this.data.fileList
        let index = event.detail.index
        fileList.splice(index, 1)
        this.setData({
            fileList,
        })
    },
    // 图片超出限制
    oversize(event) {
        wx.showToast({
            title: '图片大小请在10M以下',
            icon: 'none',
            duration: 2000,
        })
    },
    checkCode(event) {
        let inviter_code = this.data.inviter_code
        let checkCodeTimes = this.data.checkCodeTimes
        let unlockTime = this.data.unlockTime
        let id = this.data.id
        let timestampNow = Date.parse(new Date())

        if (!inviter_code) {
            return
        }
        let diffTime = 'init'
        if (unlockTime) {
            let a = moment(unlockTime)
            let b = moment(timestampNow)
            diffTime = b.diff(a, 'm')
        }
        console.log('输出 ~ diffTime', diffTime)
        if (checkCodeTimes >= 3 && diffTime == 'init') {
            wx.showToast({
                title: '已错误3次，请10分钟后再试',
                icon: 'none',
                duration: 2000,
            })
            let unlockTime = moment(timestampNow).add(11, 'm')
            this.setData({
                unlockTime: unlockTime,
            })
            return
        } else if (diffTime < 0) {
            wx.showToast({
                title: `已错误3次，请${Math.abs(diffTime)}分钟后再试`,
                icon: 'none',
                duration: 2000,
            })
            return
        } else if (diffTime >= 0) {
            this.setData({
                checkCodeTimes: 0,
                unlockTime: '',
            })
        }
        teamworkModel.checkInviteCode(inviter_code, id).then((res) => {
            if (!res) {
                this.setData({
                    checkCodeTimes: ++this.data.checkCodeTimes,
                    checkStatus: 0,
                })
            } else {
                this.setData({
                    checkStatus: 1,
                })
            }
        })
    },
    apply: async function () {
        wx.showLoading()
        let id = this.data.id
        let name = this.data.name
        let phone = this.data.phone
        let type = this.data.type
        let course_price = this.data.course_price
        let fileList = this.data.fileList
        let inviter_code = this.data.inviter_code
        let cash_back_money = this.data.cash_back_money
        let inviterCodeSend = ''
        let backMoney = 0

        // 22 付费-邀请返现 验证邀请码 及生成付费直接返现金额
        if (type == 22 && inviter_code) {
            let checkInvitCodeStatus = await teamworkModel.checkInviteCode(inviter_code, id)
            if (checkInvitCodeStatus) {
                inviterCodeSend = inviter_code
                backMoney = cash_back_money
            }
        }

        let attachment_json = fileList.map((item) => item.url).join(',')
        let params = {
            course_id: id,
            user_name: name,
            user_phone: phone,
            attachment_json,
            inviter_code: inviterCodeSend,
        }

        teamworkModel.updateCourseApply(params).then((res) => {
            wx.showToast({
                title: '报名成功',
                icon: 'none',
                duration: 2000,
            })
            if (type == 1) {
                // 免费-无凭证
                payModel.courseId = this.data.id //缓存课程id
                setTimeout(() => {
                    wx.redirectTo({
                        url: '/packageTeamwork/signUpSucess/signUpSucess',
                    })
                }, 300)
            } else if (type == 11) {
                // 免费-需凭证
                setTimeout(() => {
                    wx.redirectTo({
                        url: '/packageTeamwork/signUpSucessUnchecked/signUpSucessUnchecked',
                    })
                }, 300)
            } else {
                // let total_fee = 100
                let total_fee = tool.numberSub(course_price, backMoney)
                let source = 2
                let order_no = res.payment_order_no
                payModel.courseId = this.data.id //缓存课程id
                payModel.teamworkType = type //缓存课程类型
                payModel
                    .queryPayInfoTeamwork(Number(total_fee), order_no, source, this)
                    .then((res) => {})
                    .catch((err) => {})
            }

            // setTimeout(() => {
            //     wx.navigateBack({
            //         delta: 1,
            //     })
            // }, 300)
        })
    },
})
