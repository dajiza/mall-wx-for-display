//scale.js
//获取应用实例
var app = getApp()
Page({
    data: {
        stv: {
            offsetX: 0,
            offsetY: 0,
            zoom: false, //是否缩放状态
            distance: 0, //两指距离
            scale: 1, //缩放倍数
        },
        swiperCurrent: 0,
        left: 0,
        right: 0,
        top: 0,
        height: 0,
        width: 0,
        limitRight: 0,
        limitLeft: 0,
    },
    //事件处理函数
    touchstartCallback: function (e) {
        //触摸开始
        // console.log('touchstartCallback')
        // console.log(e)

        if (e.touches.length === 1) {
            // if (this.data.stv.scale == 1) {
            //     return
            // }
            let { clientX, clientY } = e.touches[0]
            this.startX = clientX
            this.startY = clientY
            this.touchStartEvent = e.touches
        } else {
            let xMove = e.touches[1].clientX - e.touches[0].clientX
            let yMove = e.touches[1].clientY - e.touches[0].clientY
            let distance = Math.sqrt(xMove * xMove + yMove * yMove)
            this.setData({
                'stv.distance': distance,
                'stv.zoom': true, //缩放状态
            })
        }
    },
    touchmoveCallback: function (e) {
        //触摸移动中
        //console.log('touchmoveCallback');
        // console.log(e.target.dataset.index)
        let index = e.target.dataset.index
        wx.createSelectorQuery()
            .select('#img' + index)
            .boundingClientRect((rect) => {
                // console.log('输出 ~ rect', rect)
                this.setData({
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    height: rect.height,
                    width: rect.width,
                })
            })
            .exec()
        if (e.touches.length === 1) {
            //单指移动
            if (this.data.stv.zoom || this.data.stv.scale == 1) {
                if (this.data.stv.scale == 1) {
                    let { clientX } = e.touches[0]
                    let offsetX = clientX - this.startX
                    if (offsetX < -150) {
                        this.right()
                        this.startX = clientX
                    } else if (offsetX > 150) {
                        this.left()
                        this.startX = clientX
                    }
                    // console.log('输出 ~ offsetX', offsetX)
                    return
                } else {
                    //缩放状态，不处理单指
                    return
                }
            }
            let { clientX, clientY } = e.touches[0]
            let offsetX = clientX - this.startX
            let offsetY = clientY - this.startY

            if (this.data.left >= 0 && offsetX > 0) {
                let limitLeft = this.data.limitLeft
                limitLeft += offsetX
                this.setData({
                    limitLeft: limitLeft,
                })
                if (limitLeft > 150) {
                    this.setData({
                        limitLeft: 0,
                    })
                    this.left()
                }
                offsetX = 0
            } else {
                this.setData({
                    limitLeft: 0,
                })
            }
            if (this.data.right <= this.data.width / this.data.stv.scale && offsetX < 0) {
                let limitRight = this.data.limitRight
                limitRight += offsetX
                this.setData({
                    limitRight: limitRight,
                })
                if (limitRight < -150) {
                    this.setData({
                        limitRight: 0,
                    })
                    this.right()
                }
                offsetX = 0
            } else {
                this.setData({
                    limitRight: 0,
                })
            }

            this.startX = clientX
            this.startY = clientY
            let { stv } = this.data
            stv.offsetX += offsetX
            stv.offsetY += offsetY
            stv.offsetLeftX = -stv.offsetX
            stv.offsetLeftY = -stv.offsetLeftY
            this.setData({
                stv: stv,
            })
        } else {
            //双指缩放
            let xMove = e.touches[1].clientX - e.touches[0].clientX
            let yMove = e.touches[1].clientY - e.touches[0].clientY
            let distance = Math.sqrt(xMove * xMove + yMove * yMove)

            let distanceDiff = distance - this.data.stv.distance
            let newScale = this.data.stv.scale + 0.005 * distanceDiff
            // console.log('输出 ~ newScale', newScale)
            // console.log('输出 ~ newScale', newScale)
            if (newScale < 1 || newScale > 3) {
                newScale = 1
            } else if (newScale > 3) {
                newScale = 3
            }
            this.setData({
                'stv.distance': distance,
                'stv.scale': newScale,
            })
        }
    },
    touchendCallback: function (e) {
        //触摸结束
        // console.log('touchendCallback')
        // console.log(e)
        // if (this.data.stv.scale == 1) {
        //     let { clientX } = e.touches[0]
        //     let offsetX = clientX - this.startX
        //     if (offsetX < -100) {
        //         this.left()
        //     } else if (offsetX > 100) {
        //         this.right()
        //     }
        //     // console.log('输出 ~ offsetX', offsetX)
        //     return
        // } else {
        //     //缩放状态，不处理单指
        //     return
        // }
        if (e.touches.length === 0) {
            this.setData({
                'stv.zoom': false, //重置缩放状态
            })
        }
    },
    onLoad: function () {
        console.log('onLoad')
    },
    imgtap: function (e) {
        console.log('输出 ~ imgtap', e)
    },
    // swiper监听
    onChangeSwiper(event) {
        var index = event.detail.current
        this.setData({
            swiperCurrent: index,
        })
    },
    right: function () {
        let index = this.data.swiperCurrent
        console.log('输出 ~ index', index)
        this.setData({
            swiperCurrent: index + 1,
        })
    },
    left: function () {
        let index = this.data.swiperCurrent
        if (index == 0) {
            return
        }
        this.setData({
            swiperCurrent: index - 1,
        })
    },
    onChangeSwiper: function () {
        this.setData({
            limitLeft: 0,
            limitRight: 0,
            stv: {
                offsetX: 0,
                offsetY: 0,
                zoom: false, //是否缩放状态
                distance: 0, //两指距离
                scale: 1, //缩放倍数
            },
        })
    },
})
