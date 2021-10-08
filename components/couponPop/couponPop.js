// components/couponItem/couponItem.js
Component({
    /**
     * 页面的初始数据
     */
    properties: {
        canUse: {
            type: Array,
            value: [],
        },
        notUse: {
            type: Array,
            value: [],
        },
        toAdd: {
            type: Array,
            value: [],
        },
        active: {
            type: Number,
            value: 9,
        },
        selectedCoupon: {
            type: Object,
            value: null,
        },
        // 金额 凑单用
        // amount: {
        //     type: Number,
        //     value: 0,
        // },
    },
    data: {
        isShow: false, //组件整体显示
        safeAreaInsetBottom: 0,
        // active: 0,
        // selectedCoupon: {},
        selectedIndex: '',
        list: [],
        type: 2,
        isClick: true,
        firstGet: true,
        tabsShow: false,
    },
    observers: {
        ['selectedCoupon'](value) {
            if (value && value.id) {
                this.setData({
                    isClick: false,
                })
            } else {
                this.setData({
                    isClick: true,
                })
            }
        },
        ['canUse'](value) {
            // this.selectComponent('#tabs').setLine()
        },
        // ['canUse'](value) {
        //     console.log('输出 ~ canUse', value)
        //     // 判断默认选中的券是否可用
        //     if (selectedCoupon) {
        //         var isCanUse = value.some((item) => item.coupon_user_id == couponInfo.coupon_user_id)
        //     }
        //     if (!isCanUse) {
        //         selectedCoupon = null
        //     }
        //     this.setData({
        //         selectedCoupon,
        //     })
        // },
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
        onBeforeEnter() {
            let systemInfo = wx.getSystemInfoSync()
            let windowHeight = systemInfo.windowHeight
            let safeArea = systemInfo.safeArea
            let safeAreaInsetBottom = windowHeight - safeArea.bottom
            this.setData({
                safeAreaInsetBottom: safeAreaInsetBottom,
            })
        },
        onEnter() {},
        onAfterEnter() {
            // this.selectComponent('#tabs').setLine()
            this.setData({
                tabsShow: true,
            })
            let type = this.data.type
            let selectedCoupon = this.data.selectedCoupon

            // 判断默认选中的券是否可用
            if (selectedCoupon) {
                var isCanUse = this.data.canUse.some((item) => item.coupon_user_id == selectedCoupon.coupon_user_id)
            }
            if (!isCanUse) {
                selectedCoupon = null
            }
            this.setData({
                selectedCoupon,
            })

            if (this.data.firstGet && type == 2) {
                this.setData({
                    list: this.data.canUse,
                    type: 2,
                    firstGet: false,
                })
            }
        },
        /*tab切换*/
        onChange(event) {
            switch (event.detail.index) {
                case 0:
                    this.setData({
                        list: this.data.canUse,
                        type: 2,
                    })
                    break
                case 1:
                    this.setData({
                        selectedCoupon: null,
                        list: this.data.toAdd,
                        type: 1,
                    })
                    break
                case 2:
                    this.setData({
                        selectedCoupon: null,
                        list: this.data.notUse,
                        type: 4,
                    })
                    break
            }
            // if (event.detail.index != 0) {
            //     this.setData({
            //         selectedCoupon: {},
            //     })
            // }
            this.setData({
                active: Number(event.detail.index),
            })
            // wx.pageScrollTo({
            //     scrollTop: 0,
            //     duration: 300,
            // })
        },
        show() {
            this.setData({
                isShow: true,
            })
        },

        close() {
            this.setData({
                isShow: false,
                tabsShow: false,
            })
        },
        onClickCoupon(event) {
            // console.log('输出 ~ event', event)
            // let selectedCoupon = this.data.selectedCoupon
            // if (selectedCoupon && selectedCoupon.coupon_user_id == event.target.dataset.coupon.coupon_user_id) {
            //     // 取消选择
            //     this.setData({
            //         selectedCoupon: null,
            //     })
            // } else {
            //     this.setData({
            //         selectedCoupon: event.target.dataset.coupon,
            //     })
            // }
            this.setData({
                selectedCoupon: event.target.dataset.coupon,
            })
        },
        selectCoupon(event) {
            let isClick = this.data.isClick
            if (isClick) {
                return
            }
            this.triggerEvent('select', this.data.selectedCoupon)
            this.close()
        },
    },
})
