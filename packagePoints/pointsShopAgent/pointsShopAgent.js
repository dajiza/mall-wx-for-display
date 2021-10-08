import screenConfig from '../../utils/screen_util'
import moment from 'moment'

const pointsModel = require('../../models/points')
const config = require('../../config/config')

const app = getApp()
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const navHeightRpx = screenConfig.getRPX(Number(app.globalData.statusBarHeight) + 46)

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
    safeAreaInsetBottom: safeAreaInsetBottom,
    dropdownTop: navHeightRpx + 198,
    activeIndex: 0,
    subActiveIndexs: [0, 0],
    tabGoodsSubType: [0, 0],
    tabGoodsList: [],
    tabOrderList: [],
    notShippedCount: 0,
    showGoodsDropdown: false,
    showCouponDropdown: false,
    initialize: [false, false],
    loaded: false,
    pages: [1, 1],
    listTotals: [10, 10],
    bottomLoadingShow: [false, false],
    isAllLoaded: [false, false],
  },

  onLoad: function (options) {
    //默认加载商品分页的已上架商品
    this.loadData((res) => {
      let initializeKey = 'initialize[0]'
      this.setData({
        tabGoodsList: res,
        [initializeKey]: true,
        loaded: true,
      })
    })
    this.updateNotSandNum()
  },

  onPullDownRefresh: function () {
    //下拉刷新
    this.loadData((res) => {
      this.updateList(res)
    })
  },

  onReachBottom: function () {
    //上拉加载
    let activeIndex = this.data.activeIndex
    let total = this.data.listTotals[activeIndex]
    if (activeIndex == 0) {
      if (this.data.tabGoodsList.length >= total) {
        //已加载全部的列表
        return
      }
    } else {
      if (this.data.tabOrderList.length >= total) {
        //已加载全部的列表
        return
      }
    }
    this.loadData((res) => {
      this.updateList(res, true)
    }, true, false)
  },

  loadData: function (callback, loadMore = false, showLoading = true) {
    let activeIndex = this.data.activeIndex
    let subActiveIndex = this.data.subActiveIndexs[activeIndex]
    let dataPromise = null
    //分页请求
    let page = this.data.pages[activeIndex]
    if (!loadMore) {
      page = 1
    }
    let pagesKey = "pages[" + activeIndex + "]"
    let isAllLoadedKey = "isAllLoaded[" + activeIndex + "]"
    let bottomLoadingShowKey = "bottomLoadingShow[" + activeIndex + "]"
    let listTotalsKey = "listTotals[" + activeIndex + "]"
    if (activeIndex == 0) {
      //获取商品分页相关数据
      if (subActiveIndex == 0) {
        //商品
        let type = this.data.tabGoodsSubType[0] //商品上下架类型
        let status = (type == 0) ? 2 : 1
        dataPromise = pointsModel.pointsAgentGoodsList(page, config.shopId, status)
          .then(res => {
            //UI数据适配
            let list = res.list || []
            let newList = list.map(ev => {
              let price = "￥" + (ev.price / 100).toFixed(2)
              return {
                id: ev.goodsId,
                imgUrl: ev.img,
                goodsName: ev.title,
                price: price,
                points: ev.points
              }
            })
            return {
              list: newList,
              total: res.total
            }
          })
      } else {
        //优惠卷
        let type = this.data.tabGoodsSubType[1] //优惠卷上下架类型
        let status = (type == 0) ? 2 : 1
        dataPromise = pointsModel.pointsAgentCouponList(page, config.shopId, status)
          .then(res => {
            //UI数据适配
            let list = res.list || []
            let newList = list.map(ev => {
              let coupon = ev.coupon
              let couponAmount = (coupon.type == 1) ? (coupon.coupon_amount / 100) : (coupon.coupon_amount / 10)
              let withAmount = (coupon.with_amount / 100) + ''
              let discountTop = (coupon.discount_top / 100) + ''
              let useGoodsTypeStr = ''
              if (coupon.use_goods_type == 1) {
                useGoodsTypeStr = "全场通用"
              } else if (coupon.use_goods_type == 2) {
                useGoodsTypeStr = "指定商品可用"
              } else if (coupon.use_goods_type == 3) {
                useGoodsTypeStr = "指定标签可用"
              }
              let valid = ''
              if (coupon.valid_type == 1) {
                valid = "领取后" + coupon.valid_days + "天内有效"
              } else if (coupon.valid_type == 2) {
                valid = moment(coupon.valid_start_time).format('YYYY.MM.DD') + "-" + moment(coupon.valid_end_time).format('YYYY.MM.DD')
              }
              return {
                id: ev.id,
                couponAmount: couponAmount + "",
                withAmount: withAmount,
                type: coupon.type,
                useGoodsType: coupon.use_goods_type,
                useGoodsTypeStr: useGoodsTypeStr,
                couponPoints: ev.points,
                couponId: ev.couponId,
                discountTop: discountTop,
                valid: valid
              }
            })
            return {
              list: newList,
              total: res.total
            }
          })
      }
    } else {
      //获取订单分页相关数据
      let isSand = (subActiveIndex == 0) ? 2 : 1
      let limit = 10
      if (subActiveIndex == 0) {
        //未发货,需要合并显示
        limit = 10000
      }
      dataPromise = pointsModel.pointsOrderListAdmin(page, isSand, limit)
        .then(res => {
          let list = res.lists || []
          let newList = []
          if (subActiveIndex == 0) {
            //合并发货
            let logisticsUniqueMap = new Map()
            list.forEach(value => {
              let key = value.logistics_unique
              if (logisticsUniqueMap.has(key)) {
                let newValue = logisticsUniqueMap.get(key)
                newValue["exchangeSubjectJsonList"].push({
                  exchangeSubject: value.exchange_subject_json,
                  points: value.price,
                  num: value.num,
                  props: value
                })
              } else {
                let newValue = { ...value }
                newValue["exchangeSubjectJsonList"] = [{
                  exchangeSubject: value.exchange_subject_json,
                  points: value.price,
                  num: value.num,
                  props: value
                }]
                logisticsUniqueMap.set(key, newValue)
                newList.push(newValue)
              }
            })
          } else {
            //保持数据格式一致
            newList = list.map(ev => {
              let newValue = { ...ev }
              newValue["exchangeSubjectJsonList"] = [{
                exchangeSubject: ev.exchange_subject_json,
                points: ev.price,
                num: ev.num,
                props: ev
              }]
              return newValue
            })
          }
          return {
            total: res.total,
            lists: newList,
          }
        })
        .then(res => {
          //UI数据适配
          let list = res.lists || []
          let newList = list.map(ev => {
            let props = []
            let detail = ev.exchangeSubjectJsonList.map(exchangeSubject => {
              let exchangeStr = exchangeSubject.exchangeSubject
              let points = exchangeSubject.points
              let num = exchangeSubject.num
              let exchange = JSON.parse(exchangeStr)
              props.push(exchangeSubject.props)
              return {
                detailId: exchange.Id,
                imgUrl: exchange.Img,
                goodsName: exchange.Title,
                num: num,
                points: points,
              }
            })
            return {
              id: ev.id,
              userName: ev.user_nick_name,
              detail: detail,
              props: props,
            }
          })
          return {
            list: newList,
            total: res.total
          }
        })
        .then(res => {
          if ((subActiveIndex == 0)) {
            this.updateNotSandNum(res.list.length)
          }
          return res
        })
    }
    if (dataPromise != null) {
      this.setData({
        loaded: false
      })
      if (showLoading) {
        if (!loadMore) {
          //下拉刷新
          wx.showLoading({
            title: '加载中...',
          })
        } else {
          //上拉加载
          this.setData({
            [bottomLoadingShowKey]: true,
          })
        }
      }
      //正式请求后台
      dataPromise.then(res => {
        if (!loadMore) {
          //下拉刷新，覆盖原始数据
          if (showLoading) {
            wx.hideLoading()
          }
          page++
          let isAllLoaded = false
          if (res.list.length <= res.total) {
            //已获取全部列表数据
            isAllLoaded = true
          }
          this.setData({
            [pagesKey]: page,
            [listTotalsKey]: res.total,
            [isAllLoadedKey]: isAllLoaded,
          }, () => {
            if (!loadMore) {
              wx.stopPullDownRefresh()
            }
            //将数据抛出
            callback(res.list, loadMore)
          })
        } else {
          //上拉加载,追加数据
          page++
          let isAllLoaded = false
          if (activeIndex == 0) {
            isAllLoaded = this.data.tabGoodsList.length + res.list.length >= res.total
          } else {
            isAllLoaded = this.data.tabOrderList.length + res.list.length >= res.total
          }
          this.setData({
            [pagesKey]: page,
            [isAllLoadedKey]: isAllLoaded,
            [bottomLoadingShowKey]: false,
          }, () => {
            //将数据抛出
            callback(res.list, loadMore)
          })
        }
      }).catch(err => {
        console.log(err)
        if (!loadMore) {
          wx.hideLoading()
          wx.stopPullDownRefresh()
          this.setData({
            loaded: true,
          })
        } else {
          this.setData({
            loaded: true,
            [bottomLoadingShowKey]: false,
          })
        }
      })
    }
  },
  tabsChange(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({
      loaded: this.data.initialize[index],
      activeIndex: index
    }, () => {
      if (!this.data.initialize[index]) {
        //该分页未加载过
        this.loadData((res) => {
          console.log("onTabChange tab:" + index)
          let initializeKey = 'initialize[' + index + ']'
          let diff = {}
          if (index == 0) {
            diff["tabGoodsList"] = res || []
          } else {
            diff["tabOrderList"] = res || []
          }
          this.setData({
            ...diff,
            loaded: true,
            [initializeKey]: true,
          }, () => {
            if (index ==1 && this.data.subActiveIndexs[index] == 0) {
              //加载的是未发货列表
              this.setData({
                notShippedCount: this.data.tabOrderList.length
              })
            }
          })
        })
      }
    })
  },
  onTabChange: function (e) {
    let index = e.detail.index
    this.setData({
      loaded: this.data.initialize[index],
      activeIndex: index
    }, () => {
      if (!this.data.initialize[index]) {
        //该分页未加载过
        this.loadData((res) => {
          console.log("onTabChange tab:" + index)
          let initializeKey = 'initialize[' + index + ']'
          let diff = {}
          if (index == 0) {
            diff["tabGoodsList"] = res || []
          } else {
            diff["tabOrderList"] = res || []
          }
          this.setData({
            ...diff,
            loaded: true,
            [initializeKey]: true,
          }, () => {
            if (index ==1 && this.data.subActiveIndexs[index] == 0) {
              //加载的是未发货列表
              this.setData({
                notShippedCount: this.data.tabOrderList.length
              })
            }
          })
        })
      }
    })
  },
  onGoodsTabChange: function (e) {
    let index = e.currentTarget.dataset.index
    if (index == this.data.subActiveIndexs[0]) {
      return
    }
    let key = 'subActiveIndexs[0]'
    this.setData({
      tabGoodsList: [],
      loaded: false,
      [key]: index
    }, () => {
      //获取对应tab的列表数据
      this.loadData((res) => {
        console.log("onGoodsTabChange tab:" + index)
        this.setData({
          tabGoodsList: res || [],
          loaded: true,
        })
      })
    })
  },
  onOrderTabChange: function (e) {
    let index = e.currentTarget.dataset.index
    if (index == this.data.subActiveIndexs[1]) {
      return
    }
    let key = 'subActiveIndexs[1]'
    this.setData({
      tabOrderList: [],
      loaded: false,
      [key]: index
    }, () => {
      this.loadData((res) => {
        console.log("onOrderTabChange tab:" + index)
        let diff = {
          tabOrderList: res || [],
        }
        if (index == 0) {
          diff["notShippedCount"] = diff["tabOrderList"].length
        }
        this.setData({
          ...diff,
          loaded: true,
        })
      })
    })
  },
  showGoodsDropdown: function (e) {
    let index = e.currentTarget.dataset.index
    if (index == 0) {
      this.setData({
        showGoodsDropdown: true,
        showCouponDropdown: false
      })
    } else {
      this.setData({
        showGoodsDropdown: false,
        showCouponDropdown: true
      })
    }
  },
  handleAdd: function () {
    let activeIndex = this.data.activeIndex
    if (activeIndex != 0) {
      return
    }
    let subActiveIndex = this.data.subActiveIndexs[activeIndex]
    let url = ''
    if (subActiveIndex == 0) {
      //添加商品
      url = "/packagePoints/addGoods/addGoods"
      let that = this
      wx.chooseImage({
        count: 6,
        sizeType: ['original'],
        sourceType: ['album'],
        success(res) {
          if (res.errMsg == "chooseImage:ok") {
            let tempFilePaths = res.tempFilePaths
            if (tempFilePaths.length > 0) {
              wx.navigateTo({
                url: url,
                events: {
                  updateList: function () {
                    that.loadData((res) => {
                      that.updateList(res)
                    }, false, false)
                  },
                },
                success: function (res) {
                  res.eventChannel.emit("pickImageListEvent", tempFilePaths)
                }
              })
            }
          }
        }
      })
    } else {
      //添加优惠券
      url = "/packagePoints/addCoupon/addCoupon"
      let that = this
      wx.navigateTo({
        url: url,
        events: {
          updateList: function () {
            that.loadData((res) => {
              that.updateList(res)
            }, false, false)
          },
        },
      })
    }
  },
  HandleClickItem: function (e) {
    console.log(e)
    let activeIndex = this.data.activeIndex
    let subActiveIndex = this.data.subActiveIndexs[activeIndex]
    let index = e.currentTarget.dataset.index
    let url = ""
    if (activeIndex == 0) {
      let id = this.data.tabGoodsList[index].id
      if (subActiveIndex == 0) {
        //商品
        url = "/packagePoints/addGoods/addGoods?id=" + id
      } else {
        //优惠券
        url = "/packagePoints/addCoupon/addCoupon?id=" + id
      }
    } else {
      //兑换订单
      url = "/packagePoints/redeemOrderDetail/redeemOrderDetail?isSend=" + subActiveIndex
    }
    if (url.length == 0) {
      return
    }
    let that = this
    wx.navigateTo({
      url: url,
      events: {
        updateList: function (res) {
          if (res) {
            let subActiveIndex = res
            that.loadData((res) => {
              that.updateList(res)
              that.onOrderTabChange({
                currentTarget: {
                  dataset: {
                    index: subActiveIndex
                  }
                }
              })
            }, false, false)
          } else {
            that.loadData((res) => {
              that.updateList(res)
            }, false, false)
          }
        },
      },
      success: function (res) {
        if (activeIndex == 1) {
          let order = that.data.tabOrderList[index]
          let list = order.detail.map(ev => {
            return {
              id: ev.detailId,
              title: ev.goodsName,
              price: ev.points,
              num: ev.num,
              img: ev.imgUrl
            }
          })
          res.eventChannel.emit("goodsDetailObserver", {
            list: list,
            props: order.props
          })
        }
      }
    })
  },
  updateList: function (res, isLoadMore = false) {
    console.log(res)
    let diff = {}
    let activeIndex = this.data.activeIndex
    if (activeIndex == 0) {
      if (isLoadMore) {
        //追加数据
        let offset = this.data.tabGoodsList.length
        res.forEach((value, index) => {
          let key = 'tabGoodsList[' + (offset + index) + ']'
          diff[key] = value
        })
      } else {
        diff["tabGoodsList"] = res || []
      }
    } else {
      if (isLoadMore) {
        //追加数据
        let offset = this.data.tabOrderList.length
        res.forEach((value, index) => {
          let key = 'tabOrderList[' + (offset + index) + ']'
          diff[key] = value
        })
      } else {
        diff["tabOrderList"] = res || []
      }
    }
    this.setData({
      ...diff,
      loaded: true,
    }, () => {
      if (activeIndex ==1 && this.data.subActiveIndexs[activeIndex] == 0) {
        //加载的是未发货列表
        this.setData({
          notShippedCount: this.data.tabOrderList.length
        })
      }
    })
  },
  updateNotSandNum: function (num = -1) {
    if (num == -1) {
      pointsModel.pointsOrderListNotSandNum()
        .then(res => {
          //更新未发货的订单数
          console.log("updateNotSandNum", res)
          this.setData({
            notShippedCount: res
          })
        })
        .catch(err => {
          console.log(err)
        })
    } else {
      //更新未发货的订单数
      console.log("updateNotSandNum", num)
      this.setData({
        notShippedCount: num
      })
    }
  },
  handleClickDropdownMenu: function (e) {
    console.log(e)
    let index = e.currentTarget.dataset.index
    let type = e.currentTarget.dataset.type
    if (type == "coupon") {
      let key = 'tabGoodsSubType[1]'
      this.setData({
        showCouponDropdown: false,
        [key]: index
      }, () => {
        this.loadData((res) => {
          this.setData({
            tabGoodsList: res || [],
            loaded: true,
          })
        })
      })
    } else if (type == "goods") {
      let key = 'tabGoodsSubType[0]'
      this.setData({
        showGoodsDropdown: false,
        [key]: index
      }, () => {
        this.loadData((res) => {
          this.setData({
            tabGoodsList: res || [],
            loaded: true,
          })
        })
      })
    }
  },
  onGoodsDropdownClose: function (e) {
    this.setData({
      showGoodsDropdown: false,
    })
  },
  onCouponDropdownClose: function (e) {
    this.setData({
      showCouponDropdown: false,
    })
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