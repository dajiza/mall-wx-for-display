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
        isApply: {
            type: Boolean,
            value: false,
        },
        goGoodsDetail: {
            type: Boolean,
            value: false,
        },
        showStatus: {
            type: Boolean,
            value: false,
        },
        isSellOrder:{
            type: Boolean,
            value: false,
        }
    },
    observers: {
    },

    /**
     * 组件的初始数据
     */
    data: {
        attribute: []
    },
    ready: function () {

    },

    /**
     * 组件的方法列表
     */
    methods: {
        formatAttr() {
            let goods = this.data.goods
            let attribute = []
            if (goods.attr) {
                attribute = goods.attr.map(item => item.value)
            } else if (goods.attrRefund) {
                attribute = goods.attrRefund.map(item => item.Value)
            } else {
                attribute = goods.attrValue
            }

            this.setData({
                attribute
            })
        },
        /**
         * 点击商品-前往商品详情
         */
        handleGoGoodsDetail(res) {
            console.log('1111', this.properties.goGoodsDetail);
            const goods_id = Number(res.currentTarget.dataset.id);
            if(this.properties.goGoodsDetail){
                wx.navigateTo({
                    url: '../goodsDetail/goodsDetail' + '?goodsId=' + goods_id
                })
            }
        },
    },
});
