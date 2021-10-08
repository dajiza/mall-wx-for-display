import screenConfig from '../../utils/screen_util'
const orderModel = require('../../models/order')
const userShopInfoModel = require('../../models/userShopInfo')
const pointsModel = require('../../models/points')
const loginWatch = require('../../utils/loginWatch')
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
//获取应用实例
const app = getApp()

App.Page({
    data: {
        userInfo: {
            nick_name: '',
            avatar_url: '',
            discount_value: 0,
        },
        shopInfo: {
            shop_name: '',
        },
        safeAreaInsetBottom: safeAreaInsetBottom,
        agentTopHeight: '',
        topHeight: '',
        orderStatus: [
            {
                name: '待付款',
                status: '1',
                img_url: '../../assets/images/order-pending-payment.png',
                count: 0,
            },
            {
                name: '待发货',
                status: '2',
                img_url: '../../assets/images/order-delivered.png',
                count: 0,
            },
            {
                name: '待收货',
                status: '3',
                img_url: '../../assets/images/order-received.png',
                count: 0,
            },
            {
                name: '待评价',
                status: '4',
                img_url: '../../assets/images/myComment.png',
                count: 0,
            },
            {
                name: '全部订单',
                status: '0',
                img_url: '../../assets/images/order-all.png',
                count: 0,
            },
        ],
        isShowShare: false,
        isAdmin: false, // 是否代理商
        TodayPaidNum: 0, // 今日付款笔数
        ThisMonthMoneyExpected: 0, //当月预估收益
        TotalMoney: 0, // 累计结算收益
        TodayMoneyExpected: 0, // 今日收益
        isPullDown: false,
        is_member: false,
        statusBarHeight: 0,
        agentOrderCount: 0,
        pointsNotSandCount: 0, // 积分商城 待发货订单数
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function () {
        let agentTopHeight = '498rpx'
        let topHeight = '448rpx'
        topHeight = (214 + app.globalData.statusBarHeight) * 2 + 'rpx'
        agentTopHeight = (249 + app.globalData.statusBarHeight) * 2 + 'rpx'
        const isShopAdmin = wx.getStorageSync('isShopAdmin') || 0
        this.setData({
            isAdmin: Number(isShopAdmin) === 1,
            agentTopHeight: agentTopHeight,
            topHeight,
            statusBarHeight: app.globalData.statusBarHeight,
        })

        // console.log('isShopAdmin', isShopAdmin);
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.getTabBar().init()
        loginWatch.observer(
            this,
            () => {
                this.getUserInfo()
                // if (Number(isShopAdmin) === 1) {
                //     this.getMyIncome()
                // }
            },
            '/pages/my/my',
            true
        )
        const isShopAdmin = wx.getStorageSync('isShopAdmin') || 0
        console.log('isShopAdmin', isShopAdmin)
        if (Number(isShopAdmin) === 1) {
            // this.getAgentOrderCount()
            // 获取未发货 积分兑换订单数量
            this.updateNotSandNum()
        } else {
            this.getUserOrderCount()
        }
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        this.setData({
            isPullDown: true,
        })
        this.getUserInfo()
        // if (Number(isShopAdmin) === 1) {
        //     this.getMyIncome()
        // }
    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // },

    /**
     * 网络请求，获取用户信息数据
     */
    getUserInfo() {
        // const _this = this
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                let _obj = res['user_info'],
                    _shopInfo = res['shop_info']
                this.setData({
                    userInfo: _obj,
                    shopInfo: _shopInfo,
                })
            })
            .then((res) => {
                const isShopAdmin = wx.getStorageSync('isShopAdmin') || 0
                if (Number(isShopAdmin) === 1) {
                    this.getMyIncome()
                } else {
                    wx.stopPullDownRefresh()
                }
            })
            .catch((err) => {
                wx.stopPullDownRefresh()
            })
    },

    /**
     * 网络请求，获取我的收益
     */
    getMyIncome() {
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        wx.showLoading({
            title: '加载中...',
        })
        const _this = this
        const params = {}
        userShopInfoModel
            .queryMyIncome(params)
            .then((res) => {
                if (wx.showLoading) {
                    //隐藏loading 提示框
                    wx.hideLoading()
                    //隐藏导航条加载动画
                    wx.hideNavigationBarLoading()
                    if (_this.data.isPullDown) {
                        //停止下拉刷新
                        wx.stopPullDownRefresh()
                    }
                }
                _this.setData({
                    TodayPaidNum: res.today_paid_num || 0, // 今日付款笔数
                    ThisMonthMoneyExpected: res.this_month_money_expected || 0, //当月预估收益
                    TotalMoney: res.total_money || 0, // 累计结算收益
                    TodayMoneyExpected: res.today_money_expected || 0, // 今日收益
                })
            })
            .catch((err) => {
                if (wx.showLoading) {
                    //隐藏loading 提示框
                    wx.hideLoading()
                    //隐藏导航条加载动画
                    wx.hideNavigationBarLoading()
                    if (_this.data.isPullDown) {
                        //停止下拉刷新
                        wx.stopPullDownRefresh()
                    }
                }
            })
    },

    /**
     * 跳转到我的订单页面
     */
    goMyOrder(res) {
        const _status = res.currentTarget.dataset.status
        if (_status == 4) {
            this.handleCommentDetail()
        } else {
            orderModel.backOrderList = false
            wx.navigateTo({
                url: '../myOrder/myOrder' + '?statusIndex=' + _status,
                success: function (res) {
                    // 通过eventChannel向被打开页面传送数据
                    res.eventChannel.emit('acceptDataFromOpenerPage', {
                        statusIndex: _status,
                    })
                },
            })
        }
    },

    /**
     * 跳转到地址管理页面
     */
    handleGoAddress() {
        wx.navigateTo({
            url: '../address/address',
        })
    },

    /**
     * 跳转到设置页面
     */
    handleGoSetting() {
        wx.navigateTo({
            url: '../mySetting/mySetting',
        })
    },

    /**
     * 商品管理-跳转到商品管理页面
     */
    goGoodsManagement() {
        wx.navigateTo({
            url: '/packageAgent/goodsManager/goodsManager',
        })
    },
    /**
     * 钱包 代理
     */
    gotoWallet() {
        wx.navigateTo({
            url: '/packageAgent/wallet/wallet',
        })
    },
    /**
     * 钱包 用户
     */
    gotoWalletCustomer() {
        wx.navigateTo({
            url: '/packageMainSecondary/walletPersonal/walletPersonal',
        })
    },
    /**
     * 店铺信息
     */
    shopInfoBtn() {
        wx.navigateTo({
            url: '/packageAgent/shopInfo/shopInfo',
        })
    },

    /**
     * 待完成功能
     */
    clickUnfinishedBtn() {
        wx.showToast({
            title: '抱歉，功能暂未开放～',
            icon: 'none',
            duration: 2000,
        })
    },
    /**
     * 重新授权登录
     */
    clickLoginAgainBtn() {
        wx.navigateTo({
            url: '/pages/login/login?fromUser=' + 1,
        })
    },

    /**
     * 分享店铺
     */
    shareShop() {
        let that = this
        this.post({
            eventName: 'preShareOnLoad',
            eventParams: {
                page: 'pages/index/index',
                scene: 'index',
            },
            isSticky: true,
        })
        wx.navigateTo({
            url: '/pages/share/share?type=1',
            success: function (e) {
                that.onCloseShare()
            },
        })
    },

    // 分享关闭
    onCloseShare(event) {
        this.setData({
            isShowShare: false,
        })
    },

    /**
     * 商品上架
     */
    goodsUp() {
        wx.navigateTo({
            url: '/packageAgent/putGoodsOnSale/putGoodsOnSale',
        })
    },
    /**
     * 销售统计
     */
    handleSalesStatistics() {
        wx.navigateTo({
            url: '/packageAgent/statistics/statistics',
        })
    },
    /**
     * 收益明细
     */
    goIncomeDetails() {
        wx.navigateTo({
            url: '/packageAgent/incomeDetails/incomeDetails',
        })
    },

    /**
     * 客户管理
     */
    goCustomerManagement() {
        wx.navigateTo({
            url: '/packageAgent/customerManagement/customerManagement?type=1',
        })
    },
    /**
     * 业绩排行
     */
    handlePerformanceRanking() {
        wx.navigateTo({
            url: '/packageAgent/customerManagement/customerManagement?type=2',
        })
    },
    /**
     * 优惠券
     */
    gotoCoupon() {
        wx.navigateTo({
            url: '/pages/couponsList/couponsList',
        })
    },
    /**
     * 评价
     */
    handleCommentDetail() {
        wx.navigateTo({
            url: '/packageMainSecondary/comment/commentList',
        })
    },
    /**
     * 收藏
     */
    handleFavorites() {
        wx.navigateTo({
            url: '/packageMainSecondary/favorites/favorites',
        })
    },
    handleCoupon() {},
    /**
     * 我的收藏
     */
    handleGoMyCollection() {},
    /**
     * 工具管理
     */
    handleTool() {
        wx.navigateTo({
            url: '/packageAgent/tool/tool',
        })
    },

    // 请求普通用户订单数
    getUserOrderCount() {
        //在当前页面显示导航条加载动画
        const _this = this
        const params = {}
        orderModel
            .queryUserOrderCount(params)
            .then((res) => {
                console.log('res', res)
                let _arr = this.data.orderStatus
                _arr.forEach((ev) => {
                    if (ev.status == 1) {
                        // 待付款
                        ev['count'] = res.count_status_new
                    } else if (ev.status == 2) {
                        // 待发货
                        ev['count'] = res.count_status_paid + res.count_status_pending
                    } else if (ev.status == 3) {
                        // 待收货
                        ev['count'] = res.count_status_sand
                    } else if (ev.status == 4) {
                        // 待评价
                        ev['count'] = res.count_un_comment
                    }
                })
                console.log('_arr=====434===', _arr)
                this.setData({
                    orderStatus: _arr,
                })
            })
            .catch((err) => {})
    },
    // 未发货积分订单数量
    updateNotSandNum: function () {
        pointsModel
            .pointsOrderListNotSandNum()
            .then((res) => {
                //更新未发货的订单数
                console.log('updateNotSandNum', res)
                this.setData({
                    pointsNotSandCount: res,
                })
            })
            .catch((err) => {
                console.log(err)
            })
    },
    // 请求代理商订单数
    getAgentOrderCount() {
        const _this = this
        const params = {}
        orderModel
            .queryAgentOrderCount(params)
            .then((res) => {
                console.log('res', res)
            })
            .catch((err) => {})
    },
    // 跳转到积分商城
    goPointMall() {
        const is_agent = wx.getStorageSync('isShopAdmin') || 0
        console.log('is_agent', is_agent)
        if (Number(is_agent) == 1) {
            wx.navigateTo({
                url: '/packagePoints/pointsShopAgent/pointsShopAgent',
            })
        } else {
            wx.navigateTo({
                url: '/packagePoints/pointsIndex/pointsIndex',
            })
        }
    },
})
