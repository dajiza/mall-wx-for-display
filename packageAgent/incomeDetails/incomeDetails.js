import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
const incomeModel = require("../../models/incomeDetails");
const app = getApp();
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + "px",
        active: 0,
        listData: [],
        limit: 20,
        page: 1,
        bottomLoadingShow: false,
        is_all: false,
        isPullDown: false, // 是否下拉操作
        is_query: false, // 是否在请求中
        operatingOrderId: -1, // 当前操作的订单id
        operatingOrderStatus: -1, // 当前操作的订单状态
        quest_loading: false, // 是否请求中
        is_first: true, // 初次进入页面请求
        orderId: -1,
        isAdmin: false,  // 是否是管理员
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
        // 请求订单数据
        this.queryListData();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {},

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
        this.setData({
            isPullDown: true,
            page: 1,
            is_all: false,
            loading_finish: false,
        });
        this.queryListData();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        // 到底喽～
        if (!this.data.is_all) {
            this.setData({
                bottomLoadingShow: true,
            });
            this.queryListData();
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

    /*tab切换*/
    onChange(event) {
        if (!this.data.is_first) {
            this.setData({
                page: 1,
                is_all: false,
                active: Number(event.detail.name),
            });
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 300,
            });
            this.queryListData();
        }
    },

    /**
     * 请求订单列表数据
     */
    queryListData() {
        let _status = "";
        _status = this.data.active;
        const params = {
            status: _status, //不检索传“” 或不传
            limit: this.data.limit,
            page: this.data.page,
        };
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
        incomeModel.queryList(params).then((res) => {
            _this.setListData(params,res,'list');
        });

    },


    setListData(params,res,str) {
        let diffData = {}; // 下拉刷新新增数据
        let isAll = false;
        const _this = this;
        let old_arr = [];
        let offset = 0;
        if (params.page > 1) {
            old_arr = this.data.listData;
            offset = this.data.listData.length
        }
        let new_arr = [];
        let new_page = this.data.page;

        if (res.lists) {
            const lists = res.lists;
            lists.forEach((item,index)=>{
                let key = 'listData[' + (offset + index) + "]";
                diffData[key] = item;
            })
            new_arr = old_arr.concat(lists);
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
                is_query: false,
                isPullDown: false,
                loading_finish: true,
                is_first: false,
            });
        }else {
            _this.setData({
                listData: new_arr,
                page: new_page,
                is_all: isAll,
                bottomLoadingShow: false,
                is_query: false,
                isPullDown: false,
                loading_finish: true,
                is_first: false,
            });
        }
    },

    preventTouchMove() {},
});


