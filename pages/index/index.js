import screenConfig from '../../utils/screen_util'

const config = require('../../config/config')
const searchListModel = require('../../models/searchList')
const activityModel = require('../../models/activity')
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const util = require('../../utils/util')

const app = getApp()

App.Page({
    data: {
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        navTitle: config.shopName,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        safeAreaInsetBottom: safeAreaInsetBottom,
        imgList: ['http://yanxuan.nosdn.127.net/ed50cbf7fab10b35f676e2451e112130.jpg'],
        duration: 500,
        indicatorDots: false,
        autoplay: false,
        goodsList: [],
        page: 1,
        limit: 20,
        is_all: false, // 已经是全部了哦
        isPullDown: false, // 上拉刷新操作
        bottomLoadingShow: false,
        isInvite: false, //判断是否从邀请进来,是的话toast显示领券情况
        bannerList: [],
        advList: [],
        showNewTip: false,
        ob: '', //曝光方法监听对象
        exposureList: [], //曝光商品id列表
        sort_top: 0,
        sort_price: 0, // 0 不排序 1 倒序 2 正序
        filterNavIndex: 1,
        newsGoodsList: [],
        priceGoodsList: [],
        new_is_all: false,
        price_is_all: false,
        sortBg: false,
        showTopBack:false,
    },
    // 不用于数据绑定的全局数据
    tempData: {
        listScrollTop: 0,
        hotScrollTop: 0,
        newScrollTop: 0,
        priceScrollTop: 0,
        hotList: [],
        newList: [],
        priceList: [],
        hotPage: 1,
        newPage: 1,
        pricePage: 1,
    },
    events: {
        // getSelectedAddress: function (address) {
        //     this.setData({
        //         defaultAddress: address,
        //     })
        //     this.queryFreight()
        // },
        getInviteCouponResult: function (res) {
            console.log('输出 ~ res', res)
            this.setData({
                isInvite: true,
            })
            // wx.showLoading({
            //     title: '领券中',
            // })
            wx.showToast({
                title: res.data ? '领取成功,可在“我的-优惠券包”内查看' : res.msg,
                icon: 'none',
                duration: 3000,
            })
        },
        scrollToTop: function () {
            wx.pageScrollTo({
                scrollTop: 0
            })
        },
    },
    onLoad: function (options) {
        const nav_height_rpx = screenConfig.getRPX(Number(app.globalData.statusBarHeight) + 46)
        console.log('nav_height_rpx', nav_height_rpx)
        // 获取状态 是否第一次打开
        let showNewTip = wx.getStorageSync('hideenNewTip') ? false : true
        // let sceneValue = wx.getLaunchOptionsSync()
        // console.log('输出 ~ sceneValue', sceneValue.scene)
        // if(sceneValue.scene==1001){
        //     showNewTip=false
        // }
        this.setData({
            sort_top: nav_height_rpx,
            showNewTip,
        })
        wx.setStorageSync('hideenNewTip', true)
        // 获取商品列表
        this.getData(1)
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.getTabBar().init()
        this.queryAdv()
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.selectComponent('#homeModule').loadData()
        //调用刷新时将执行的方法
        let is_all = this.data.is_all,
            new_is_all = this.data.new_is_all,
            price_is_all = this.data.price_is_all
        if (this.data.filterNavIndex == 1) {
            this.tempData.hotPage = 1
            is_all = false
        } else if (this.data.filterNavIndex == 2) {
            this.tempData.newPage = 1
            new_is_all = false
        } else {
            this.tempData.pricePage = 1
            price_is_all = false
        }
        this.setData(
            {
                isPullDown: true,
                page: 1,
                is_all,
                new_is_all,
                price_is_all,
            },
            () => {
                this.getData(1)
                this.queryAdv()
            }
        )
    },
    // 关闭新用户提醒
    closeNewTip: function () {
        this.setData({
            showNewTip: false,
        })
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        // 到底喽～
        if (!this.data.is_all) {
            this.setData(
                {
                    bottomLoadingShow: true,
                },
                () => {
                    this.getData(2)
                }
            )
        }
    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // },

    /**
     * 页面滚动
     */
    onPageScroll: function (e) {
        util.debounce(() => {
            //监听分页tab高度
            wx.createSelectorQuery()
                .select('#sortHeader')
                .boundingClientRect(rect => {
                    let showTopBack = rect.top <= (screenConfig.getPX(this.data.sort_top) + 10)
                    if (this.data.showTopBack != showTopBack) {
                        this.setData({
                            showTopBack: showTopBack
                        }, () => {
                            this.getTabBar().showTopBack(showTopBack)
                        })
                    }
                    this.setData({
                        sortBg: rect.top <= (screenConfig.getPX(this.data.sort_top) + 5),
                    })
                }).exec();
        }, 30)()
         //顶部搜索框联动以及置顶
         this.selectComponent('#homeModule').onPageScroll(e)
    },
    /**
     * 获取活动列表
     */
    queryAdv: function (e) {
        activityModel.queryAdvList().then((res) => {
            let bannerList = []
            let advList = []
            let customParams = encodeURIComponent(JSON.stringify({ path: 'pages/index/index', pid: 1 })) // 开发者在直播间页面路径上携带自定义参数（如示例中的path和pid参数），后续可以在分享卡片链接和跳转至商详页时获取，详见【获取自定义参数】、【直播间到商详页面携带参数】章节（上限600个字符，超过部分会被截断）

            for (let i = 0; i < res.length; i++) {
                const element = res[i]
                // 拼接直播参数
                if (element.link.indexOf('room_id') != -1) {
                    element.link += '&custom_params=' + customParams
                }
                if (element.location == 1) {
                    bannerList.push(element)
                } else {
                    advList.push(element)
                }
            }
            this.setData({
                bannerList,
                advList,
            })
        })
    },

    /**
     * 网络请求，获取热搜商品数据
     * typeIndex 1 初始获取  2 上拉加载   3 切换nav
     */
    getData(typeIndex) {
        let sort_str = 'desc'
        if (this.data.sort_price == 2 && this.data.filterNavIndex == 3) {
            sort_str = 'asc'
        }
        const params = {
            page: this.data.page,
            limit: this.data.limit,
            sort_field: this.data.filterNavIndex,
            sort: sort_str,
        }
        let isInvite = this.data.isInvite
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        if (this.data.isPullDown) {
            wx.showLoading({
                title: '刷新中...',
            })
        } else if (!this.data.bottomLoadingShow && !isInvite) {
            wx.showLoading({
                title: '加载中...',
            })
        }
        const _this = this
        let isAll = false
        searchListModel.queryHotGoodsList(params).then((res) => {
            let oldGoodsList = []
            if (params.page > 1) {
                oldGoodsList = _this.data.goodsList
            }
            let newGoodsList = []
            if (_this.data.isPullDown) {
                oldGoodsList = []
            }
            let newPage = params.page
            if (res.lists) {
                newGoodsList = oldGoodsList.concat(res.lists)
                if (newGoodsList.length < res.total) {
                    newPage++
                } else {
                    isAll = true
                }
            } else {
                isAll = true
            }
            // 隐藏loading 提示框
            if (!_this.data.bottomLoadingShow && !isInvite) {
                wx.hideLoading()
            }
            // 隐藏导航条加载动画
            wx.hideNavigationBarLoading()
            if (_this.data.isPullDown) {
                //停止下拉刷新
                wx.stopPullDownRefresh()
            }
            _this.setData(
                {
                    goodsList: [...new Set(newGoodsList)],
                    page: newPage,
                    bottomLoadingShow: false,
                    isPullDown: false,
                    isInvite: false,
                    is_all: isAll,
                },
                () => {
                    _this.creatObserver()
                }
            )
        })
    },

    /**
     * 点击输入框-前往搜索页面
     */
    goSearch: function (e) {
        wx.navigateTo({
            url: '../goodsSearch/goodsSearch',
        })
    },
    onJump: function (e) {
        // 埋点上报
        util.tracking('index_adv_click', { adv_id: e.target.dataset.id, title: e.target.dataset.title })
        wx.navigateTo({
            url: e.target.dataset.link,
        })
    },
    /**
     * 点击商品-前往商品详情
     */
    handleGoGoodsDetail(res) {
        const goods_id = Number(res.currentTarget.dataset.id)
        // 埋点上报
        util.tracking('index_goods_click_api', { goods_id: goods_id })
        wx.navigateTo({
            url: '../goodsDetail/goodsDetail' + '?goodsId=' + goods_id,
        })
    },

    // 图片上传
    afterRead(event) {
        wx.showLoading({
            title: '上传中',
        })
        console.log('输出 ~ event', event)
        const file = event.detail.file

        util.uploadFile(file.path)
            .then((res) => {
                console.log('输出 ~ res', res)
                let result = JSON.parse(res)
                wx.hideLoading()
                if (result.code == 200) {
                    wx.navigateTo({
                        url: '/pages/imgSearchResult/imgSearchResult?img=' + result.data.file_url,
                    })
                } else {
                    wx.showToast({
                        title: '图片上传失败',
                        icon: 'none',
                        duration: 2000,
                    })
                }
            })
            .catch((err) => {
                // reject(err)
                wx.hideLoading()
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
    // 曝光获取方法
    creatObserver: function () {
        let ob = this.data.ob
        let exposureList = this.data.exposureList
        if (ob) {
            ob.disconnect()
        }
        // 创建实例
        ob = this.createIntersectionObserver({
            // 阈值设置少，避免触发过于频繁导致性能问题
            thresholds: [1],
            // 监听多个对象
            observeAll: true,
        })
        // 相对于文档视窗监听
        ob.relativeToViewport().observe('.goods-item-box', (res) => {
            if (exposureList.indexOf(res.dataset.id) == -1) {
                exposureList.push(res.dataset.id)
            }
        })
        this.setData({
            ob,
            exposureList,
        })
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        // 埋点上报
        let pages = getCurrentPages()
        let view = pages[pages.length - 1]
        if (this.data.exposureList.length == 0) {
            return
        }
        util.tracking('goods_exposure', { goods_id: this.data.exposureList, page: view.route }, true)
        this.setData({
            exposureList: [],
        })
    },

    /**
     * 切换筛选条件
     */
    onClickTab(res) {
        const _index = Number(res.currentTarget.dataset.index)
        if (_index !== 3 && _index == this.data.filterNavIndex) {
            return
        }
        let priceSortTypeIndex = 0,
            _list = []
        if (_index === 3) {
            priceSortTypeIndex = 1
            if (this.data.filterNavIndex === 3 && this.data.sort_price === 1) {
                priceSortTypeIndex = 2
            }
        }
        this.setData(
            {
                filterNavIndex: _index,
                sort_price: priceSortTypeIndex,
                page: 1,
            },
            () => {
                this.getData(3)
            }
        )
    },
    restoreScroll() {
        let scroll_height = 0
        if (this.data.filterNavIndex == 1) {
            scroll_height = this.tempData.hotScrollTop
        } else if (this.data.filterNavIndex == 2) {
            scroll_height = this.tempData.newScrollTop
        } else {
            scroll_height = this.tempData.priceScrollTop
        }
        let _height = 400
        if (this.data.advList.length > 0) {
            _height = _height + 144 + 40 + 40
        }
        const top_px = screenConfig.getPX(_height)
        if (scroll_height > top_px) {
            wx.pageScrollTo({
                scrollTop: scroll_height,
                duration: 300,
            })
        } else {
            wx.pageScrollTo({
                scrollTop: top_px,
                duration: 300,
            })
        }
    },
})
