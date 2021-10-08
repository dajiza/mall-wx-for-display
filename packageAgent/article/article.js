// pages/article/article.js
const activityModel = require('../../models/activity')

// var WxParse = require('../wxParse/wxParse.js')
Page({
    /**
     * 页面的初始数据
     */
    data: {
        navTitle: '文章',
        htmlSnip: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let id = Number(options.id) || null

        if (!id) {
            wx.showToast({
                title: '文章不存在或已下架,正在返回上一页',
                icon: 'none',
                duration: 1000,
            })
            let that = this
            setTimeout(function () {
                that.onPop()
            }, 1000)
            return
        }

        this.queryArticle(id)
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        // var that = this
        // const query = wx.createSelectorQuery()
        // let item = query.select('.article')
        // setTimeout(function () {
        //     var query = wx.createSelectorQuery()
        //     query.select('.article').boundingClientRect()
        //     query.exec(function (rect) {
        //         // console.log('输出 ~ rect', rect)
        //         // rect[0].attachShadow({ mode: 'closed' })
        //         var shadow = rect[0].createShadowRoot()
        //         console.log('输出 ~ shadow', shadow)
        //     })
        // }, 500)
        // console.log('输出 ~ item', item)
        // let shadow = item.attachShadow({ mode: 'closed' })
        // query
        //     .select('.article')
        //     .boundingClientRect(function (res) {
        //         //这里返回元素自身的DOM属性
        //         console.log(res)
        //     })
        //     .exec(function (rect) {
        //         that.setData({
        //             swiperHeight: rect[0].height + 0,
        //         })
        //         // rect返回一个数组，需要使用下标0才能找到
        //         // console.log(s[0].height)
        //     })
    },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    /**
     * 获取文章详情
     */
    queryArticle: function (id) {
        activityModel.queryAboutDetail(id).then((res) => {
            console.log('输出 ~ queryAdv', res)
            // res.content = res.content.replace(/<section/g, '<div').replace(/\/section>/g, '/div>')
            this.setData({
                htmlSnip: res.content,
                navTitle: res.title,
            })

            // let that = this
            // WxParse.wxParse('sourseDetail', 'html', res.content, that, 0)
        })
    },
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
