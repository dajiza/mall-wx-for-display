Component({
    /**
     * 组件的属性列表
     */
    properties: {
        user_name: {
            type: String,
            value: '',
        },
        user_avatar: {
            type: String,
            value: '',
        },
        create_time: {
            type: String,
            value: '',
        },
        second_label: {
            type: String,
            value: '',
            observer: function (newVal, oldVal) {
                // console.log('newVal2222',newVal)
                const isJSON = this.isJSON(newVal)
                let attr_list = [],
                    _label = ''
                if (isJSON) {
                    if (newVal) {
                        const sku_attr = JSON.parse(newVal)
                        attr_list = sku_attr.map((e) => {
                            return e['Value']
                        })
                        _label = attr_list.join(' ')
                    }
                } else {
                    _label = newVal
                }
                this.setData({
                    label: _label,
                })
            },
        },
        textLineNum: {
            type: Number,
            value: 10,
            observer: function (newVal, oldVal) {
                this.setData({
                    lineNum: newVal,
                })
            },
        },
        comment: {
            type: String,
            value: '',
            observer: function (newVal, oldVal) {
                let _srt = ''
                if (newVal) {
                    _srt = newVal.replace(/↵/g, '\n')
                }
                this.setData({
                    commentText: _srt,
                })
            },
        },
        attachment: {
            type: Array,
            value: [],
            observer: function (newVal, oldVal) {
                let list = []
                if (newVal.length > 0) {
                    list = newVal.map((e) => {
                        let { type = -1, url = '' } = e
                        return {
                            type: e.media_type,
                            url: e.media_url,
                        }
                    })
                }
                // console.log('list======', list)
                this.setData({
                    list: list,
                })
            },
        },
        showUser: {
            type: Boolean,
            value: true,
            observer: function (newVal, oldVal) {
                this.setData({
                    showUser: newVal,
                })
            },
        },
        imgSize: {
            type: String,
            value: '160rpx',
        },
    },

    /**
     * 组件的初始数据
     */
    data: {
        list: [],
        label: '',
        showUser: true,
        commentText: '',
        lineNum: 10,
        videoContext: [], //视频实例数组
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onItemClick: function (e) {
            let index = e.currentTarget.dataset.index
            // this.triggerEvent('onItemClick',this.data.list[index])
        },
        /**
         * 视频错误回调
         */
        videoErrorCallback() {
            console.log('err')
        },
        // 预览图片
        previewImage: function (e) {
            // 获取data-src
            let src = e.currentTarget.dataset.src
            // 获取data-list
            let img_list = this.data.list.filter((item) => {
                return item.type != 1
            })
            let imgList = img_list.map((item) => item.url)
            console.log('imgList', imgList)
            console.log('src', src)
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
        isJSON(str) {
            if (typeof str == 'string') {
                try {
                    let obj = JSON.parse(str)
                    if (typeof obj == 'object' && obj) {
                        return true
                    } else {
                        return false
                    }
                } catch (e) {
                    // console.log('error：' + str + '!!!' + e)
                    return false
                }
            } else {
                return false
            }
            // console.log('It is not a string!')
        },
        // 播放自动全屏
        onVideoPlay(e) {
            let id = e.currentTarget.id
            let videoContext = wx.createVideoContext(id, this)
            videoContext.requestFullScreen()
        },
        // 视频进入和退出全屏时触发
        onFullChange(e) {
            let fullScreen = e.detail.fullScreen
            if (!fullScreen) {
                let id = e.currentTarget.id
                let videoContext = wx.createVideoContext(id, this)
                videoContext.pause()
            }
        },
    },
})
