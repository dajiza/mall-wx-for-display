// components/orderGoods/orderGoods.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        goods: {
            type: Object,
            value: {},
        },
        useCoupon: {
            type: Boolean,
            value: false,
        },
    },
    observers: {
        ['goods'](value) {
            this.formatAttr()
        },
    },

    /**
     * 组件的初始数据
     */
    data: {
        attribute: [],
        // goods: {
        //     image: "https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg",
        //     name:
        //         "标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题标题",
        //     price: "55.66",
        //     num: "55",
        //     specification:
        //         "规格规格规格规格规格规格规格规格规格规格规格规格规格规格规格规格",
        // },
    },
    ready: function () {},
    /**
     * 组件的方法列表
     */
    methods: {
        formatAttr() {
            let goods = this.data.goods
            let attribute = []
            if (goods.attr) {
                attribute = goods.attr.map((item) => item.value)
            } else if (goods.attrRefund) {
                attribute = JSON.parse(goods.attrRefund).map((item) => item.Value)
            } else {
                attribute = goods.attrValue
            }

            this.setData({
                attribute,
            })
        },
    },
})
