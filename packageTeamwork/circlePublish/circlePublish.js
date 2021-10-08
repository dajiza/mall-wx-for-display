import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
const circleModel = require("../../models/circle");
const userShopInfoModel = require('../../models/userShopInfo')
const tool = require("../../utils/tool");
const util = require('../../utils/util')
const upyun = require('../../utils/upyun_wxapp_sdk')
const app = getApp();
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + "px",
        navTitle:'发表圈子',
        isPullDown: false, // 是否下拉操作
        quest_loading: false, // 是否在请求中
        showType: 0, // 1 图片 2 视频
        courseId: 0, // 团作id

        isTeacher: false,  // 是否是老师
        textMessage:'', // 文字
        selectedType: 2, // 发布类型 2圈子，3作业，4示范作业

        coursewareVideos: [], // 视频
        videoPreviewUrl: '', // 视频预览
        coursewareImages: [], // 图片
        imagesLength: 0,
        pageMetaScrollTop: 0,
        scrollTop: 0,
        size: 3,
        extraNodes: [
            {
                type: "after",
                dragId: "plus",
                slot: "plus",
                fixed: true
            }
        ],
        userId: 0,
        shopId: 0,
    },
    // 不用于数据绑定的全局数据
    tempData: {
        uploadImgIndex: 0,
        uploadSuccessNum: 0,
        uploadImgList: []
    },

    events: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const isShopAdmin = wx.getStorageSync("isShopAdmin") || 0;
        const _type = Number(options.type)  // 1 视频 2 图片
        this.setData({
            showType: _type,
            courseId: Number(options.courseId),
            isTeacher: Number(isShopAdmin) === 1,
            userId: Number(options.userId),
            shopId: Number(options.shopId),
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

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

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
                url: "/pages/index/index",
            });
        } else {
            wx.navigateBack({
                delta: 1,
            });
        }
    },

    preventTouchMove() {},

    bindInput: function (e) {
        // this.setData({
        //     textMessage: e.detail.value,
        // })
        console.log('e', e.detail);
        console.log('textMessage', this.data.textMessage)
    },
    /**
     * 选择发布类型
     */
    onChooseType(e){
        const _type = Number(e.currentTarget.dataset.type)
        this.setData({
            selectedType: _type
        });
    },
    /**
     * 点击发布
     */
    handleOnPublish(){
        if ( this.data.coursewareImages.length < 1 && this.data.showType == 2) { // 1视频 2图片
            // wx.showToast({
            //     title: "请上传图片",
            //     icon: "none",
            //     mask: true,
            //     duration: 2000,
            // });
            return
        } else if (this.data.showType == 1 && !this.data.videoPreviewUrl){
            // wx.showToast({
            //     title: "请上传视频",
            //     icon: "none",
            //     mask: true,
            //     duration: 2000,
            // });
            return
        }
        if (this.data.quest_loading) {
            return;
        }
        this.setData({
            quest_loading: true,
        });
        let params = {
            shop_id: this.data.shopId,
            platform: this.data.selectedType,
            message: this.data.textMessage,
            course_id: this.data.courseId,
            parent_id: 0,
            medias: []
        }
        if(this.data.showType == 2){
            this.data.coursewareImages.forEach((ev,i)=>{
                let _obj = {
                    type: this.data.showType,
                    title:'',
                    link: ev.link,
                    sort: i
                }
                params['medias'].push(_obj)
            })
        } else {
            let _obj = {
                type: this.data.showType,
                title:'',
                link: this.data.videoPreviewUrl,
                sort: 0
            }
            params['medias'].push(_obj)
        }
        console.log('params', params)
        const _this = this;
        wx.showLoading({
            title: "加载中...",
        });
        circleModel.creatCircle(params).then((res)=>{
            console.log('res', res)
            wx.hideLoading()
            wx.showToast({
                title: "发布成功~",
                icon: "none",
                mask: true,
                duration: 2000,
            });
            let _type = 2; // 2 圈子 3 作业墙
                if(params.platform == 3){
                _type = 3
            }
            setTimeout(() => {

                this.post({
                    eventName: "publishCircle",
                    eventParams: _type,
                });
                _this.setData({
                    quest_loading: false,
                });
                wx.navigateBack();
            }, 1000);
        }).catch(err=>{
            _this.setData({
                quest_loading: false,
            });
            console.log('err', err)
        })

    },
    //添加视频
    handelVideoAdd: function (e) {
        console.log(e);
        let that = this
        wx.chooseVideo({
            sourceType: ['album', 'camera'],
            success(res) {
                console.log(res)
                if (res.errMsg == "chooseVideo:ok") {
                    that.uploadFile(res.tempFilePath, (file_url) => {
                        let dragVideo = that.selectComponent('#drag-video');
                        let lastIndex = that.data.coursewareVideos.length
                        let key = 'coursewareVideos[' + lastIndex + ']'
                        let diffData = {}
                        diffData[key] = {
                            id: '0_' + file_url,
                            url: res.thumbTempFilePath,
                            link: file_url,
                        }
                        that.setData({
                            ...diffData,
                            videoPreviewUrl: file_url
                        })
                        dragVideo.init();
                    })
                }
            }
        })
    },
    handleDeleteVideo(){
        this.setData({
            videoPreviewUrl: ''
        })
    },
    //添加图片
    handelImageAdd: function (e) {
        console.log(e);
        let that = this
        this.tempData.uploadImgList = []
        this.tempData.uploadImgIndex = 0
        this.tempData.uploadSuccessNum = 0
        wx.chooseImage({
            count: 9-that.data.coursewareImages.length,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                console.log('res===233', res)
                if (res.errMsg == "chooseImage:ok") {
                    console.log('res=======271', res)
                    that.tempData.uploadImgList = res.tempFilePaths
                    wx.showLoading({
                        title: '上传中...',
                    })
                    that.uploadImgFile(that.tempData.uploadImgList)
                }
            }
        })
    },
    //多张图片上传
    uploadImgFile(list) {
        console.log('this.tempData.uploadImgIndex', this.tempData.uploadImgIndex)
        const path = list[this.tempData.uploadImgIndex]
        let that = this
        upyun.upload(path, 80)
            .then((result) => {
                console.log('输出 ~ result', result)
                if (result.code == 200) {
                    const file_url = result.data.file_url
                    let dragImage = that.selectComponent('#drag-image');
                    let lastIndex = that.data.coursewareImages.length
                    let key = 'coursewareImages[' + lastIndex + ']'
                    let diffData = {}
                    diffData[key] = {
                        id: '0_' + file_url,
                        url: file_url,
                        link: file_url,
                    }
                    that.setData({
                        ...diffData,
                    },()=>{
                        console.log('this.data.coursewareImages.length', that.data.coursewareImages.length)
                        that.setData({
                            imagesLength: that.data.coursewareImages.length
                        })
                    })
                    dragImage.init();
                    that.tempData.uploadSuccessNum ++
                    // 上传完成or继续上传
                    that.continueUpload()
                } else {
                    // 上传完成or继续上传
                    that.continueUpload()
                }
            }).catch((err) => {
            // 上传完成or继续上传
            that.continueUpload()
        })
    },
    // 上传完成or继续上传
    continueUpload(){
        let title_text = '上传成功！',
            err_count = 0
        this.tempData.uploadImgIndex ++
        if(this.tempData.uploadImgIndex == this.tempData.uploadImgList.length){
            console.log('结束了')
            wx.hideLoading()
            if(this.tempData.uploadSuccessNum < this.tempData.uploadImgList.length){
                err_count = this.tempData.uploadImgList.length - this.tempData.uploadSuccessNum
                title_text = '上传成功' + this.tempData.uploadSuccessNum + '张，失败' + err_count + '张'
                console.log('err_count', err_count)
            }
            wx.showToast({
                title: title_text,
                duration: 1500,
                success: function(){
                }
            });
        } else {
            console.log('不，还没结束呢')
            this.uploadImgFile(this.tempData.uploadImgList)
        }
    },
    uploadFile(path, callback) {
        wx.showLoading({
            title: '上传中...',
        })
        util.uploadFile(path)
            .then((res) => {
                console.log('输出 ~ res', res)
                let result = JSON.parse(res)
                wx.hideLoading()
                if (result.code == 200) {
                    if (callback) {
                        callback(result.data.file_url)
                    }
                } else {
                    wx.showToast({
                        title: '图片上传失败',
                        icon: 'none',
                        duration: 2000,
                    })
                }
            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    itemClick(e) {
        console.log(e)
        let type = e.currentTarget.dataset.type || ''
        let index = e.detail.index
        if (index < 0) {
            return
        }
        if (type == 'video') {
            let videoContext = wx.createVideoContext('myVideo')
            let videoPreviewUrl = this.data.coursewareVideos[index].link
            this.setData({
                videoPreviewUrl: videoPreviewUrl
            }, () => {
                setTimeout(() => {
                    videoContext.play()
                }, 10)
            })
        } else if (type == 'image') {
            let url = this.data.coursewareImages[index].link + '!upyun520/fw/3000'
            let urls = []
            this.data.coursewareImages.forEach((ev)=>{
                if (ev.link ) {
                    urls.push(ev.link + '!upyun520/fw/3000')
                }
            })
            wx.previewImage({
                current: url, // 当前显示图片的http链接
                urls: urls, // 需要预览的图片http链接列表
                success: function (res) {
                    console.log('success')
                },
                fail: function (res) {
                    console.log(res)
                },
            })
        }
    },
    itemDelete(e) {
        console.log(e)
        let type = e.currentTarget.dataset.type || ''
        let index = e.detail.index
        if (index < 0) {
            return
        }
        let item = e.detail.data
        if (type == 'video') {
            let reallyIndex = this.data.coursewareVideos.findIndex(ev => {
                return ev.id == item.id
            })
            let dragVideo = this.selectComponent('#drag-video');
            this.data.coursewareVideos.splice(reallyIndex, 1)
            this.setData({
                coursewareVideos: this.data.coursewareVideos
            })
            dragVideo.init();
        } else if (type == 'image') {
            let reallyIndex = this.data.coursewareImages.findIndex(ev => {
                return ev.id == item.id
            })
            let dragImage = this.selectComponent('#drag-image');
            this.data.coursewareImages.splice(reallyIndex, 1)
            this.setData({
                coursewareImages: this.data.coursewareImages,
                imagesLength: this.data.coursewareImages.length
            })
            dragImage.init();
        }
    },
    handleVideoPreviewClose(e) {
        let videoContext = wx.createVideoContext('myVideo')
        videoContext.stop()
        this.setData({
            videoPreviewUrl: ''
        })
    },
    change(e) { },
    sortEnd(e) {
        let type = e.currentTarget.dataset.type || ''
        if (type == 'video') {
            this.setData({
                coursewareVideos: e.detail.listData
            });
        } else if (type == 'image') {
            this.setData({
                coursewareImages: e.detail.listData
            });
        }
    },
    scroll(e) {
        this.setData({
            pageMetaScrollTop: e.detail.scrollTop
        })
    },
    onPageScroll(e) {
        this.setData({
            scrollTop: e.scrollTop
        });
    },


});


