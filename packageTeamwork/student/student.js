const teamworkModel = require('../../models/teamwork')
const app = getApp()
Page({
  data: {
    searchValue: '',
    statusBarHeight: app.globalData.statusBarHeight,
    navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
    list: [],
    showMuteDialog: false,
    muteType: 1,
    muteDay: '',
    currentIndex: -1,
    activeIndex: 0,
    initialize: false,
    showShare: false,
    page: 1,
    total: 10,
    bottomLoadingShow: false,
    isAllLoaded: false,
    hideMoney:false,
  },
  onLoad: function (options) {
    let courseId = Number(options.course_id || '-1')
    if (courseId >= 0) {
      this.data.courseId = courseId
      this.loadData(false, true)
    }
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
    let params = {
      course_id: this.data.courseId,
      keyword: this.data.searchValue,
      banned: this.data.activeIndex,
      pi: page,
      ps: 10,
    }
    teamworkModel.queryCourseDetail(this.data.courseId)
      .then(res => {
        this.setData({
          hideMoney: (res.type == 1 || res.type == 11)
        })
        return teamworkModel.studentList(params)
      })
      .then(res => {
        let list = res.list || []
        let newList = list.map(ev => {
          return {
            id: ev.user_id,
            avatar: ev.avatar_url,
            name: ev.user_name,
            nickName: ev.nick_name,
            phone: ev.user_phone,
            submit_task: ev.submit_task,
            banned_talk: ev.banned_talk,
            is_banned: ev.is_banned,
            deposit_state: ev.deposit_state,
            money:ev.money - ev.refund_money
          }
        })
        let showShareObj = {}
        if (this.data.initialize == false) {
          showShareObj.showShare = newList.length == 0
        }
        if (!loadMore) {
          //下拉刷新，覆盖原始数据
          wx.hideLoading()
          page++
          let isAllLoaded = false
          if (newList.length <= res.total) {
            //已获取全部列表数据
            isAllLoaded = true
          }
          this.setData({
            ...showShareObj,
            initialize: true,
            list: newList,
            activeIndex: this.data.activeIndex,
            page: page,
            total: res.total,
            isAllLoaded: isAllLoaded,
          }, () => {
            if (!init && !loadMore) {
              wx.stopPullDownRefresh()
            }
          })
        } else {
          //上拉加载,追加数据
          let diffData = {}
          if (newList) {
            let offset = this.data.list.length
            newList.forEach((value, index) => {
              let key = 'list[' + (offset + index) + ']'
              diffData[key] = value
            })
          }
          page++
          let isAllLoaded = false
          if (this.data.list.length + newList.length >= res.total) {
            //已加载全部数据
            isAllLoaded = true
          }
          this.setData({
            ...diffData,
            activeIndex: this.data.activeIndex,
            page: page,
            isAllLoaded: isAllLoaded,
            bottomLoadingShow: false,
          })
        }
      }).catch(err => {
        if (!loadMore) {
          wx.hideLoading()
          this.setData({
            initialize: true,
            activeIndex: this.data.activeIndex,
            showShare: this.data.list.length == 0 && this.data.activeIndex == 0,
          }, () => {
            if (!init && !loadMore) {
              wx.stopPullDownRefresh()
            }
          })
        }
      })
  },
  bindSearchInput: function (e) {
    this.setData({
      searchValue: e.detail.value,
    })
  },
  handleOnSearch: function () {
    this.loadData()
  },
  handleShare: function () {
    wx.navigateTo({
      url: '/packageTeamwork/coursePoster/coursePoster?course_id=' + this.data.courseId,
    })
  },
  onTabChange: function (e) {
    this.data.activeIndex = e.detail.index
    this.loadData()
  },
  handlePhoneCopy: function (e) {
    let index = e.currentTarget.dataset.index
    let student = this.data.list[index]
    wx.setClipboardData({
      data: student.phone,
      success(res) { }
    })
  },
  showMutePopup: function (e) {
    let index = e.currentTarget.dataset.index
    let student = this.data.list[index]
    if (student.is_banned == 1) {
      //禁言
      this.setData({
        showMuteDialog: true,
        muteType: 1,
        currentIndex: index
      })
    } else if (student.is_banned == 2) {
      //解除禁言
      let userId = student.id
      this.doMute({
        course_id: this.data.courseId,
        user_id: userId,
        banned_type: 1,
        banned_day: 0
      })
    }
  },
  //开启了异步关闭，手动关闭
  handleOnMuteCancel: function (e) {
    e.detail.dialog.stopLoading()
    setTimeout(() => {
      this.setData({
        showMuteDialog: false,
      })
    }, 0)
  },
  //开启了异步关闭，手动关闭
  handleOnMuteConfirm: function (e) {
    e.detail.dialog.stopLoading()
    if (this.data.currentIndex == -1) {
      return
    }
    let muteType = this.data.muteType
    if (muteType == 2) {
      //择期禁言，判断天数
      if (this.data.muteDay == '') {
        wx.showToast({
          icon: 'none',
          title: '请输入天数',
        })
        return
      }
    }
    let userId = this.data.list[this.data.currentIndex].id
    let params = {
      course_id: this.data.courseId,
      user_id: userId,
      banned_type: (muteType == 1) ? 2 : 1,
    }
    if (muteType == 2) {
      let muteDay = Number(this.data.muteDay)
      params['banned_day'] = muteDay
    }
    console.log(params)
    this.setData({
      showMuteDialog: false,
    }, () => {
      this.doMute(params)
    })
  },
  doMute(params) {
    wx.showLoading({
      title: '加载中...',
    })
    teamworkModel.studentBannedTalk(params)
      .then(res => {
        wx.hideLoading()
        this.setData({
          muteDay: ''
        }, () => {
          this.loadData()
        })
      })
      .catch(res => {
        wx.hideLoading()
      })
  },
  handleOnMuteDayInput: function (e) {
    this.setData({
      muteDay: e.detail.value
    })
  },
  changeMuteType: function (e) {
    let muteType = e.currentTarget.dataset.type || '1'
    this.setData({
      muteType: Number(muteType)
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