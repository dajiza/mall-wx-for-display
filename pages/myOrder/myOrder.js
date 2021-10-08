import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
const orderModel = require("../../models/order");
const payModel = require("../../models/pay");
const tool = require("../../utils/tool");
const app = getApp();
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + "px",
        active: 0,
        orderList: [],
        orderStatus: "",
        order_no: "",
        orderData: {},
        limit: 20,
        page: 1,
        bottomLoadingShow: false,
        is_all: false,
        isPullDown: false, // 是否下拉操作
        is_query: false, // 是否在请求中
        orderTimeOut: 0,
        operatingOrderId: -1, // 当前操作的订单id
        operatingOrderStatus: -1, // 当前操作的订单状态
        dialogShow: false, // 弹框是否显示
        quest_loading: false, // 是否请求中
        is_delete: false, // 取消或者确认收货
        apply_list: [],
        operatingIndex: -1, // 当前操作的订单index
        loading_finish: false, // 请求是否完成
        tabsShow: false,
        is_first: true, // 初次进入页面请求
        orderId: -1,
        navTitle:'我的订单',
        agentSelectedType:'buy', // 代理商选择查看的订单类型（买入/卖出）
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
        const isShopAdmin = wx.getStorageSync("isShopAdmin") || 0;
        orderModel.backOrderList = false;
        let activeIndex = 0;
        if (Number(options.statusIndex)) {
            activeIndex = Number(options.statusIndex);
        }
        this.setData({
            active: activeIndex,
            isAdmin: Number(isShopAdmin) === 1,
            navTitle: Number(isShopAdmin) === 1?'订单管理':'我的订单'
        });

        // 请求订单数据
        if (Number(this.data.active) === 5) {
            this.getApplyList(); // 请求售后列表数据
        } else {
            this.queryOrderListData();
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        if (orderModel.backOrderList) {
            if (Number(this.data.active) === 5) {
                this.getApplyList(); // 请求售后列表数据
            } else {
                this.queryOrderListData();
            }
        }
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
        this.setData({
            isPullDown: true,
            page: 1,
            is_all: false,
            loading_finish: false,
        });
        if (Number(this.data.active) === 5) {
            this.getApplyList(); // 请求售后列表数据
        } else {
            this.queryOrderListData();
        }
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
            if (Number(this.data.active) === 5) {
                this.getApplyList(); // 请求售后列表数据
            } else {
                this.queryOrderListData();
            }
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
            if (Number(event.detail.name) === 5) {
                this.getApplyList(); // 请求售后列表数据
            } else {
                this.queryOrderListData();
            }
        }
    },

    /**
     * 请求订单列表数据
     */
    queryOrderListData() {
        let _status = "";
        let _status_in = [];
        if (this.data.active === 0) {
            // 全部
            _status = "";
        } else if (this.data.active === 1) {
            // 待付款
            _status = "0";
        } else if (this.data.active === 2) {
            // 待发货
            _status = "";
            _status_in = [1, 2];
        } else if (this.data.active === 3) {
            // 待收货
            _status = "3";
        } else if (this.data.active === 4) {
            // 已完成
            _status = "10";
        }
        const params = {
            order_no: "", //不检索传“” 或不传
            status: _status, //不检索传“” 或不传
            status_in: _status_in,
            limit: orderModel.backOrderList
                ? Number(orderModel.orderListLimit) *
                Number(orderModel.orderListPage)
                : this.data.limit,
            page: orderModel.backOrderList ? 1 : this.data.page,
        };
        const _this = this;
        let isAll = false;
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
        if (this.data.isAdmin && this.data.agentSelectedType === 'sell') {
            orderModel.queryAgentSellOrderList(params).then((res)=>{
                _this.setOrderList(params,res,'list');
            })
        } else {
            orderModel.queryOrderList(params).then((res) => {
                _this.setOrderList(params,res,'list');
            });
        }

    },

    /**
     * 请求售后列表数据
     */
    getApplyList() {
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
        const params = {
            limit: orderModel.backOrderList
                ? Number(orderModel.orderListLimit) *
                Number(orderModel.orderListPage)
                : this.data.limit,
            page: orderModel.backOrderList ? 1 : this.data.page,
        };
        let diffData = {}; // 加载更多新增数据

        if (this.data.isAdmin && this.data.agentSelectedType === 'sell') {
            orderModel.queryAgentSellOrderApplyList(params).then((res) => {
                console.log('代理卖出订单 售后');
                _this.setOrderList(params,res,'lists');
            });
        } else {
            orderModel.queryOrderApplyList(params).then((res) => {
                console.log('普通售后');
                _this.setOrderList(params,res,'lists');
            });
        }
    },

    setOrderList(params,res,str) {
        orderModel.backOrderList = false;
        let isAll = false;
        const _this = this;
        let old_arr = [];
        if (params.page > 1) {
            old_arr = this.data.orderList;
        }
        let new_arr = [];
        let new_page = this.data.page;
        if (_this.data.isPullDown) {
            old_arr = [];
        }
        if (res[str]) {
            new_arr = old_arr.concat(res[str]);
            if (new_arr.length < res.total) {
                new_page = Number(this.data.page) + 1;
            } else {
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
        console.log('new_arr======================>', new_arr);
        _this.setData({
            orderList: new_arr,
            page: new_page,
            is_all: isAll,
            bottomLoadingShow: false,
            isPullDown: false,
            loading_finish: true,
            tabsShow: true,
            is_first: false,
        });
    },
    /**
     * 按钮-取消订单
     */
    handleOnCancelOrder(res) {
        this.setData({
            operatingOrderId: Number(res.currentTarget.dataset.id),
            operatingOrderStatus: Number(res.currentTarget.dataset.status),
            operatingIndex: Number(res.currentTarget.dataset.index),
            dialogShow: true,
        });
    },

    /**
     * 去支付
     */
    handleOnGoPay(res) {
        payModel.orderNo = res.currentTarget.dataset.no;
        this.setData({
            orderId: Number(res.currentTarget.dataset.id)
        },()=>{
            wx.showToast({
                title: "加载中",
                icon: "loading",
                mask: true,
            });
            tool.debounce(this.goWXPay());
        })
    },

    goWXPay() {
        if(!this.data.quest_loading){
            this.setData({
                quest_loading: true,
            });
            const params = {
                id: this.data.orderId,
                order_no: '',
            };
            const _this = this;
            orderModel.queryOrderDetail(params).then((res) => {
                if (res) {
                    _this.setData({
                        isPullDown: false,
                        quest_loading: false,
                    });
                    const total_fee = Number(res.price_total_real);
                    if(res.status === 0){
                        payModel.queryPayInfo(total_fee);
                    }else {
                        wx.showToast({
                            title: "抱歉，订单已关闭~",
                            icon: "none",
                            mask: true,
                        });
                        this.onPullDownRefresh();
                    }
                }
            });
        }

    },

    /**
     * 确认收货
     */
    handleOnConfirmReceipt(res) {
        this.setData({
            operatingOrderId: Number(res.currentTarget.dataset.id),
            operatingOrderStatus: Number(res.currentTarget.dataset.status),
            operatingIndex: Number(res.currentTarget.dataset.index),
            dialogShow: true,
        });
    },

    /**
     * 查看订单详情
     */
    handleOnGoOrderDetail(res) {
        const order_id = Number(res.currentTarget.dataset.id);
        const goods_id = Number(res.currentTarget.dataset.id);
        orderModel.orderListPage = this.data.page;
        orderModel.orderListLimit = this.data.limit;
        if (this.data.active === 5) {
            // 跳转到售后详情页面
            if(!(this.data.isAdmin && this.data.agentSelectedType === 'sell')){
                orderModel.backOrderList = true;
                wx.navigateTo({
                    url: "../refundResult/refundResult" + "?id=" + goods_id,
                });
            }
        } else {
            // 跳转到订单详情页面
            if(this.data.isAdmin && this.data.agentSelectedType === 'sell'){
                wx.navigateTo({
                    url: "../orderDetail/orderDetail" + "?orderId=" + order_id + "&agentSell=1",
                });
            }else {
                wx.navigateTo({
                    url: "../orderDetail/orderDetail" + "?orderId=" + order_id,
                });
            }
        }
    },

    /**
     * 确认取消订单
     */
    sureCancelOrder() {
        if (this.data.quest_loading) {
            return;
        }
        this.setData({
            quest_loading: true,
        });
        const params = {
            order_id: this.data.operatingOrderId,
        };
        let new_list = this.data.orderList;
        const _index = this.data.operatingIndex;
        const _this = this;
        orderModel
            .queryCancelOrder(params)
            .then((res) => {
                if (_this.data.active === 0) {
                    new_list[_index].status = 9;
                } else {
                    new_list.splice(_this.data.operatingIndex, 1);
                }
                wx.showToast({
                    title: "取消成功~",
                    icon: "none",
                    mask: true,
                    duration: 2000,
                });
                _this.setData({
                    dialogShow: false,
                    orderList: new_list,
                });
                setTimeout(() => {
                    _this.setData({
                        quest_loading: false,
                    });
                }, 500);
            })
            .catch((err) => {
                setTimeout(() => {
                    _this.setData({
                        quest_loading: false,
                    });
                }, 500);
            });
    },

    /**
     * 确认收货
     */
    ConfirmReceipt() {
        if (this.data.quest_loading) {
            return;
        }
        this.setData({
            quest_loading: true,
        });
        const params = {
            order_id: this.data.operatingOrderId,
        };
        let new_list = this.data.orderList;
        const _index = this.data.operatingIndex;
        const _this = this;
        orderModel
            .queryOrderSuccess(params)
            .then((res) => {
                if (_this.data.active === 0) {
                    new_list[_index].status = res.status;
                } else {
                    if (res.status !== 3) {
                        new_list.splice(_this.data.operatingIndex, 1);
                    } else {
                    }
                }
                _this.setData({
                    dialogShow: false,
                    orderList: new_list,
                });
                wx.showToast({
                    title: "确认收货成功~",
                    icon: "none",
                    mask: true,
                    duration: 2000,
                });
                setTimeout(() => {
                    _this.setData({
                        quest_loading: false,
                    });
                }, 500);
            })
            .catch((err) => {
                setTimeout(() => {
                    _this.setData({
                        quest_loading: false,
                    });
                }, 500);
            });
    },

    /**
     * 弹窗关闭
     */
    onClose() {
        this.setData({
            dialogShow: false,
        }); //点击取消按钮，弹窗隐藏
    },

    preventTouchMove() {},

    /**
     * 选择买入/卖出订单（代理端）
     */
    chooseBuyOrSell(res) {
        const type = res.currentTarget.dataset.type;
        if(this.data.agentSelectedType !== type){
            this.setData({
                agentSelectedType: type,
                page: 1,
                is_all: false,
                loading_finish: false,
            },()=>{
                if (Number(this.data.active) === 5) {
                    this.getApplyList(); // 请求售后列表数据
                } else {
                    this.queryOrderListData();
                }
            })
        }
    },
    /**
     * 分享店铺（代理端）
     */
    handleOnShare(){
        this.post({
            eventName: "preShareOnLoad",
            eventParams: {
                page: "pages/index/index",
                scene: "index",
            },
            isSticky: true,
        });
        let that = this;
        wx.navigateTo({
            url: "/pages/share/share?type=1",
            success: function (e) {
                that.onCloseShare();
            },
        });
    }
});


