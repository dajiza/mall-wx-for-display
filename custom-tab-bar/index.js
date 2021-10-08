const loginWatch = require('../utils/loginWatch')
const userShopInfoModel = require('../models/userShopInfo')
const circleModel = require('../models/circle')
const util = require('../utils/util')
App.Component({
    data: {
        active: 0,
        list: [
            {
                icon: '/assets/images/tab_home.svg',
                icon_h: '/assets/images/tab_home_h.svg',
                text: '首页',
                url: '/pages/index/index',
            },
            {
                icon: '/assets/images/tab_teamwork.svg',
                icon_h: '/assets/images/tab_teamwork_h.svg',
                text: '团作',
                url: '/pages/teamworkIndex/teamworkIndex',
            },
            {
                icon: '/assets/images/tab_kankan.svg',
                icon_h: '/assets/images/tab_kankan_h.svg',
                text: '看看',
                url: '/pages/kankanIndex/kankanIndex',
            },
            {
                icon: '/assets/images/tab_car.svg',
                icon_h: '/assets/images/tab_car_h.svg',
                text: '购物车',
                url: '/pages/cart/cart',
            },
            {
                icon: '/assets/images/tab_my.svg',
                icon_h: '/assets/images/tab_my_h.svg',
                text: '我的',
                url: '/pages/my/my',
            },
        ],
        toolCourse: 0, //团作 1不开 2开启
        toolTutorial: 0, //看看 1不开 2开启
        noticeShow: false, //团作 提醒消息是否显示
        showTopBack: false,
    },

    methods: {
        click(e) {
            let index = e.currentTarget.dataset.index
            let url = this.data.list[index].url
            if (index == 0 && url == '/pages/index/index' && this.data.showTopBack) {
                let indexPage = getCurrentPages().find((page) => page && page.route == 'pages/index/index')
                indexPage.post({
                    eventName: 'scrollToTop',
                })
            }
        },
        onChange(event) {
            let pageId = this.getPageId()
            let page = getCurrentPages().find((page) => page && page.getPageId() == pageId)
            let url = this.data.list[event.detail].url
            if (url == '/pages/index/index' || url == '/pages/category/category') {
                wx.switchTab({
                    url: url,
                })
                return
            }
            loginWatch.observer(
                page,
                () => {
                    wx.switchTab({
                        url: url,
                    })
                },
                url,
                true
            )
            // wx.switchTab({
            //     url: this.data.list[event.detail].url,
            // })
        },

        async init() {
            this.queryCommitCount()
            await this.getUserInfo()
            const page = getCurrentPages().pop()

            this.setData({
                active: this.data.list.findIndex((item) => item.url === `/${page.route}`),
            })
        },
        /**
         * 网络请求，获取团作消息数量
         */
        queryCommitCount() {
            let checkCode = util.checkToken()
            if (checkCode != 0) {
                return
            }
            circleModel
                .queryNoticeCount({ search_type: 2 })
                .then((res) => {
                    this.setData({
                        noticeShow: res > 0,
                    })
                })
                .catch((err) => {})
        },
        /**
         * 网络请求，获取用户信息数据
         */
        getUserInfo() {
            let checkCode = util.checkToken()
            if (checkCode != 0) {
                return
            }
            let toolCourse = this.data.toolCourse
            let toolTutorial = this.data.toolTutorial
            return new Promise((resolve, reject) => {
                userShopInfoModel
                    .queryUserShopInfo({})
                    .then((res) => {
                        //团作 1不开 2开启
                        let tool_course = res.shop_info.tool_course
                        let tool_tutorial = res.shop_info.tool_tutorial
                        if (tool_course != toolCourse || tool_tutorial != toolTutorial) {
                            this.setTabData(tool_course, tool_tutorial)
                        }
                        resolve(res)
                    })
                    .catch((err) => {
                        reject(err)
                    })
            })
        },
        // 设置tabbar列表数据
        setTabData(tool_course, tool_tutorial) {
            let list = [
                {
                    icon: '/assets/images/tab_home.svg',
                    icon_h: '/assets/images/tab_home_h.svg',
                    text: '首页',
                    url: '/pages/index/index',
                },
                {
                    icon: '/assets/images/tab_teamwork.svg',
                    icon_h: '/assets/images/tab_teamwork_h.svg',
                    text: '团作',
                    url: '/pages/teamworkIndex/teamworkIndex',
                    hidden: tool_course == 1,
                },
                {
                    icon: '/assets/images/tab_kankan.svg',
                    icon_h: '/assets/images/tab_kankan_h.svg',
                    text: '看看',
                    url: '/pages/kankanIndex/kankanIndex',
                    hidden: tool_tutorial == 1,
                },
                {
                    icon: '/assets/images/tab_car.svg',
                    icon_h: '/assets/images/tab_car_h.svg',
                    text: '购物车',
                    url: '/pages/cart/cart',
                },
                {
                    icon: '/assets/images/tab_my.svg',
                    icon_h: '/assets/images/tab_my_h.svg',
                    text: '我的',
                    url: '/pages/my/my',
                },
            ]
            list = list.filter((item) => !item.hidden)
            this.setData({
                list,
                toolCourse: tool_course,
                toolTutorial: tool_tutorial,
            })
        },
        showTopBack(show = false) {
            if (show) {
                this.data.list[0].icon_h = '/assets/images/tab_home_back_to_top.svg'
                this.data.list[0].text = '回顶部'
            } else {
                this.data.list[0].icon_h = '/assets/images/tab_home_h.svg'
                this.data.list[0].text = '首页'
            }
            let key = 'list[0]'
            this.setData({
                showTopBack: show,
                [key]: this.data.list[0],
            })
        },
    },
})
