// components/pointsGoodsList/pointsGoodsList.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        list: {
            type: Object,
            value: [],
        },
    },

    /**
     * 组件的初始数据
     */
    data: {},

    /**
     * 组件的方法列表
     */
    methods: {
        gotoDetail(e) {
            let id = e.currentTarget.dataset.id
            wx.navigateTo({
                url: `/packagePoints/pointsGoodsDetail/pointsGoodsDetail?goodsId=${id}`,
            })
        },
    },
})
