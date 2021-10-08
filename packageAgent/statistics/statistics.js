import screenConfig from '../../utils/screen_util'
import moment from 'moment'
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const navigateBarHeight = screenConfig.getSafeAreaTopPadding() + 46

const statisticsModel = require('../../models/statistics')

Page({
    data: {
        safeAreaInsetBottom: safeAreaInsetBottom,
        headerBoxHeight: navigateBarHeight + screenConfig.getPX(224),
        headerBoxHeightPadding: navigateBarHeight + screenConfig.getPX(268),
        minDate: new Date().getTime() - 1000 * 60 * 60 * 24 * 31,
        maxDate: new Date().getTime(),
        currentDate: new Date().getTime(),
        formatter(type, value) {
            if (type === 'year') {
                return `${value}年`
            } else if (type === 'month') {
                return `${value}月`
            }
            return value
        },

        showDatetPicker: false,
        pickerTitle: '',
        picker: '',
        startDateStr: new Date().format('yyyy-MM-dd'),
        endDateStr: new Date().format('yyyy-MM-dd'),

        sum: {
            num: 0,
            money: 0,
        },
        goodsList: [],

        loaded: false,
        page: 1,
        total: 0,
        isAllLoaded: false,
        bottomLoadingShow: false,
    },
    onLoad: function (options) {
        this.getGoodsList()
    },
    onPullDownRefresh: function () {
        if (this.data.showDatetPicker) {
            return
        }
        this.getGoodsList(false, false)
    },
    onReachBottom: function () {
        console.log('onReachBottom')
        if (this.data.goodsList.length >= this.data.total) {
            return
        }
        this.getGoodsList(false, true)
    },
    getGoodsList: function (init = true, loadMore = false) {
        let page = this.data.page
        if (!loadMore) {
            page = 1
            wx.showLoading({
                title: !init ? '刷新中...' : '加载中...',
            })
        } else {
            if (this.data.goodsList.length >= this.data.total) {
                return
            }
            this.setData({
                bottomLoadingShow: true,
            })
        }
        let startDate = this.data.startDateStr + ' 00:00:00'
        let endDate = this.data.endDateStr + ' 23:59:59'

        if (moment(this.data.startDateStr) > moment(this.data.endDateStr)) {
            wx.showToast({
                title: '请选择正确时间',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        statisticsModel
            .agenOrderReport({
                page: page,
                startDate: startDate,
                endDate: endDate,
            })
            // .then(res => {
            //   let result = []
            //   if (page < 3) {
            //     for (let index = 0; index < 10; index++) {
            //       result.push({
            //         "goods_img": "https://storehouse-upyun.chuanshui.cn/2020-12-11/files/7xv3BemZhRcv04bn.png",
            //         "goods_name": "其它3",
            //         "num": 5,
            //         "money": 5
            //       })
            //     }
            //   }
            //   return {
            //     total: 20,
            //     pages: page,
            //     lists: result,
            //     sum: {
            //       num: 100,
            //       money: 100
            //     }
            //   }
            // })
            .then((res) => {
                console.log(res)
                if (!loadMore) {
                    wx.hideLoading()
                    page++
                    let isAllLoaded = false
                    if (res.lists == null) {
                        this.setData({
                            goodsList: [],
                        })
                    }
                    if (res.lists.length <= res.total) {
                        //已获取全部列表数据
                        isAllLoaded = true
                    }
                    this.setData(
                        {
                            goodsList: res.lists,
                            page: page,
                            total: res.total,
                            isAllLoaded: isAllLoaded,
                            sum: res.sum,
                            loaded: true,
                        },
                        () => {
                            if (!init) {
                                wx.stopPullDownRefresh()
                            }
                        }
                    )
                } else {
                    let diffData = {}
                    if (res.lists) {
                        let offset = this.data.goodsList.length
                        res.lists.forEach((value, index) => {
                            let key = 'goodsList[' + (offset + index) + ']'
                            diffData[key] = value
                        })
                    }
                    page++
                    let isAllLoaded = false
                    if (this.data.goodsList.length + res.lists.length >= res.total) {
                        //已加载全部数据
                        isAllLoaded = true
                    }
                    this.setData({
                        ...diffData,
                        page: page,
                        isAllLoaded: isAllLoaded,
                        bottomLoadingShow: false,
                        loaded: true,
                    })
                }
            })
            .catch((err) => {
                if (!loadMore) {
                    wx.hideLoading()
                    this.setData(
                        {
                            loaded: true,
                        },
                        () => {
                            if (!init && !loadMore) {
                                wx.stopPullDownRefresh()
                            }
                        }
                    )
                }
            })
    },
    handleDatePick: function (e) {
        let picker = e.currentTarget.dataset.picker
        let pickerTitle = ''
        if (picker === 'start') {
            pickerTitle = '开始时间'
        } else if (picker === 'end') {
            pickerTitle = '结束时间'
        }
        this.setData({
            showDatetPicker: true,
            pickerTitle: pickerTitle,
            picker: picker,
        })
    },
    handleSearch: function () {
        this.getGoodsList()
    },
    handleOnCancel: function () {
        this.setData({
            showDatetPicker: false,
        })
    },
    handleOnConfirm: function (e) {
        console.log(e)
        let time = e.detail
        if (this.data.picker === 'start') {
            let startDateStr = new Date(time).format('yyyy-MM-dd')
            this.setData({
                showDatetPicker: false,
                startDateStr: startDateStr,
            })
        } else if (this.data.picker === 'end') {
            let endDateStr = new Date(time).format('yyyy-MM-dd')
            this.setData({
                showDatetPicker: false,
                endDateStr: endDateStr,
            })
        }
    },
    ClickBack() {
        if (this.data.searchModel) {
            this.onSearchCancel()
            return
        }
        let pages = getCurrentPages()
        if (pages.length === 1) {
            wx.switchTab({
                url: '../index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
    preventTouchMove: function () {},
})
