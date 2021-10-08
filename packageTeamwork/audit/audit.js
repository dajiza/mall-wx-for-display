import moment from 'moment'

const app = getApp();
const teamworkModel = require('../../models/teamwork')

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    navHeight: Number(app.globalData.statusBarHeight) + 46,
    coures: {
      couresPoster: "",
      couresTitle: "",
      couresTime: "",
      couresSign: "",
      couresType: "",
    },
    user: {
      avatar: "",
      name: "",
      wxNick: "",
      phone: "",
    },
    certificate: [],
    backMoney: 0,
    showRejectDialog: false,
    showConfirmDialog: false,
    rejectReason: ""
  },

  onLoad: function (options) {
    console.log(options)
    let courseId = Number(options.id || "0")
    let courseApplyId = Number(options.apply_id || "0")
    this.data.courseId = courseId
    this.data.courseApplyId = courseApplyId
    if (courseApplyId > 0 && courseId > 0) {
      wx.showLoading({
        title: '加载中...',
      })
      teamworkModel.queryCourseDetail(courseId)
        .then(res => {
          let couresType = '免费'
          if (res.type == 21) {
            //付费-凭证返现
            couresType = '付费返现'
          }
          let start_time = res.start_time_txt ? moment(res.start_time_txt).format('YYYY-MM-DD') : ''
          let end_time = res.end_time_txt ? moment(res.end_time_txt).format('YYYY-MM-DD') : ''
          let coures = {
            couresPoster: res.poster_link,
            couresTitle: res.title,
            couresTime: start_time + "～" + end_time,
            couresSign: res.join_num + "/" + res.limit_num,
            couresType: couresType,
          }
          this.setData({
            coures: coures
          })
          return teamworkModel.courseApplyData(courseApplyId)
        })
        .then(res => {
          wx.hideLoading()
          let user = {
            avatar: res.avatar_url,
            name: res.user_name,
            wxNick: res.nick_name,
            phone: res.user_phone,
          }
          let certificate = res.attachment_json.split(",")
          this.setData({
            user: user,
            certificate: certificate,
            backMoney: res.inviter_back_money
          })
        })
        .catch(err => {
          wx.hideLoading()
        })
    }
  },

  onReady: function () {

  },
  previewImage: function (e) {
    let index = e.currentTarget.dataset.index
    let url = this.data.certificate[index] || ''
    let urls = this.data.certificate
    if (url.length > 0) {
        wx.previewImage({
            current: url, // 当前显示图片的http链接
            urls: urls, // 需要预览的图片http链接列表
            success: function (res) {
                console.log('success')
            },
            fail: function (res) {
                console.log(res)
            },
        })
    }
},
  handleOnReject: function () {
    this.setData({
      showRejectDialog: true
    }, () => {
      setTimeout(() => {
        this.setData({
          rejectReason: ""
        })
      }, 10);
    })
  },
  handleOnPass: function () {
    if (this.data.backMoney > 0) {
      this.setData({
        showConfirmDialog: true
      })
    } else {
      //通过
      this.doApprove(2, "")
    }
  },
  handleOnRejectConfirm: function () {
    //拒绝
    this.doApprove(3, this.data.rejectReason)
    this.handleOnRejectCancel()
  },
  handleOnRejectCancel: function () {
    this.setData({
      showRejectDialog: false
    })
  },
  handleOnConfirmClose: function () {
    this.setData({
      showConfirmDialog: false
    })
  },
  handleOnCashBackConfirm: function () {
    //通过
    this.doApprove(2, '')
  },
  bindRejectReasonInput: function (e) {
    console.log(e)
    let rejectReason = e.detail.value
    this.data.rejectReason = rejectReason
  },
  doApprove: function (result, reason) {
    if (this.data.courseApplyId) {
      let params = {
        course_apply_id: this.data.courseApplyId,
        result: result
      }
      if (result == 3) {
        params["reason"] = reason
      }
      wx.showLoading({
        title: '加载中...',
      })
      teamworkModel.courseApplyAttachmentApprove(params)
        .then(res => {
          wx.hideLoading()
          if (this.data.showConfirmDialog) {
            this.setData({
              showConfirmDialog: false
            })
          }
          if (this.data.showRejectDialog) {
            this.setData({
              showRejectDialog: false
            })
          }
          wx.showToast({
            title: (result == 3) ? "审核拒绝" : "审核通过",
          })
          setTimeout(() => {
            wx.navigateBack({
              delta: 1,
            })
          }, 500);
        })
        .catch(err => {
          wx.hideLoading()
        })
    }
  },
  ClickBack() {
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