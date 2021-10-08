const util = require('../utils/util')

module.exports = {
  isFirstPublish: function () {
    let isFirstPublish = wx.getStorageSync("isFirstPublish") || 1;
    return isFirstPublish == 1
  },
  setIsFirstPublish: function (isFirst) {
    wx.setStorageSync('isFirstPublish', isFirst ? 1 : 2)
  },
  //看看详情
  tutorialDetail: function (tutorial_id) {
    return new Promise((resolve, reject) => {
      util.request('tutorial-detail', {
        tutorial_id: tutorial_id
      }).then((res) => {
        resolve(res)
      }).catch((err) => {
        reject(err)
      })
    })
  },
  // 材料清单信息（sku）
  querySkuList: function (sku_ids) {
    return new Promise((resolve, reject) => {
      util.request('goods-shop-sku-list', {
        sku_ids: sku_ids
      }).then((res) => {
        resolve(res)
      }).catch((err) => {
        reject(err)
      })
    })
  },
  //创建或修改看看
  tutorialSave: function (params) {
    return new Promise((resolve, reject) => {
      util.request('tutorial-save', params)
        .then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
    })
  },
  //收藏/取消收藏
  tutorialLike: function (params) {
    return new Promise((resolve, reject) => {
      util.request('tutorial-like', params)
        .then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
    })
  },
  //看看随机列表(首页)
  tutorialRandList: function (params) {
    return new Promise((resolve, reject) => {
      util.request('tutorial-rand-list', params)
        .then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
    })
  },
  //收藏列表
  tutorialLikeList: function (params) {
    return new Promise((resolve, reject) => {
      util.request('tutorial-like-list', params)
        .then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
    })
  },
  //看看个人列表
  tutorialAuthorList: function (params) {
    return new Promise((resolve, reject) => {
      util.request('tutorial-author-list', params)
        .then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
    })
  },
  //删除看看
  tutorialDelete: function (params) {
    return new Promise((resolve, reject) => {
      util.request('tutorial-delete', params)
        .then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
    })
  },
  //店铺商品列表批量查询
  tutorialMaterialSkuList: function (params) {
    return new Promise((resolve, reject) => {
      util.request('goods-shop-sku-list', params)
        .then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
    })
  },

}