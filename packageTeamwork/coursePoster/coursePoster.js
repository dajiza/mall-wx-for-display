import screenConfig from '../../utils/screen_util'
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)

const teamworkModel = require('../../models/teamwork')
const app = getApp()
Page({
    data: {
        statusBarHeight: app.globalData.statusBarHeight,
        safeAreaInsetBottom: safeAreaInsetBottom,
        showSaveImageToPhotosAlbumDialog: false,
        posterUrl: '',
    },

    onLoad: function (options) {
        let courseId = Number(options.course_id || '-1')
        if (courseId >= 0) {
            this.data.courseId = courseId
            this.buildPoster()
        }
    },
    buildPoster: function () {
        wx.showLoading({
            title: '加载中...',
        })
        teamworkModel
            .userCardInfo({
                course_id: this.data.courseId,
            })
            .then((res) => {
                return teamworkModel.posterCourse({
                    scene: 'id:' + this.data.courseId,
                    page: 'packageTeamwork/teamworkDetail/teamworkDetail',
                    avatar_img: res.avatar_url,
                    course_id: this.data.courseId,
                })
            })
            .then((res) => {
                wx.hideLoading()
                this.setData({
                    posterUrl: res,
                })
            })
            .catch((res) => {
                wx.hideLoading()
            })
    },
    save: function () {
        let url = this.data.posterUrl
        if (url.length == 0) {
            return
        }
        wx.showLoading({
            title: '保存中',
        })
        let isExist = false
        let storages = wx.getStorageSync('coursePoster') || []
        let index = storages.findIndex((ev) => ev.web_path == url)
        if (index >= 0) {
            let cache = storages[index]
            //存在缓存
            try {
                const fileSystem = wx.getFileSystemManager()
                fileSystem.accessSync(cache.local_path)
                //图片存在
                isExist = true
            } catch (error) {
                console.log(err)
                //图片不存在,清空缓存
                storages.splice(index, 1)
                wx.setStorageSync('coursePoster', storages)
            }
        }
        let imagePromise
        if (isExist) {
            wx.hideLoading()
            let cache = storages[index]
            imagePromise = Promise.resolve(cache.local_path)
        } else {
            //图片不存在，下载海报
            imagePromise = new Promise((resolve, reject) => {
                wx.downloadFile({
                    url: url,
                    success: function (res) {
                        let filePath = res.tempFilePath
                        let storage = {
                            web_path: url,
                            local_path: filePath,
                        }
                        storages.push(storage)
                        wx.setStorageSync('coursePoster', storages)
                        console.log('下载图片并缓存 filePath:' + filePath)
                        console.log(storage)
                        wx.hideLoading()
                        resolve(filePath)
                    },
                    fail: function (err) {
                        console.log(err)
                        reject(err)
                    },
                })
            })
        }
        imagePromise
            .then((res) => {
                let that = this
                wx.saveImageToPhotosAlbum({
                    filePath: res,
                    success: function (data) {
                        wx.showToast({
                            title: '已保存到相册',
                        })
                    },
                    fail: function (err) {
                        console.log(err)
                        if (err.errMsg != 'saveImageToPhotosAlbum:fail cancel') {
                            that.setData({
                                showSaveImageToPhotosAlbumDialog: true,
                            })
                        }
                    },
                })
            })
            .catch((err) => {
                wx.hideLoading()
            })
    },
    onOpenSetting: function (e) {
        console.log('onOpenSetting')
        if (e.detail.authSetting['scope.writePhotosAlbum']) {
            this.save()
        }
    },
    onClose: function (e) {
        console.log('onClose')
        this.setData({
            showSaveImageToPhotosAlbumDialog: false,
        })
    },
    ClickBack() {
        let pages = getCurrentPages()
        if (pages.length === 1) {
            wx.switchTab({
                url: '../index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },
})
