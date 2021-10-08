import screenConfig from '../../utils/screen_util'

const upyun = require('../../utils/upyun_wxapp_sdk')

const util = require('../../utils/util')
const tool = require('../../utils/tool')
const tutorialModel = require('../../models/tutorial')
const configModel = require('../../config/config')
const app = getApp()

App.Page({
    data: {
        navHeight: screenConfig.getRPX(Number(app.globalData.statusBarHeight) + 46),
        tutorialId: 0,
        images: [],
        materialList: [],
        courseList: [],
        introduceContent: '',
        approveStatus: 0, //1待审核 2通过 3拒绝
        approveReason: '',
        pageMetaScrollTop: 0,
        scrollTop: 0,
        size: 3,
        extraNodes: [
            {
                type: 'after',
                dragId: 'plus',
                slot: 'plus',
                fixed: true,
            },
        ],
        limit: 9,
        showGuide: false,
        guideStep: 0,
        courseAddOffset: 0,
        courseAddTop: 0,
        isEdit: false,
    },
    // 不用于数据绑定的全局数据
    tempData: {
        uploadList: [],
        uploadIndex: 0,
        uploadSuccessNum: 0,
        preDetail: null,
    },
    onLoad: function (options) {
        console.log(options)
        let tutorialId = Number(options.id || '0')
        this.data.tutorialId = tutorialId
        if (tutorialId > 0) {
            //编辑
            wx.showLoading({
                title: '加载中...',
            })
            tutorialModel
                .tutorialDetail(tutorialId)
                .then((res) => {
                    //备份看看详情数据
                    //再次发布时比较时需要
                    this.tempData.preDetail = res
                    //已经通过id获取到发布的看看的信息，意味者不可能是第一次发布看看
                    tutorialModel.setIsFirstPublish(false)
                    wx.hideLoading()
                    let materialList = res.material_list || []
                    let images = res.show_img_list || []
                    let steps = res.steps || []
                    let tutorial = res.tutorial
                    //介绍以及状态
                    let data = {
                        tutorialId: tutorialId,
                        introduceContent: tutorial.summary,
                        approveStatus: tutorial.approve_status,
                        approveReason: tutorial.approve_reason,
                    }
                    //成品图排序
                    images.sort((a, b) => {
                        return a.sort - b.sort
                    })
                    //转换
                    images = images.map((ev) => {
                        return {
                            ...ev,
                            id: ev.id + '_' + ev.img_url,
                            url: ev.img_url,
                        }
                    })
                    //教程排序
                    steps.sort((a, b) => {
                        return a.sort - b.sort
                    })
                    //转换
                    let courseList = steps.map((ev) => {
                        return {
                            ...ev,
                            img: ev.img_url,
                            description: ev.summary,
                        }
                    })
                    let dragImage = this.selectComponent('#drag-image')
                    let extraNodes = []
                    if (images.length < this.data.limit) {
                        extraNodes = [
                            {
                                type: 'after',
                                dragId: 'plus',
                                slot: 'plus',
                                fixed: true,
                            },
                        ]
                    }
                    this.setData({
                        ...data,
                        images: images,
                        extraNodes: extraNodes,
                        materialList: materialList,
                        courseList: courseList,
                        showGuide: false,
                        isEdit: true,
                    })
                    dragImage.init()
                })
                .catch((err) => {
                    console.log(err)
                    wx.hideLoading()
                    let dragImage = this.selectComponent('#drag-image')
                    dragImage.init()
                })
        } else {
            //创建
            if (tutorialModel.isFirstPublish()) {
                let dragImage = this.selectComponent('#drag-image')
                this.setData({
                    isEdit: false,
                    showGuide: true,
                    guideStep: 1,
                })
                dragImage.init()
            }
        }
    },
    onReady: function () {
        let query = wx.createSelectorQuery().in(this)
        query.selectViewport().scrollOffset()
        query
            .select('#courseAdd')
            .boundingClientRect()
            .exec((res) => {
                console.log(res)
                var miss = res[0].scrollTop + res[1].top
                this.setData({
                    courseAddOffset: miss,
                })
            })
    },
    handleGuideNext: function (e) {
        let guideStep = this.data.guideStep
        guideStep += 1
        let that = this
        if (guideStep == 4) {
            //制作教程
            wx.pageScrollTo({
                scrollTop: that.data.courseAddOffset,
                duration: 0,
                complete: function (res) {
                    wx.createSelectorQuery()
                        .select('#courseAdd')
                        .boundingClientRect((rect) => {
                            that.setData({
                                courseAddTop: screenConfig.getRPX(rect.top),
                                guideStep: guideStep,
                            })
                        })
                        .exec()
                },
            })
        } else if (guideStep >= 5) {
            //引导完成
            tutorialModel.setIsFirstPublish(false)
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 0,
                complete: function (res) {
                    that.setData({
                        showGuide: false,
                        guideStep: guideStep,
                    })
                },
            })
        } else {
            that.setData({
                guideStep: guideStep,
            })
        }
    },
    // 看看介绍
    handleEditIntroductionContent: function () {
        if (this.data.showGuide) {
            return
        }
        let that = this
        let introduceContent = this.data.introduceContent
        wx.navigateTo({
            url: '/packageKanKan/introduce/introduce',
            events: {
                introduceConrentEdit: function (e) {
                    that.setData({
                        introduceContent: e,
                    })
                },
            },
            success: function (res) {
                res.eventChannel.emit('introduceContent', introduceContent)
            },
        })
    },
    // 材料清单
    handleMaterialManage: function () {
        if (this.data.showGuide) {
            return
        }
        let that = this
        let materialList = this.data.materialList
        wx.navigateTo({
            url: '/packageKanKan/material/material',
            events: {
                materialEdit: function (e) {
                    console.log('materialEdit', e)
                    that.setData({
                        materialList: e,
                    })
                },
            },
            success: function (res) {
                res.eventChannel.emit('checkedMaterialList', { checkedList: materialList })
            },
        })
    },
    // 制作教程
    handleCourseEdit: function () {
        if (this.data.showGuide) {
            return
        }
        let that = this
        let courseList = that.data.courseList
        wx.navigateTo({
            url: '/packageKanKan/course/course',
            events: {
                courseEdit: function (e) {
                    console.log('courseEdit', e)
                    that.setData({
                        courseList: e,
                    })
                },
            },
            success: function (res) {
                console.log(res)
                res.eventChannel.emit('courseList', { courseList: courseList })
            },
        })
    },
    //删除
    handleDelete: function (e) {
        //删除看看
        if (this.data.isEdit && this.data.tutorialId > 0) {
            wx.showLoading({
                title: '加载中...',
            })
            tutorialModel
                .tutorialDelete({
                    tutorial_id: this.data.tutorialId,
                })
                .then((res) => {
                    wx.hideLoading()
                    const eventChannel = this.getOpenerEventChannel()
                    if (eventChannel && eventChannel.emit) {
                        eventChannel.emit('updateList', true)
                    }
                    wx.navigateBack({
                        delta: 1,
                    })
                })
                .catch((err) => {
                    console.log(err)
                    wx.hideLoading()
                })
        }
    },
    //发布
    handleSave: function (e) {
        let materialList = this.data.materialList
        let images = this.data.images
        let courseList = this.data.courseList
        if (materialList.length == 0) {
            wx.showToast({
                title: '请添加材料',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        if (images.length == 0) {
            wx.showToast({
                title: '请添加成品图',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        if (this.data.introduceContent == 0) {
            wx.showToast({
                title: '请添加介绍',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        //精简post数据
        materialList = materialList.map((material) => {
            return {
                id: material.id,
                goods_id: material.goods_id,
                sku_id: material.sku_id,
            }
        })
        images = images.map((image, index) => {
            return {
                img_url: image.url,
                sort: index,
            }
        })
        courseList = courseList.map((course, index) => {
            return {
                summary: course.description,
                img_url: course.img,
                sort: index,
            }
        })
        let params = {
            id: this.data.tutorialId,
            shop_id: configModel.shopId,
            material_list: materialList,
            show_img_list: images,
            steps: courseList,
            summary: this.data.introduceContent,
        }
        if (this.data.isEdit) {
            //编辑模式下，需要比较更新的内容
            let preDetail = this.tempData.preDetail
            let obj = {
                material_list: params.material_list.map((ev) => {
                    return ev.sku_id
                }),
                show_img_list: params.show_img_list.map((ev) => {
                    return ev.img_url
                }),
                steps: params.steps.map((ev) => {
                    return {
                        img_url: ev.img_url,
                        summary: ev.summary,
                    }
                }),
                summary: params.summary,
            }
            let comparedObj = {
                material_list: preDetail.material_list.map((ev) => {
                    return ev.sku_id
                }),
                show_img_list: preDetail.show_img_list.map((ev) => {
                    return ev.img_url
                }),
                steps: preDetail.steps.map((ev) => {
                    return {
                        img_url: ev.img_url,
                        summary: ev.summary,
                    }
                }),
                summary: preDetail.tutorial.summary,
            }
            if (tool.objectEquals(obj, comparedObj)) {
                console.log('两次提交的数据一致')
                //两次提交的数据一致,不重复提交
                //直接显示提交成功
                wx.redirectTo({
                    url: '/packageKanKan/audit/audit',
                })
                return
            }
        }
        wx.showLoading({
            title: '加载中...',
        })
        tutorialModel
            .tutorialSave(params)
            .then((res) => {
                wx.hideLoading()
                //发布成功，通知更新并跳转
                const eventChannel = this.getOpenerEventChannel()
                if (eventChannel && eventChannel.emit) {
                    eventChannel.emit('updateList', false)
                }
                this.post({
                    eventName: 'getKankanIndexRefresh',
                    eventParams: '',
                })
                wx.redirectTo({
                    url: '/packageKanKan/audit/audit',
                })
            })
            .catch((err) => {
                console.log(err)
                wx.hideLoading()
            })
    },
    //添加成品
    handelImageAdd: function (e) {
        if (this.data.showGuide) {
            return
        }
        console.log(e)
        let that = this
        this.tempData.uploadList = []
        this.tempData.uploadIndex = 0
        this.tempData.uploadSuccessNum = 0
        wx.chooseImage({
            count: 9 - this.data.images.length,
            sizeType: ['original'],
            sourceType: ['album', 'camera'],
            success(res) {
                console.log(res)
                if (res.errMsg == 'chooseImage:ok') {
                    that.tempData.uploadList = res.tempFilePaths
                    wx.showLoading({
                        title: '上传中...',
                    })
                    that.uploadImgFile(that.tempData.uploadList)
                }
            },
        })
    },
    //多张图片上传
    uploadImgFile(list) {
        let path = list[this.tempData.uploadIndex]
        let that = this
        upyun.upload(path, 80)
            .then((res) => {
                console.log('输出 ~ res', res)
                if (res.code == 200) {
                    const file_url = res.data.file_url
                    let lastIndex = 0, key
                    lastIndex = that.data.images.length
                    key = 'images[' + lastIndex + ']'
                    let diffData = {
                        [key]: {
                            id: lastIndex + '_' + file_url,
                            url: file_url,
                        },
                    }
                    that.setData({
                        ...diffData,
                    })
                    that.tempData.uploadSuccessNum++
                    // 上传完成or继续上传
                    that.continueUpload()
                } else {
                    // 上传完成or继续上传
                    that.continueUpload()
                }
            }).catch((err) => {
                console.log(err)
                // 上传完成or继续上传
                that.continueUpload()
            })
    },
    // 上传完成or继续上传
    continueUpload() {
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
            let dragImage = this.selectComponent('#drag-image')
            let extraNodes = []
            if (this.data.images.length < this.data.limit) {
                extraNodes = [
                    {
                        type: 'after',
                        dragId: 'plus',
                        slot: 'plus',
                        fixed: true,
                    },
                ]
            }
            this.setData({
                extraNodes: extraNodes,
            })
            dragImage.init()
            wx.showToast({
                title: title_text,
                duration: 1500,
                success: function () { },
            })
        } else {
            console.log('不，还没结束呢')
            console.log('输出 ~ uploadList', this.tempData.uploadList)
            console.log('uploadIndex', this.tempData.uploadIndex)
            this.uploadImgFile(this.tempData.uploadList)
        }
    },
    itemClick: function (e) {
        console.log(e)
        let index = e.detail.index
        if (index < 0) {
            return
        }
        let url = this.data.images[index].url + '!upyun520/fw/3000'
        let urls = this.data.images.map((ev) => ev.url + '!upyun520/fw/3000')
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
    },
    itemDelete(e) {
        console.log(e)
        let index = e.detail.index
        if (index < 0) {
            return
        }
        let item = e.detail.data
        let reallyIndex = this.data.images.findIndex((ev) => {
            return ev.id == item.id
        })
        let dragImage = this.selectComponent('#drag-image')
        this.data.images.splice(reallyIndex, 1)
        let extraNodes = []
        if (this.data.images.length < this.data.limit) {
            extraNodes = [
                {
                    type: 'after',
                    dragId: 'plus',
                    slot: 'plus',
                    fixed: true,
                },
            ]
        }
        this.setData({
            images: this.data.images,
            extraNodes: extraNodes,
        })
        dragImage.init()
    },
    change(e) { },
    sortEnd(e) {
        this.setData({
            images: e.detail.listData,
        })
    },
    scroll(e) {
        this.setData({
            pageMetaScrollTop: e.detail.scrollTop,
        })
    },
    onPageScroll(e) {
        this.setData({
            scrollTop: e.scrollTop,
        })
    },
    ClickBack: function () {
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
})
