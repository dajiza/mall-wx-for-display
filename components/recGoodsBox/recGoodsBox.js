// components/couponItem/couponItem.js
import moment from 'moment'
const orderModel = require('../../models/order')

App.Component({
    /**
     * 页面的初始数据
     */
    properties: {
        // 选中
        goodsList: {
            type: Object,
            value: [],
        },
    },

    data: {},
    lifetimes: {
        ready: function () {},
        detached: function () {
            // 在组件实例被从页面节点树移除时执行
        },
    },

    methods: {
        gotoDetail(e) {
            let id = e.currentTarget.dataset.id
            wx.navigateTo({
                url: `/pages/goodsDetail/goodsDetail?goodsId=${id}`,
            })
        },
    },
})
