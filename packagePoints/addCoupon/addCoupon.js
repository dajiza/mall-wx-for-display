import screenConfig from '../../utils/screen_util'
import moment from 'moment'

const pointsModel = require('../../models/points')
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
Page({
  data: {
    safeAreaInsetBottom: safeAreaInsetBottom,
    id: 0,
    isEdit: false,
    title: "",
    points: "",
    status: 0,
    couponId: 0,
    couponName: "",
    couponDetailInfo: []
  },
  onLoad: function (options) {
    let id = Number(options.id || '0')
    this.setData({
      id: id,
      isEdit: id > 0,
      title: id > 0 ? "编辑优惠券" : "新建优惠券",
    }, () => {
      if (this.data.isEdit) {
        //编辑模式,获取优惠券详情
        wx.showLoading({
          title: '加载中...',
        })
        pointsModel.pointsAgentCouponDetail(this.data.id)
          .then(res => {
            wx.hideLoading()
            let coupon = res.coupon
            let useGoodsTypeStr = ""
            if (coupon.use_goods_type == 1) {
              useGoodsTypeStr = "全场通用"
            } else if (coupon.use_goods_type == 2) {
              useGoodsTypeStr = "指定商品可用"
            } else if (coupon.use_goods_type == 3) {
              useGoodsTypeStr = "指定标签可用"
            }
            let valid = ""
            if (coupon.valid_type == 1) {
              valid = "领取后" + coupon.valid_days + "天内"
            } else if (coupon.valid_type == 2) {
              valid = moment(coupon.valid_start_time).format('YYYY.MM.DD') + "-" + moment(coupon.valid_end_time).format('YYYY.MM.DD')
            }
            let couponDetailInfo = this.format({
              name: coupon.title,
              couponAmount: coupon.coupon_amount,
              withAmount: coupon.with_amount,
              useGoodsTypeStr: useGoodsTypeStr,
              totalNum: coupon.quota,
              takeCount: coupon.take_count,
              discount: coupon.discount_top,
              type: coupon.type,
              valid: valid,
            })
            this.setData({
              points: res.points,
              couponId: res.couponId,
              couponName: coupon.title,
              couponDetailInfo: couponDetailInfo,
              status: res.status
            })
          })
          .catch(err => {
            wx.hideLoading()
          })
      }
    })
  },
  handleSave: function () {
    let id = this.data.id
    let points = Number(this.data.points) || 0
    let couponId = this.data.couponId
    if ((couponId == 0)) {
      wx.showToast({
        icon: 'none',
        title: '请选择优惠券',
      })
      return
    }
    if (points == 0) {
      wx.showToast({
        icon: 'none',
        title: '积分不能设置为0',
      })
      return
    }
    wx.showLoading({
      title: '保存中...',
    })
    pointsModel.pointsAgentCouponEdit(id, points, couponId)
      .then(res => {
        wx.hideLoading()
        this.finish()
      })
      .catch(err => {
        wx.hideLoading()
      })
  },
  handleCouponPick: function (e) {
    let that = this
    wx.navigateTo({
      url: '/packagePoints/couponList/CouponList',
      events: {
        updateCoupon: function (res) {
          let couponDetailInfo = that.format(res)
          that.setData({
            couponId: res.id,
            couponName: res.name,
            couponDetailInfo: couponDetailInfo
          })
        },
      },
    })
  },
  format: function (coupon) {
    let couponAmount = (coupon.type == 1) ? ("￥" + coupon.couponAmount / 100) : ((coupon.couponAmount / 10) + "折")
    let withAmount = (coupon.withAmount > 0) ? ("满￥" + coupon.withAmount / 100) : "无门槛"
    let useGoodsTypeStr = coupon.useGoodsTypeStr || ''
    let couponDetailInfo = [
      { name: "类型：", value: (coupon.type == 1) ? '满减' : '折扣' },
      { name: "面额：", value: couponAmount },
      { name: "使用门槛：", value: withAmount },
      { name: "使用期限：", value: coupon.valid },
      { name: "可用商品：", value: useGoodsTypeStr.replace("有效", "") },
      { name: "发放数量：", value: coupon.totalNum + "" },
      { name: "已发数量：", value: coupon.takeCount + "" },
    ]
    if (coupon.discount > 0 && coupon.type == 2) {
      couponDetailInfo.push({ name: "封顶优惠：", value: coupon.discount })
    }
    return couponDetailInfo
  },
  //删除
  handleDelete: function (e) {
    if (this.data.id == 0) {
      return
    }
    wx.showLoading({
      title: '删除...',
    })
    pointsModel.pointsAgentCouponDelete(this.data.id)
      .then(res => {
        wx.hideLoading()
        this.finish()
      })
      .catch(err => {
        wx.hideLoading()
      })
  },
  //上下架
  handleOnOff: function (e) {
    if (this.data.id == 0) {
      return
    }
    let status = this.data.status
    if (status == 1) {
      status = 2
    } else if (status == 2) {
      status = 1
    }
    if (status == 0) {
      return
    }
    wx.showLoading({
      title: '加载中...',
    })
    pointsModel.pointsAgentCouponStatus(this.data.id, status)
      .then(res => {
        wx.hideLoading()
        this.finish()
      })
      .catch(err => {
        wx.hideLoading()
      })
  },
  finish: function () {
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('updateList');
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