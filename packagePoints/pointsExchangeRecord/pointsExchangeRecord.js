import screenConfig from '../../utils/screen_util'
import moment from 'moment'

const pointsModel = require('../../models/points')
const userShopInfoModel = require('../../models/userShopInfo')

const app = getApp()
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)

Page({
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        safeAreaInsetBottom: safeAreaInsetBottom,
        activeIndex: 0,
        subActiveIndexs: 0,
        tabGoodsList: [],
        tabCouponList: [],
        notShippedCount: 0,
        initialize: [false, false],
        loaded: false,
        pages: [1, 1],
        listTotals: [10, 10],
        bottomLoadingShow: [false, false],
        isAllLoaded: [false, false],
        discount_value: 0, //判断是否是会员
    },
    onLoad: function (options) {
        //默认加载商品分页
        this.loadData((res) => {
            let initializeKey = 'initialize[0]'
            this.setData({
                tabGoodsList: res,
                notShippedCount: res.length,
                [initializeKey]: true,
                loaded: true,
            })
        })
        this.getUserInfo()
    },

    onPullDownRefresh: function () {
        this.loadData((res) => {
            wx.stopPullDownRefresh()
            this.updateList(res)
        })
    },

    onReachBottom: function () {
        let activeIndex = this.data.activeIndex
        let total = this.data.listTotals[activeIndex]
        if (activeIndex == 0) {
            if (this.data.tabGoodsList.length >= total) {
                //已加载全部的列表
                return
            }
        } else {
            if (this.data.tabCouponList.length >= total) {
                //已加载全部的列表
                return
            }
        }
        this.loadData(
            (res) => {
                this.updateList(res, true)
            },
            true,
            false
        )
    },
    onTabChange: function (e) {
        let index = e.detail.index
        this.setData(
            {
                loaded: this.data.initialize[index],
                activeIndex: index,
            },
            () => {
                if (!this.data.initialize[index]) {
                    //该分页未加载过
                    this.loadData((res) => {
                        console.log('onTabChange tab:' + index)
                        let initializeKey = 'initialize[' + index + ']'
                        let diff = {}
                        if (index == 0) {
                            diff['tabGoodsList'] = res || []
                            if (this.data.subActiveIndexs == 0) {
                                //加载的是未发货列表
                                diff['notShippedCount'] = diff['tabGoodsList'].length
                            }
                        } else {
                            diff['tabCouponList'] = res || []
                        }
                        this.setData({
                            ...diff,
                            loaded: true,
                            [initializeKey]: true,
                        })
                    })
                }
            }
        )
    },
    onGoodsTabChange: function (e) {
        let index = e.currentTarget.dataset.index
        if (index == this.data.subActiveIndexs) {
            return
        }
        this.setData(
            {
                tabGoodsList: [],
                loaded: false,
                subActiveIndexs: index,
            },
            () => {
                //获取对应tab的列表数据
                this.loadData((res) => {
                    console.log('onGoodsTabChange tab:' + index)
                    this.setData({
                        tabGoodsList: res || [],
                        loaded: true,
                    })
                })
            }
        )
    },
    loadData: function (callback, loadMore = false, showLoading = true) {
        let activeIndex = this.data.activeIndex
        let subActiveIndex = this.data.subActiveIndexs
        let dataPromise = null

        //分页请求
        let page = this.data.pages[activeIndex]
        if (!loadMore) {
            page = 1
        }
        let pagesKey = 'pages[' + activeIndex + ']'
        let isAllLoadedKey = 'isAllLoaded[' + activeIndex + ']'
        let bottomLoadingShowKey = 'bottomLoadingShow[' + activeIndex + ']'
        let listTotalsKey = 'listTotals[' + activeIndex + ']'

        if (activeIndex == 0) {
            //获取商品分页相关数据
            let isSand = subActiveIndex == 0 ? 2 : 1
            dataPromise = pointsModel.pointsOrderListUser(page, isSand, 1).then((res) => {
                //UI数据适配
                let list = res.lists || []
                let newList = list.map((ev) => {
                    let exchangeSubjectJson = ev.exchange_subject_json || ''
                    let imgUrl = ''
                    let goodsName = ''
                    let goodsId = 0
                    if (exchangeSubjectJson.length > 0) {
                        let exchangeSubject = JSON.parse(exchangeSubjectJson)
                        goodsId = exchangeSubject.Id
                        imgUrl = exchangeSubject.Img
                        goodsName = exchangeSubject.Title
                    }
                    return {
                        id: ev.id,
                        imgUrl: imgUrl,
                        goodsId: goodsId,
                        goodsName: goodsName,
                        num: ev.num,
                        points: ev.price,
                        props: ev,
                        time: moment(ev.created_at).format('YYYY.MM.DD HH:mm'),
                    }
                })
                return {
                    list: newList,
                    total: res.total,
                }
            })
        } else {
            //获取优惠券分页相关数据
            dataPromise = pointsModel
                .pointsOrderListUser(page, 0, 2)
                .then((res) => {
                    //UI数据适配
                    let list = res.lists || []
                    let newList = list.map((ev) => {
                        let exchangeSubjectJson = ev.exchange_subject_json || ''
                        let couponAmount = 0
                        let withAmount = 0
                        let discount = 0
                        let type = 0
                        let useGoodsTypeStr = ''
                        let useGoodsType = 1
                        let valid = ''
                        if (exchangeSubjectJson.length > 0) {
                            let exchangeSubject = JSON.parse(exchangeSubjectJson)
                            couponAmount = exchangeSubject.CouponAmount || 0
                            withAmount = exchangeSubject.WithAmount || 0
                            discount = exchangeSubject.DiscountTop || 0
                            type = exchangeSubject.Type
                            useGoodsType = exchangeSubject.UseGoodsType
                            if (useGoodsType == 1) {
                                useGoodsTypeStr = '全场通用'
                            } else if (useGoodsType == 2) {
                                useGoodsTypeStr = '指定商品可用'
                            } else if (useGoodsType == 3) {
                                useGoodsTypeStr = '指定标签可用'
                            }
                            if (exchangeSubject.ValidType == 1) {
                                valid = '领取后' + exchangeSubject.ValidDays + '天内有效'
                            } else if (exchangeSubject.ValidType == 2) {
                                valid = moment(exchangeSubject.ValidStartTime).format('YYYY.MM.DD') + '-' + moment(exchangeSubject.ValidEndTime).format('YYYY.MM.DD')
                            }
                        }
                        return {
                            id: ev.id,
                            couponAmount: couponAmount,
                            withAmount: withAmount,
                            discount: discount,
                            type: type,
                            useGoodsTypeStr: useGoodsTypeStr,
                            useGoodsType: useGoodsType,
                            couponPoints: ev.price,
                            used: 0,
                            exchangeSubjectDetailId: ev.exchange_subject_detail_id || 0,
                            time: moment(ev.created_at).format('YYYY.MM.DD HH:mm'),
                            valid: valid,
                        }
                    })
                    return {
                        list: newList,
                        total: res.total,
                    }
                })
                .then((res) => {
                    //查询优惠券使用状态
                    let list = res.list
                    let total = res.total
                    if (list.length > 0) {
                        //兼容老数据，分离出有exchangeSubjectDetailId字段的数据，使用这些id查询状态
                        //老数据默认used=0
                        let detailMap = new Map()
                        let ids = []
                        list.forEach((element) => {
                            if (element.exchangeSubjectDetailId > 0) {
                                ids.push(element.exchangeSubjectDetailId)
                                detailMap.set(element.exchangeSubjectDetailId, element)
                            }
                        })
                        if (ids.length > 0) {
                            return pointsModel.myCouponList(ids).then((res) => {
                                let coupons = res.list
                                let nowTime = res.now_time
                                coupons.forEach((element) => {
                                    if (detailMap.has(element.id)) {
                                        let coupon = detailMap.get(element.id)
                                        if (element.status == 2) {
                                            //已使用
                                            coupon.used = 2
                                        } else if (element.status == 1) {
                                            let now = moment(nowTime).toDate().getTime()
                                            let end = moment(element.end_time).toDate().getTime()
                                            if (now > end) {
                                                //已过期
                                                coupon.used = 3
                                            } else {
                                                //未使用
                                                coupon.used = 1
                                            }
                                        }
                                    }
                                })
                                return {
                                    list: list,
                                    total: total,
                                }
                            })
                        }
                    }
                    return Promise.resolve({
                        list: list,
                        total: total,
                    })
                })
        }
        if (dataPromise != null) {
            this.setData({
                loaded: false,
            })
            if (showLoading) {
                if (!loadMore) {
                    //下拉刷新
                    wx.showLoading({
                        title: '加载中...',
                    })
                } else {
                    //上拉加载
                    this.setData({
                        [bottomLoadingShowKey]: true,
                    })
                }
            }
            dataPromise
                .then((res) => {
                    if (!loadMore) {
                        //下拉刷新，覆盖原始数据
                        if (showLoading) {
                            wx.hideLoading()
                        }
                        page++
                        let isAllLoaded = false
                        if (res.list.length <= res.total) {
                            //已获取全部列表数据
                            isAllLoaded = true
                        }
                        this.setData(
                            {
                                [pagesKey]: page,
                                [listTotalsKey]: res.total,
                                [isAllLoadedKey]: isAllLoaded,
                            },
                            () => {
                                if (!loadMore) {
                                    wx.stopPullDownRefresh()
                                }
                                //将数据抛出
                                callback(res.list, loadMore)
                            }
                        )
                    } else {
                        //上拉加载,追加数据
                        page++
                        let isAllLoaded = false
                        if (activeIndex == 0) {
                            isAllLoaded = this.data.tabGoodsList.length + res.list.length >= res.total
                        } else {
                            isAllLoaded = this.data.tabCouponList.length + res.list.length >= res.total
                        }
                        this.setData(
                            {
                                [pagesKey]: page,
                                [isAllLoadedKey]: isAllLoaded,
                                [bottomLoadingShowKey]: false,
                            },
                            () => {
                                //将数据抛出
                                callback(res.list, loadMore)
                            }
                        )
                    }
                })
                .catch((err) => {
                    console.log(err)
                    if (!loadMore) {
                        wx.hideLoading()
                        wx.stopPullDownRefresh()
                        this.setData({
                            loaded: true,
                        })
                    } else {
                        this.setData({
                            loaded: true,
                            [bottomLoadingShowKey]: false,
                        })
                    }
                })
        }
    },
    updateList: function (res, isLoadMore = false) {
        console.log(res)
        let activeIndex = this.data.activeIndex
        let subActiveIndex = this.data.subActiveIndexs
        let diff = {}
        if (activeIndex == 0) {
            if (isLoadMore) {
                //追加数据
                let offset = this.data.tabGoodsList.length
                res.forEach((value, index) => {
                    let key = 'tabGoodsList[' + (offset + index) + ']'
                    diff[key] = value
                })
            } else {
                diff['tabGoodsList'] = res
            }
            if (subActiveIndex == 0) {
                diff['notShippedCount'] = this.data.listTotals[activeIndex]
            }
        } else {
            if (isLoadMore) {
                //追加数据
                let offset = this.data.tabCouponList.length
                res.forEach((value, index) => {
                    let key = 'tabCouponList[' + (offset + index) + ']'
                    diff[key] = value
                })
            } else {
                diff['tabCouponList'] = res
            }
        }
        this.setData({
            ...diff,
            loaded: true,
        })
    },
    HandleClickItem: function (e) {
        let activeIndex = this.data.activeIndex
        if (activeIndex == 0) {
            let subActiveIndex = this.data.subActiveIndexs
            let index = e.currentTarget.dataset.index
            let order = this.data.tabGoodsList[index]

            let orderId = order.id
            let url = '/packagePoints/redeemOrderDetail/redeemOrderDetail?orderId=' + orderId + '&isSend=' + subActiveIndex
            let that = this
            wx.navigateTo({
                url: url,
                events: {
                    updateList: function () {
                        that.loadData(
                            (res) => {
                                that.updateList(res)
                            },
                            false,
                            false
                        )
                    },
                },
                success: function (res) {
                    let list = [
                        {
                            id: order.goodsId,
                            title: order.goodsName,
                            price: order.points,
                            num: order.num,
                            img: order.imgUrl,
                        },
                    ]
                    res.eventChannel.emit('goodsDetailObserver', {
                        list: list,
                        props: [order.props],
                    })
                },
            })
        }
    },
    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        wx.showLoading({
            title: '加载中...',
        })
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                this.setData({
                    discount_value: res.user_info.discount_value,
                })
                this.selectComponent('#tabs').setLine()

                wx.hideLoading()
            })

            .catch((err) => {
                wx.hideLoading()
            })
    },
    ClickBack() {
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
})
