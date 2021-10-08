// pages/category/category.js
import screenConfig from '../../utils/screen_util'
const searchListModel = require('../../models/searchList')
const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const app = getApp()
App.Page({
    /**
     * 页面的初始数据
     */
    data: {
        type_index: -1,
        searchValue: '',
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        safeAreaInsetBottom: safeAreaInsetBottom,
        cloth_list: [],
        loading_finish: false, // 请求完成
        cateAllList: [],
        cateSonsList: [],
    },
    // 不用于数据绑定的全局数据
    tempData: {
        cloth_list_clone: [], // 传递的参数
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log('输出 ~ onLoad pages/category/category')
        // this.getTabBar().init()
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        // this.getTabBar().init()
        // console.log('cloth_list_clone======>', this.tempData.cloth_list_clone)
        this.getCategoryDataNew()
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
    onPullDownRefresh: function () {},

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},

    /**
     * 用户切换商品类型（布/其它）
     */
    selectedType: function (event) {
        const _index = Number(event.currentTarget.dataset.index)

        if (_index == -1) {
            this.setData({
                type_index: _index,
            })
        } else if (_index > 0) {
            const selectCateList = this.data.cateAllList.filter((item) => {
                return item.id == _index
            })
            if (selectCateList.length > 0) {
                this.setData({
                    type_index: _index,
                    cateSonsList: selectCateList[0].sons,
                })
            }
        }

        console.log('type_index', this.data.type_index)
    },

    getCategoryDataNew() {
        const _this = this
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading()
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        wx.showLoading({
            title: '加载中...',
        })
        searchListModel.queryV2GoodsCateList({}).then((res) => {
            // console.log('res-------128--------', res)
            const categoryList = res.category
            let groupCate = categoryList.filter((item) => {
                return item.type == 2 && item.sons && item.sons.length > 0
            })
            let OtherCate = categoryList.filter((item) => {
                return item.type == 1 && item.sons && item.sons.length > 0
            })
            // console.log('groupCate', groupCate)
            // console.log('OtherCate', OtherCate)
            groupCate.forEach((ev) => {
                this.back_sort(ev.sons)
            })
            OtherCate.forEach((ev) => {
                this.back_sort(ev.sons)
            })
            this.back_sort(groupCate)
            this.back_sort(OtherCate)

            const clothObj = res.attr.cloth
            let clothData = []
            for (let key in clothObj) {
                let _obj = {}
                _obj['list'] = clothObj[key]
                _obj['showAll'] = false
                _obj['attr_key'] = key
                if (key === 'brand') {
                    _obj['attr_name'] = '品牌'
                } else if (key === 'material') {
                    _obj['attr_name'] = '材质'
                } else if (key === 'origin') {
                    _obj['attr_name'] = '产地'
                } else if (key === 'unit') {
                    _obj['attr_name'] = '单位'
                } else if (key === 'pattern') {
                    _obj['attr_name'] = '花纹'
                } else if (key === 'color') {
                    _obj['attr_name'] = '颜色'
                }
                if (_obj['attr_key'] == 'brand' || _obj['attr_key'] == 'material' || _obj['attr_key'] == 'pattern') {
                    clothData.push(_obj)
                }
            }
            clothData.forEach((ev) => {
                this.back_sort(ev.list)
            })
            this.tempData.cloth_list_clone.forEach((ev_clone) => {
                clothData.forEach((ev) => {
                    if (ev.attr_key == ev_clone.attr_key && ev.list.length > 6) {
                        ev['showAll'] = ev_clone['showAll']
                    }
                })
            })
            console.log('clothData=============155', clothData)
            this.setData({
                cateAllList: groupCate.concat(OtherCate),
                cloth_list: clothData,
            })
            // 隐藏loading 提示框
            wx.hideLoading()
            //隐藏导航条加载动画
            wx.hideNavigationBarLoading()
        })
    },
    back_sort(arr) {
        arr.sort(function (a, b) {
            return a.asc - b.asc
        })
    },
    /**
     * 切换 展开收起
     */
    onClickShowAll(res) {
        const _index = Number(res.currentTarget.dataset.index)
        let _arr = this.data.cloth_list
        _arr[_index]['showAll'] = !_arr[_index]['showAll']
        this.tempData.cloth_list_clone = this.data.cloth_list
        this.setData({
            cloth_list: _arr,
        })
    },

    /**
     * 键盘输入
     */
    bindSearchInput: function (e) {
        this.setData({
            searchValue: e.detail.value,
        })
    },

    /**
     * 清空搜索框内容
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
            const str = this.data.searchValue
            const _this = this
            let search_arr = []
            // 存储搜索内容后 - 跳转到搜索页
            wx.getStorage({
                key: 'historySearchKey',
                success(res) {
                    search_arr = res.data
                    let arrIndex = search_arr.indexOf(str)
                    if (arrIndex !== -1) {
                        // 删除已存在后重新插入至数组
                        search_arr.splice(arrIndex, 1)
                    }
                    search_arr.unshift(str)
                    wx.setStorage({
                        key: 'historySearchKey',
                        data: search_arr,
                    })
                    _this.goSearchResult('input', str, '', -1, 0)
                },
                fail: (res) => {
                    search_arr.unshift(str)
                    wx.setStorage({
                        key: 'historySearchKey',
                        data: search_arr,
                    })
                    _this.goSearchResult('input', str, '', -1, 0)
                },
            })
        }
    },

    /**
     * 点击 属性
     */
    onclickCate(res) {
        const searchType = 'select'
        const searchName = res.currentTarget.dataset.name
        const attrName = res.currentTarget.dataset.attr
        this.goSearchResult(searchType, searchName, attrName, -1, 0)
    },

    /**
     * 点击子分类中某一个
     */
    onclickSonsItem(res) {
        const searchType = 'select'
        const searchName = res.currentTarget.dataset.name
        const otherId = Number(res.currentTarget.dataset.id)
        const cate_parent_id = Number(res.currentTarget.dataset.parentId) // 父级分类id
        console.log('cate_parent_id', cate_parent_id)
        this.goSearchResult(searchType, searchName, '', otherId, cate_parent_id)
        // 跳转到搜索页
    },

    /**
     * 跳转到搜索页
     */
    goSearchResult(searchType, searchName, attrName, otherId, goodsCate) {
        const _this = this
        let _url = ''
        if (attrName) {
            // 布料
            _url = '../goodsSearchResult/goodsSearchResult?searchType=' + searchType + '&cate_id=' + goodsCate + '&other_id=' + otherId + '&attrName=' + attrName + '&attrValue=' + searchName
        } else {
            // 布组其它
            _url = '../goodsSearchResult/goodsSearchResult?searchType=' + searchType + '&cate_id=' + goodsCate + '&other_id=' + otherId
        }
        if (searchType === 'input') {
            _url = _url + '&name=' + searchName
        }
        wx.navigateTo({
            // url: '../goodsSearchResult/goodsSearchResult',
            url: _url,
            success: function (res) {
                // 通过eventChannel向被打开页面传送数据
                res.eventChannel.emit('acceptDataFromOpenerPage', {
                    searchType: searchType, // 搜索类型 -- 输入框搜索/点击属性搜索  input/select
                    searchValue: searchName, // 搜索文字 -- 输入文字/点击属性详情名称
                    attrName: attrName, // 属性名称（英文） 当点击 属性搜索 且 分类 为布料 时需要
                    navTitle: '商品分类', //  跳转页面的标题
                    otherId: otherId, // 其它分类 id  当点击其它/布组 搜索时需要  默认-1
                    goodsCate: goodsCate,
                })
                _this.setData({
                    searchValue: '',
                })
            },
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
