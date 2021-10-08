import screenConfig from '../../utils/screen_util'

const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)

const teamworkModel = require('../../models/teamwork')
const util = require('../../utils/util')
const tool = require("../../utils/tool");
const upyun = require('../../utils/upyun_wxapp_sdk')
const app = getApp();

Page({
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46,
        safeAreaInsetBottom: safeAreaInsetBottom,
        coursewareVideos: [],
        coursewareImages: [],
        imagesLength: 0,
        videosLength: 0,
        pageMetaScrollTop: 0,
        size: 4,
        extraNodes: [
            {
                type: "after",
                dragId: "plus",
                slot: "plus",
                fixed: true
            }
        ],
        videoPreviewUrl: '',
        active: 0,
        movableViewPosition: {
            x: 0,
            y: 0,
            className: 'none',
            data: {},
        },
        scrollPosition: {
            everyOptionCell: screenConfig.getPX(250),
            everyOptionHeight: screenConfig.getPX(220),
            top: Number(app.globalData.statusBarHeight) + 46 + screenConfig.getPX(100),
            scrollTop: 0,
            scrollY: true,
            scrollViewHeight: 0,
            scrollViewWidth: 375,
            windowViewHeight: 1000,
        },
        selectItemInfo: {
            url: '',
            title: '',
            id: '',
            selectIndex: -1,
            selectPosition: 0,
        },
        movable: false,
        textareaPlaceholder: '请输入视频名称',
        optionsListData: [],
    },
    // 不用于数据绑定的全局数据
    tempData: {
        isFirst: true,
        courseId: -1,
        uploadList: [],
        uploadIndex: 0,
        uploadSuccessNum: 0,
        scrollTop: 0,
        scrollBefore: 0,
        selectItemInfoY: 0,
        variableNum: 1,
        ios: false,
    },
    onLoad: function (options) {
        let phone = wx.getSystemInfoSync()
        if (phone.platform == 'ios') {
            this.tempData.ios = true
        }
        let courseId = Number(options.course_id || '-1')
        if (courseId >= 0) {
            this.tempData.courseId = courseId
            this.loadCourseMedia()
        }
    },
    onReady: function () {
    },
    onShow: function () {
    },
    onHide: function () {
    },
    onPullDownRefresh: function () {
    },
    onReachBottom: function () {
    },
    loadCourseMedia: function () {
        wx.showLoading({
            title: '加载中...',
        })
        let params = {
            course_id: this.tempData.courseId
        }
        teamworkModel.courseMediaList(params)
            .then(res => {
                wx.hideLoading()
                let coursewareVideos = []
                let coursewareImages = []
                const list = res.sort(function (a, b) {
                    return a.sort - b.sort
                })
                list.forEach((element, i) => {
                    if (element.type == 1) {
                        coursewareVideos.push({
                            id: element.id ? element.id : i + '_' + element.link,
                            url: element.video_img_url,
                            link: element.link,
                            title: element.title,
                            variableNum: element.id ? element.id : i + '_' + element.link
                        })
                    } else if (element.type == 2) {
                        coursewareImages.push({
                            id: element.id ? element.id : i + '_' + element.link,
                            url: element.link,
                            link: element.link,
                            title: element.title,
                        })
                    }
                })
                this.setData({
                    coursewareVideos: coursewareVideos,
                    coursewareImages: coursewareImages,
                    imagesLength: coursewareImages.length,
                    videosLength: coursewareVideos.length
                }, () => {
                    console.log('coursewareVideos', coursewareVideos)
                    this.setScrollPosition()
                })
            })
            .catch(err => {
                wx.hideLoading()
            })
    },
    //保存
    handleSave: function () {
        let params = {
            course_id: this.tempData.courseId,
            data: []
        }
        let offset = 0
        this.data.coursewareVideos.forEach((ev, index) => {
            params.data.push({
                type: 1,
                title: ev.title,
                link: ev.link,
                sort: offset + index
            })
        })
        offset = this.data.coursewareVideos.length
        this.data.coursewareImages.forEach((ev, index) => {
            params.data.push({
                type: 2,
                title: ev.title,
                link: ev.link,
                sort: offset + index
            })
        })
        wx.showLoading({
            title: '保存中...',
        })
        teamworkModel.courseMediaUpdate(params)
            .then(res => {
                wx.hideLoading()
                wx.showToast({
                    title: '保存成功',
                    duration: 1500
                });
                setTimeout(() => {
                    const eventChannel = this.getOpenerEventChannel()
                    if (eventChannel) {
                        eventChannel.emit('updateCourseMedia');
                    }
                }, 500)
                setTimeout(() => {
                    wx.navigateBack({
                        delta: 1,
                    })
                }, 1500)

            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    //添加视频
    handelVideoAdd: function () {
        this.tempData.uploadList = []
        this.tempData.uploadIndex = 0
        this.tempData.uploadSuccessNum = 0
        let that = this
        wx.chooseMedia({
            count: 9,
            mediaType: ['video'],
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                if (res.errMsg == "chooseMedia:ok") {
                    that.tempData.uploadList = res.tempFiles
                    wx.showLoading({
                        title: '上传中...',
                    })
                    const _type = 'video'
                    that.uploadImgFile(that.tempData.uploadList, _type)
                }
            }
        })
    },
    //添加图片
    handelImageAdd: function () {
        let that = this
        this.tempData.uploadList = []
        this.tempData.uploadIndex = 0
        this.tempData.uploadSuccessNum = 0
        wx.chooseImage({
            count: 100,
            sizeType: ['original'],
            sourceType: ['album', 'camera'],
            success(res) {
                if (res.errMsg == "chooseImage:ok") {
                    that.tempData.uploadList = res.tempFilePaths
                    wx.showLoading({
                        title: '上传中...',
                    })
                    const _type = 'image'
                    that.uploadImgFile(that.tempData.uploadList, _type)
                }
            }
        })
    },
    //多张图片上传
    uploadImgFile(list, type) {
        let path = type == 'image' ? list[this.tempData.uploadIndex] : list[this.tempData.uploadIndex].tempFilePath
        let that = this
        /*util.uploadFile(path)
            .then((res) => {
                console.log('输出 ~ res', res)
                let result = JSON.parse(res)
                // wx.hideLoading()
                if (result.code == 200) {
                    const file_url = result.data.file_url
                    let lastIndex = 0, key
                    if (type == 'image') {
                        lastIndex = that.data.coursewareImages.length
                        key = 'coursewareImages[' + lastIndex + ']'
                    } else {
                        lastIndex = that.data.coursewareVideos.length
                        key = 'coursewareVideos[' + lastIndex + ']'
                    }
                    let diffData = {}
                    diffData[key] = {
                        id: lastIndex + '_' + file_url,
                        url: file_url,
                        link: file_url,
                        title: '',
                        variableNum: lastIndex + '_' + file_url
                    }
                    that.setData({
                        ...diffData,
                    }, () => {
                        that.setData({
                            imagesLength: that.data.coursewareImages.length,
                            videosLength: that.data.coursewareVideos.length,
                        })
                    })
                    that.tempData.uploadSuccessNum++
                    // 上传完成or继续上传
                    that.continueUpload(type)
                } else {
                    // 上传完成or继续上传
                    that.continueUpload(type)
                }
            })
            .catch((err) => {
                // 上传完成or继续上传
                that.continueUpload(type)
            })*/
        upyun.upload(path, 80)
            .then((result) => {
                console.log('输出 ~ result', result)
                if (result.code == 200) {
                    const file_url = result.data.file_url
                    let lastIndex = 0, key
                    if (type == 'image') {
                        lastIndex = that.data.coursewareImages.length
                        key = 'coursewareImages[' + lastIndex + ']'
                    } else {
                        lastIndex = that.data.coursewareVideos.length
                        key = 'coursewareVideos[' + lastIndex + ']'
                    }
                    let diffData = {}
                    diffData[key] = {
                        id: lastIndex + '_' + file_url,
                        url: file_url,
                        link: file_url,
                        title: '',
                        variableNum: lastIndex + '_' + file_url
                    }
                    that.setData({
                        ...diffData,
                    }, () => {
                        that.setData({
                            imagesLength: that.data.coursewareImages.length,
                            videosLength: that.data.coursewareVideos.length,
                        })
                    })
                    that.tempData.uploadSuccessNum++
                    // 上传完成or继续上传
                    that.continueUpload(type)
                } else {
                    // 上传完成or继续上传
                    that.continueUpload(type)
                }
            }).catch((err) => {
            that.continueUpload(type)
        })
    },
    // 上传完成or继续上传
    continueUpload(type) {
        let title_text = '上传成功！',
            err_count = 0
        this.tempData.uploadIndex++
        if (this.tempData.uploadIndex == this.tempData.uploadList.length) {
            console.log('结束了')
            wx.hideLoading()
            if (this.tempData.uploadSuccessNum < this.tempData.uploadList.length) {
                err_count = this.tempData.uploadList.length - this.tempData.uploadSuccessNum
                title_text = '上传成功' + this.tempData.uploadSuccessNum + '，失败' + err_count
                console.log('err_count', err_count)
            }
            this.setData({
                imagesLength: this.data.coursewareImages.length,
                videosLength: this.data.coursewareVideos.length,
            })
            this.setScrollPosition()
            wx.showToast({
                title: title_text,
                duration: 1500,
                success: function () {
                }
            });
        } else {
            console.log('不，还没结束呢')
            this.uploadImgFile(this.tempData.uploadList, type)
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
                if (result.code == 200) {
                    teamworkModel.getVideoPic(result.data.file_url)
                        .then(res => {
                            wx.hideLoading()
                            if (callback) {
                                callback(result.data.file_url, res)
                            }
                        })
                } else {
                    wx.hideLoading()
                    wx.showToast({
                        title: '图片上传失败',
                        icon: 'none',
                        duration: 2000,
                    })
                }
            })
            .catch((err) => {

                wx.hideLoading()
                wx.showToast({
                    title: err,
                    icon: 'none',
                    duration: 2000,
                })
            })
    },
    itemDelete(e) {
        console.log(e)
        let type = e.currentTarget.dataset.type || ''
        let index = Number(e.currentTarget.dataset.index)
        if (index < 0) {
            return
        }
        if (type == 'video') {
            let new_list = tool.deepClone(this.data.coursewareVideos)
            new_list.splice(index, 1)
            this.setData({
                coursewareVideos: new_list
            }, () => {
                this.setData({
                    videosLength: this.data.coursewareVideos.length
                })
                this.setScrollPosition()
            })
        } else if (type == 'image') {
            let new_list = tool.deepClone(this.data.coursewareImages)
            new_list.splice(index, 1)
            this.setData({
                coursewareImages: new_list
            }, () => {
                this.setData({
                    imagesLength: this.data.coursewareImages.length,
                    videosLength: this.data.coursewareVideos.length,
                })
                this.setScrollPosition()
            })
        }
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

    onPageScroll(e) {
        this.tempData.scrollTop = e.scrollTop
    },
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


    bindScroll: function (event) {
        console.log('bindScroll', event)
    },
    getOptionInfo: function (code) {
        let _list = []
        if (this.data.active > 0) {
            _list = this.data.coursewareImages
        } else {
            _list = this.data.coursewareVideos
        }
        for (let i = 0, j = _list.length; i < j; i++) {
            let optionData = _list[i]
            if (optionData.id == code) {
                optionData.selectIndex = i
                return optionData
            }
        }
        return {}
    },

    getPositionDomByXY: function (potions) {
        const top = screenConfig.getPX(100) + Number(app.globalData.statusBarHeight) + 46
        let y = potions.y - top
        let optionsListData = this.data.coursewareImages
        if (this.data.active == 0) {
            optionsListData = this.data.coursewareVideos
        }
        let everyOptionCell = this.data.scrollPosition.everyOptionCell
        for (let i = 0, j = optionsListData.length; i < j; i++) {
            if (y >= i * everyOptionCell && y < (i + 1) * everyOptionCell) {
                return optionsListData[i]
            }
        }
        return optionsListData[0]
    },

    draggleTouch: function (event) {
        let touchType = event.type
        switch (touchType) {
            case 'touchstart':
                console.log('拖动前this.data.coursewareVideos', this.data.coursewareVideos)
                this.scrollTouchStart(event)
                break
            case 'touchmove':
                this.scrollTouchMove(event)
                break
            case 'touchend':
                this.scrollTouchEnd(event)
                break
        }
    },
    scrollTouchStart: function (event) {
        let firstTouchPosition = {
            x: event.changedTouches[0].pageX,
            y: event.changedTouches[0].pageY,
        }
        let domData = this.getPositionDomByXY(firstTouchPosition)
        //movable-area滑块位置处理
        let movableX = 0
        let movableY = firstTouchPosition.y - this.data.scrollPosition.top - (this.data.scrollPosition.everyOptionCell / 2)
        console.log('domData=======475', domData)
        let secCode = domData.id
        let secInfo = this.getOptionInfo(secCode)
        secInfo.selectPosition = event.changedTouches[0].clientY
        this.tempData.selectItemInfoY = event.changedTouches[0].clientY
        secInfo.selectClass = 'dragSelected'

        let optionsListData = []
        if (this.data.active > 0) {
            this.data.coursewareImages[secInfo.selectIndex].selectClass = 'dragSelected'
            optionsListData = this.data.coursewareImages
        } else {
            this.data.coursewareVideos[secInfo.selectIndex].selectClass = 'dragSelected'
            optionsListData = this.data.coursewareVideos
        }
        console.log('secInfo', secInfo)
        if (this.data.active > 0) {
            this.setData({
                movableViewPosition: {
                    x: movableX,
                    y: movableY,
                    className: '',
                    data: domData,
                },
                movable: true,
                'scrollPosition.scrollY': false,
                selectItemInfo: secInfo,
                'scrollPosition.selectIndex': secInfo.selectIndex,
                coursewareImages: optionsListData
            })
        } else {
            this.setData({
                movableViewPosition: {
                    x: movableX,
                    y: movableY,
                    className: '',
                    data: domData,
                },
                movable: true,
                'scrollPosition.scrollY': false,
                selectItemInfo: secInfo,
                'scrollPosition.selectIndex': secInfo.selectIndex,
                coursewareVideos: optionsListData
            })
        }
    },
    scrollTouchMove: function (event) {
        let selectItemInfo = this.data.selectItemInfo
        let selectPosition = selectItemInfo.selectPosition
        let moveDistance = event.changedTouches[0].clientY
        let everyOptionCell = this.data.scrollPosition.everyOptionCell
        let optionsListData = this.data.coursewareVideos
        let selectIndex = selectItemInfo.selectIndex

        if (this.data.active > 0) {
            optionsListData = this.data.coursewareImages
        }
        //movable-area滑块位置处理
        let movableX = 0
        let movableY = event.changedTouches[0].pageY - this.data.scrollPosition.top - this.data.scrollPosition.everyOptionCell / 2

        this.setData({
            movableViewPosition: {
                x: movableX,
                y: movableY,
                className: '',
                data: this.data.movableViewPosition.data,
            },
        },()=>{
            // console.log('移动中 x', this.data.movableViewPosition.x)
            // console.log('移动中 y', this.data.movableViewPosition.y)
        })
        // return
        // console.log('selectIndex', selectIndex)
        // console.log('moveDistance', moveDistance)
        // console.log('selectPosition', selectPosition)
        // console.log('moveDistance - selectPosition', moveDistance - selectPosition)
        if (moveDistance - selectPosition > 0 && selectIndex < optionsListData.length - 1) {
            // console.log('moveDistance - selectPosition========', moveDistance - selectPosition)
            if (optionsListData[selectIndex].id == selectItemInfo.id) {
                // console.log('向上')
                optionsListData.splice(selectIndex, 1)
                optionsListData.splice(++selectIndex, 0, selectItemInfo)
                selectPosition += everyOptionCell
                this.tempData.selectItemInfoY += everyOptionCell
            }
        }

        if (moveDistance - selectPosition < 0 && selectIndex > 0) {
            // console.log('moveDistance - selectPosition？？？？', moveDistance - selectPosition)
            if (optionsListData[selectIndex].id == selectItemInfo.id) {
                // console.log('向下')
                optionsListData.splice(selectIndex, 1)
                optionsListData.splice(--selectIndex, 0, selectItemInfo)
                selectPosition -= everyOptionCell
            }
        }
        if (this.data.active > 0) {
            this.setData({
                'selectItemInfo.selectPosition': selectPosition,
                'selectItemInfo.selectIndex': selectIndex,
                coursewareImages: optionsListData
            })
        } else {
            this.setData({
                'selectItemInfo.selectPosition': selectPosition,
                'selectItemInfo.selectIndex': selectIndex,
                coursewareVideos: optionsListData
            })
        }
    },
    scrollTouchEnd: function (event) {
        console.log('输出 ~ scrollTouchEnd')
        let optionsListData = this.optionsDataTranlate(this.data.coursewareVideos, '')
        if (this.data.active > 0) {
            optionsListData = this.optionsDataTranlate(this.data.coursewareImages, '')
        }
        this.tempData.variableNum++
        if(!this.tempData.ios){
            optionsListData.forEach((ev)=>{
                ev['variableNum'] = ev['variableNum'] +'_'+ this.tempData.variableNum
            })
        }
        if (this.data.active > 0) {
            this.setData({
                movable: false,
                'scrollPosition.scrollY': true,
                'movableViewPosition.className': 'none',
                coursewareImages: optionsListData
            })
        } else {
            this.setData({
                movable: false,
                'scrollPosition.scrollY': true,
                'movableViewPosition.className': 'none',
                coursewareVideos: optionsListData
            },()=>{
                console.log('拖动后this.data.coursewareVideos', this.data.coursewareVideos)
            })
        }

        console.log('optionsListData', optionsListData)
    },
    optionsDataTranlate: function (optionsList, selectClass) {
        for (let i = 0, j = optionsList.length; i < j; i++) {
            optionsList[i].selectClass = selectClass
        }
        return optionsList
    },

    setScrollPosition() {
        let _length = 0
        if (this.data.active > 0) {
            _length = this.data.coursewareImages.length
        } else {
            _length = this.data.coursewareVideos.length
        }
        const _height = screenConfig.getPX(250) * _length
        this.setData({
            'scrollPosition.scrollViewHeight': _height,
        })
    },
    onInput(e) {
        const _id = e.currentTarget.dataset.id
        let diffData = {}
        let lists = this.data.active > 0 ? this.data.coursewareImages : this.data.coursewareVideos
        lists.forEach((item, index) => {
            let key = 'listData[' + index + ']'
            diffData[key] = item
            if (item.id == _id) {
                item['title'] = e.detail.value
            }
        })
        if (this.data.active > 0) {
            this.setData({
                coursewareImages: lists
            })
        } else {
            this.setData({
                coursewareVideos: lists
            })
        }
    },
    onFocus(e) {
        const height = wx.getSystemInfoSync().windowHeight
        const _index = Number(e.currentTarget.dataset.index)
        const query = wx.createSelectorQuery();
        const dom = '#media-'+_index
        query.select(dom).boundingClientRect();
        query.exec((res) => {
            // 这个节点距离顶部的距离   和距离底部的距离
            const menuBottom = res[0].bottom;
            if(height - menuBottom < e.detail.height && e.detail.height  > 0){
                this.tempData.scrollBefore = this.tempData.scrollTop
                let scroll_height = this.tempData.scrollTop + e.detail.height - screenConfig.getSafeAreaBottomPadding() - screenConfig.getPX(80)
                this.setData({
                    placeholderHeight: scroll_height
                },()=>{
                    wx.pageScrollTo({
                        scrollTop: scroll_height,
                        duration: 50,
                    })
                })
            }
        })
    },
    onBlur() {
        this.setData({
            placeholderHeight: 0
        },()=>{
            wx.pageScrollTo({
                scrollTop: this.tempData.scrollBefore,
                duration: 50,
            })
        })
    },
    handelAddMedia() {
        if (this.data.active > 0) {
            this.handelImageAdd()
        } else {
            this.handelVideoAdd()
        }
    },
    /*tab切换*/
    onChange(event) {
        this.setData({
            active: Number(event.detail.name),
            textareaPlaceholder: event.detail.name > 0 ? '请输入图片名称' : '请输入视频名称'
        }, () => {
            this.setScrollPosition()
        })
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 300,
        })
    },
    // 预览图片
    previewImage: function (e) {
        // 获取data-src
        let src = e.currentTarget.dataset.src ? (e.currentTarget.dataset.src + '!upyun520/fw/3000') : ''
        // 获取data-list
        let img_list = this.data.coursewareImages
        let imgList = []
        img_list.forEach((ev)=>{
            if (ev.url) {
                imgList.push(item.url + '!upyun520/fw/3000')
            }
        })
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
})