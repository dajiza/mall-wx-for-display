// pages/goodsManagerDetail/goodsManagerDetail.js
import screenConfig from '../../utils/screen_util';

const agentShelvesModel = require("../../models/agentShelves");
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX);
const tool = require("../../utils/tool");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    safeAreaInsetBottom: safeAreaInsetBottom,
    current: 0,
    goodsId: 0,
    is_top: 1,
    type: 0,
    goodsImgData: [],
    goodsSkus: [],
    goodsName: ''
  },

  videoContext: {
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    let goodsId = options.goodsId
    this.data.goodsName = options.goodsName
    this.data.type = Number(options.type)
    this.data.is_top = options.is_top || 1
    this.getGoods(Number(goodsId));
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.data.goodsImgData.forEach((value, index) => {
      if (value.type == 2) {
        this.videoContext[index] = wx.createVideoContext('video_' + index)
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  // 自定义dots
  swiperChange: function (e) {
    var that = this;
    if (e.detail.source == "touch") {
      let current = Number(e.detail.current)
      this.data.goodsImgData.forEach((value, index) => {
        if (value.type == 2 && current != index) {
          let videContext = this.videoContext[index]
          if (videContext) {
            console.log(videContext)
            videContext.stop()
          }
        }
      });
      if (this.data.goodsImgData[current].type == 2) {
        let videContext = this.videoContext[current]
        if (videContext) {
          console.log(videContext)
          videContext.play()
        }
      }
      that.setData({
        current: e.detail.current,
      });
    }
  },
  // 预览图片
  previewImage: function (e) {
    var src = e.currentTarget.dataset.src; // 获取data-src
    console.log("GOOGLE: src", src);
    var imgList = this.data.goodsImgData.map(
      (item) => item.img_url
    ); // 获取data-list
    console.log("GOOGLE: imgList", imgList);
    wx.previewImage({
      current: src, // 当前显示图片的http链接
      urls: imgList, // 需要预览的图片http链接列表
      success: function (res) {
        console.log("success");
      },
      fail: function (res) {
        console.log("fail");
      },
    });
  },

  onPop() {
    let pages = getCurrentPages();
    if (pages.length === 1) {
      wx.switchTab({
        url: '../index/index'
      })
    } else {
      wx.navigateBack({
        delta: 1
      });
    }
  },

  handleOnReset() {
    let goodsSkus = this.data.goodsSkus.map(sku => {
      let calPrice = sku.minPrice
      // if (sku.goods_sku_price) {
      //   calPrice = (sku.goods_sku_price / 100).toFixed(2)
      // }
      let commission = sku.originCommission
      // if (sku.goods_sku_commission) {
      //   commission = sku.goods_sku_commission
      // }
      sku.commission = commission
      sku.calPrice = calPrice
      return sku
    })
    this.setData({
      goodsSkus: goodsSkus,
    })
  },

  handleOnConfirm() {
      var timerBatch;
      clearTimeout(timerBatch);
      let skus = this.data.goodsSkus.map(sku => {
      const newPrice = tool.numberMul(sku.calPrice,100);
      return {
        id: sku.id,
        price: newPrice,
      }
      })
    let request = {
      goods_id: this.data.goodsId,
      is_top: this.data.is_top,
      skus: skus,
    }
    console.log(request)
    wx.showLoading({
      title: '加载中...',
    })
    agentShelvesModel.getAgentGoodsOn(request)
      .then(res => {
        wx.hideLoading({
          success: (res) => {
              wx.showToast({
                  title: "上架成功",
                  icon: "none",
                  duration: 2000,
                  mask: true,
              });
              timerBatch = setTimeout(()=>{
                  wx.navigateBack();
              },1500)
          },
        })
      })
      .catch(err => {
        console.log(err)
        wx.hideLoading()
      })
  },

  handleOnSingleReset(e) {
    let index = e.currentTarget.dataset.index;
    let sku = this.data.goodsSkus[index];
    let key = "goodsSkus[" + index + "]"
    let calPrice = sku.minPrice
    // if (sku.goods_sku_price) {
    //   calPrice = (sku.goods_sku_price / 100).toFixed(2)
    // }
    let commission = sku.originCommission
      // if (sku.goods_sku_commission) {
      //   commission = sku.goods_sku_commission
      // }
    sku.commission = commission
    sku.calPrice = calPrice
    this.setData({
      [key]: sku
    })
  },
  onChange: function (e) {
    let index = e.currentTarget.dataset.index;
    let price = Number(e.detail);
    let sku = this.data.goodsSkus[index];
    let key = "goodsSkus[" + index + "]"
    wx.showLoading({
      title: "计算中...",
    });
    const new_price = tool.numberMul(price,100);
    agentShelvesModel.getAgentGoodsCommission(sku.skuPrice, new_price)
      .then(res => {
        wx.hideLoading()
        sku.commission = res.money
        sku.calPrice = price
        this.setData({
          [key]: sku
        })
        console.log(this.data)
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
        title: "不能低于官方指导价￥" + this.data.goodsSkus[index].minPrice + "~",
        icon: "none",
        duration: 2000,
      });
    }
  },
  getGoods(goodsId) {
    if (goodsId) {
      wx.showLoading({
        title: '加载中...',
      })
      let type = this.data.type
      agentShelvesModel.getAgentGoodsSkuList(goodsId)
        .then(res => {
          let goodsSkus = []
          res.goods_sku_data.forEach(sku => {
            let skuPrice = Number(sku.min_price)
            let step = Number(((skuPrice * 0.05) / 100).toFixed(2))
            if(step==0){
              step = 0.01
            }
            let minPrice = Number((skuPrice / 100).toFixed(2))
            let calPrice = (skuPrice / 100).toFixed(2)
            let displayPrice = sku.display_price
            if (sku.goods_sku_price) {
              calPrice = (sku.goods_sku_price / 100).toFixed(2)
              displayPrice = sku.goods_sku_price
            }
            let commission = sku.commission
            if (sku.goods_sku_commission) {
              commission = sku.goods_sku_commission
            }
            goodsSkus.push({
              id: sku.id,
              goods_id: sku.goods_id,
              img: sku.sku_img,
              title: sku.Title || sku.title,
              price: displayPrice,
              status: sku.status,
              not_allow: sku.not_allow,
              commission: commission,
              displaySales: "",
              attr_brand: sku.attr_brand,
              attr_material: sku.attr_material,
              attr_color: sku.attr_color,
              attr_origin: sku.attr_origin,
              attr_pattern: sku.attr_pattern,
              attr_piece:sku.attr_piece,
              attr_size:sku.attr_size,
              stockAvailable: sku.stock_available,
              type: type,
              step: step,
              originCommission: sku.commission,
              skuPrice: skuPrice,
              minPrice: minPrice,
              calPrice: calPrice,
              goods_sku_price: sku.goods_sku_price,
              goods_sku_commission: sku.goods_sku_commission
            })
          });
          return {
            goods_sku_data: goodsSkus,
            goods_img_data: res.goods_img_data
          }
        })
        .then(res => {
          console.log(res)
          wx.hideLoading()
          this.setData({
            goodsId: goodsId,
            goodsSkus: res.goods_sku_data,
            goodsImgData: res.goods_img_data,
            goodsName: this.data.goodsName
          })
        })
        .catch(err => {
          console.log(err)
          wx.hideLoading()
        })
    }
  }
})
