Component({
    /**
     * 组件的属性列表
     */
    properties: {
        money: {
            type: Number,
            value: 200,
        },
        showDollar: {
            type: Boolean,
            value: true,
        },
        size: {
            type: String,
            value: 'medium',
        },
    },
    observers: {
        //观察者：属性监听
        money(value) {
            this.formatMoney(value)
        },
    },
    /**
     * 组件的初始数据
     */
    data: {
        // goodsInstance: {},
        integer: 0,
        decimal: 0,
    },
    ready: function () {
        let money = this.data.money
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 格式化金额
         */
        formatMoney: function (val) {
            if (val == 0) {
                this.setData({
                    integer: 0,
                    decimal: '.00',
                })
                return
            }
            if (!val) {
                this.setData({
                    integer: 'error',
                    decimal: '.',
                })
                return
            }
            //金额转换 分->元 保留2位小数
            var str = (val / 100).toFixed(2) + ''
            var intSum = str.substring(0, str.indexOf('.')).replace(/\B(?=(?:\d{3})+$)/g, ',') //取到整数部分
            // var intSum = str.substring(0, str.indexOf('.')).replace(getRegExp('/B(?=(?:d{3})+$)', 'g'), '.')
            var dot = str.substring(str.length, str.indexOf('.')) //取到小数部分搜索
            this.setData({
                integer: intSum,
                decimal: dot,
            })
        },
    },
})
