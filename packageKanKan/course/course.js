const util = require('../../utils/util')

const upyun = require('../../utils/upyun_wxapp_sdk')

Page({
  data: {
    courseList: [],
  },
  onLoad: function (options) {
    const eventChannel = this.getOpenerEventChannel()
    let that = this
    if (eventChannel) {
      if (eventChannel.on) {
        eventChannel.on('courseList', function (data) {
          that.setData({
            courseList: data.courseList
          }, () => {
            that.initCourse(that.data.courseList)
          })
        })
      } else {
        that.initCourse(that.data.courseList)
      }
    } else {
      that.initCourse(that.data.courseList)
    }
  },
  onReady: function () { },
  initCourse(courseList) {
    if (courseList.length == 0) {
      courseList.push({
        img: "",
        description: ""
      })
    }
    //生成unique
    courseList.forEach((ev, index) => {
      ev.unique = index
    });
    this.setData({
      courseList: courseList,
    })
  },
  handleSave: function (e) {
    let courseList = this.data.courseList
    let errorIndex = -1
    for (let index = 0; index < courseList.length; index++) {
      const course = courseList[index];
      if (course.img == '' || course.description == '') {
        errorIndex = index
        break
      }
    }
    if (errorIndex == -1) {
      const eventChannel = this.getOpenerEventChannel()
      if (eventChannel && eventChannel.emit) {
        eventChannel.emit('courseEdit', this.data.courseList);
      }
      wx.navigateBack({
        delta: 1,
      })
    } else {
      wx.showToast({
        title: '请完成步骤' + (errorIndex + 1) + '的编辑',
        icon: 'none',
        duration: 2000,
      })
    }
  },
  //添加步骤
  handleCourseAdd: function () {
    let courseList = this.data.courseList
    courseList.push({
      img: "",
      description: ""
    })
    this.initCourse(courseList)
    let lastIndex = this.data.courseList.length
    if (lastIndex > 1) {
      //添加步骤2开始
      let query = wx.createSelectorQuery().in(this)
      query.selectViewport().scrollOffset()
      query.select('#courseContent_' + (lastIndex - 1))
        .boundingClientRect().exec(res => {
          console.log(res);
          var miss = res[0].scrollTop + res[1].top;
          wx.pageScrollTo({
            scrollTop: miss,
            duration: 300,
            complete: function (res) { }
          });
        })
    }
  },
  //删除指定步骤
  handleDel: function (e) {
    let index = e.currentTarget.dataset.index
    let courseList = this.data.courseList
    courseList.splice(index, 1)
    this.initCourse(courseList)
  },
  bindIntroduceInput: function (e) {
    let description = e.detail.value
    let index = e.currentTarget.dataset.index
    let courseList = this.data.courseList
    let item = courseList[index]
    item.description = description
    let key = 'courseList[' + index + ']'
    this.setData({
      [key]: item
    })
  },
  //预览图片
  handlePreviewImage: function (e) {
    let item = e.currentTarget.dataset.item
    if (url == '') {
      return
    }
    let url = item.img + '!upyun520/fw/3000'
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: [url], // 需要预览的图片http链接列表
      success: function (res) {
        console.log('success')
      },
      fail: function (res) {
        console.log(res)
      },
    })
  },
  //添加步骤图片
  handelImageAdd: function (e) {
    let index = e.currentTarget.dataset.index
    let that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success(res) {
        console.log(res)
        if (res.errMsg == "chooseImage:ok") {
          let path = res.tempFilePaths[0]
          that.uploadFile(path, (file_url) => {
            console.log('file_url', file_url)
            let course = that.data.courseList[index]
            let key = 'courseList[' + index + ']'
            course.img = file_url
            that.setData({
              [key]: course,
            })
          })
        }
      }
    })
  },
  uploadFile(path, callback) {
    wx.showLoading({
      title: '上传中...',
    })
    upyun.upload(path, 75)
      .then((res) => {
        console.log('输出 ~ res', res)
        if (res.code == 200) {
          wx.hideLoading()
          if (callback) {
            callback(res.data.file_url)
          }
        } else {
          wx.hideLoading()
          wx.showToast({
            title: '图片上传失败',
            icon: 'none',
            duration: 2000,
          })
        }
      }).catch((err) => {
        wx.hideLoading()
        wx.showToast({
          title: err,
          icon: 'none',
          duration: 2000,
        })
      })
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