// component/stepper/stepper.js
const adj = require('../../utils/adjacency')
const cartModel = require('../../models/cart')
const orderModel = require('../../models/order')
const tool = require('../../utils/tool')

const loginWatch = require('../../utils/loginWatch')
const phoneNumWatch = require('../../utils/phoneNumWatch')

Component({
    properties: {
        // 内容
        content: {
            type: String,
        },
        // 标题
        title: {
            type: String,
        },
        // placeholder
        placeholder: {
            type: String,
        },
    },
    options: {
        isShow: false, //组件整体显示
        text: '',
        styleIsolation: 'shared',
    },
    data: {},
    methods: {
        onEnter() {
            this.setData({
                text: this.data.content,
            })
            console.log('输出 ~ this.data.content', this.data.content)
        },
        show() {
            this.setData({
                isShow: true,
            })
        },
        close() {
            this.setData({
                isShow: false,
            })
        },

        onChangeValue(e) {
            e.detail.value
            this.setData({
                text: e.detail.value,
            })
        },
        preventTouchMove() {},
        save() {
            this.triggerEvent('saveText', this.data.text)
            this.close()
        },
    },
})
