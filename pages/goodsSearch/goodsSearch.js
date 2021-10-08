import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'
const searchListModel = require('../../models/searchList')
const util = require('../../utils/util')

const app = getApp()
Page({
    /**
     * 页面的初始数据
     */
    data: {
        searchValue: '',
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        historyList: [],
        showHistoryList: [],
        unfoldBtnFlag: false, // 搜索历史中展开按钮开关
        showAllSearchHistory: false, // 展开全部历史搜索
        hotSearchList: [],
        isPullDown: false,
        showDeleteConfirmDialog: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.getHotSearchData()
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        const _this = this
        // 获取缓存中的搜索历史
        wx.getStorage({
            key: 'historySearchKey',
            success(res) {
                const _list = res.data || []
                let history_list = []
                _list.forEach((ev) => {
                    if (ev) {
                        history_list.push(ev)
                    }
                })
                _this.setData(
                    {
                        historyList: history_list,
                    },
                    () => {
                        if (_this.data.historyList.length > 0) {
                            setTimeout(() => {
                                // 获取historyList遍历后子元素节点在页面上的宽高
                                const query = wx.createSelectorQuery().in(_this)
                                query
                                    .selectAll('.search-item')
                                    .fields(
                                        {
                                            size: true,
                                        },
                                        function (res) {
                                            _this.computedItemSize(res)
                                        }
                                    )
                                    .exec()
                            }, 100)
                        }
                    }
                )
            },
            fail: (res) => {},
        })
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.setData({
            isPullDown: true,
        })
        this.onRefresh()
    },

    /**
     * 刷新
     */
    onRefresh() {
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        wx.showLoading({
            title: '刷新中...',
        })
        this.getHotSearchData()
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // },

    ClickBack() {
        let pages = getCurrentPages()
        if (pages.length === 1) {
            wx.switchTab({
                url: '../index/index',
            })
        } else {
            wx.navigateBack({
                delta: 1,
            })
        }
    },

    bindSearchInput: function (e) {
        this.setData({
            searchValue: e.detail.value,
        })
    },

    /**
     * 清空搜索记录
     */
    bindClearSearch: function () {
        this.setData({
            searchValue: '',
        })
    },

    /**
     * 点击软键盘搜索按钮
     */
    handleOnSearch: function () {
        if (this.data.searchValue) {
            this.saveSearch(this.data.searchValue)
        }
    },

    /**
     * 点击搜索历史
     */
    handleClickHistory(res) {
        const historyValue = res.currentTarget.dataset.value
        this.saveSearch(historyValue)
    },

    /**
     * 存储搜索内容
     */
    saveSearch(str) {
        const _this = this
        //把获取的input值插入数组里面
        let historySearchArr = [] // 搜索历史记录
        wx.getStorage({
            key: 'historySearchKey',
            success(res) {
                historySearchArr = res.data
                let arrIndex = historySearchArr.indexOf(str)
                if (arrIndex !== -1) {
                    // 删除已存在后重新插入至数组
                    historySearchArr.splice(arrIndex, 1)
                    historySearchArr.unshift(str)
                } else {
                    historySearchArr.unshift(str)
                }
                wx.setStorage({
                    key: 'historySearchKey',
                    data: historySearchArr,
                })
                _this.goSearchResult('input', str, '', -1)
            },
            fail: (res) => {
                historySearchArr.unshift(str)
                wx.setStorage({
                    key: 'historySearchKey',
                    data: historySearchArr,
                })
                _this.goSearchResult('input', str, '', -1)
            },
        })
    },

    /**
     * 点击取消，返回首页
     */
    handleCancel: function () {
        wx.switchTab({
            url: '../index/index',
        })
    },

    // 搜索历史子元素个数计算
    async computedItemSize(res) {
        const keywordsList = this.data.historyList
        if (keywordsList.length === 0) return
        const rem = wx.getSystemInfoSync().windowWidth / 750
        const listWidth = wx.getSystemInfoSync().windowWidth - 40 * rem // 20 为左右padding
        const listItemMarginRight = 20 * rem
        const itemObj = {} // { arrLength : arr }
        let itemArr = [] // 每行子元素集合
        let count = 0 // 当前长度
        for (let i = 0; i < res.length; i++) {
            const listItemWidth = res[i].width + listItemMarginRight
            let num = count + listItemWidth
            if (num < listWidth) {
                itemArr.push(keywordsList[i])
                count += res[i].width + listItemMarginRight
            } else {
                if (itemArr.length === 0 && count === 0) {
                    // 此条件满足，说明子元素长度超出
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
        const itemObjKeyArr = Object.values(itemObj)
        let maxWidthIndex = 0 // 第二行的到最大宽度子元素的索引
        if (itemObjKeyArr.length > 2) {
            // 超过2行
            this.setData({
                unfoldBtnFlag: true,
            }) // 行数大于2显示展开按钮
            if (itemObjKeyArr[1].length > 1) {
                // 若第二行的子元素有多个，否则表示子元素长度超出，css处理即可
                const listSecWidth = listWidth - 84 * rem // 26为展开按钮的宽度
                let maxWidth = 0
                itemObj[1].forEach((item, index) => {
                    maxWidth += res[itemObjKeyArr[0].length + index].width + listItemMarginRight
                    if (maxWidth < listSecWidth) {
                        maxWidthIndex = index
                    }
                })
                itemObj[1] = itemObj[1].slice(0, maxWidthIndex + 1) // 截取最大宽度内的子元素集合
            }
            newKeywordsList = [...itemObj[0], ...itemObj[1]]
        } else {
            itemObjKeyArr.forEach((item) => (newKeywordsList = [...newKeywordsList, ...item]))
        }
        this.setData({
            historyList: newKeywordsList,
        }) // 替换搜索历史数据
        this.setData({
            showHistoryList: newKeywordsList,
        })
    },

    /**
     * 展开搜索历史记录
     */
    unfoldList() {
        const _this = this
        wx.getStorage({
            key: 'historySearchKey',
            success(res) {
                _this.setData({
                    historyList: res.data,
                    showAllSearchHistory: true,
                })
            },
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

    // 删除全部搜索历史记录
    handleDeleteAllSearch() {
        this.setData({
            showDeleteConfirmDialog: true,
        })
        const _this = this
    },

    onDeleteConfirmDialogClose() {
        this.setData({
            showDeleteConfirmDialog: false,
        })
    },

    onDeleteConfirm() {
        wx.removeStorageSync('historySearchKey') // 清除缓存中的记录
        this.setData({
            showDeleteConfirmDialog: false,
            historyList: [],
            unfoldBtnFlag: false,
            showHistoryList: [],
        })
        wx.showToast({
            title: '删除成功',
            icon: 'none',
            duration: 2000,
        })
    },

    preventTouchMove() {},

    /**
     * 网络请求，获取热搜榜商品数据
     */
    getHotSearchData() {
        const params = {
            page: 1,
            limit: 10,
        }
        const _this = this
        searchListModel.queryMostSearchList(params).then((res) => {
            if (_this.data.isPullDown) {
                //隐藏loading 提示框
                wx.hideLoading()
                //隐藏导航条加载动画
                wx.hideNavigationBarLoading()
                //停止下拉刷新
                wx.stopPullDownRefresh()
            }
            _this.setData({
                hotSearchList: res.lists || [],
                isPullDown: false,
            })
        })
    },

    /**
     * 点击商品-前往商品详情
     */
    handleGoGoodsDetail(res) {
        const goods_id = Number(res.currentTarget.dataset.id)
        wx.navigateTo({
            url: '../goodsDetail/goodsDetail' + '?goodsId=' + goods_id,
        })
    },

    /**
     * 跳转到搜索页
     */
    goSearchResult(searchType, searchName, attrName, otherId) {
        const _this = this
        wx.navigateTo({
            url: '../goodsSearchResult/goodsSearchResult?searchType=' + searchType + '&name=' + searchName,
            success: function (res) {
                // 通过eventChannel向被打开页面传送数据
                res.eventChannel.emit('acceptDataFromOpenerPage', {
                    searchType: searchType, // 搜索类型 -- 输入框搜索/点击属性搜索  input/select
                    searchValue: searchName, // 搜索文字 -- 输入文字/点击属性详情名称
                    attrName: attrName, // 属性名称（英文） 当点击 属性搜索 且 分类 为布料 时需要
                    navTitle: '商品搜索', //  跳转页面的标题
                    otherId: otherId, // 其它分类 id  当点击其它/布组 搜索时需要  默认-1
                    goodsCate: 0,
                })
                _this.setData({
                    searchValue: '',
                })
            },
        })
    },
    // 图片上传
    afterRead(event) {
        wx.showLoading({
            title: '上传中',
        })
        console.log('输出 ~ event', event)
        const file = event.detail.file

        util.uploadFile(file.path)
            .then((res) => {
                console.log('输出 ~ res', res)
                let result = JSON.parse(res)
                wx.hideLoading()
                if (result.code == 200) {
                    wx.navigateTo({
                        url: '/pages/imgSearchResult/imgSearchResult?img=' + result.data.file_url,
                    })
                } else {
                    wx.showToast({
                        title: '图片上传失败',
                        icon: 'none',
                        duration: 2000,
                    })
                }
            })
            .catch((err) => {
                // reject(err)
                wx.hideLoading()
            })
    },
    // 图片超出限制
    oversize(event) {
        wx.showToast({
            title: '图片大小请在10M以下',
            icon: 'none',
            duration: 2000,
        })
    },
})
