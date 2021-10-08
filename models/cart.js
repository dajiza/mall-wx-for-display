const util = require('../utils/util')

let cartGoodsCheckedSnapshot = new Set()

module.exports = {
    // 添加购物车 is_exchange 1加价购 正常不传
    addToCartGoods: function (sku_id, goods_id, count, price, promotion_id = 0, is_exchange = 0, commission_type = 0, commission_user_id = 0) {
        let that = this
        return new Promise((resolve, reject) => {
            util.request('shopping-car-create', {
                sku_id: sku_id,
                goods_id: goods_id,
                count: Number(count),
                price: Number(price),
                promotion_id: promotion_id,
                is_exchange: is_exchange,
                commission_type,
                commission_user_id,
            })
                .then((res) => {
                    //添加购物车后默认选中
                    if (typeof res == 'number') {
                        let shoppingCarId = Number(res)
                        console.log('shoppingCarId:', shoppingCarId)
                        that.updateCartGoodsCheckedSnapshot(shoppingCarId, true)
                    }
                    // 埋点上报
                    util.tracking('cart_add', { sku_id, goods_id, count, price })
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 获取购物车列表
    getCartGoods: function (data = {}) {
        return util.request('shopping-car-list-new', data)
    },

    //删除选中的商品列表
    deleteCartGoods: function (shoppingCarIds) {
        return util
            .request('shopping-car-delete', {
                shopping_car_ids: shoppingCarIds,
            })
            .then((res) => {
                //如果删除成功，继续请求后台返回最新的购物车商品列表
                return this.getCartGoods()
            })
    },
    //修改指定的商品
    updateCartGoods: function (data = {}) {
        return util.request('shopping-car-update', data).then((res) => {
            //如果删除成功，继续请求后台返回最新的购物车商品列表
            return this.getCartGoods()
        })
    },

    // 添加到口袋（扫码）
    addToPocketGoods: function (sku_id, goods_id, count, price) {
        return util.request('shopping-car-create', {
            sku_id: sku_id,
            goods_id: goods_id,
            count: Number(count),
            price: Number(price),
            car_type: 1,
        })
    },

    // 获取口袋（扫码商品）列表
    getPocketGoods: function (data = {}) {
        return util.request('shopping-car-list-new', {
            car_type: 1,
        })
    },

    //查询购物车商品数量
    queryCartNum: function () {
        return new Promise((resolve, reject) => {
            util.request('shopping-car-list-new', {})
                .then((res) => {
                    let list = res.valid_goods_info || []
                    let validGoodsCount = 0
                    //过滤加购商品(加购商品为零时数据)
                    list.forEach((element) => {
                        let isExchange = element.is_exchange || 0
                        if (isExchange == 0) {
                            validGoodsCount += 1
                        }
                    })
                    let num = validGoodsCount
                    resolve(num)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    //删除选中的口袋（扫码商品）列表
    deletePocketGoods: function (shoppingCarIds) {
        return util
            .request('shopping-car-delete', {
                shopping_car_ids: shoppingCarIds,
                car_type: 1,
            })
            .then((res) => {
                //如果删除成功，继续请求后台返回最新的口袋（扫码商品）列表
                return this.getPocketGoods()
            })
    },

    //修改指定的口袋（扫码商品）
    updatePocketGoods: function (data = {}) {
        return util.request('shopping-car-update', data).then((res) => {
            //如果删除成功，继续请求后台返回最新的购物车商品列表
            return this.getPocketGoods()
        })
    },

    //
    queryCodeSearchGoods: function (product_code) {
        return util.request('goods-code-search', {
            product_code: product_code,
        })
    },

    //获取购物车选中商品的快照
    getCartGoodsCheckedSnapshot: function () {
        return cartGoodsCheckedSnapshot
    },

    updateCartGoodsCheckedSnapshot: function (shoppingCarId, save) {
        if (save) {
            cartGoodsCheckedSnapshot.add(shoppingCarId)
        } else {
            cartGoodsCheckedSnapshot.delete(shoppingCarId)
        }
    },
}
