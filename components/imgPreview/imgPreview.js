// components/couponItem/couponItem.js
Component({
    /**
     * 页面的初始数据
     */
    properties: {
        imgList: {
            type: Array,
            value: [],
        },
        previewIndex: {
            type: Number,
            value: 0,
        },
    },
    data: {
        isShow: false, //组件整体显示
        swiperCurrent: 0,
    },

    options: {
        styleIsolation: 'shared',
    },
    lifetimes: {
        ready: function () {},
        detached: function () {
            // 在组件实例被从页面节点树移除时执行
        },
    },
    methods: {
        onBeforeEnter() {},
        onEnter() {},
        onAfterEnter() {
            this.setData({
                swiperCurrent: this.data.previewIndex,
            })
        },
        // swiper监听
        onChangeSwiper(event) {
            var index = event.detail.current
            this.setData({
                swiperCurrent: index,
            })
        },
        show() {
            this.setData({
                isShow: true,
            })
        },

        close() {
            let index = this.data.swiperCurrent
            let imgList = this.data.imgList
            this.triggerEvent('closePreview', imgList[index].sku_id)
            this.setData({
                isShow: false,
            })
        },
        imgtap() {},
    },
})
