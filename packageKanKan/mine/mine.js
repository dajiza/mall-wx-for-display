import screenConfig from '../../utils/screen_util'
const util = require('../../utils/util')

const tutorialModel = require('../../models/tutorial')
const userInfoModel = require('../../models/userInfo')
const userShopInfoModel = require('../../models/userShopInfo')
const app = getApp()

Page({
  data: {
    layoutType: 2,
    statusBarHeight: app.globalData.statusBarHeight,
    navHeight: Number(app.globalData.statusBarHeight) + 46,
    navOpacity: 0,
    avatar: "",
    name: "",
    introduce: "",
    isAuthor: false,
    shareCount: 0,
    collectCount: "0",
    courseList: [],
    introduceRect: null,
    ruleRect: null,
    showIntroduceDialog: false,
    total: 0,
    page: 1,
    pageSize: 10,
    bottomLoadingShow: false,
    isAllLoaded: false,
    showPop: false,
    rules: [],
  },
  tempData: {
    updateList: false,
    scrollTop: 0,
    scrollViewHeight: 0,
    scrolltolower: false,
  },
  onLoad: function (options) {
    let userId = options.user_id || "0"
    this.data.userId = Number(userId)
    let listOffset = this.data.navHeight + screenConfig.getPX(420)
    this.setData({
      listOffset: listOffset,
      listWrapHeight: "calc(100vh - " + (this.data.navHeight - screenConfig.getPX(0)) + "px);",
    }, () => {
      wx.showLoading({
        title: '加载中...',
      })
      userShopInfoModel.queryUserShopInfo()
        .then(res => {
          //用户自身的ID
          let userId = res.user_info.user_id
          let tutorialRate = res.shop_info.tutorial_rate
          let tutorialDays = res.shop_info.tutorial_days
          if (this.data.userId > 0 && userId != this.data.userId) {
            //url携带的userId存在且和用户自身的userId不一致，跳转的是别人的看看个人列表
            //二次请求
            this.data.isAuthor = false
          } else {
            this.data.isAuthor = true
          }
          return userInfoModel.queryUserInfoBase({
            user_id: this.data.userId
          }).then(res => {
            return {
              ...res,
              tutorialRate: tutorialRate,
              tutorialDays: tutorialDays,
            }
          })
        })
        .then(res => {
          wx.hideLoading()
          let rules = this.getRules(res.tutorialRate, res.tutorialDays)
          this.setData({
            rules: rules,
            isAuthor: this.data.isAuthor,
            avatar: res.avatar_url,
            name: res.nick_name,
            introduce: res.intro,
          }, () => {
            //获取
            if (this.data.layoutType == 1) {
              wx.createSelectorQuery()
                .select('#introduce')
                .boundingClientRect(rect => {
                  console.log(rect)
                  this.data.introduceRect = rect
                }).exec()
              wx.createSelectorQuery()
                .select('#rule')
                .boundingClientRect(rect => {
                  this.data.ruleRect = rect
                }).exec()
            }
            this.loadData(false)
          })
        })
        .catch(err => {
          console.log(err)
        })
    })
  },
  onReady: function () {
    if (this.data.layoutType == 1) {
      wx.createSelectorQuery()
        .select('#contentList')
        .boundingClientRect(rect => {
          this.tempData.scrollViewHeight = rect.height
        }).exec();
    }
  },
  onShow: function () {
    if (this.tempData.updateList) {
      this.tempData.updateList = false
      this.loadData(false)
    }
  },
  onPageScroll(e) {
    // console.log('eeeeeee', e)
  },
  onReachBottom() {
    console.log('到底喽～',)
    console.log('page', this.data)
    console.log('this.data.isAllLoaded', this.data.isAllLoaded)
    // 到底喽～
    if (!this.data.isAllLoaded) {
      this.setData({
        bottomLoadingShow: true,
      },()=>{
        this.loadData(true)
      });
    }
  },
  loadData: function (loadMore) {
    let page = this.data.page
    if (!loadMore) {
      //下拉刷新
      page = 1
      wx.showLoading({
        title: '加载中...',
      })
    } else {
      if (this.data.courseList.length >= this.data.total) {
        return
      }
      this.setData({
        bottomLoadingShow: true,
      })
    }
    let params = {
      page_index: page,
      page_size: this.data.pageSize
    }
    if (!this.data.isAuthor) {
      //指定作者的看看个人列表
      params["author_id"] = this.data.userId
    } else {
      //自己的看看个人列表
    }
    tutorialModel.tutorialAuthorList(params)
      .then(res => {
        let likeTotal = res.like_total
        let collects = ''
        if (likeTotal >= 1000) {
          collects = "超过" + (likeTotal / 1000).toFixed(1) + "k个收藏"
        } else {
          collects = likeTotal + "个收藏"
        }
        let list = res.list || []
        let newList = list.map(ev => {
          let tutorial = ev.tutorial
          let author = ev.author
          let audit = tutorial.approve_status
          let auditStatus = ''
          if (tutorial.update_id > 0 && this.data.isAuthor) {
            //自己的看看个人主页，有需改
            audit = tutorial.update_status
          }
          if (audit == 1) {
            auditStatus = '审核中'
          } else if (audit == 2) {
            auditStatus = '审核已通过'
          } else if (audit == 3) {
            auditStatus = '已拒绝'
          }
          return {
            ...ev,
            poster: tutorial.cover_img_url,
            title: tutorial.summary,
            authorAvatar: author.avatar_url,
            authorName: author.nick_name,
            isFavorite: ev.like_status == 2,
            favorites: tutorial.like_count,
            audit: audit,
            auditStatus: auditStatus,
          }
        })
        if (!loadMore) {
          wx.hideLoading()
          page++
          let isAllLoaded = false
          if (newList.length >= res.total) {
            //已获取全部列表数据
            isAllLoaded = true
          }
          this.setData({
            shareCount: res.total,
            collectCount: collects,
            courseList: newList,
            page: page,
            total: res.total,
            isAllLoaded: isAllLoaded,
          })
        } else {
          //上拉加载,追加数据
          let diffData = {}
          if (newList) {
            let offset = this.data.courseList.length
            newList.forEach((value, index) => {
              let key = 'courseList[' + (offset + index) + ']'
              diffData[key] = value
            })
          }
          page++
          let isAllLoaded = false
          if (this.data.courseList.length + newList.length >= res.total) {
            //已加载全部数据
            isAllLoaded = true
          }
          this.setData({
            ...diffData,
            page: page,
            isAllLoaded: isAllLoaded,
            bottomLoadingShow: false,
          })
        }
      })
      .catch(err => {
        console.log(err)
        this.setData({
          collectCount: '0个收藏',
          bottomLoadingShow: false,
        }, () => {
          if (!loadMore) {
            wx.hideLoading()
          }
        })
      })
  },
  handleOnScroll: function (e) {
    if (this.data.layoutType == 1) {
      util.debounce(() => {
        //解决小程序scrollview快速滑动事件丢失的问题
        //垃圾小程序
        wx.createSelectorQuery()
          .select('#courseList')
          .boundingClientRect(rect => {
            if (rect && rect.top <= (this.data.navHeight + 5)) {
              this.setData({
                navOpacity: 1
              })
            }
          }).exec()
      }, 100)()
      let scrollTop = e.detail.scrollTop
      let offset = screenConfig.getPX(420) - 75
      let opacity = 0
      if (scrollTop >= offset) {
        opacity = (scrollTop - offset) / 75
      } else {
        //隐藏标题栏
        opacity = 0
      }
      if (scrollTop >= screenConfig.getPX(420) - 5) {
        opacity = 1
      }
      if (this.data.navOpacity == opacity) {
        return
      }
      this.setData({
        navOpacity: opacity
      })
    }
  },
  bindscroll: function (e) {
    if (this.data.layoutType == 1) {
      util.debounce(() => {
        if (this.tempData.scrollTop < e.detail.scrollTop) {
          //向下滑动
          if (this.tempData.scrolltolower == false && (e.detail.scrollTop + this.tempData.scrollViewHeight) > (e.detail.scrollHeight - 100)) {
            //达到加载更多的阈值
            console.log("达到加载更多的阈值")
            this.tempData.scrolltolower = true
            this.loadData(true)
          } else if (e.detail.scrollTop + this.tempData.scrollViewHeight < (e.detail.scrollHeight - 100)) {
            if (this.tempData.scrolltolower == true) {
              console.log("重置加载更多的阈值")
              this.tempData.scrolltolower = false
            }
          }
        } else {
          //向上滑动
          if (e.detail.scrollTop + this.tempData.scrollViewHeight < (e.detail.scrollHeight - 100)) {
            if (this.tempData.scrolltolower == true) {
              console.log("重置加载更多的阈值")
              this.tempData.scrolltolower = false
            }
          }
        }
        this.tempData.scrollTop = e.detail.scrollTop
      }, 100)()
    }
  },
  handletap: function (e) {
    console.log(e)
    if (this.data.layoutType == 1) {
      let x = e.detail.x
      let y = e.detail.y
      if (this.data.introduceRect) {
        let rect = this.data.introduceRect
        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
          //有效区域内
          console.log('编辑有效区域内')
          this.handleIntroduceEdit()
        }
      }
      if (this.data.ruleRect) {
        let rect = this.data.ruleRect
        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
          //有效区域内
          this.handleShowRuleTip()
        }
      }
    }
  },
  handleAddFavorite: function (e) {
    // if (this.data.isAuthor) {
    //   return
    // }
    // let item = e.currentTarget.dataset.item
    // let index = e.currentTarget.dataset.index
    // wx.showLoading({
    //   title: '收藏中...',
    // })
    // let params = {
    //   status: (item.like_status == 2) ? 1 : 2,
    //   tutorial_id: item.tutorial.id,
    // }
    // tutorialModel.tutorialLike(params)
    //   .then(res => {
    //     wx.hideLoading()
    //     let key = 'courseList[' + index + ']'
    //     item.like_status = params.status
    //     item.isFavorite = params.status == 2
    //     if (params.status == 2) {
    //       //收藏
    //       item.tutorial.like_count += 1
    //       item.favorites += 1
    //     } else {
    //       //取消收藏
    //       item.tutorial.like_count -= 1
    //       item.favorites -= 1
    //     }
    //     let diff = {
    //       [key]: item
    //     }
    //     this.setData({
    //       ...diff
    //     })
    //   })
    //   .catch(err => {
    //     console.log(err)
    //     wx.hideLoading()
    //   })
  },
  //发布看看
  handlePublish: function () {
    this.navigateToPublish()
  },

  handleCourseDetail: function (e) {
    let item = e.currentTarget.dataset.item
    console.log(item)
    if (this.data.isAuthor) {
      //是作者自己的看看
      let id = item.tutorial.id
      if (item.tutorial.update_id > 0) {
        id = item.tutorial.update_id
      }
      this.navigateToPublish(id)
    } else {
      //别人的看看
      let id = item.tutorial.id
      wx.navigateTo({
        url: '/packageKanKan/detail/detail?id=' + id,
      })
    }
  },
  handleShowRuleTip: function () {

    // tutorialRate:null,
    // tutorialDays:null,
    this.showPopup()
  },
  handleIntroduceEdit: function () {
    this.data.tempIntroduce = this.data.introduce
    this.setData({
      showIntroduceDialog: true,
    })
  },
  handleIntroduceEditConfirm: function (e) {
    let introduce = this.data.tempIntroduce
    wx.showLoading({
      title: '修改中...',
    })
    userInfoModel.updateUserInfoBase({
      intro: introduce
    }).then(res => {
      wx.hideLoading()
      this.data.tempIntroduce = ""
      this.setData({
        showIntroduceDialog: false,
        introduce: introduce
      })
    }).catch(err => {
      console.log(err)
      wx.hideLoading()
    })
  },
  handleIntroduceEditCancel: function () {
    this.data.tempIntroduce = ""
    this.setData({
      showIntroduceDialog: false
    })
  },
  bindIntroduceInput: function (e) {
    console.log(e)
    this.data.tempIntroduce = e.detail.value
  },
  navigateToPublish: function (id) {
    let that = this
    let url = '/packageKanKan/publish/publish'
    if (id) {
      url = url + '?id=' + id
    }
    wx.navigateTo({
      url: url,
      events: {
        updateList: function (immediately) {
          console.log('updateList', immediately)
          if (immediately) {
            that.loadData(false)
          } else {
            that.tempData.updateList = true
          }
        },
      },
    })
  },
  onClose: function () {
    this.setData({ showPop: false })
  },
  showPopup: function () {
    this.setData({ showPop: true })
  },
  getRules: function (tutorialRate, tutorialDays) {
    let txtArray = []
    txtArray.push({
      title: "发布审核",
      value: "您发布所有“看看”平台都将进行审核，审核通过后才会显示。若审核失败，您可根据要求修改后重新提交审核"
    })
    txtArray.push({
      title: "奖励规则",
      value: "用户在您发布的“看看”页面材料清单中加入购物车并在" + tutorialDays + "天内下单，商品售价*" + tutorialRate + "%为您的奖励金"
    })
    txtArray.push({
      title: "结算规则",
      value: "有效订单完结后自动结算奖励，结算的奖励金存入可提现金额内"
    })
    txtArray.push({
      title: "有效订单",
      value: "订单创建付款成功，暂未进行退款等售后申请"
    })
    txtArray.push({
      title: "失效订单",
      value: "订单申请售后，进行退货退款(包括确认收货后申请售后进行退款)"
    })
    return txtArray
  },
  dummyTouchMove: function (e) {
    console.log(e)
  },
  ClickBack: function () {
    let pages = getCurrentPages();
    if (pages.length === 1) {
      wx.switchTab({
        url: "/pages/index/index",
      });
    } else {
      wx.navigateBack({
        delta: 1,
      });
    }
  },
})