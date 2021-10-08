import screenConfig from '../../utils/screen_util'
import moment from 'moment'

const pointsModel = require('../../models/points')
const config = require('../../config/config')

const app = getApp()
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
Page({
  data: {
    searchValue: '',
    statusBarHeight: app.globalData.statusBarHeight,
    navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
    safeAreaInsetBottom: safeAreaInsetBottom,
    list: [],
    loaded: false,
  },
  onLoad: function (options) {
    this.loadData()
  },
  loadData: function () {
    wx.showLoading({
      title: '加载中...',
    })
    pointsModel.pointsAgentShopCouponList(config.shopId, this.data.searchValue)
      .then(res => {
        let list = res || []
        let newList = list.map(ev => {
          let useGoodsTypeStr = ""
          if (ev.use_goods_type == 1) {
            useGoodsTypeStr = "全场通用"
          } else if (ev.use_goods_type == 2) {
            useGoodsTypeStr = "指定商品可用"
          } else if (ev.use_goods_type == 3) {
            useGoodsTypeStr = "指定标签可用"
          }
          let valid = ""
          if (ev.valid_type == 1) {
            valid = "领取后" + ev.valid_days + "天内有效"
          } else if (ev.valid_type == 2) {
            valid = moment(ev.valid_start_time).format('YYYY.MM.DD') + "-" + moment(ev.valid_end_time).format('YYYY.MM.DD')
          }
          return {
            id: ev.id,
            name: ev.title,
            couponAmount: ev.coupon_amount,
            withAmount: ev.with_amount,
            useGoodsTypeStr: useGoodsTypeStr,
            totalNum: ev.quota,
            takeCount: ev.take_count,
            discount: ev.discount_top,
            type: ev.type,
            valid: valid,
          }
        })
        wx.hideLoading()
        this.setData({
          loaded: true,
          list: newList
        })
      })
      .catch(err => {
        wx.hideLoading()
      })
  },
  handleOnSearch: function (e) {
    this.loadData()
  },
  bindSearchInput: function (e) {
    this.setData({
      searchValue: e.detail.value,
    })
  },
  bindClearSearch: function (e) {
    this.setData({
      searchValue: "",
    }, () => {
      this.loadData()
    })
  },
  handleClickItem: function (e) {
    console.log(e)
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      let index = e.currentTarget.dataset.index
      let coupon = this.data.list[index]
      eventChannel.emit('updateCoupon', coupon);
    }
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
      })
    }, 10)
  },
  ClickBack() {
    let pages = getCurrentPages();
    if (pages.length === 1) {
      wx.switchTab({
        url: "../index/index",
      });
    } else {
      wx.navigateBack({
        delta: 1,
      });
    }
  },
})