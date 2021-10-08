module.exports = {
    /*函数节流*/
    throttle: function (fn, interval) {
        var enterTime = 0 //触发的时间
        var gapTime = interval || 600 //间隔时间，如果interval不传，则默认300ms
        return function () {
            var context = this
            var backTime = new Date() //第一次函数return即触发的时间
            if (backTime - enterTime > gapTime) {
                fn.call(context, arguments)
                enterTime = backTime //赋值给第一次触发的时间，这样就保存了第二次触发的时间
            }
        }
    },

    /*函数防抖*/
    // 使用方法
    // gotoUnlock: tool.debounce(function() {
    //     this.saveUserInfo();
    //  }),
    debounce: function (fn, interval) {
        var timer
        var gapTime = interval || 600 //间隔时间，如果interval不传，则默认1000ms
        return function () {
            clearTimeout(timer)
            var context = this
            var args = arguments //保存此处的arguments，因为setTimeout是全局的，arguments不是防抖函数需要的。
            timer = setTimeout(function () {
                fn.call(context, args)
            }, gapTime)
        }
    },
    // 判断登录
    checkLogin: function () {
        console.log('GOOGLE: checkLogin 判断登录')

        const token = wx.getStorageSync('token')
        if (!token) {
            return false
        } else {
            return true
        }
    },
    // 未登录跳转登录页面
    gotoLogin: function () {
        const token = wx.getStorageSync('token')
        if (!token) {
            wx.navigateTo({
                url: '/pages/login/login',
            })
        }
    },
    // 四舍五入保留几位小数点 num为传入的值，n为保留的小数位
    fomatFloat: function (num, n) {
        var f = parseFloat(num)
        if (isNaN(f)) {
            return false
        }
        f = Math.round(num * Math.pow(10, n)) / Math.pow(10, n) // n 幂
        var s = f.toString()
        var rs = s.indexOf('.')
        //判定如果是整数，增加小数点再补0
        if (rs < 0) {
            rs = s.length
            s += '.'
        }
        while (s.length <= rs + n) {
            s += '0'
        }
        return s
    },
    // 浮点数 + - x
    numberAdd(a, b) {
        let c, d, e
        try {
            c = a.toString().split('.')[1].length
        } catch (f) {
            c = 0
        }
        try {
            d = b.toString().split('.')[1].length
        } catch (f) {
            d = 0
        }
        return (e = Math.pow(10, Math.max(c, d))), (this.numberMul(a, e) + this.numberMul(b, e)) / e
    },

    numberSub(a, b) {
        let c, d, e
        try {
            c = a.toString().split('.')[1].length
        } catch (f) {
            c = 0
        }
        try {
            d = b.toString().split('.')[1].length
        } catch (f) {
            d = 0
        }
        return (e = Math.pow(10, Math.max(c, d))), (this.numberMul(a, e) - this.numberMul(b, e)) / e
    },
    numberMul(a, b) {
        let c = 0,
            d = a.toString(),
            e = b.toString()
        try {
            c += d.split('.')[1].length
        } catch (f) {}
        try {
            c += e.split('.')[1].length
        } catch (f) {}
        return (Number(d.replace('.', '')) * Number(e.replace('.', ''))) / Math.pow(10, c)
    },

    // 深拷贝
    deepClone(o) {
        // 判断如果不是引用类型，直接返回数据即可
        if (typeof o === 'string' || typeof o === 'number' || typeof o === 'boolean' || typeof o === 'undefined') {
            return o
        } else if (Array.isArray(o)) {
            // 如果是数组，则定义一个新数组，完成复制后返回
            // 注意，这里判断数组不能用typeof，因为typeof Array 返回的是object
            var _arr = []
            o.forEach((item) => {
                _arr.push(item)
            })
            return _arr
        } else if (typeof o === 'object') {
            var _o = {}
            for (let key in o) {
                _o[key] = this.deepClone(o[key])
            }
            return _o
        }
    },
    /**
     * 格式化金额
     */
    formatMoney: function (val) {
        if (val == 0) {
            return '0.00'
        }
        if (!val) {
            return ''
        }
        //金额转换 分->元 保留2位小数
        var str = (val / 100).toFixed(2) + ''
        var intSum = str.substring(0, str.indexOf('.')).replace(/\B(?=(?:\d{3})+$)/g, ',') //取到整数部分
        // var intSum = str.substring(0, str.indexOf('.')).replace(getRegExp('/B(?=(?:d{3})+$)', 'g'), '.')
        var dot = str.substring(str.length, str.indexOf('.')) //取到小数部分搜索
        var ret = intSum + dot
        return ret
    },
    /**
     * 生成促销名称
     * 1每满减 2满减 3满折 4满件折 5加价购 6满卷
     */
    formatPromotion: function (promotion) {
        let name
        if (promotion.type == 1) {
            let needNum = promotion.rules[0].needNum
            let subNum = promotion.rules[0].subNum
            name = `每满￥${this.formatMoney(needNum)}元可减￥${this.formatMoney(subNum)}元`
        } else if (promotion.type == 2) {
            let arr = promotion.rules.map((item) => `满￥${this.formatMoney(item.needNum)}元减￥${this.formatMoney(item.subNum)}元`)
            name = arr.join('; ')
        } else if (promotion.type == 3) {
            let arr = promotion.rules.map((item) => `满￥${this.formatMoney(item.needNum)}元打${item.subNum / 10}折`)
            name = arr.join('; ')
            if (promotion.topMoney != 0) {
                name += `; 封顶优惠${this.formatMoney(promotion.topMoney)}元`
            }
        } else if (promotion.type == 4) {
            let arr = promotion.rules.map((item) => `满${item.needNum}件打${item.subNum / 10}折`)
            name = arr.join('; ')
            if (promotion.topMoney != 0) {
                name += `; 封顶优惠${this.formatMoney(promotion.topMoney)}元`
            }
        } else if (promotion.type == 5) {
            let needNum = promotion.rules[0].needNum
            let subNum = promotion.rules[0].subNum
            name = `满￥${this.formatMoney(needNum)}元加￥${this.formatMoney(subNum)}元可换购热销商品`
        } else if (promotion.type == 6) {
            let arr = promotion.rules.map((item) => `满￥${this.formatMoney(item.needNum)}元送${item.objName}券`)
            name = arr.join('; ')
        }
        return name
    },
    /**
     * 促销计算
     * promotion 促销详情
     * amount 当前商品金额
     * num 当前商品件数
     * 1每满减 2满减 3满折 4满件折 5加价购 6满卷
     */
    promotionCalc: function (promotion, amount, num, barterList = []) {
        let subtotal = '' //小计
        let rest = '' //剩余
        let capped = '' //封顶显示
        let top = false //是否封顶
        let discountText = 0 //具体优惠金额/优惠券 显示生成
        let discountAmount = 0 //具体优惠数字

        var checkedBarterNum = barterList.filter((item) => item.checked).length //加价购数量
        var isBarter = false //是否可以加价购
        if (promotion.type == 1) {
            let needNum = promotion.rules[0].needNum
            let subNum = promotion.rules[0].subNum
            let times = Math.floor(amount / needNum)

            let gap = this.numberSub(this.numberMul(times + 1, needNum), amount)
            subtotal = `小计 ￥${this.formatMoney(amount)}`
            rest = `再买￥${this.formatMoney(gap)}, 可减￥${this.formatMoney(this.numberMul(subNum, times + 1))}`
            // 计算优惠金额
            discountAmount = this.numberMul(subNum, times)
            discountText = `- ￥${this.formatMoney(Math.floor(discountAmount))}`
        } else if (promotion.type == 2) {
            for (let i = 0; i < promotion.rules.length; i++) {
                const rule = promotion.rules[i]
                if (amount >= rule.needNum) {
                    // topDiscount += rule.subNum
                    top = true
                } else {
                    rest = `再买￥${this.formatMoney(rule.needNum - amount)}, 可减￥${this.formatMoney(rule.subNum)}`
                    if (i > 0) {
                        discountAmount = promotion.rules[i - 1].subNum
                    }
                    top = false
                    break
                }
            }
            if (top) {
                capped = `小计 ￥${this.formatMoney(amount)}, 已减￥${this.formatMoney(promotion.rules[promotion.rules.length - 1].subNum)}`
                discountAmount = promotion.rules[promotion.rules.length - 1].subNum
            }
            subtotal = `小计 ￥${this.formatMoney(amount)}`
            // 计算优惠金额
            discountText = `- ￥${this.formatMoney(Math.floor(discountAmount))}`
        } else if (promotion.type == 3) {
            let rate = 100
            for (let i = 0; i < promotion.rules.length; i++) {
                const rule = promotion.rules[i]
                if (amount >= rule.needNum) {
                    top = true
                } else {
                    rest = `再买￥${this.formatMoney(rule.needNum - amount)},可享受￥${rule.subNum / 10}折`
                    if (i > 0) {
                        rate = promotion.rules[i - 1].subNum
                    }
                    top = false
                    break
                }
            }
            if (top) {
                capped = `小计 ￥${this.formatMoney(amount)}, 已享受￥${promotion.rules[promotion.rules.length - 1].subNum / 10}折`
                rate = promotion.rules[promotion.rules.length - 1].subNum
            }
            subtotal = `小计 ￥${this.formatMoney(amount)}`
            // 计算优惠金额
            rate = this.numberSub(1, rate / 100)
            if (promotion.topMoney > 0) {
                discountAmount = this.numberMul(amount, rate) > promotion.topMoney ? promotion.topMoney : this.numberMul(amount, rate)
            } else {
                discountAmount = this.numberMul(amount, rate)
            }
            discountText = `- ￥${this.formatMoney(Math.floor(discountAmount))}`
        } else if (promotion.type == 4) {
            let rate = 100

            for (let i = 0; i < promotion.rules.length; i++) {
                const rule = promotion.rules[i]
                if (num >= rule.needNum) {
                    top = true
                } else {
                    rest = `再买${rule.needNum - num}件,可享受${rule.subNum / 10}折`
                    if (i > 0) {
                        rate = promotion.rules[i - 1].subNum
                    }
                    top = false
                    break
                }
            }
            if (top) {
                capped = `小计${num}件, 已享受${promotion.rules[promotion.rules.length - 1].subNum / 10}折`
                rate = promotion.rules[promotion.rules.length - 1].subNum
            }
            subtotal = `小计${num}件`
            // 计算优惠金额
            rate = this.numberSub(1, rate / 100)
            if (promotion.topMoney > 0) {
                discountAmount = this.numberMul(amount, rate) > promotion.topMoney ? promotion.topMoney : this.numberMul(amount, rate)
            } else {
                discountAmount = this.numberMul(amount, rate)
            }
            discountText = `- ￥${this.formatMoney(Math.floor(discountAmount))}`
        } else if (promotion.type == 5) {
            let needNum = promotion.rules[0].needNum
            let gap = this.numberSub(needNum, amount)
            let redeemed = false //是否已换购
            subtotal = `小计 ￥${this.formatMoney(amount)}`

            if (amount < needNum) {
                rest = `还差￥${this.formatMoney(gap)},可换购`
                isBarter = false
            } else {
                if (checkedBarterNum > 0) {
                    rest = `已满足条件,已换购`
                } else {
                    rest = `已满足条件,请换购`
                }
                isBarter = true
            }
        } else if (promotion.type == 6) {
            discountAmount = 0
            discountText = '无'
            for (let i = 0; i < promotion.rules.length; i++) {
                const rule = promotion.rules[i]
                if (amount >= rule.needNum) {
                    top = true
                } else {
                    rest = `再买￥${this.formatMoney(rule.needNum - amount)},可获赠${rule.objName}`
                    if (i > 0) {
                        discountText = `赠送一张${promotion.rules[i - 1].objName}（优惠券包中查看）`
                    }

                    top = false
                    break
                }
                if (top) {
                    capped = `小计 ￥${this.formatMoney(amount)}, 已获赠${promotion.rules[promotion.rules.length - 1].objName}`
                    discountText = `赠送一张${promotion.rules[promotion.rules.length - 1].objName}（优惠券包中查看）`
                }
            }
            subtotal = `小计 ￥${this.formatMoney(amount)}`
        }

        return {
            rest,
            subtotal,
            capped,
            top,
            isBarter,
            checkedBarterNum,
            discountText,
            discountAmount,
            promotionType: promotion.type,
        }
    },
    objectEquals: function (object1, object2) {
        for (let propName in object1) {
            if (object1.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
                return false
            } else if (typeof object1[propName] != typeof object2[propName]) {
                return false
            }
        }
        for (let propName in object2) {
            if (object1.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
                return false
            } else if (typeof object1[propName] != typeof object2[propName]) {
                return false
            }
            if (!object1.hasOwnProperty(propName)) continue

            if (object1[propName] instanceof Array && object2[propName] instanceof Array) {
                if (!this.objectEquals(object1[propName], object2[propName])) {
                    return false
                }
            } else if (object1[propName] instanceof Object && object2[propName] instanceof Object) {
                if (!this.objectEquals(object1[propName], object2[propName])) {
                    return false
                }
            } else if (object1[propName] != object2[propName]) {
                return false
            }
        }
        return true
    },
}
