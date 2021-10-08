// pages/orderCheck/orderCheck.js
const teamworkModel = require('../../models/teamwork')
const util = require('../../utils/util')
const tool = require('../../utils/tool')
const goodsModel = require('../../models/goods')
const upyun = require('../../utils/upyun_wxapp_sdk')

import moment from 'moment'

App.Page({
    /**
     * 页面的初始数据
     */

    /**
     *  团作新增
     *  `title` varchar(20) NOT NULL DEFAULT '' COMMENT '团作名称',
     *  `start_time` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '课程开始时间',
     *  `end_time` timestamp NULL DEFAULT NULL COMMENT '课程结束时间',
     *  `limit_num` int(11) NOT NULL COMMENT '报名限额',
     *  `type` int(11) NOT NULL DEFAULT '1' COMMENT '团作模式：1免费 2付费 3押金',
     *  `course_price` int(11) NOT NULL DEFAULT '0' COMMENT '团作模式价格',
     *  `poster_link` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '海报地址',
     *  `introduction` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '团作介绍',
     *  `is_draft` int(11) NOT NULL DEFAULT '1' COMMENT '是否草稿：\n1 是\n2 不是',
     */
    data: {
        id: '', //编辑 id
        showDatePicker: false,
        formatter(type, value) {
            if (type === 'year') {
                return `${value}年`
            } else if (type === 'month') {
                return `${value}月`
            }
            return value
        },
        minDate: new Date().getTime(), // n个月前 new Date().getTime() - 1000 * 60 * 60 * 24 * 31 * n
        currentDate: new Date().getTime(),
        picker: '', //标志 选择是开始/结束
        mode: '', //选中的模式
        // 上传字段
        title: '',
        start_time: '',
        end_time: '',
        limit_num: '',
        type: '', //1免费 2付费 3押金 11免费-需凭证 21付费-凭证返现 22 付费-邀请返现
        typeFree: '', //免费 11需凭证 12否
        typePay: '', //付费 20普通 21付费-凭证返现 21付费-邀请返现
        back_money: '', //条件返现金额
        comment: '', //条件说明
        course_price: '',
        poster_link: '',
        introduction: '',
        is_draft: '', //\n1 是\n2 不是,
        goodsNum: 0,
        tipShow: false, //提示显示

        defaultText: '',
    },
    events: {
        updateIntroduction: function (introduction) {
            this.setData({
                introduction: introduction,
            })
        },
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        let id = Number(options.id) || ''
        if (id) {
            teamworkModel.queryCourseDetail(id).then((res) => {
                let shop_goods_ids = JSON.parse(res.shop_goods_ids)
                let type = res.type
                let typeFree = ''
                let typePay = ''
                switch (res.type) {
                    case 1:
                        type = 1
                        typeFree = 12
                        break
                    case 11:
                        type = 1
                        typeFree = 11
                        break
                    case 2:
                        type = 2
                        typePay = 20
                        break
                    case 21:
                        type = 2
                        typePay = 21
                        break
                    case 22:
                        type = 2
                        typePay = 22
                        break

                    default:
                        break
                }
                this.setData({
                    title: res.title,
                    start_time: res.start_time_txt ? moment(res.start_time_txt).format('YYYY-MM-DD') : '',
                    end_time: res.end_time_txt ? moment(res.end_time_txt).format('YYYY-MM-DD') : '',
                    limit_num: res.limit_num == 0 ? '' : res.limit_num,
                    type: type,
                    typeFree: typeFree,
                    typePay: typePay,
                    back_money: res.cash_back_money ? res.cash_back_money / 100 : 0,
                    comment: res.comment,
                    course_price: res.course_price / 100,
                    poster_link: res.poster_link,
                    introduction: res.introduction,
                    is_draft: res.is_draft,
                    shop_goods_ids: shop_goods_ids,
                    goodsNum: shop_goods_ids.length,
                })
                this.queryGoodsDetail(shop_goods_ids)
            })
        } else {
            teamworkModel.recGoods = []
        }

        this.setData({
            id,
        })
    },
    onShow: function () {
        let goodsNum = teamworkModel.recGoods.length
        this.setData({ goodsNum })
    },
    // 获取商品详情
    queryGoodsDetail: function (ids) {
        if (ids.length == 0) {
            teamworkModel.recGoods = []
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
                let list = res.lists.map((item) => ({
                    id: item.id,
                    title: item.goods_title,
                    img: item.goods_img,
                    price: item.price,
                    commission: item.commission,
                    display_sales: item.real_sales,
                    status: 2,
                }))
                teamworkModel.recGoods = list
                console.log('输出 ~ res queryGoodsDetail', res)
            })
            .catch((err) => {})
    },
    onPop: function (e) {
        let that = this
        let id = this.data.id
        let is_draft = this.data.is_draft
        let limit_num = this.data.limit_num
        // 编辑时 直接返回
        if (id && is_draft == 2) {
            wx.navigateBack({
                delta: 1,
            })
            return
        }

        // 生成提交参数
        let params = {
            title: this.data.title,
            start_time: this.data.start_time,
            end_time: this.data.end_time,
            limit_num: limit_num === '' ? '' : Number(limit_num),
            type: Number(this.data.type),
            course_price: Number(this.data.course_price),
            poster_link: this.data.poster_link,
            introduction: this.data.introduction,
        }
        // 生成报名条件

        let type = this.data.type
        let typeFree = this.data.typeFree
        let typePay = this.data.typePay
        let comment = this.data.comment
        let back_money = this.data.back_money
        if (type == 1) {
            if (typeFree == 11) {
                params['comment'] = comment
                params['type'] = 11
            }
        }
        if (type == 2) {
            if (typePay == 21) {
                params['comment'] = comment
                params['type'] = 21
                params['back_money'] = tool.numberMul(back_money, 100)
            } else if (typePay == 22) {
                params['type'] = 22
                params['back_money'] = tool.numberMul(back_money, 100)
            }
        }
        // 格式化时间
        params['start_time'] = params['start_time'] ? params['start_time'] + ' 00:00:00' : ''
        params['end_time'] = params['end_time'] ? params['end_time'] + ' 23:59:59' : ''
        // 格式化金额
        params['course_price'] = params['course_price'] ? tool.numberMul(params['course_price'], 100) : ''
        // 编辑草稿时直接保存
        if (id && is_draft == 1) {
            params['is_draft'] = 1
            wx.showModal({
                title: '',
                content: '将此次草稿编辑保存？',
                confirmText: '保存',
                cancelText: '不保存',
                success(res) {
                    if (res.confirm) {
                        params['id'] = id
                        teamworkModel.updateCourseDetail(params).then((res) => {
                            wx.showToast({
                                title: '草稿保存成功',
                                icon: 'none',
                                duration: 2000,
                            })
                            that.post({
                                eventName: 'getTeamworkIndexRefresh',
                                eventParams: '',
                            })
                            setTimeout(() => {
                                wx.navigateBack({
                                    delta: 1,
                                })
                            }, 300)
                        })
                    } else if (res.cancel) {
                        wx.navigateBack({
                            delta: 1,
                        })
                    }
                },
            })
            return
        }
        // 验证是否有编辑过数据
        let needSave = false
        for (let key in params) {
            if (params[key]) {
                needSave = true
                break
            }
        }

        // 创建时保存草稿
        if (needSave) {
            params['shop_goods_ids'] = teamworkModel.recGoods.map((item) => item.id)

            wx.showModal({
                title: '',
                content: '将此次编辑保留草稿箱？',
                confirmText: '保留',
                cancelText: '不保留',
                success(res) {
                    if (res.confirm) {
                        teamworkModel.creatCourse(params).then((res) => {
                            wx.showToast({
                                title: '草稿保存成功',
                                icon: 'none',
                                duration: 2000,
                            })
                            that.post({
                                eventName: 'getTeamworkIndexActive',
                                eventParams: '1',
                            })
                            that.post({
                                eventName: 'getTeamworkIndexRefresh',
                                eventParams: '',
                            })
                            setTimeout(() => {
                                wx.navigateBack({
                                    delta: 1,
                                })
                            }, 300)
                        })
                    } else if (res.cancel) {
                        wx.navigateBack({
                            delta: 1,
                        })
                    }
                },
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
    // 选择模式 一级
    checkMode(e) {
        let key = e.target.dataset.key
        this.setData({
            type: key,
        })
    },
    // 选择模式 免费 二级
    checkModeFree(e) {
        let key = e.target.dataset.key
        this.setData({
            typeFree: key,
        })
    },
    // 选择模式 付费 二级
    checkModePay(e) {
        let key = e.target.dataset.key
        this.setData({
            typePay: key,
        })
    },
    // 选择开始时间
    openStartDate: function () {
        this.setData({
            picker: 'start',
            showDatePicker: true,
            currentDate: new Date(this.data.start_time || this.data.minDate).getTime(),
        })
    },
    // 选择结束时间
    openEndDate: function () {
        this.setData({
            picker: 'end',
            showDatePicker: true,
            currentDate: new Date(this.data.end_time || this.data.minDate).getTime(),
        })
    },
    /**
     * 取消时间选择
     */
    handleOnCancel: function () {
        this.setData({
            showDatePicker: false,
        })
    },
    /**
     * 确定单个日期选择
     */
    handleOnConfirm: function (e) {
        let time = e.detail
        if (this.data.picker === 'start') {
            let startDateStr = new Date(time).format('yyyy-MM-dd')
            this.setData({
                showDatePicker: false,
                start_time: startDateStr,
                currentDate: '',
            })
        } else if (this.data.picker === 'end') {
            let endDateStr = new Date(time).format('yyyy-MM-dd')
            this.setData({
                showDatePicker: false,
                end_time: endDateStr,
                currentDate: '',
            })
        }
    },
    // 图片上传
    afterRead(event) {
        wx.showLoading({
            title: '上传中',
        })
        const file = event.detail.file
        let that = this
        // util.uploadFile(file.path)
        //     .then((res) => {
        //         let result = JSON.parse(res)
        //         wx.hideLoading()
        //         if (result.code == 200) {
        //             this.setData({
        //                 poster_link: result.data.file_url,
        //             })
        //         } else {
        //             wx.showToast({
        //                 title: '图片上传失败',
        //                 icon: 'none',
        //                 duration: 2000,
        //             })
        //         }
        //     })
        //     .catch((err) => {
        //         // reject(err)
        //         wx.hideLoading()
        //     })
        upyun.upload(file.path, 80)
            .then((result) => {
                console.log('输出 ~ result', result)
                wx.hideLoading()
                if (result.code == 200) {
                    this.setData({
                        poster_link: result.data.file_url,
                    })
                } else {
                    wx.showToast({
                        title: '图片上传失败',
                        icon: 'none',
                        duration: 2000,
                    })
                }
            }).catch((err) => {
            console.log(err)
            wx.hideLoading()
        })
    },

    // 跳转团作介绍
    gotoDesc() {
        teamworkModel.introduction = this.data.introduction
        wx.navigateTo({
            url: `/packageTeamwork/introduction/introduction`,
        })
    },
    // 跳转团作推荐商品
    gotoRec() {
        wx.navigateTo({
            url: `/packageTeamwork/recommend/recommend?id=${this.data.id}`,
        })
    },
    closeTip() {
        this.setData({
            tipShow: false,
        })
    },
    openTip() {
        let type = this.data.type
        let typeFree = this.data.typeFree
        let typePay = this.data.typePay
        if ((type == 1 && typeFree) || (type == 2 && typePay)) {
            this.setData({
                tipShow: true,
            })
        }
    },
    // 删除团作
    deleteTeamwork() {
        let that = this
        wx.showModal({
            title: '',
            content: '是否删除草稿',
            confirmText: '删除',
            cancelText: '不删除',
            success(res) {
                if (res.confirm) {
                    let id = that.data.id
                    teamworkModel.deleteCourse(id).then((res) => {
                        wx.showToast({
                            title: '删除成功',
                            icon: 'none',
                            duration: 2000,
                        })
                        that.post({
                            eventName: 'getTeamworkIndexRefresh',
                            eventParams: '',
                        })
                        setTimeout(() => {
                            wx.navigateBack({
                                delta: 1,
                            })
                        }, 300)
                    })
                } else if (res.cancel) {
                }
            },
        })
    },
    // 草稿预览
    previewTeamwork() {
        let id = this.data.id
        let limit_num = this.data.limit_num

        let params = {
            title: this.data.title,
            start_time: this.data.start_time,
            end_time: this.data.end_time,
            limit_num: limit_num === '' ? '' : Number(limit_num),
            type: Number(this.data.type),
            course_price: Number(this.data.course_price),
            poster_link: this.data.poster_link,
            introduction: this.data.introduction,
            is_draft: 1,
        }
        let mapping = {
            title: '团作名称',
            start_time: '课程开始时间',
            end_time: '课程结束时间',
            limit_num: '报名限额',
            type: '团作模式',
            course_price: '金额',
            poster_link: '海报',
            introduction: '团作介绍',
        }
        let errorList = []
        // 根据类型 哦按段是否需要价格字段
        if (params.type == 1) {
            delete params.course_price
        }

        // 验证数据
        for (let key in params) {
            if (!params[key] && key != 'limit_num') {
                errorList.push(key)
            }
        }
        if (errorList.length > 0) {
            wx.showToast({
                title: '请填写' + mapping[errorList[0]] + '后再预览',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        // 生成并验证报名条件
        var pattern_course_price = /(^[1-9](\d+)?(\.\d{1,2})?$)|(^\d\.\d{1,2}$)/

        let type = this.data.type
        let typeFree = this.data.typeFree
        let typePay = this.data.typePay
        let comment = this.data.comment
        let back_money = this.data.back_money
        if (type == 1) {
            if (!typeFree) {
                wx.showToast({
                    title: '请选择是否需要凭证',
                    icon: 'none',
                    duration: 2000,
                })
                return
            }
            if (typeFree == 11) {
                params['comment'] = comment
                params['type'] = 11
            }
        }
        if (type == 2) {
            if (!typePay) {
                wx.showToast({
                    title: '请选择付费模式',
                    icon: 'none',
                    duration: 2000,
                })
                return
            }
            if (typePay == 21) {
                let verify_back_money = pattern_course_price.test(back_money)
                if (!verify_back_money) {
                    wx.showToast({
                        title: '请填写正确金额',
                        icon: 'none',
                        duration: 2000,
                    })
                    return
                }
                params['comment'] = comment
                params['type'] = 21
                params['back_money'] = tool.numberMul(back_money, 100)
            } else if (typePay == 22) {
                let verify_back_money = pattern_course_price.test(back_money)
                if (!verify_back_money) {
                    wx.showToast({
                        title: '请填写正确金额',
                        icon: 'none',
                        duration: 2000,
                    })
                    return
                }
                params['type'] = 22
                params['back_money'] = tool.numberMul(back_money, 100)
            }
        }
        // 格式化金额
        params['course_price'] = params['course_price'] ? tool.numberMul(params['course_price'], 100) : ''
        // 预览前先保存编辑
        params['id'] = id
        teamworkModel.updateCourseDetail(params).then((res) => {
            wx.navigateTo({
                url: `/packageTeamwork/teamworkDetail/teamworkDetail?id=${id}`,
            })
        })
    },
    // 新建/编辑 团作/草稿
    creatTeamwork() {
        let that = this
        let id = this.data.id
        let is_draft = this.data.is_draft
        let limit_num = this.data.limit_num
        let params = {
            title: this.data.title,
            start_time: this.data.start_time,
            end_time: this.data.end_time,
            limit_num: limit_num === '' ? '' : Number(limit_num),
            type: Number(this.data.type),
            course_price: Number(this.data.course_price),
            poster_link: this.data.poster_link,
            introduction: this.data.introduction,
            is_draft: 2,
        }
        let mapping = {
            title: '团作名称',
            start_time: '课程开始时间',
            end_time: '课程结束时间',
            limit_num: '报名限额',
            type: '团作模式',
            course_price: '金额',
            poster_link: '海报',
            introduction: '团作介绍',
        }
        let errorList = []
        // 根据类型 哦按段是否需要价格字段
        if (params.type == 1) {
            delete params.course_price
        }

        // 验证数据全部不为空
        for (let key in params) {
            if (!params[key] && key != 'limit_num') {
                errorList.push(key)
            }
        }
        if (errorList.length > 0) {
            wx.showToast({
                title: '请填写' + mapping[errorList[0]],
                icon: 'none',
                duration: 2000,
            })
            return
        }

        // 个别验证 金额
        // 正则 大于0 最多两位小数
        var pattern_course_price = /(^[1-9](\d+)?(\.\d{1,2})?$)|(^\d\.\d{1,2}$)/
        let verify_course_price = pattern_course_price.test(params['course_price'])
        if (!verify_course_price && params['type'] != 1) {
            wx.showToast({
                title: '请填写正确金额',
                icon: 'none',
                duration: 2000,
            })
            return
        }

        // 个别验证 报名限额 可以为空
        if (params['limit_num'] !== '') {
            var pattern_limit_num = /^[1-9]\d*$/
            let verify_limit_num = pattern_limit_num.test(params['limit_num'])
            if (!verify_limit_num) {
                wx.showToast({
                    title: '请填写正确报名限额',
                    icon: 'none',
                    duration: 2000,
                })
                return
            }
        }

        // 生成并验证报名条件
        let type = this.data.type
        let typeFree = this.data.typeFree
        let typePay = this.data.typePay
        let comment = this.data.comment
        let back_money = this.data.back_money
        if (type == 1) {
            if (!typeFree) {
                wx.showToast({
                    title: '请选择是否需要凭证',
                    icon: 'none',
                    duration: 2000,
                })
                return
            }
            if (typeFree == 11) {
                params['comment'] = comment
                params['type'] = 11
            }
        }
        if (type == 2) {
            if (!typePay) {
                wx.showToast({
                    title: '请选择付费模式',
                    icon: 'none',
                    duration: 2000,
                })
                return
            }
            if (typePay == 21) {
                let verify_back_money = pattern_course_price.test(back_money)
                if (!verify_back_money) {
                    wx.showToast({
                        title: '请填写正确金额',
                        icon: 'none',
                        duration: 2000,
                    })
                    return
                }
                params['comment'] = comment
                params['type'] = 21
                params['back_money'] = tool.numberMul(back_money, 100)
            } else if (typePay == 22) {
                let verify_back_money = pattern_course_price.test(back_money)
                if (!verify_back_money) {
                    wx.showToast({
                        title: '请填写正确金额',
                        icon: 'none',
                        duration: 2000,
                    })
                    return
                }
                params['type'] = 22
                params['back_money'] = tool.numberMul(back_money, 100)
            }
        }

        // 格式化时间
        params['start_time'] = params['start_time'] + ' 00:00:00'
        params['end_time'] = params['end_time'] + ' 23:59:59'
        // 格式化金额
        params['course_price'] = params['course_price'] ? tool.numberMul(params['course_price'], 100) : ''
        // 验证返现金额大小
        if ((params['type'] == 21 || params['type'] == 22) && params['back_money'] >= params['course_price']) {
            wx.showToast({
                title: '返现金额不能高于或等于团作价格',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        if (!id) {
            params['shop_goods_ids'] = teamworkModel.recGoods.map((item) => item.id)
            // 发布团作-发布
            teamworkModel.creatCourse(params).then((res) => {
                wx.showToast({
                    title: '创建成功',
                    icon: 'none',
                    duration: 2000,
                })
                setTimeout(() => {
                    that.post({
                        eventName: 'getTeamworkIndexActive',
                        eventParams: '2',
                    })
                    that.post({
                        eventName: 'getTeamworkIndexRefresh',
                        eventParams: '',
                    })
                    wx.navigateBack({
                        delta: 1,
                    })
                }, 300)
            })
        } else {
            // 草稿-发布 已发布编辑-发布(保存)
            params['id'] = id
            teamworkModel.updateCourseDetail(params).then((res) => {
                wx.showToast({
                    title: (is_draft == 2 ? '编辑' : '发布') + '成功',
                    icon: 'none',
                    duration: 2000,
                })
                setTimeout(() => {
                    that.post({
                        eventName: 'getTeamworkIndexActive',
                        eventParams: '2',
                    })
                    that.post({
                        eventName: 'getTeamworkIndexRefresh',
                        eventParams: '',
                    })
                    wx.navigateBack({
                        delta: 1,
                    })
                }, 300)
            })
        }
    },
    getTetx(e) {
        console.log('输出 ~ getTetx', e)
        this.setData({
            comment: e.detail,
        })
    },

    openTextarea(event) {
        this.setData({
            defaultText: this.data.comment,
        })
        this.selectComponent('#textarea').show()
    },
})
