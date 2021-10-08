// components/searchHistory/searchHistory.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    fromId: {
      type: String,
      value: 'shelves' // 默认上下架的商品管理搜索
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    historyList: [],
    unfoldBtnFlag: false, // 搜索历史中展开按钮开关
    showAllSearchHistory: false, // 展开全部历史搜索
    showDeleteConfirmDialog: false,
    historyVisible: 0,
    cacheKey:''
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
    attached: function () {
      this.attachedEx()
    },
  },

  // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
  attached: function () { 
    this.attachedEx()
  }, // 此处attached的声明会被lifetimes字段中的声明覆盖

  /**
   * 组件的方法列表
   */
  methods: {
    attachedEx() {
      let key = this.getCacheKey('shelves')
      this.data.cacheKey = key
      if (this.data.fromId === 'shelves') {
        const _this = this;
        wx.getStorage({
          key: key,
          success(res) {
            _this.setData({
              historyList: res.data
            })
            if (_this.data.historyList.length > 0) {
              setTimeout(() => {
                // 获取historyList遍历后子元素节点在页面上的宽高
                const query = wx.createSelectorQuery().in(_this)
                query.selectAll('.search-item').fields({
                  size: true,
                }, function (res) {
                  _this.computedItemSize(res);
                }).exec()
              }, 100)
            }
          },
          fail: (res) => { }
        })
      }
    },
    // 删除全部搜索历史记录
    handleDeleteAllSearch() {
      this.setData({
        showDeleteConfirmDialog: true
      })
    },
    /**
    * 点击搜索历史
    */
    handleClickHistory(res) {
      const historyValue = res.currentTarget.dataset.value;
      this.saveSearch(historyValue);
    },
    /**
    * 展开搜索历史记录
    */
    unfoldList() {
      const _this = this;
      let key = this.data.cacheKey
      wx.getStorage({
        key: key,
        success(res) {
          _this.setData({
            historyList: res.data,
            showAllSearchHistory: true,
          })
        }
      })
    },
    /**
      * 收起搜索历史记录
      */
    handlePackUp() {
      this.setData({
        historyList: this.data.showHistoryList,
        showAllSearchHistory: false,
      })
    },
    preventTouchMove() {

    },
    onDeleteConfirmDialogClose() {
      this.setData({
        showDeleteConfirmDialog: false
      })
    },
    onDeleteConfirm() {
      let key = this.data.cacheKey
      wx.removeStorageSync(key)
      this.setData({
        showDeleteConfirmDialog: false,
        historyList: [],
        unfoldBtnFlag: false,
        showHistoryList: []
      })
      wx.showToast({
        title: '删除成功',
        icon: 'none',
        duration: 2000
      })
    },
    saveSearch(str) {
      const _this = this;
      //把获取的input值插入数组里面
      let historySearchArr = []; // 搜索历史记录
      let key = this.data.cacheKey
      wx.getStorage({
        key: key,
        success(res) {
          historySearchArr = res.data;
          let arrIndex = historySearchArr.indexOf(str);
          if (arrIndex !== -1) {
            // 删除已存在后重新插入至数组
            historySearchArr.splice(arrIndex, 1)
            historySearchArr.unshift(str);
          } else {
            historySearchArr.unshift(str);
          }
          wx.setStorage({
            key: key,
            data: historySearchArr
          });
          _this.goSearch('input', str, '', -1);

        },
        fail: (res) => {
          historySearchArr.unshift(str);
          wx.setStorage({
            key: key,
            data: historySearchArr
          });
          _this.goSearch('input', str, '', -1);
        }
      })
    },
    // 搜索历史子元素个数计算
    async computedItemSize(res) {
      const keywordsList = this.data.historyList;
      if (keywordsList.length === 0) return;
      const rem = wx.getSystemInfoSync().windowWidth / 750;
      const listWidth = wx.getSystemInfoSync().windowWidth - 40 * rem; // 20 为左右padding
      const listItemMarginRight = 20 * rem;
      const itemObj = {}; // { arrLength : arr }
      let itemArr = []; // 每行子元素集合
      let count = 0; // 当前长度
      for (let i = 0; i < res.length; i++) {
        const listItemWidth = res[i].width + listItemMarginRight;
        let num = count + listItemWidth;
        if (num < listWidth) {
          itemArr.push(keywordsList[i])
          count += res[i].width + listItemMarginRight
        } else {
          if (itemArr.length === 0 && count === 0) { // 此条件满足，说明子元素长度超出
            itemObj[Object.keys(itemObj).length] = [keywordsList[i]]
          } else {
            itemObj[Object.keys(itemObj).length] = itemArr
            count = 0
            itemArr = []
            i-- // 当前元素宽度+总长度超出，重置集合后，重新遍历
          }
        }
      }
      if (itemArr.length > 0) {
        itemObj[Object.keys(itemObj).length] = itemArr
      }

      let newKeywordsList = [] // 最终结果
      const itemObjKeyArr = Object.values(itemObj);
      let maxWidthIndex = 0; // 第二行的到最大宽度子元素的索引
      if (itemObjKeyArr.length > 2) { // 超过2行
        this.setData({
          unfoldBtnFlag: true
        }) // 行数大于2显示展开按钮
        if (itemObjKeyArr[1].length > 1) { // 若第二行的子元素有多个，否则表示子元素长度超出，css处理即可
          const listSecWidth = listWidth - 84 * rem // 26为展开按钮的宽度
          let maxWidth = 0;
          itemObj[1].forEach((item, index) => {
            maxWidth += res[itemObjKeyArr[0].length + index].width + listItemMarginRight
            if (maxWidth < listSecWidth) {
              maxWidthIndex = index
            }
          });
          itemObj[1] = itemObj[1].slice(0, maxWidthIndex + 1) // 截取最大宽度内的子元素集合
        }
        newKeywordsList = [...itemObj[0], ...itemObj[1]];
      } else {
        itemObjKeyArr.forEach(item => newKeywordsList = [...newKeywordsList, ...item]);
      }

      this.setData({
        historyList: newKeywordsList
      }, () => {
        this.setData({
          historyVisible: 1
        }, () => {
          setTimeout(() => {
            this.setData({
              historyVisible: 2,
              showHistoryList: newKeywordsList // 替换搜索历史数据
            })
          }, 50);
        })
      });
    },
    goSearch(searchType, searchName, attrName, otherId) {
      this.triggerEvent("goSearch", searchName);
    },
    getCacheKey(fromId){
      return fromId+"HistorySearchKey";
    }
  }
})
