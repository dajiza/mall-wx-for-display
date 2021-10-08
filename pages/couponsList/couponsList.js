// packageAgent/couponsList/couponsList.js
const couponModel = require('../../models/coupon')

const app = getApp()
Page({
    /**
     * 页面的初始数据
     */
    data: {
        navTitle: '优惠券包',
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        active: 0,
        unUseList: [],
        timeOutList: [],
        usedList: [],
        list: [],
        firstGet: true,
        type: 1,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.queryCouponList()
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    /*tab切换*/
    onChange(event) {
        switch (event.detail.index) {
            case 0:
                this.setData({
                    list: this.data.unUseList,
                    type: 1,
                })
                break
            case 1:
                this.setData({
                    list: this.data.usedList,
                    type: 3,
                })
                break
            case 2:
                this.setData({
                    list: this.data.timeOutList,
                    type: 4,
                })
                break
        }
        this.setData({
            active: Number(event.detail.index),
        })
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 300,
        })
        // if (!this.data.is_first) {
        //     this.setData({
        //         page: 1,
        //         is_all: false,
        //         active: Number(event.detail.name),
        //     })
        //     wx.pageScrollTo({
        //         scrollTop: 0,
        //         duration: 300,
        //     })
        //     // this.queryListData()
        // }
    },
    /**
     * 获取可用优惠券列表
     */
    queryCouponList: function () {
        wx.showLoading({
            title: '加载中...',
        })
        couponModel.queryMyCoupun().then((res) => {
            console.log('输出 ~ res', res)

            if (this.data.firstGet) {
                this.setData({
                    list: res.un_use_list,
                    type: 1,
                    firstGet: false,
                })
            }
            this.setData({
                unUseList: res.un_use_list,
                timeOutList: res.time_out_list,
                usedList: res.used_list,
            })
            wx.hideLoading()
        })
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
    onPullDownRefresh: function () {},

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {},
})
