import screenConfig from '../../utils/screen_util'
const orderModel = require('../../models/order')
const pointsModel = require('../../models/points')
const logisticsModel = require('../../models/logistics')
const tool = require('../../utils/tool')
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const app = getApp()

App.Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        navTitle: '兑换订单详情',
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        isPullDown: false,
        orderInfo: {},
        orderList: [],
        orderId: -1,
        quest_loading: false,
        safeAreaInsetBottom: safeAreaInsetBottom,
        isAgent: true, // 代理商
        isSend: false, // 代理商是否已发货
        goodsList: [],
        steps: [],
        stepsList: [],
        is_received: false, // 是否签收
        logistics_company_name: '', // 物流公司名称
        logistics_no: '', // 物流单号
        shipping_address: '', // 收货地址
        logistics_status: '', // 当前物流状态
        courier_tel: '', // 快递员手机号
        showLogisticsDialog: false,
        showPicker: false,
        LogisticsNo: '',
        logisticsCompanyId: 0,
        logisticsCompanyName: '', // 物流公司名称
        expressList: [], // 快递列表
        companyList: [],
        companyIndex: 0,
    },

    onLoad: function (options) {
        const is_agent = wx.getStorageSync('isShopAdmin') || 0
        console.log('is_agent', is_agent)
        console.log('pointsModel.goodsList', pointsModel.goodsList)
        const eventChannel = this.getOpenerEventChannel();
        const that = this
        eventChannel.on('goodsDetailObserver', function(data) {
            console.log('47====', data)
            that.setData(
                {
                    isAgent: Number(is_agent) == 1,
                    isSend: Number(options.isSend) == 1,
                    goodsList: data.list,
                    orderList: data.props,
                    orderInfo: data.props[0]
                },
                () => {
                    that.getExpressList() // 获取快递公司列表
                    // that.getOrderDetail() // 订单详情
                    console.log('this.data.isSend')
                    console.log('this.data.isAgent')
                    if (that.data.isSend) {
                        that.queryLogisticsData() // 请求物流信息数据
                    }
                }
            )
        })

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        // console.log('下拉');
        this.setData(
            {
                isPullDown: true,
            },
            () => {
                this.getOrderDetail()
            }
        )
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        // 到底喽～
    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {},

    /**
     * 页面滚动
     */
    onPageScroll: function (e) {},

    /**
     * 请求订单详情
     */
    getOrderDetail() {
        const params = {
            id: this.data.orderId,
        }
        const _this = this
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        if (this.data.isPullDown) {
            wx.showLoading({
                title: '刷新中...',
            })
        } else {
            wx.showLoading({
                title: '加载中...',
            })
        }
        console.log('请求订单详情')
        pointsModel
            .queryOrderDetail(params)
            .then((res) => {
                console.log('params', params)
                if (_this.data.isPullDown) {
                    //停止下拉刷新
                    wx.stopPullDownRefresh()
                }
                //隐藏loading 提示框
                wx.hideLoading()
                //隐藏导航条加载动画
                wx.hideNavigationBarLoading()
                if (res) {
                    let _info = res
                    _info['exchange_subject_json'] = JSON.parse(_info['exchange_subject_json'])
                    _this.setData({
                        orderInfo: res,
                        isPullDown: false,
                    })
                }
            })
            .catch((err) => {
                //隐藏导航条加载动画
                wx.hideNavigationBarLoading()
                if (_this.data.isPullDown) {
                    //停止下拉刷新
                    wx.stopPullDownRefresh()
                    _this.setData({
                        isPullDown: false,
                    })
                }
            })
    },

    /**
     * 返回上一页
     */
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

    preventTouchMove() {},

    /**
     * 立即发货
     */
    handleOnSend() {
        this.setData({
            LogisticsNo: '',
            logisticsCompanyName: '',
            showLogisticsDialog: true,
        })
    },

    /*确定发货*/
    handleOnLogisticsConfirm() {
        console.log('确定发货')
        if(this.data.quest_loading) {
            return;
        }
        this.setData({
            quest_loading: true
        })
        if (!this.data.LogisticsNo || !this.data.logisticsCompanyName) {
            wx.showToast({
                title: '请填写完整的信息',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        // 请求发货接口
        let company_id = 0
        this.data.expressList.forEach((item) => {
            if (item.name == this.data.logisticsCompanyName) {
                company_id = item.id
            }
        })
        const ids = this.data.orderList.map(item => {return item.id})
        console.log('ids', ids)
        const params = {
            points_order_ids: ids,
            sd_company_id: company_id, //快递公司id
            sd_company_name: this.data.logisticsCompanyName, //快递公司名称
            sd_no: this.data.LogisticsNo, // 单号
        }
        console.log('params', params)
        wx.showLoading({
            title: '加载中...',
        })
        pointsModel
            .queryOrderSand(params)
            .then((res) => {
                //隐藏loading 提示框
                wx.hideLoading()
                wx.showToast({
                    title: '操作成功',
                    icon: 'none',
                    duration: 3000,
                })
                this.setData({
                    showLogisticsDialog: false,
                })
                setTimeout(() => {
                    this.setData({
                        quest_loading: false,
                        LogisticsNo: '',
                        logisticsCompanyName: '',
                    })
                    this.finish()
                }, 1000)
            })
            .catch((err) => {
                this.setData({
                    quest_loading: false
                })
            })
    },

    /*下次再说*/
    handleOnLogisticsCancel() {
        this.setData({
            LogisticsNo: '',
            logisticsCompanyName: '',
            showLogisticsDialog: false,
            quest_loading: false
        })
    },

    handleOnLogisticsInput: function (e) {
        this.setData({
            LogisticsNo: e.detail.value,
        })
    },

    selectLogisticsCompany() {
        console.log('companyIndex', this.data.companyIndex)
        let _index = 0
        this.data.companyList.forEach((ev, i) => {
            if (this.data.logisticsCompanyName && ev == this.data.logisticsCompanyName) {
                _index = i
            }
        })
        this.setData({
            showPicker: true,
            companyIndex: _index,
        })
    },
    handleOnCancel: function () {
        this.setData({
            showPicker: false,
        })
    },
    bindPickerChange: function (e) {
        console.log('picker发送选择改变，携带值为', e.detail.value)
        this.setData({
            companyIndex: e.detail.value,
        })
    },
    onPickerConfirm(e) {
        console.log('value', e.detail.value)
        console.log('index', e.detail.index)
        this.setData({
            logisticsCompanyName: e.detail.value,
            showPicker: false,
        })
    },
    onPickerCancel() {
        console.log('companyIndex', this.data.companyIndex)
        this.setData({
            showPicker: false,
        })
    },
    // 请求快递公司列表
    getExpressList() {
        orderModel.queryExpressList().then((res) => {
            console.log('res======72', res)
            let company_list = []
            if (res && res.length > 0) {
                company_list = res.map((item) => {
                    return item.name
                })
            }
            this.setData({
                expressList: res,
                companyList: company_list,
            })
        })
    },

    /**
     * 请求物流信息数据
     */
    queryLogisticsData() {
        const params = {
            companyId: this.data.orderInfo.logistics_company_id,
            logisticsNo: this.data.orderInfo.logistics_no
        }
        console.log('params', params)
        const _this = this
        let courierTel = '' // 快递员手机号
        let steps_list = [] // 物流信息
        let logistics_status = '' // 物流状态
        let _address = '' // 收货地址
        let logistics_company_name = '' // 物流公司名称
        let logistics_no = '' // 物流单号
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        if (this.data.isPullDown) {
            wx.showLoading({
                title: '刷新中...',
            })
        } else {
            wx.showLoading({
                title: '加载中...',
            })
        }
        pointsModel.queryOrderSdInfo(params).then((res) => {
            //隐藏loading 提示框
            wx.hideLoading()
            //隐藏导航条加载动画
            wx.hideNavigationBarLoading()
            if (_this.data.isPullDown) {
                //停止下拉刷新
                wx.stopPullDownRefresh()
            }
            const province = this.data.orderInfo.logistics_province
            const city = this.data.orderInfo.logistics_city
            const area = this.data.orderInfo.logistics_area
            const address = this.data.orderInfo.logistics_address
            _address = '[收货地址] ' + province + city + area + ' ' + address
            if (this.data.orderInfo) {
                logistics_company_name = this.data.orderInfo.logistics_company_name
                logistics_no = this.data.orderInfo.logistics_no
            }
            if (res) {
                const _list = [
                    { message: '包裹正在等待揽收', time: 1603264819, type: '已发货' },
                    { message: '在浙江杭州西湖去溪畔公司进行派件扫描；派送业务员：陈卫中   联系电话：17816197313', time: 1599445186, type: '派件中' },
                ]
                let new_arr = res.reverse()
                logistics_status = new_arr[0].type
                new_arr.forEach((ev, index) => {
                    const time = this.formatDate(ev.time)
                    const date = time.split(' ')[0]
                    const sj = time.split(' ')[1]
                    let params = {
                        content: ev.message,
                        timestamp: this.formatDate(ev.time),
                        currentDate: date,
                        currentTime: sj,
                        type: ev.type,
                        hasTel: false,
                        TelContArr: [],
                    }
                    if (_this.mobilePhoneArray(ev.message).length > 0) {
                        let telContArr = _this.mobilePhoneArray(ev.message)
                        params['hasTel'] = true
                        params['TelContArr'] = telContArr
                    }
                    steps_list.push(params)
                })
            }
            _this.setData({
                stepsList: steps_list,
                courier_tel: courierTel,
                logistics_status: logistics_status,
                shipping_address: _address,
                logistics_company_name: logistics_company_name,
                logistics_no: logistics_no,
            })
        })
    },
    finish: function () {
        const eventChannel = this.getOpenerEventChannel()
        if (eventChannel) {
            eventChannel.emit('updateList', 1);
        }
        setTimeout(() => {
            wx.navigateBack({
                delta: 1,
            })
        }, 500)
    },
    formatDate(val) {
        if (val) {
            let dt
            if (val.length > 10) {
                dt = new Date(Number(val))
            } else {
                dt = new Date(Number(val) * 1000)
            }
            let new_time = dt.format('MM-dd hh:mm')
            // let year = dt.getFullYear(); //年
            // let month = dt.getMonth() + 1; //月
            // let date = dt.getDate(); //日
            // let hh = dt.getHours(); //时
            // let mm = dt.getMinutes(); //分
            // let ss = dt.getSeconds(); //秒
            // month = month < 10 ? "0" + month : month;
            // date = date < 10 ? "0" + date : date;
            // hh = hh < 10 ? "0" + hh : hh;
            // mm = mm < 10 ? "0" + mm : mm;
            // ss = ss < 10 ? "0" + ss : ss;
            // let new_time = ''
            // new_time = month + "-" + date + ' ' + hh + ':' + mm;
            return new_time
        }
    },
    /**
     * 匹配获取手机号或者座机号
     */
    mobilePhoneArray(strContent) {
        if (strContent === '') {
            return
        }
        let mobileReg = /[1][3,4,5,7,6,8,9][0-9]{9}|\d{3,4}-\d{7,8}/g
        var telephoneReg
        let phoneList = strContent.match(mobileReg)
        let textList = strContent.split(/[1][3,4,5,7,6,8,9][0-9]{9}|\d{3,4}-\d{7,8}/),
            list = []
        console.log('phoneList', phoneList)
        console.log('textList', textList)
        if (phoneList) {
            for (let i in textList) {
                if (textList[i] == '') {
                    i == 0 && list.push({ type: 'phone', val: phoneList[0] })
                } else {
                    list.push({ type: 'text', val: textList[i] })
                    list.push({ type: 'phone', val: phoneList[i] })
                }
            }
        }
        return list
    },
    // 复制
    handleCopy: function (e) {
        console.log('data', this.data.orderInfo)
        const name = '姓名：' + this.data.orderInfo.logistics_name
        const phone = '手机号：' + this.data.orderInfo.logistics_phone
        const address = '地址：' + this.data.orderInfo.logistics_province + this.data.orderInfo.logistics_city + this.data.orderInfo.logistics_area + this.data.orderInfo.logistics_address

        let content = name + '\n' + phone + '\n' + address
        console.log('content', content)
        wx.setClipboardData({
            data: content,
            success(res) {
                // wx.showToast({
                //     title: '复制成功'
                // })
            },
        })
    },
})
