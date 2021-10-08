// components/orderGoods/agentGoods.js
function splitFirst(content) {
    if (content) {
        if (content.indexOf(",") !== 1) {
            return content.split(",")[0];
        }
    }
    return "";
}
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        goods: {
            type: Object,
            observer: function (value) {
                this.initData(value);
            },
        },
        stockAvailable: {
            type: Number,
            value: 0,
        },
        showAttr: {
            type: Boolean,
            value: true,
        }, // 是否展示商品属性 默认开启
        showInventory: {
            type: Boolean,
            value: false,
        }, // 是否显示库存 默认 false
        showSales: {
            type: Boolean,
            value: true,
        }, // 是否显示销量 默认 true
        showPrice: {
            type: Boolean,
            value: true,
        }, // 是否显示价格 默认 true
        paddingStr: {
            type: String,
            value: "30rpx",
        },
    },
    options: {
        multipleSlots: true,
    },
    /**
     * 组件的初始数据
     */
    data: {
        goodsInstance: {},
    },
    ready: function () {},

    /**
     * 组件的方法列表
     */
    methods: {
        initData(props) {
            let { not_allow = -1 } = props;
            let isDistribution = props.status == 2; //上架
            if (not_allow != -1 && isDistribution) {
                isDistribution = not_allow == 0; //可售
            }
            let goods = Object.assign(
                {},
                {
                    id: props.goods_id,
                    img: props.img,
                    title: props.title,
                    price: props.price,
                    commission: props.commission,
                    isDistribution: isDistribution,
                    displaySales: props.display_sales,
                    attrBrand: splitFirst(props.attr_brand),
                    attrMaterial: splitFirst(props.attr_material),
                    attrColor: splitFirst(props.attr_color),
                    attrOrigin: splitFirst(props.attr_origin),
                    attrPattern: splitFirst(props.attr_pattern),
                    attrSize: splitFirst(props.attr_size),
                    attrPiece: splitFirst(props.attr_piece),
                    type: props.type,
                }
            );
            this.setData({
                goodsInstance: goods,
            });
        },
        /**
         * 点击商品-前往商品详情
         */
        handleGoGoodsDetail(res) {
            let isDistribution = res.currentTarget.dataset.isDistribution;
            if (isDistribution) {
                this.triggerEvent("onClick");
            } else {
                wx.showToast({
                    title: "已下架",
                    icon: "none",
                    duration: 2000,
                });
            }
        },
    },
});
