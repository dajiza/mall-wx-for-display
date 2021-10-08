import screenConfig from '../../utils/screen_util'

const app = getApp()
const pageLayoutModel = require('../../models/pageLayout')
const util = require('../../utils/util')

Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    bannerHeight: screenConfig.getRPX(Number(app.globalData.statusBarHeight) + 46) + 548,
    windowHeight: 0,
    mainBannerCurrent: 0,
    navHeight: Number(app.globalData.statusBarHeight) + 46,
    searchBarWidth: 690,
    searchBarTop: Number(app.globalData.statusBarHeight) + 46,
    searchBarFixed: false,
    indicatorDots: false,
    opacity: 0,
    autoplay: true,
    duration: 500,
    bannerList: [],
    layoutList: [],
    subBannerBottom: 0,
    subBannerAutoplay: true,
  },
  observers: {
    "searchBarFixed": function (searchBarFixed) {
      this.setData({
        autoplay: !searchBarFixed
      })
    },
    "subBannerAutoplay":function(subBannerAutoplay){
      console.log("subBannerAutoplay",subBannerAutoplay)
    },
    "autoplay":function(autoplay){
      console.log("autoplay",autoplay)
    }
  },
  lifetimes: {
    attached: function () {
      this.handleAttached()
    },
    detached: function () {
      this.handleDetached()
    },
  },
  attached: function () {
    this.handleAttached()
  },
  detached: function () {
    this.handleDetached()
  },
  pageLifetimes: {
    show: function () {
      if (!this.data.searchBarFixed) {
        //banner已在屏幕中
        this.setData({
          autoplay: true
        })
      }
      this.checkContentBanner()
    },
    hide: function () {
      this.setData({
        autoplay: false,
        subBannerAutoplay: false,
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    handleAttached: function () {
      let systemInfo = wx.getSystemInfoSync()
      this.setData({
        windowHeight: systemInfo.windowHeight,
      }, () => {
        this.loadData()
      })
    },
    handleDetached: function () { },
    loadData() {
      pageLayoutModel.pageLayoutDetail()
        .then(res => {
          let list = res.layoutList || []
          let layoutList = []
          let bannerList = []
          list.forEach(ev => {
            if (ev.status == 2) {
              if (ev.kind == 5) {
                //bannner位
                let contentList = ev.ContentList.filter(content => {
                  return content.status == 2
                })
                bannerList.push(...contentList)
              } else {
                let contentList = ev.ContentList.filter(content => {
                  return content.status == 2
                })
                layoutList.push({
                  ...ev,
                  ContentList: contentList,
                  current: 0
                })
              }
            }
          })
          return {
            bannerList: bannerList,
            layoutList: layoutList
          }
        })
        .then(res => {
          this.setData({
            ...res
          }, () => {
            this.checkContentBanner()
          })
        })
        .catch(err => {
          console.log(err)
        })
    },
    swiperChange: function (e) {
      console.log(e)
      let current = e.detail.current
      let type = e.currentTarget.dataset.type
      if (type == "content") {
        let layoutIndex = e.currentTarget.dataset.layoutIndex
        let layout = this.data.layoutList[layoutIndex]
        layout.current = current
        let key = "layoutList[" + layoutIndex + "]" + "current"
        this.setData({
          [key]: current,
        })
      } else {
        this.setData({
          mainBannerCurrent: current,
        })
      }
    },
    handleGocategory:function(){
      wx.navigateTo({
        url: '/pages/category/category',
      })
    },
    handleClick: function (e) {
      let url = e.currentTarget.dataset.parameter
      wx.navigateTo({
        url: url,
      })
    },
    dummy: function (e) { },
    goSearch: function (e) {
      this.triggerEvent("go-search");
    },
    afterRead: function (e) {
      this.triggerEvent("after-read", { ...e.detail });
    },
    oversize: function (e) {
      this.triggerEvent("oversize");
    },
    checkContentBanner: function () {
      this.createSelectorQuery()
        .select('#contentBanner')
        .boundingClientRect(rect => {
          if (rect) {
            //该控件存在
            let autoplay = true
            if (rect.top > this.data.navHeight && rect.top < (this.data.windowHeight - 50)) {
              //在屏幕中
              autoplay = true
            } else {
              //不在屏幕中
              autoplay = false
            }
            this.setData({
              subBannerAutoplay: autoplay
            })
          }
        }).exec()
    },
    onPageScroll: function (e) {
      util.debounce(() => {
        //监听分页tab高度
        this.checkContentBanner()
      }, 100)()
      this.createSelectorQuery()
        .select('#banner')
        .boundingClientRect(rect => {
          let opacityRange = 40
          let offset = (Number(app.globalData.statusBarHeight) + 46 + opacityRange) - (rect.top + rect.height)
          if (offset >= 0) {
            if (offset <= opacityRange) {
              let opacity = 0
              opacity = offset * (46 / 100) / 10
              opacity = Math.min(opacity, 1)
              this.setData({
                opacity: opacity
              })
            } else {
              this.setData({
                opacity: 1
              })
            }
          } else {
            this.setData({
              opacity: 0
            })
          }
        }).exec();

      if (e.scrollTop < 180) {
        if (this.data.searchBarWidth == 690
          && this.data.searchBarTop == this.data.navHeight
          && this.data.searchBarFixed == false
        ) {
          return
        }
        this.setData({
          searchBarWidth: 690,
          searchBarTop: this.data.navHeight,
          searchBarFixed: false,
        })
        return
      }

      let bannerHeight = this.data.bannerHeight
      let slideHeight = screenConfig.getPX(bannerHeight) - 180
      let offset = e.scrollTop - 180
      let searchBarWidth = 690 - (690 - 520) * (offset / slideHeight) * 4
      searchBarWidth = searchBarWidth < 520 ? 520 : searchBarWidth

      let navHeight = this.data.navHeight
      let searchBarTop = navHeight - offset
      searchBarTop = searchBarTop < Number(app.globalData.statusBarHeight) ? Number(app.globalData.statusBarHeight) : searchBarTop
      searchBarTop = searchBarTop > navHeight ? navHeight : searchBarTop

      this.setData({
        searchBarWidth: searchBarWidth,
        searchBarTop: searchBarTop,
        searchBarFixed: searchBarTop == Number(app.globalData.statusBarHeight)
      })
    }
  }
})
