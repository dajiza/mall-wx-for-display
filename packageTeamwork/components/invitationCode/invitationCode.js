Component({
    /**
     * 组件的属性列表
     */
    properties: {
        invitationCode: String,
        customStyle: String,
        big: {
            type: Boolean,
            value: false,
        },
        showTipTitle: {
            type: Boolean,
            value: false,
        },
        backMoney: {
            type: Number,
            value: 0,
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
        codeCopy: function (e) {
            wx.setClipboardData({
                data: this.data.invitationCode,
                success() {
                    wx.showToast({
                        icon: 'none',
                        title: '复制邀请码成功',
                    })
                },
            })
        },
    },
})
