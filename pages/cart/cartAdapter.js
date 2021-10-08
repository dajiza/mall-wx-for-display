const cartModel = require('../../models/cart')
const promotionModel = require('../../models/promotion')
const config = require('../../config/config')
const util = require('../../utils/util')

module.exports = {
  //购物车列表数据适配器，兼容现有数据
  isVip: false,
  getCartGoods: function (isVip = false) {
    console.log(isVip)
    this.isVip = isVip
    const isShopAdmin = wx.getStorageSync('isShopAdmin') || 0
    if (Number(isShopAdmin) == 1 || isVip) {
      //分销商或者会员，不参与促销活动
      return cartModel.getCartGoods()
        .then(res => {
          return {
            invalid_goods_info: res.invalid_goods_info,
            valid_goods_info: res.valid_goods_info,
          }
        })
        .then(res => {
          return this.freightGoodsListConvert(res)
        })
    }
    return cartModel.getCartGoods()
      .then(res => {
        console.log(res)
        //抽离封装的包邮商品
        let tempValidGoodsInfo = []
        if (res.freight_goods_list) {
          let tempList = res.freight_goods_list || []
          tempList.forEach(element => {
            element.valid_goods_info.forEach(ev => {
              tempValidGoodsInfo.push(ev)
            });
          });
        }
        if (res.valid_goods_info && res.valid_goods_info.length > 0) {
          tempValidGoodsInfo = tempValidGoodsInfo.concat(res.valid_goods_info)
        }
        return {
          invalid_goods_info: res.invalid_goods_info,
          valid_goods_info: tempValidGoodsInfo,
        }
      })
      .then(res => {
        console.log(res)
        //重新封装
        //活动组合 promotion_goods_list
        let tempValidGoodsInfo = []
        let promotionMap = new Map()
        let goodIdsSet = new Set()
        let validGoodsInfo = res.valid_goods_info || []
        let invalidGoodsInfo = res.invalid_goods_info || []

        validGoodsInfo.forEach(element => {
          if (element.promotion_id) {
            //参与了促销活动,一个活动包含多个商品
            let key = element.promotion_id
            if (promotionMap.has(key)) {
              let list = promotionMap.get(key)
              list.push(element)
            } else {
              promotionMap.set(key, [element])
            }
            goodIdsSet.add(element.goods_id)
          } else {
            //未参与
            tempValidGoodsInfo.push(element)
          }
        });
        if (promotionMap.size > 0) {
          return new Promise((resolve, reject) => {
            //获取当前促销活动列表
            let goodsIds = []
            goodIdsSet.forEach(value => {
              goodsIds.push(value)
            })
            util.request('promotion-list', {
              shopId: config.shopId,
              goodsIds: goodsIds,
            }).then(res => {
              let list = res || []
              let promotionGoodsList = []
              list.forEach(promotion => {
                let promotionId = promotion.id
                if (promotionMap.has(promotionId)) {
                  let label = ''
                  let tips = ''
                  let validGoodsInfo = promotionMap.get(promotionId)
                  let exchaneGoodsInfo = [] //换购商品
                  let rules = promotion.rules
                  //排序
                  rules.sort((a, b) => {
                    return a.needNum - b.needNum
                  })
                  console.log(rules)
                  if (promotion.type == 1) {
                    label = '每满减'
                    let rule = rules[0]
                    tips = '每满' + (rule.needNum / 100) + '元减' + (rule.subNum / 100) + '元'
                  } else if (promotion.type == 2) {
                    label = '满减'
                    let rule = rules[rules.length - 1]
                    tips = '满' + (rule.needNum / 100) + '元减' + (rule.subNum / 100) + '元'
                  } else if (promotion.type == 3) {
                    label = '满折'
                    let rule = rules[rules.length - 1]
                    tips = '满' + (rule.needNum / 100) + '元打' + (rule.subNum / 10) + '折'
                  } else if (promotion.type == 4) {
                    label = '满件折'
                    let rule = rules[rules.length - 1]
                    tips = '满' + (rule.needNum) + '件打' + (rule.subNum / 10) + '折'
                  } else if (promotion.type == 5) {
                    label = '加价购'
                    let rule = rules[0]
                    tips = '满' + (rule.needNum / 100) + '元可换购'
                    //参与换购促销活动
                    let tempGoodsInfo = []
                    validGoodsInfo.forEach(goods => {
                      let isExchange = goods.is_exchange || 0
                      if (isExchange == 0) {
                        //后台脏数据过滤
                        tempGoodsInfo.push(goods)
                      }
                    })
                    let barterCheckedMap = promotionModel.barterCheckedList
                    if (barterCheckedMap.has(promotionId)) {
                      let list = barterCheckedMap.get(promotionId) || []
                      exchaneGoodsInfo = list.map(ev => {
                        let attrs = [ev.attrBrand, ev.attrMaterial, ev.attrOrigin, ev.attrColor, ev.attrPattern]
                        let sku_attr_value = attrs.join(" ")
                        return {
                          is_exchange: 1,
                          goods_id: ev.goodsId,
                          goods_name: ev.title,
                          promotion_id: promotionId,
                          shop_goods_sku_id: ev.shopSkuId,
                          shopping_car_id: ev.shopGoodsId,
                          sku_attr_value: sku_attr_value,
                          sku_count: 1,
                          sku_id: ev.skuId,
                          sku_img: ev.skuImg,
                          sku_price: ev.exchangePrice,
                          sku_status: 2,
                          sku_stock: 1,
                          user_discount: 0
                        }
                      })
                    }
                    validGoodsInfo = tempGoodsInfo
                  } else if (promotion.type == 6) {
                    label = '满券'
                    let rule = rules[rules.length - 1]
                    let name = rule.objName
                    if (!name.endsWith('优惠券')) {
                      name = name + '优惠券'
                    }
                    tips = '满' + (rule.needNum / 100) + '元送' + name
                  }
                  if (validGoodsInfo.length > 0) {
                    //主商品存在，促销活动有效
                    promotionGoodsList.push({
                      //促销活动信息
                      id: promotionId,
                      promotion_info: {
                        ...promotion,
                        label: label,
                        tips: tips,
                        originalTips: tips,
                      },
                      valid_goods_info: validGoodsInfo,
                      exchane_goods_info: exchaneGoodsInfo,
                    })
                  }
                  promotionMap.delete(promotionId)
                }
              });
              if (promotionMap.size > 0) {
                //促销活动丢失(后台或者运营配置问题导致)
                //避免促销活动出现问题导致购物车内商品丢失
                let goods = []
                promotionMap.forEach(value => {
                  goods = goods.concat(value)
                })
                tempValidGoodsInfo = tempValidGoodsInfo.concat(goods)
              }
              resolve({
                promotion_goods_list: promotionGoodsList,
                valid_goods_info: tempValidGoodsInfo,
                invalid_goods_info: invalidGoodsInfo
              })
            }).catch(err => {
              //获取促销活动失败，默认商品不参加促销活动
              console.log(err)
              resolve({
                promotion_goods_list: [],
                valid_goods_info: validGoodsInfo,
                invalid_goods_info: invalidGoodsInfo
              })
            })
          })
        } else {
          //没有商品参加活动
          return Promise.resolve({
            promotion_goods_list: [],
            valid_goods_info: tempValidGoodsInfo,
            invalid_goods_info: invalidGoodsInfo
          })
        }
      })
      .then(res => {
        console.log("txf",res)
        let orginRes = res
        let promotionGoodsList = res.promotion_goods_list
        if (promotionGoodsList.length > 0) {
          return new Promise((resolve, reject) => {
            let goodsIdSet = new Set()
            promotionGoodsList.forEach(element => {
              element.valid_goods_info.forEach(goods => {
                //默认多活动，避免活动丢失
                goods.multi_promotion = true
                goodsIdSet.add(goods.goods_id)
              });
            });
            let goodsIds = []
            goodsIdSet.forEach(value => {
              goodsIds.push(value)
            })
            util.request('promotionids-by-goodsids', {
              goodsIds: goodsIds,
            }).then(res => {
              let list = res || []
              promotionGoodsList.forEach(ev => {
                ev.valid_goods_info.forEach(goods => {
                  let goods_id = goods.goods_id
                  console.log("txf goods_id:",goods_id)
                  let obj = list.find((item) => item.goodsId == goods_id)
                  console.log("txf",obj)
                  if (obj != null) {
                    goods.multi_promotion = obj.promotionIds.length > 1
                  }
                })
              });
              resolve(orginRes)
            }).catch(err => {
              console.log(err)
              resolve(res)
            })
          })
        } else {
          return Promise.resolve(res)
        }
      })
      .then(res => {
        return this.freightGoodsListConvert(res)
      })
      .then(res => {
        console.log(res)
        //最终数据，作为后续的扩展入口
        return {
          promotion_goods_list: res.promotion_goods_list,
          freight_goods_list: res.freight_goods_list,
          valid_goods_info: res.valid_goods_info,
          invalid_goods_info: res.invalid_goods_info
        }
      })
  },
  freightGoodsListConvert: function (res) {
    console.log(res)
    //重新封装
    //不参加活动但是有包邮策略 freight_goods_list
    let promotionGoodsList = res.promotion_goods_list || []
    let validGoodsInfo = res.valid_goods_info || []
    let invalidGoodsInfo = res.invalid_goods_info || []

    let freightGoodsMap = new Map()
    validGoodsInfo.forEach(element => {
      let key = element.freight_id
      if (freightGoodsMap.has(key)) {
        let list = freightGoodsMap.get(key)
        list.push(element)
      } else {
        freightGoodsMap.set(key, [element])
      }
    })
    if (freightGoodsMap.size > 0) {
      let freightIds = []
      freightGoodsMap.forEach((value, key) => {
        freightIds.push(key)
      })
      return new Promise((resolve, reject) => {
        util.request('freight-strategy-list', {
          freightIds: freightIds,
        }).then(res => {
          let list = res || []
          let tempFreightGoodsList = []
          let tempValidGoodsInfo = []
          list.forEach(freight => {
            let key = freight.freightId
            if (freightGoodsMap.has(key)) {
              if (freight.num > 0) {
                //有效的包邮凑单策略
                tempFreightGoodsList.push({
                  freight_info: {
                    free_type: freight.type,
                    free_need_num: freight.num
                  },
                  valid_goods_info: freightGoodsMap.get(key)
                })
              } else {
                tempValidGoodsInfo = tempValidGoodsInfo.concat(freightGoodsMap.get(key))
              }
              freightGoodsMap.delete(key)
            }
          });
          if (freightGoodsMap.size > 0) {
            //包邮策略丢失(后台或者运营配置问题导致)
            //避免包邮策略出现问题导致购物车内商品丢失
            let goods = []
            freightGoodsMap.forEach(value => {
              goods = goods.concat(value)
            })
            tempValidGoodsInfo = tempValidGoodsInfo.concat(goods)
          }
          resolve({
            promotion_goods_list: promotionGoodsList,
            freight_goods_list: tempFreightGoodsList,
            valid_goods_info: tempValidGoodsInfo,
            invalid_goods_info: invalidGoodsInfo
          })
        }).catch(err => {
          resolve({
            promotion_goods_list: promotionGoodsList,
            freight_goods_list: [],
            valid_goods_info: validGoodsInfo,
            invalid_goods_info: invalidGoodsInfo
          })
        })
      })
    } else {
      return Promise.resolve({
        promotion_goods_list: promotionGoodsList,
        freight_goods_list: [],
        valid_goods_info: validGoodsInfo,
        invalid_goods_info: invalidGoodsInfo
      })
    }
  },
  deleteCartGoods: function (shoppingCarIds) {
    return util
      .request('shopping-car-delete', {
        shopping_car_ids: shoppingCarIds,
      })
      .then((res) => {
        //如果删除成功，继续请求后台返回最新的购物车商品列表
        return this.getCartGoods(this.isVip)
      })
  },
  justDeleteCartGoods: function (shoppingCarIds) {
    util
      .request('shopping-car-delete', {
        shopping_car_ids: shoppingCarIds,
      })
      .then((res) => { })
      .catch((err) => {
        console.log(err)
      })
  },
  updateCartGoods: function (params) {
    return util.request('shopping-car-update', params).then((res) => {
      //如果删除成功，继续请求后台返回最新的购物车商品列表
      return this.getCartGoods(this.isVip)
    })
  },
  getPromotionList: function (goodsIds = []) {
    return util.request('promotion-list', {
      shopId: config.shopId,
      goodsIds: goodsIds,
    })
  },
  //计算购物车总计金额
  calcAmount: function () {

  }
}