// components/shelves/scanCodeGoods.js
const agentShelvesModel = require("../../models/agentShelves.js");
const tool = require("../../utils/tool");
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer: function (show) {
        this.setData({
          show: show
        })
      },
    },
    goodsSkus: {
      type: Array,
      observer: function (value) {
        this.convert(value)
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    skus: []
  },
  /**
   * 组件的方法列表
   */
  methods: {
    convert(props) {
      if (props) {
        let reallySkus = this.initSkus(props);
        this.setData({
          skus: reallySkus
        })
      }
    },
    onChange: function (e) {
      let index = e.currentTarget.dataset.index;
      let price = Number(e.detail);
      let sku = this.data.skus[index];
      let key = "skus[" + index + "]"
      wx.showLoading({
        title: "计算中...",
      });
      const newPrice = tool.numberMul(price,100);
      agentShelvesModel.getAgentGoodsCommission(sku.skuPrice, newPrice)
        .then(res => {
          wx.hideLoading()
          sku.profitPrice = ((res.money) / 100).toFixed(2)
          sku.calPrice = price
          this.setData({
            [key]: sku
          })
        }).catch(err => {
          wx.hideLoading()
          this.setData({
            [key]: sku
          })
        })
    },
    onOverlimit: function (e) {
      if (e.detail === "inputMinus") {
        let index = e.currentTarget.dataset.index;
        wx.showToast({
          title: "不能低于官方指导价￥" + this.data.skus[index].minPrice + "~",
          icon: "none",
          duration: 2000,
        });
      }
    },
    stepperPlus: function (e) {
    },
    stepperMinus: function (e) {
    },
    handleOnConfirm: function () {
      let skus = []
      this.data.skus.forEach(sku=>{
        const new_price = tool.numberMul(Number(sku.calPrice),100);
        skus.push({
          id:sku.id,
          price:new_price,
        })
      })
      this.triggerEvent('confirm',skus)
    },
    handleOnCancel: function () {
      this.setData({
        show: false,
      })
    },
    handleOnReset: function () {
      let reallySkus = this.resetSkus(this.data.skus);
      this.setData({
        skus: reallySkus
      })
    },
    initSkus(skus) {
      let reallySkus = []
      skus.forEach(sku => {
        let skuPrice = Number(sku.min_price)
        let step = Number(((skuPrice * 0.05) / 100).toFixed(2))
        if(step==0){
          step = 0.01
        }
        let title = ""
        if (sku.Title) {
          title = sku.Title
        } else if (sku.title) {
          title = sku.title
        }
        let calPrice = (skuPrice / 100).toFixed(2)
        let profitPrice = (sku.commission/100).toFixed(2)
        if(sku.goods_sku_price){
          calPrice = (sku.goods_sku_price / 100).toFixed(2)
        }
        if(sku.goods_sku_commission){
          profitPrice = (sku.goods_sku_commission/100).toFixed(2)
        }
        reallySkus.push({
          id: sku.id,
          goodsName: title,
          imgUrl: sku.sku_img,
          skuPrice: skuPrice,
          commission: sku.commission,
          minPrice: Number((skuPrice / 100).toFixed(2)),
          calPrice: Number(calPrice),
          profitPrice: profitPrice,
          step: step,
          goods_sku_price:sku.goods_sku_price,
          goods_sku_commission:sku.goods_sku_commission
        })
      });
      return reallySkus;
    },
    resetSkus(skus) {
      return skus.map(sku => {
        let profitPrice = (sku.commission/100).toFixed(2)
        // if(sku.goods_sku_commission){
        //   profitPrice = (sku.goods_sku_commission/100).toFixed(2)
        // }
        let calPrice = sku.minPrice
        // if(sku.goods_sku_price){
        //   calPrice = (sku.goods_sku_price / 100).toFixed(2)
        // }
        sku.calPrice = calPrice
        sku.profitPrice = profitPrice
        return sku;
      })
    },
      preventTouchMove() {

      },
  }
})
