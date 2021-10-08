const http = require('../utils/util')
const config = require('../config/config')

module.exports = {
    // 板块获取
    pageLayoutDetail: function () {
        return new Promise((resolve, reject) => {
            http.request('page-layout-detail', { shopId: config.shopId }, 'POST', false)
                .then((res) => {
                    let { layoutList = [] } = res
                    layoutList.sort((a, b) => {
                        return a.sort - b.sort
                    })
                    layoutList.forEach((ev) => {
                        ev.ContentList.sort((a, b) => {
                            return a.sort - b.sort
                        })
                    })
                    resolve({
                        layoutList: layoutList,
                    })
                })
                .catch((err) => {
                    reject(err)
                })
        })
        // .then(res => {
        //   let layoutList = [
        //     {
        //       id: 0,
        //       kind: 5,
        //       showTitle: 1,
        //       showSubtitle: 1,
        //       title: "标题",
        //       subtitle: "副标题",
        //       status: 2,
        //       ContentList: [
        //         {
        //           id: 1,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         },
        //         {
        //           id: 2,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         },
        //         {
        //           id: 3,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         }
        //       ]
        //     },
        //     {
        //       id: 1,
        //       kind: 1,
        //       showTitle: 1,
        //       showSubtitle: 1,
        //       title: "标题",
        //       subtitle: "副标题",
        //       status: 2,
        //       ContentList: [
        //         {
        //           id: 11,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         },
        //         {
        //           id: 12,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         }
        //       ]
        //     },
        //     {
        //       id: 2,
        //       kind: 3,
        //       showTitle: 2,
        //       showSubtitle: 2,
        //       title: "标题",
        //       subtitle: "副标题",
        //       status: 2,
        //       ContentList: [
        //         {
        //           id: 21,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         },
        //         {
        //           id: 22,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         },
        //         {
        //           id: 13,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         },
        //         {
        //           id: 14,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         }
        //       ]
        //     }, {
        //       id: 3,
        //       kind: 4,
        //       showTitle: 2,
        //       showSubtitle: 1,
        //       title: "活动促销",
        //       subtitle: "副标题",
        //       status: 2,
        //       ContentList: [
        //         {
        //           id: 31,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         },
        //         {
        //           id: 32,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         }
        //       ]
        //     }, {
        //       id: 4,
        //       kind: 2,
        //       showTitle: 1,
        //       showSubtitle: 2,
        //       title: "活动促销",
        //       subtitle: "活动促销副标题",
        //       status: 2,
        //       ContentList: [
        //         {
        //           id: 41,
        //           img: "https://img.yzcdn.cn/vant/cat.jpeg",
        //           status: 2,
        //           parameter: "",
        //           type: 1
        //         }
        //       ]
        //     },
        //   ]
        //   return {
        //     layoutList:layoutList
        //   }
        // })
    },
}
