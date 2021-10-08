import screenConfig from '../../utils/screen_util'
import moment from 'moment'

const pointsModel = require('../../models/points')

const app = getApp()
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
    safeAreaInsetBottom: safeAreaInsetBottom,
    activeIndex: 0,
    list: [],
    initialize: [false, false],
    loaded: false,
    page: 1,
    total: 10,
    bottomLoadingShow: false,
    isAllLoaded: false,
  },
  onLoad: function (options) {
    this.loadData(false, true)
  },
  onPullDownRefresh: function () {
    this.loadData(false, false)
  },
  onReachBottom: function () {
    if (this.data.list.length >= this.data.total) {
      //已加载全部的列表
      return
    }
    this.loadData(true, false)
  },
  onTabChange: function (e) {
    let index = e.detail.index
    this.setData({
      loaded: this.data.initialize[index],
      activeIndex: index
    }, () => {
      this.loadData(false, false)
    })
  },
  loadData: function (loadMore = false, init = false) {
    let page = this.data.page
    if (!loadMore) {
      //下拉刷新
      page = 1
      wx.showLoading({
        title: !init ? '刷新中...' : '加载中...',
      })
    } else {
      if (this.data.list.length >= this.data.total) {
        return
      }
      this.setData({
        bottomLoadingShow: true,
      })
    }
    let activeIndex = this.data.activeIndex
    let searchType = (activeIndex == 0) ? 1 : 2
    pointsModel.pointsLogList(page, searchType)
      .then(res => {
        console.log(res)
        let list = res.lists || []
        let newList = list.map(ev => {
          let desc = ''
          if (ev.type == 1) {
            desc = "购买商品"
          } else if (ev.type == 2) {
            desc = "兑换商品"
          } else if (ev.type == 3) {
            desc = "退款扣减"
          } else if (ev.type == 4) {
            desc = "发表评价"
          } else if (ev.type == 5) {
            desc = "兑换优惠卷"
          } else if (ev.type == 6) {
            desc = "旧系统导入"
          }
          let points = ev.points
          let type = points > 0 ? 1 : 2
          return {
            id: ev.id,
            desc: desc,
            time: moment(ev.created_at).format('YYYY.MM.DD HH:mm:ss'),
            points: (points > 0) ? ("+" + points) : (points + ""),
            type: type
          }
        })
        if (!loadMore) {
          //下拉刷新，覆盖原始数据
          wx.hideLoading()
          page++
          let isAllLoaded = false
          if (newList.length <= res.total) {
            //已获取全部列表数据
            isAllLoaded = true
          }
          let initializeKey = "initialize[" + activeIndex + "]"
          this.setData({
            [initializeKey]: true,
            list: newList,
            page: page,
            total: res.total,
            loaded: true,
            isAllLoaded: isAllLoaded,
          }, () => {
            if (!init && !loadMore) {
              wx.stopPullDownRefresh()
            }
          })
        } else {
          //上拉加载,追加数据
          let diffData = {}
          let offset = this.data.list.length
          newList.forEach((value, index) => {
            let key = 'list[' + (offset + index) + ']'
            diffData[key] = value
          })
          page++
          let isAllLoaded = false
          if (this.data.list.length + newList.length >= res.total) {
            //已加载全部数据
            isAllLoaded = true
          }
          this.setData({
            ...diffData,
            page: page,
            loaded: true,
            isAllLoaded: isAllLoaded,
            bottomLoadingShow: false,
          })
        }
      })
      .catch(err => {
        if (!loadMore) {
          wx.hideLoading()
          let initializeKey = "initialize[" + activeIndex + "]"
          this.setData({
            [initializeKey]: true,
            loaded: true,
          }, () => {
            if (!init && !loadMore) {
              wx.stopPullDownRefresh()
            }
          })
        }
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