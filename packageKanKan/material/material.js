import screenConfig from '../../utils/screen_util'

const orderModel = require('../../models/order')
const tutorialModel = require('../../models/tutorial')
const configModel = require('../../config/config')
const util = require('../../utils/util')

const app = getApp()

Page({
  data: {
    searchValue: '',
    statusBarHeight: app.globalData.statusBarHeight,
    navHeight: screenConfig.getRPX(Number(app.globalData.statusBarHeight) + 46),
    active: '2', //2购买过的商品 1已添加
    checkedList: [],
    allList: [],
    filterCheckedList: [],
    total: 0,
    page: 1,
    pageSize: 20,
    bottomLoadingShow: false,
    isAllLoaded: false,
  },
  tempData: {
    searchValues: ['', ''],
    scrollTop: 0,
    scrollViewHeight: 0,
    scrolltolower: false,
  },
  onLoad: function (options) {
    //获取已购买商品列表
    let orderSkuListPromise = orderModel.queryOrderSkuList({
      page_index: this.data.page,
      page_size: this.data.pageSize,
      shop_id: configModel.shopId,
      status:[1,2,3,5,6,10,11]
    })
    //获取已添加商品列表
    let checkedMaterialListPromise = null
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel && eventChannel.on) {
      //获取看看发布页透传的已添加商品列表
      checkedMaterialListPromise = new Promise((resolve, reject) => {
        eventChannel.on('checkedMaterialList', function (data) {
          console.log("checkedMaterialList", data)
          resolve(data.checkedList)
        })
      }).then(res => {
        //通过已添加商品skuid查询sku信息
        if (res.length > 0) {
          let sku_ids = res.map(ev => {
            return ev.sku_id
          })
          return tutorialModel.tutorialMaterialSkuList({
            sku_ids: sku_ids,
          }).then(res=>{
            let list = res || []
            return {
              list:list,
              total:list.length
            }
          })
        }
        //已添加商品为空，无需查询，返回空数据
        return Promise.resolve({
          list: [],
          total: 0,
        })
      })
    } else {
      //兼容错误的页面跳转
      //已添加商品为空
      checkedMaterialListPromise = Promise.resolve({
        list: [],
        total: 0,
      })
    }
    wx.showLoading({
      title: '加载中...',
    })
    //数据合并
    Promise.all([orderSkuListPromise, checkedMaterialListPromise])
      .then(values => {
        console.log(values)
        let all = values[0]
        let checked = values[1]
        //格式化列表数据
        let checkedList = this.formatList(checked.list || [], true)
        let allList = this.formatList(all.list || [], false)
        if (checkedList.length > 0) {
          allList.forEach(ev => {
            let sku = checkedList.find(sku => {
              return sku.sku_id == ev.sku_id
            })
            if (sku != null) {
              ev.checked = true
            }
          })
        }
        this.setData({
          allList: allList,
          checkedList: checkedList,
          filterCheckedList: checkedList,
          total: all.total,
          page: 2,
        })
        wx.hideLoading()
      })
      .catch(err => {
        console.log(err)
        wx.hideLoading()
      })
  },
  onReady: function () {
    wx.createSelectorQuery()
      .select('#materialAllList')
      .boundingClientRect(rect => {
        this.tempData.scrollViewHeight = rect.height
      }).exec();
  },
  bindscroll: function (e) {
    // console.log(e)
    util.debounce(() => {
      if (this.tempData.scrollTop < e.detail.scrollTop) {
        //向下滑动
        if (this.tempData.scrolltolower == false && (e.detail.scrollTop + this.tempData.scrollViewHeight) > (e.detail.scrollHeight - 100)) {
          //达到加载更多的阈值
          console.log("达到加载更多的阈值")
          this.tempData.scrolltolower = true
          let active = this.data.active
          if (active == '2') {
            if (this.data.allList.length < this.data.total) {
              this.loadSkuList(true)
            }
          }
        } else if (e.detail.scrollTop + this.tempData.scrollViewHeight < (e.detail.scrollHeight - 100)) {
          if(this.tempData.scrolltolower == true){
            console.log("重置加载更多的阈值")
            this.tempData.scrolltolower = false
          }
        }
      } else {
        //向上滑动
        if (e.detail.scrollTop + this.tempData.scrollViewHeight < (e.detail.scrollHeight - 100)) {
          if(this.tempData.scrolltolower == true){
            console.log("重置加载更多的阈值")
            this.tempData.scrolltolower = false
          }
        }
      }
      this.tempData.scrollTop = e.detail.scrollTop
    }, 100)()

  },
  //获取购买过的商品（下拉刷新，上拉加载更多）
  loadSkuList: function (loadMore = false) {
    let page = this.data.page
    if (!loadMore) {
      //下拉刷新
      page = 1
      wx.showLoading({
        title: '加载中...',
      })
    } else {
      if (this.data.allList.length >= this.data.total) {
        return
      }
      this.setData({
        bottomLoadingShow: true,
      })
    }
    orderModel.queryOrderSkuList({
      title: this.data.searchValue,
      page_index: page,
      page_size: this.data.pageSize,
      shop_id: configModel.shopId,
      status:[1,2,3,5,6,10,11]
    }).then(res => {
      let list = res.list || []
      let newList = this.formatList(list)
      if (this.data.checkedList.length > 0) {
        newList.forEach(ev => {
          let sku = this.data.checkedList.find(sku => {
            return sku.sku_id == ev.sku_id
          })
          if (sku != null) {
            ev.checked = true
          }
        })
      }
      if (!loadMore) {
        wx.hideLoading()
        page++
        let isAllLoaded = false
        if (newList.length <= res.total) {
          //已获取全部列表数据
          isAllLoaded = true
        }
        this.setData({
          allList: newList,
          page: page,
          total: res.total,
          isAllLoaded: isAllLoaded,
        }, () => {
          if (!loadMore) {
            wx.stopPullDownRefresh()
          }
        })
      } else {
        //上拉加载,追加数据
        let diffData = {}
        if (newList) {
          let offset = this.data.allList.length
          newList.forEach((value, index) => {
            let key = 'allList[' + (offset + index) + ']'
            diffData[key] = value
          })
        }
        page++
        let isAllLoaded = false
        if (this.data.allList.length + newList.length >= res.total) {
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
    }).catch(err => {
      console.log(err)
      if (!loadMore) {
        wx.hideLoading()
        wx.stopPullDownRefresh()
      } else {
        this.setData({
          bottomLoadingShow: false,
        })
      }
    })
  },
  //格式化数据，适配UI显示
  formatList: function (list, checked) {
    return list.map(ev => {
      let goodsAttr = JSON.parse(ev.goods_attr)
      let sku = goodsAttr.map(attr=>{
        if(attr.value)
          return attr.value
        if(attr.Value)
          return attr.Value
        return ''  
      }).join(" ")
      return {
        ...ev,
        title: ev.sku_name,
        price: ev.price,
        img: ev.sku_img,
        sku: sku,
        checked: checked,
      }
    })
  },
  onChange(event) {
    console.log('输出 ~ event', event)
    let active = event.currentTarget.dataset.name
    this.setData({
      active: active,
    }, () => {
      let active = this.data.active
      if (active == '2') {
        console.log(this.tempData)
        if (this.tempData.searchValues[0] != this.tempData.searchValues[1]) {
          //两个分页的搜索关键字不一致，意味着在已添加分页修改了关键字
          //已购买的商品分页需要重新请求列表
          this.tempData.searchValues[0] = this.tempData.searchValues[1]
          //滚动到顶部
          this.handleOnSearch()
        }
      } else {
        this.handleOnSearch()
      }
    })
  },
  handleMaterialCheck: function (e) {
    console.log(e)
    let item = e.currentTarget.dataset.item
    let index = e.currentTarget.dataset.index
    let checkedList = this.data.checkedList
    if (this.data.active == '2') {
      if (item.checked) {
        return
      }
      //添加
      item.checked = true
      let checkedKey = 'checkedList[' + checkedList.length + ']'
      let allListKey = 'allList[' + index + ']'
      let diff = {
        [checkedKey]: { ...item },
        [allListKey]: item,
      }
      this.setData({
        ...diff
      })
    } else {
      //移除
      let clearIndex = this.data.allList.findIndex(ev => {
        return ev.id == item.id
      })
      item.checked = false
      let diff = {}
      if (clearIndex >= 0) {
        let allListKey = 'allList[' + clearIndex + ']'
        diff[allListKey] = item
      }
      this.data.checkedList.splice(index, 1)
      this.setData({
        ...diff,
        checkedList: this.data.checkedList,
      },()=>{
        this.handleOnSearch()
      })
    }
  },
  handleSave: function (e) {
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel && eventChannel.emit) {
      eventChannel.emit('materialEdit', this.data.checkedList);
    }
    wx.navigateBack({
      delta: 1,
    })
  },
  bindSearchInput: function (e) {
    this.setData({
      searchValue: e.detail.value,
    })
    //记录下不同分页下搜索关键字
    let active = this.data.active
    if (active == '2') {
      this.tempData.searchValues[0] = e.detail.value
    } else {
      this.tempData.searchValues[1] = e.detail.value
    }
  },
  handleOnSearch: function () {
    let active = this.data.active
    if (active == '2') {
      //购买过的商品
      //api搜索
      this.loadSkuList(false)
    } else {
      //已添加
      //本地搜索
      let searchValue = this.data.searchValue
      let filterCheckedList = this.data.checkedList
      if (searchValue != '') {
        //搜索关键字存在
        filterCheckedList = this.data.checkedList.filter(sku => {
          return sku.sku_name.indexOf(searchValue) != -1
        })
      }
      this.setData({
        filterCheckedList: filterCheckedList
      })
    }
  },
  bindClearSearch: function () {
    this.setData({
      searchValue: '',
    }, () => {
      this.handleOnSearch()
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