import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";
import screenConfig from '../../utils/screen_util'
const circleModel = require("../../models/circle");
const userShopInfoModel = require('../../models/userShopInfo')
const commentModel = require("../../models/comment");
const tool = require("../../utils/tool");
const util = require('../../utils/util')
const app = getApp();
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + "px",
        navTitle: '写评价',
        isPullDown: false, // 是否下拉操作
        quest_loading: false, // 是否在请求中
        showType: 0, // 1 图片 2 视频
        textMessage: '', // 文字

        coursewareVideos: [], // 视频
        coursewareImages: [], // 图片
        mediasLength: 0,
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
        skuImg: '',
        skuName: '',
        skuPrice: 0,
        skuAttr: '',
        starList: ['非常差', '差', '一般', '好', '非常好'],
        starIndex: 0,
        mediasList: [],
        mediaScrollLeft: 0
    },
    // 不用于数据绑定的全局数据
    tempData: {
        uploadFileList: [],
        uploadFileIndex: 0,
        uploadImgIndex: 0,
        uploadSuccessNum: 0,
        userId: 0,
        shopId: 0,
        orderDetailId: -1,
        left: screenConfig.getPX(200*4 + 40 - 750)
    },

    events: {},

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        if(options.orderDetailId > 0){
            this.tempData.orderDetailId = Number(options.orderDetailId)
        }
        console.log('commentModel.commentParams', commentModel.commentParams)
        if (commentModel.commentParams.skuId) {
            this.setData({
                skuImg: commentModel.commentParams.skuImg,
                skuName: commentModel.commentParams.skuName,
                skuPrice: commentModel.commentParams.skuPrice,
                skuAttr: commentModel.commentParams.skuAttr
            })
        }
        userShopInfoModel
            .queryUserShopInfo({})
            .then((res) => {
                let _obj = res['user_info']
                this.tempData.userId = _obj.user_id
                this.tempData.shopId = _obj.shop_id
            }).catch((err) => {
            console.log('err', err)
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
    },

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

    preventTouchMove() {
    },

    bindInput: function (e) {
        console.log('e', e.detail);
        console.log('textMessage', this.data.textMessage)
    },

    handleDel(e) {
        let _index = Number(e.currentTarget.dataset.index)
        let _list = tool.deepClone(this.data.mediasList)
        _list.splice(_index, 1)
        _list.forEach((ev, i) => {
            ev['id'] = i + '_' + ev.url
        })
        this.setData({
            mediasList: _list,
            mediasLength: _list.length
        },()=>{
            console.log('mediasList', this.data.mediasList)
            setTimeout(()=>{
                this.setMediaScrollLeft()
            },50)
        })
    },

    handleVideoPreviewClose(e) {
        let videoContext = wx.createVideoContext('myVideo')
        videoContext.stop()
        this.setData({
            videoPreviewUrl: ''
        })
    },
    change(e) {
    },
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
    // 评星
    handleClickStar(e) {
        console.log('handleClickStar')
        const _index = Number(e.currentTarget.dataset.index) + 1
        this.setData({
            starIndex: _index
        });
    },
    handelMediaAdd(e) {
        console.log('e=====', e);
        let that = this
        this.tempData.uploadFileList = []
        this.tempData.uploadFileIndex = 0
        this.tempData.uploadSuccessNum = 0
        wx.chooseMedia({
            count: 4 - that.data.mediasList.length,
            mediaType: ['image', 'video'],
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            maxDuration: 60,
            success(res) {
                console.log('res===218', res)
                if (res.errMsg == "chooseMedia:ok") {
                    console.log('res=======220', res)
                    that.tempData.uploadFileList = res.tempFiles
                    const _type = res.type
                    console.log('tempData.uploadFileList', that.tempData.uploadFileList)
                    wx.showLoading({
                        title: '上传中...',
                    })
                    that.uploadMultipleFile(that.tempData.uploadFileList, _type)
                }
            }
        })
    },
    //多张图片、视频上传
    uploadMultipleFile(list, _type) {
        console.log('this.tempData.uploadFileIndex', this.tempData.uploadFileIndex)

        const path = list[this.tempData.uploadFileIndex].tempFilePath
        // const thumbTempFilePath =list[this.tempData.uploadFileIndex].thumbTempFilePath || ''
        // console.log('thumbTempFilePath=====238', thumbTempFilePath)
        // if(thumbTempFilePath){
        //     wx.getFileSystemManager().readFile({
        //         filePath: thumbTempFilePath, //选择图片返回的相对路径
        //         encoding: 'base64', //编码格式
        //         success: res => { //成功的回调
        //             console.log('data:image/png;base64,' + res.data)
        //         }
        //     })
        // }
        //以下两行注释的是同步方法，不过我不太喜欢用。
        //let base64 = wx.getFileSystemManager().readFileSync(res.tempFilePaths[0], 'base64')
        //console.log(base64)

        // list[this.tempData.uploadFileIndex].fileType
        const type = _type
        let that = this
        util.uploadFile(path)
            .then((res) => {
                console.log('输出 ~ res----450', res)
                let result = JSON.parse(res)
                if (result.code == 200) {
                    const file_url = result.data.file_url
                    // let dragImage = that.selectComponent('#drag-image');
                    let lastIndex = that.data.mediasList.length
                    let key = 'mediasList[' + lastIndex + ']'
                    let diffData = {}
                    diffData[key] = {
                        type: _type,
                        id: lastIndex + '_' + file_url,
                        url: file_url,
                        link: file_url,
                    }
                    that.setData({
                        ...diffData,
                    }, () => {
                        console.log('this.data.mediasList.length', that.data.mediasList)
                        that.setData({
                            mediasLength: that.data.mediasList.length
                        })
                        setTimeout(()=>{
                            this.setMediaScrollLeft()
                        },50)
                    })
                    // dragImage.init();
                    that.tempData.uploadSuccessNum++
                    // 上传完成继续上传
                    that.continueUpload(_type)
                } else {
                    // 上传失败继续上传
                    that.continueUpload(_type)
                }
            })
            .catch((err) => {
                // 上传失败继续上传
                that.continueUpload(_type)
            })
    },
    // 已完成or继续上传
    continueUpload(_type) {
        let title_text = '上传成功！',
            err_count = 0
        this.tempData.uploadFileIndex++
        if (this.tempData.uploadFileIndex == this.tempData.uploadFileList.length) {
            console.log('结束了')
            wx.hideLoading()
            if (this.tempData.uploadSuccessNum < this.tempData.uploadFileList.length) {
                err_count = this.tempData.uploadFileList.length - this.tempData.uploadSuccessNum
                title_text = '上传成功' + this.tempData.uploadSuccessNum + '，失败' + err_count
                console.log('err_count', err_count)
            }
            wx.showToast({
                title: title_text,
                duration: 1500,
                success: function () {
                }
            });
        } else {
            console.log('不，还没结束呢')
            this.uploadMultipleFile(this.tempData.uploadFileList, _type)
        }
    },

    previewImage: function (e) {
        // 获取data-src
        var src = e.currentTarget.dataset.src
        // 获取data-list
        const img_list = this.data.mediasList.filter((item) => {
            return item.type == 'image'
        })
        console.log('img_list', img_list)
        var imgList = img_list.map((item) => item.url)
        wx.previewImage({
            current: src, // 当前显示图片的http链接
            urls: imgList, // 需要预览的图片http链接列表
            success: function (res) {
                console.log('success')
            },
            fail: function (res) {
                console.log('fail')
            },
        })
    },
    /**
     * 点击发布
     */
    handleOnPublish() {
        if (this.data.starIndex < 1) {
            wx.showToast({
                title: "请选择星级",
                icon: "none",
                mask: true,
                duration: 2000,
            });
            return
        }
        if (!this.data.textMessage) {
            wx.showToast({
                title: "请填写评价",
                icon: "none",
                mask: true,
                duration: 2000,
            });
            return
        }
        if (this.data.quest_loading) {
            return;
        }
        this.setData({
            quest_loading: true,
        });
        console.log('commentModel.commentParams.', commentModel.commentParams)
        let params = {
            orderNo: commentModel.commentParams.order_no, // 订单编号
            orderDetailId: commentModel.commentParams.order_id, // 订单详情id
            shopId: this.tempData.shopId, // 店铺id
            goodsId: commentModel.commentParams.goodsId,
            skuId: commentModel.commentParams.skuId,
            skuName: commentModel.commentParams.skuName,
            skuImg: commentModel.commentParams.skuImg,
            skuAttr: commentModel.commentParams.skuAttr,
            price: commentModel.commentParams.skuPrice,
            rate: this.data.starIndex,
            message: this.data.textMessage,
            medias: []
        }
        this.data.mediasList.forEach((ev, i) => {
            let _obj = {
                type: ev.type == 'image' ? 2 : 1,
                title: '',
                link: ev.link,
                sort: i
            }
            params['medias'].push(_obj)
        })
        console.log('params', params)
        const _this = this;
        wx.showLoading({
            title: "发布中...",
        });
        commentModel.creatComment(params).then((res) => {
            console.log('res', res)
            wx.hideLoading()
            wx.showToast({
                title: "发布成功",
                icon: "none",
                mask: true,
                duration: 2000,
            });
            console.log('this.tempData.orderDetailId', this.tempData.orderDetailId)
            if (this.tempData.orderDetailId > 0) {
                this.post({
                    eventName: "commentSuccess",
                    eventParams: this.tempData.orderDetailId,
                });
            }
            setTimeout(() => {
                _this.setData({
                    quest_loading: false,
                });
                if (this.tempData.orderDetailId > 0) {
                    console.log('返回上一页')
                    // 返回上一页
                    wx.navigateBack({
                        delta: 1,
                    });
                } else {
                    console.log('跳转到我的评价')
                    // 跳转到我的评价
                    wx.navigateTo({
                        url: '/packageMainSecondary/comment/commentList',
                    })
                }

            }, 1000);
        }).catch(err => {
            _this.setData({
                quest_loading: false,
            });
            console.log('err', err)
        })

    },

    mediaScroll(event){
        // console.log('event.detail ', event.detail);
        // console.log('mediaScrollLeft', this.data.mediaScrollLeft)
    },

    setMediaScrollLeft() {
        const _left = this.tempData.left
        if(this.data.mediasList.length > 2 && this.data.mediaScrollLeft < _left){
            console.log('_left', _left)
            this.setData({
                mediaScrollLeft: _left
            });
        } else if(this.data.mediasList.length < 3 && this.data.mediaScrollLeft > 0){
            this.setData({
                mediaScrollLeft: 0
            });
        }
    }
});


