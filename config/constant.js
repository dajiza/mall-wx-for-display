module.exports = {
    /**
     * 售后结果页的标题和描述
     * describe countdown:倒计时 reason:拒绝理由 updateTime:操作时间
     */
    // 退款
    ORDER_REFUND_TEXT: {
        0: {
            title: '商家确认中',
            describe: '', //倒计时
        }, //新建
        1: {
            title: '退款中',
            describe: '',
        }, //待退款
        2: {
            title: '退款失败',
            describe: 'reason',
        }, ////拒绝完结
        3: '', //撤销
        4: '', //请退货
        5: '', //退货中
        6: '', //待重新发货
        7: {
            title: '退款成功',
            describe: 'updateTime',
        }, //打款/重发完结
    },
    // 退货
    ORDER_RETURN_TEXT: {
        0: {
            title: '商家确认中',
            describe: '',
        }, //新建
        1: {
            title: '商家确认中',
            describe: '',
        }, //待退款
        2: {
            title: '商家已驳回',
            describe: 'reason',
        }, //拒绝完结
        3: '', //撤销
        4: {
            title: '商家已确认，请您寄回',
            describe: '收到货后确认无误将会把钱款原路径退还',
        }, //请退货
        5: {
            title: '快递已寄出，请等待商家确认',
            describe: '收到货后确认无误将会把钱款原路径退还',
        }, //退货中
        6: '', //待重新发货
        7: {
            title: '商家已确认，钱款已原路退还',
            describe: '如未收到退款，请联系客服',
        }, //打款/重发完结
        8: {
            title: '商家拒绝退款',
            describe: 'reason',
        }, //拒绝打款
    },
    // 换货
    ORDER_CHANGE_TEXT: {
        0: {
            title: '商家确认中',
            describe: '',
        }, //新建
        1: {
            title: '商家确认中',
            describe: '',
        }, //待退款
        2: {
            title: '商家已驳回',
            describe: 'reason',
        }, ////拒绝完结
        3: '', //撤销
        4: {
            title: '商家已确认，请您寄回',
            describe: '收到货后确认无误将会重新发货',
        }, //请退货
        5: {
            title: '快递已寄出，请等待商家确认',
            describe: '收到货后确认无误将会重新发货',
        }, //退货中
        6: {
            title: '快递已寄出，请等待商家确认',
            describe: '收到货后确认无误将会重新发货',
        }, //待重新发货
        7: {
            title: '已签收，换货完成',
            describe: '请关注物流信息',
        }, //打款/重发完结
        8: {
            title: '商家已驳回',
            describe: 'reason',
        },
        9: {
            title: '商家已重新发货',
            describe: '请关注物流信息',
        }, // 商家已重新发货     请关注物流信息
    },

    // 提现状态
    WITHDRAW_TEXT: {
        1: '待审核',
        2: '审核通过',
        3: '拒绝',
        4: '放款成功',
    },
    /**
     * 促销名称
     * 1每满减 2满减 3满折 4满件折 5加价购 6满卷
     */
    PROMOTION_TEXT: {
        1: '每满减',
        2: '满减',
        3: '满折',
        4: '满件折',
        5: '加价购',
        6: '满券',
    },
}
