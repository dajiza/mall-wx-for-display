const http = require("../utils/util");

module.exports = {
  getAgentShopGoodsList: function (request = {}) {
    console.log(request)
    let {
      limit = 10,
      page = 1,
      status = 2,
      name = "",
      color = "",
      brand = "",
      material = "",
      origin = "",
      unit = "",
      pattern = "",
      tag_id = "",
      other_id = -1,
      size = "",
    } = request;
    return http.request("agent-shop-goods-list", {
      limit,
      page,
      status,
      name,
      color,
      brand,
      material,
      origin,
      unit,
      pattern,
      tag_id,
      other_id,
      size,
    });
  },
  getAgentToOnGoodsList: function (request = {}) {
    let {
      limit = 10,
      page = 1,
      other_id = -1,
      order_sales = 0,
      order_time = 0,
      name = "",
      brand = "",
      color = "",
      material = "",
      origin = "",
      unit = "",
      pattern = "",
      tag_id = "",
      size = "",
    } = request;
    return http.request("agent-to-on-goods-list", {
      limit,
      page,
      other_id,
      order_sales,
      order_time,
      name,
      brand,
      color,
      material,
      origin,
      unit,
      pattern,
      tag_id,
      size,
    });
  },
  getAgentGoodsSkuList: function (goodsId) {
    return http.request("agent-goods-sku-list", { goods_id: goodsId });
  },
  getAgentGoodsCommission: function (minPrice, salePrice) {
    return http.request("agent-goods-commission", {
      min_price: minPrice,
      sale_price: salePrice
    });
  },
  getAgentGoodsOn: function (request = {}) {
    let {
      goods_id = 0,
      is_top = 1,
      skus = []
    } = request;
    return http.request("agent-goods-on", {
      goods_id: goods_id,
      is_top: is_top,
      skus: skus
    });
  },
  getAgentGoodsDown: function (shop_goods_id = 0,status=1) {
    return http.request("agent-goods-down", {
      shop_goods_id: shop_goods_id,
      status:status
    });
  },
  toggleAgentShopGoodsTop:function(shop_goods_id,is_top){
    return http.request("agent-shop-goods-top", {
      shop_goods_id: shop_goods_id,
      is_top:is_top,
    });
  }

}
