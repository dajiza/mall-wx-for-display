import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
const customerModel = require("../../models/customerManagement");
import moment from 'moment'
const tool = require("../../utils/tool");
const app = getApp();
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + "px",
        customerTapHeight: 'calc(' + (Number(app.globalData.statusBarHeight) + 46 + "px") +  ' + 112rpx)',
        timeShowCustomerTapHeight: 'calc(' + (Number(app.globalData.statusBarHeight) + 46 + "px") +  ' + 184rpx)',
        customerList: [],
        limit: 20,
        page: 1,
        bottomLoadingShow: false,
        is_all: false,
        isPullDown: false, // 是否下拉操作
        loading_finish: false, // 请求是否完成
        is_first: true, // 初次进入页面请求
        navTitle:'客户管理',
        name:'',
        scrollTop: false,
        searchHeight: 0,
        customerNumBoxHeight: 0,
        isShopAdmin: false,
        customerSum:{
            customer_total: '',   //客户总数
            new_monthly: '',  //本月新增
            new_daily: ''  //昨日新增
        },
        showType: 1,
        filterNavIndex: 0,
        order_sales: 0, // 销量排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
        order_price: 0, // 价格排序  0 不参与排序 1 倒叙  2顺序 （默认 :0）
        showSelectTime: false,
        timeFilter:  false, // true 时间过滤启用
        showDatePicker: false,
        pickerTitle: '',
        picker: '',
        startDateStr: '', // 暂存开始日期 未确定 new Date().format('yyyy-MM-dd')
        endDateStr: '',   // 暂存结束日期 未确定 new Date().format('yyyy-MM-dd')
        ParamsStartDateStr: '', // 确定开始选择日期 new Date().format('yyyy-MM-dd')
        ParamsEndDateStr: '',   // 确定结束选择日期 new Date().format('yyyy-MM-dd')
        formatter(type, value) {
            if (type === 'year') {
                return `${value}年`
            } else if (type === 'month') {
                return `${value}月`
            }
            return value
        },
        minDate: new Date('2020-01-01').getTime(), // n个月前 new Date().getTime() - 1000 * 60 * 60 * 24 * 31 * n
        maxDate: new Date().getTime(),
        currentDate: new Date().getTime(),
    },
    events: {
        orderStatusChange: function (params) {
            this.setData({});
        },
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // type 1: 客户管理 2: 业绩排行
        console.log('options=====', options)
        let _type = 1
        if(options.type){
            _type = Number(options.type)
        }
        const isShopAdmin = wx.getStorageSync("isShopAdmin") || 0;
        this.setData({
            showType: _type,
            navTitle: _type === 1 ? '客户管理' : '业绩排行',
            isShopAdmin: Number(isShopAdmin) === 1
        },()=>{
            // 请求订单数据
            this.queryListData();
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        wx.createSelectorQuery().select('#searchBox').boundingClientRect(rect=>{
            this.setData({
                searchHeight: rect.height
            })
        }).exec();
        wx.createSelectorQuery().select('#customerNumBox').boundingClientRect(rect=>{
            this.setData({
                customerNumBoxHeight: rect.height
            })
        }).exec();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        if (this.data.showDatePicker || this.data.showSelectTime) {
            return
        }
        this.setData({
            isPullDown: true,
            page: 1,
            is_all: false,
            loading_finish: false,
            order_sales: 0,
            order_price: 0
        },()=>{
            this.queryListData();
        });
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        // 到底喽～
        if (!this.data.is_all) {
            this.setData({
                bottomLoadingShow: true,
            },()=>{
                this.queryListData();
            });
        }
    },

    /**
     * 页面滚动
     */
    onPageScroll: function (e) {
        let num = Number(this.data.customerNumBoxHeight) + Number(this.data.searchHeight);
        console.log('num', num)
        if(e.scrollTop >= this.data.customerNumBoxHeight  && !this.data.scrollTop){
            this.setData({
                scrollTop: true
            })
        }else if(e.scrollTop < this.data.customerNumBoxHeight && this.data.scrollTop) {
            this.setData({
                scrollTop: false
            })
        }
    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // },

    ClickBack() {
        let pages = getCurrentPages();
        if (pages.length === 1) {
            wx.switchTab({
                url: "../index/index",
            });
        } else {
            wx.navigateBack({
                delta: 1,
            });
        }
    },

    /**
     * 请求订单列表数据
     */
    queryListData() {
        const params = {
            nick_name: this.data.name, //不检索传“” 或不传
            status: 0, //不检索传“” 或不传
            phone: "",
            limit: this.data.limit,
            page: this.data.page,
            order_by_count: this.data.order_sales,
            order_by_money: this.data.order_price
        };
        if (this.data.showType === 1) { // 客户管理
            params['reg_time_le'] = this.data.ParamsEndDateStr //右边
            params['reg_time_ge'] = this.data.ParamsStartDateStr //左边
        } else {
            params['buy_time_le'] = this.data.ParamsEndDateStr //右边
            params['buy_time_ge'] = this.data.ParamsStartDateStr //左边
        }
        const _this = this;
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading();
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        if (this.data.isPullDown) {
            wx.showLoading({
                title: "刷新中...",
            });
        } else if (!this.data.bottomLoadingShow) {
            wx.showLoading({
                title: "加载中...",
            });
        }
        customerModel.queryCustomerList(params).then((res) => {
            _this.setListData(params,res);
        });

    },

    setListData(params,res) {
        let diffData = {}, isAll = false, old_arr = [],new_arr = [], offset = 0, new_page;
        const _this = this;
        if (params.page > 1) {
            old_arr = this.data.customerList;
            offset = this.data.customerList.length
        }
        new_page = this.data.page;
        if (res['lists']) {
            res['lists'].forEach((item,index)=>{
                let key = 'customerList[' + (offset + index) + "]";
                diffData[key] = item;
            })
            new_arr = old_arr.concat(res['lists']);
            if(new_arr.length < res.total) {
                new_page = Number(this.data.page) + 1;
            }else {
                isAll = true;
            }
        } else {
            new_arr = old_arr;
            isAll = true;
        }
        //隐藏loading 提示框
        if (!_this.data.bottomLoadingShow) {
            wx.hideLoading();
        }
        //隐藏导航条加载动画
        wx.hideNavigationBarLoading();
        if (_this.data.isPullDown) {
            //停止下拉刷新
            wx.stopPullDownRefresh();
        }
        if (params.page > 1) {
            _this.setData({
                ...diffData,
                page: new_page,
                is_all: isAll,
                bottomLoadingShow: false,
                isPullDown: false,
                loading_finish: true,
                is_first: false,
                customerSum: res.customer_sum
            });
        }else {
            _this.setData({
                customerList: new_arr,
                page: new_page,
                is_all: isAll,
                bottomLoadingShow: false,
                isPullDown: false,
                loading_finish: true,
                is_first: false,
                customerSum: res.customer_sum
            });
        }
    },

    /**
     * 输入框input事件
     */
    bindSearchInput: function (e) {
        this.setData({
            name: e.detail.value,
        });
        if(e.detail.value === ''){
            this.setData({
                page: 1,
                is_all: false
            });
        }
    },

    /**
     * 清空搜索内容
     */
    bindClearSearch: function () {
        this.setData({
            name: '',
            page: 1,
            is_all: false
        },()=>{
            this.queryListData();
        });
    },

    /**
     * 点击软键盘搜索按钮
     */
    handleOnSearch: function () {
        if (this.data.name) {
            this.setData({
                page: 1,
                is_all: false
            },()=>{
                this.queryListData();
            });
        }else {
            this.queryListData();
        }

    },

    /**
     * 切换筛选条件
     */
    onClickTab(res) {
        let priceSortTypeIndex = 0;
        let salesSortTypeIndex = 0;
        if (Number(res.currentTarget.dataset.index) === 2) {
            priceSortTypeIndex = 1;
            if (this.data.filterNavIndex === 2 && this.data.order_price === 1) {
                priceSortTypeIndex = 2;
            }
        } else if (Number(res.currentTarget.dataset.index) === 1) {
            salesSortTypeIndex = 1;
            if (this.data.filterNavIndex === 1 && this.data.order_sales === 1) {
                salesSortTypeIndex = 2;
            }
        }
        this.setData({
            filterNavIndex: Number(res.currentTarget.dataset.index),
            order_sales: salesSortTypeIndex,
            order_price: priceSortTypeIndex,
            page: 1,
            loading_finish: false
        },()=>{
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 300
            })
            this.queryListData()
        })
    },

    handleOpenSelectDate() {
        if(this.data.showType === 1){
            this.handleSelectDate()
        }

    },
    handleSelectDate() {
        this.setData({
            showSelectTime: true,
        })
    },
    handleSelectDateCancel() {
        this.setData({
            showSelectTime: false,
        })
    },
    /**
     * 打开时间选择
     */
    handleDatePick: function (e) {
        let picker = e.currentTarget.dataset.picker
        console.log('picker', picker)
        let pickerTitle = ''
        if (picker === 'start') {
            pickerTitle = '开始时间'
        } else if (picker === 'end') {
            pickerTitle = '结束时间'
        }
        this.setData({
            showDatePicker: true,
            pickerTitle: pickerTitle,
            picker: picker,
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
        console.log(e)
        let time = e.detail
        if (this.data.picker === 'start') {
            let startDateStr = new Date(time).format('yyyy-MM-dd')
            this.setData({
                showDatePicker: false,
                startDateStr: startDateStr,
            })
        } else if (this.data.picker === 'end') {
            let endDateStr = new Date(time).format('yyyy-MM-dd')
            this.setData({
                showDatePicker: false,
                endDateStr: endDateStr,
            })
        }
    },
    /**
     * 日期重置
     */
    handleOnDateReset: function(){
        this.setData({
            showSelectTime: false,
            timeFilter: false,
            startDateStr: '',
            endDateStr: '',
            ParamsStartDateStr: '',
            ParamsEndDateStr: '',
            page: 1,
            is_all: false,
            loading_finish: false,
        },()=>{
            this.queryListData();
        })
    },
    /**
     * 日期确定
     */
    handleOnDateSure(){
        if(!this.data.startDateStr){
            wx.showToast({
                title: '请选择开始时间',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        if(!this.data.endDateStr){
            wx.showToast({
                title: '请选择结束时间',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        if (moment(this.data.startDateStr) > moment(this.data.endDateStr)) {
            wx.showToast({
                title: '请选择正确时间',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        this.setData({
            showSelectTime: false,
            timeFilter: true,
            ParamsStartDateStr: this.data.startDateStr,
            ParamsEndDateStr: this.data.endDateStr,
            page: 1,
            is_all: false,
            loading_finish: false,
        },()=>{
            this.queryListData();
        })
    },
});


