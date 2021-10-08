import screenConfig from '../../utils/screen_util'

const util = require('../../utils/util')
const pointsModel = require('../../models/points')

const app = getApp()
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
    safeAreaInsetBottom: safeAreaInsetBottom,
    inputAmount: 75,
    points: "",
    amount: "",
    stock: "",
    exchangeNum: "",
    goodsName: "",
    images: [],
    imagesLength: 0,
    attrList: [],
    id: 0,
    isEdit: false,
    status: 0,
    lastFocus: '',
    keyboardHeight: 0,
  },
  tempData: {
    uploadList: [],
    uploadIndex: 0,
    uploadSuccessNum: 0,
  },
  onLoad: function (options) {
    let id = Number(options.id || '0')
    let isEdit = id > 0
    this.setData({
      id: id,
      isEdit: isEdit,
    })
    if (isEdit) {
      wx.showLoading({
        title: '加载中...',
      })
      pointsModel.pointsAgentGoodsDetail(id)
        .then(res => {
          wx.hideLoading()
          let images = []
          if (res.medias) {
            images = res.medias.map(ev => {
              return ev.link
            })
          }
          let attrList = []
          if (res.attrs && res.attrs != "") {
            let attrsJson = JSON.parse(res.attrs)
            attrList = attrsJson.map(ev => {
              return {
                attrName: ev.title,
                attrValue: ev.value
              }
            })
          }
          this.setData({
            points: res.points,
            amount: (res.price / 100).toFixed(2),
            stock: res.stockQty,
            exchangeNum: res.redeemQty,
            goodsName: res.title,
            images: images,
            imagesLength: images.length,
            attrList: attrList,
            status: res.status,
          })
        })
        .catch(err => {
          wx.hideLoading()
        })
    } else {
      let that = this
      const eventChannel = this.getOpenerEventChannel()
      //接收选择的图片列表
      eventChannel.on('pickImageListEvent', function (data) {
        console.log(data)
        that.tempData.uploadIndex = 0
        that.tempData.uploadSuccessNum = 0
        that.tempData.uploadList = data
        wx.showLoading({
          title: '上传中...',
        })
        that.uploadImgFile(that.tempData.uploadList)
      })
    }
  },
  onReady: function () {
    let height = wx.getSystemInfoSync().windowHeight;
    this.setData({
      scrollViewHeight: height
    })
    wx.createSelectorQuery()
      .select('#inputAmountPlaceholder')
      .boundingClientRect(rect => {
        this.setData({
          inputAmount: rect.width
        })
      }).exec();
  },
  uploadImgFile(list) {
    let path = list[this.tempData.uploadIndex]
    let that = this
    util.uploadFile(path)
      .then((res) => {
        let result = JSON.parse(res)
        console.log(result)
        if (result.code == 200) {
          //上传成功
          const file_url = result.data.file_url
          let lastIndex = that.data.images.length
          let key = 'images[' + lastIndex + ']'
          let diffData = {}
          diffData[key] = file_url
          that.setData({
            ...diffData,
            imagesLength: that.data.images.length + 1
          })
          that.tempData.uploadSuccessNum++
          // 上传完成or继续上传
          that.continueUpload()
        } else {
          // 上传完成or继续上传
          that.continueUpload()
        }
      })
      .catch((err) => {
        // 上传完成or继续上传
        that.continueUpload()
      })
  },
  continueUpload() {
    let title_text = '上传成功！'
    let err_count = 0
    this.tempData.uploadIndex++
    if (this.tempData.uploadIndex == this.tempData.uploadList.length) {
      //上传完成
      wx.hideLoading()
      if (this.tempData.uploadSuccessNum < this.tempData.uploadList.length) {
        //未全部上传成功，修改提示
        err_count = this.tempData.uploadList.length - this.tempData.uploadSuccessNum
        title_text = '上传成功' + this.tempData.uploadSuccessNum + '，失败' + err_count
        console.log('err_count', err_count)
        wx.showToast({
          icon: 'none',
          title: title_text,
          duration: 1500
        });
      }
    } else {
      this.uploadImgFile(this.tempData.uploadList)
    }
  },
  //商品名称
  bindGoodsNameInput: function (e) {
    this.data.goodsName = e.detail.value
  },
  handelAddGoodsImage: function (e) {
    this.tempData.uploadList = []
    this.tempData.uploadIndex = 0
    this.tempData.uploadSuccessNum = 0
    let that = this
    wx.chooseImage({
      count: 6 - that.data.images.length,
      sizeType: ['original'],
      sourceType: ['album'],
      success(res) {
        if (res.errMsg == "chooseImage:ok") {
          that.tempData.uploadList = res.tempFilePaths
          if (that.tempData.uploadList.length > 0) {
            wx.showLoading({
              title: '上传中...',
            })
            that.uploadImgFile(that.tempData.uploadList)
          }
        }
      }
    })
  },
  handleAddGoodsAttr: function (e) {
    let length = this.data.attrList.length
    if (length >= 6) {
      return
    }
    this.data.attrList.unshift({
      id: new Date().getTime,
      attrName: "",
      attrValue: ""
    })
    this.setData({
      attrList: this.data.attrList
    })
  },
  handleImageClick: function (e) {
    let index = e.currentTarget.dataset.index
    let url = this.data.images[index]
    let urls = this.data.images
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
  },
  handleDeleteGoodsImage: function (e) {
    let index = e.currentTarget.dataset.index
    this.data.images.splice(index, 1)
    this.setData({
      images: this.data.images
    })
  },
  handleDeleteGoodsAttr: function (e) {
    let index = e.currentTarget.dataset.index
    this.data.attrList.splice(index, 1)
    this.setData({
      attrList: this.data.attrList
    })
  },
  handleInputGoodsInfoValue: function (e) {
    console.log(e)
    let key = e.currentTarget.dataset.key
    let value = e.detail.value
    if (key == "points" || key == "amount" || key == "stock" || key == "exchangeNum") {
      if (key == "points") {
        if (Number(value) > 1000000) {
          wx.showToast({
            icon: 'none',
            title: "不能大于1000000",
          })
          value = '1000000'
        }
      } else {
        if (Number(value) > 10000) {
          wx.showToast({
            icon: 'none',
            title: "不能大于10000",
          })
          value = '10000'
        }
      }
    }
    this.setData({
      [key]: value
    }, () => {
      if (key == "amount") {
        wx.createSelectorQuery()
          .select('#inputAmountPlaceholder')
          .boundingClientRect(rect => {
            console.log(rect)
            this.setData({
              inputAmount: rect.width
            })
          }).exec();
      }
    })
  },
  handleInputGoodsAttrName: function (e) {
    console.log(e)
    let index = e.currentTarget.dataset.index
    let key = "attrList[" + index + "]"
    let arrt = this.data.attrList[index]
    arrt.attrName = e.detail.value
    // this.setData({
    //   [key]: arrt
    // })
  },
  handleInputGoodsAttrValue: function (e) {
    let index = e.currentTarget.dataset.index
    let key = "attrList[" + index + "]"
    let arrt = this.data.attrList[index]
    arrt.attrValue = e.detail.value
    // this.setData({
    //   [key]: arrt
    // })
  },
  handlePublish: function (e) {
    if (this.data.goodsName.length == 0
      || this.data.points.length == 0
      || this.data.amount.length == 0
      || this.data.stock.length == 0
      || this.data.images.length == 0
    ) {
      return
    }
    console.log("handlePublish")
    let price = Number(this.data.amount) * 100
    let points = Number(this.data.points)
    let stock = Number(this.data.stock)
    let exchangeNum = Number(this.data.exchangeNum)
    if (price == 0 || points == 0 || stock == 0 ) {
      wx.showToast({
        icon: 'none',
        title: "请输入大于0的值",
      })
      return
    }
    let medias = this.data.images.map((value, index) => {
      return {
        link: value,
        type: 2,
        sort: index
      }
    })
    let attrs = this.data.attrList.map(value => {
      return {
        title: value.attrName,
        value: value.attrValue
      }
    })
    let params = {
      id: this.data.id || 0,
      title: this.data.goodsName,
      medias: medias,
      points: Number(this.data.points),
      price: price,
      stockQty: Number(this.data.stock),
      redeemQty: Number(this.data.exchangeNum),
      attrs: JSON.stringify(attrs)
    }
    console.log(params)
    wx.showLoading({
      title: '发布...',
    })
    pointsModel.pointsAgentGoodsEdit(params)
      .then(res => {
        wx.hideLoading()
        setTimeout(() => {
          this.finish()
        }, 50);
      }).catch(err => {
        console.log(err)
        wx.hideLoading()
      })
  },
  handleDelete: function (e) {
    if (this.data.id == 0) {
      return
    }
    wx.showLoading({
      title: '删除...',
    })
    pointsModel.pointsAgentGoodsDelete(this.data.id)
      .then(res => {
        wx.hideLoading()
        this.finish()
      })
      .catch(err => {
        wx.hideLoading()
      })
  },
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
    pointsModel.pointsAgentGoodsStatus(this.data.id, status)
      .then(res => {
        wx.hideLoading()
        this.finish()
      })
      .catch(err => {
        wx.hideLoading()
      })
  },
  handleSave: function (e) {
    this.handlePublish()
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
  handleBindscroll: function (e) {
    // console.log(e)
    // this.data.scrollTop = e.detail.scrollTop
  },
  handleHideKeyboard: function (e) {
    console.log(e)
    let key = e.currentTarget.dataset.key
    let lastFocus = ''
    if (key == 'attrLabel' || key == 'attrValue') {
      let index = e.currentTarget.dataset.index
      lastFocus = key + index
    } else {
      lastFocus = key
    }
    console.log(lastFocus)
    if (this.data.lastFocus == "" || lastFocus == this.data.lastFocus) {
      return
    }
    wx.hideKeyboard({
      success: (res) => { },
    })
    // wx.createSelectorQuery()
    //   .select('#' + lastFocus)
    //   .boundingClientRect(rect => {
    //     console.log(rect)
    //     let systemInfo = wx.getSystemInfoSync()
    //     let windowHeight = systemInfo.windowHeight
    //     let safeArea = systemInfo.safeArea
    //     let safeAreaInsetBottom = windowHeight - safeArea.bottom
    //     let keyboardHeight = this.data.keyboardHeight
    //     if (rect.top > (windowHeight - safeAreaInsetBottom - keyboardHeight)) {
    //       //被键盘遮盖
    //       wx.showToast({
    //         title: '被键盘遮盖',
    //       })
    //       console.log("被键盘遮盖")
    //       wx.hideKeyboard({
    //         success: (res) => {
    //           setTimeout(() => {
    //             this.setData({
    //               lastFocus: lastFocus,
    //             })
    //           }, 500);
    //         },
    //       })
    //     } else {
    //       wx.showToast({
    //         title: '未被键盘遮盖',
    //       })
    //       this.setData({
    //         lastFocus: lastFocus,
    //       })
    //     }
    //   }).exec();
  },
  handleBindfocus: function (e) {
    console.log(e)
    let key = e.currentTarget.dataset.key
    let keyboardHeight = e.detail.height
    let lastFocus = ''
    if (key == 'attrLabel' || key == 'attrValue') {
      let index = e.currentTarget.dataset.index
      lastFocus = key + index
    } else {
      lastFocus = key
    }
    this.setData({
      lastFocus: lastFocus,
      keyboardHeight: keyboardHeight
    })
  },
  handleBindblur: function (e) {
    console.log(e)
    let lastFocus = this.data.lastFocus
    setTimeout(() => {
      if (lastFocus == this.data.lastFocus) {
        console.log("handleBindblur lastFocus:", lastFocus)
        this.setData({
          lastFocus: ''
        })
      }
    }, 50);
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