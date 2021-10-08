const http = require("../utils/util");

const expire = 1000 * 60 * 10

module.exports = {
    clearCache: function () {
        let expireObject = wx.getStorageSync('expire') || {}
        let {
            lastClearTime = 0
        } = expireObject;
        if (lastClearTime == 0) {
            //未记录
            wx.setStorageSync('expire', {
                lastClearTime: Date.parse(new Date()),
            })
            return;
        }
        if ((Date.parse(new Date()) - expire) > lastClearTime) {
            //再次清理时间已经超出缓存有效期
            wx.setStorageSync('posters', []);
            let webImageStorage = wx.getStorageSync('webImages') || []
            webImageStorage.forEach(storage => {
                wx.removeSavedFile({
                    filePath: storage.local_path,
                    complete(res) {
                        console.log(res)
                    }
                })
            });
            wx.setStorageSync('webImages', []);
            wx.setStorageSync('expire', {
                lastClearTime: Date.parse(new Date()),
            })
        }
    },
    /**
     * 商品海报
     */
    queryGoodsPoster: function (page, scene, goods_img, goods_name, goods_price, avatar_img, nick_name) {
        return new Promise((resolve, reject) => {
            let posters = wx.getStorageSync('posters') || [];
            let request = {
                page,
                scene,
                goods_img,
                goods_name,
                goods_price,
                avatar_img,
                nick_name
            }
            let key = JSON.stringify(request);
            let poster = posters.find((y) => {
                return y.key == key
            });
            console.log(poster)
            let image_url = "";
            if (poster) {
                if ((Date.parse(new Date()) - expire) > poster.last_time) {
                    //过期
                    let posterIdx = posters.findIndex(y => y.key === key);
                    posters.splice(posterIdx, 1);
                    wx.setStorageSync('posters', posters);
                    this.clearStorageImage(poster.url)
                        .then(res => {

                        }).catch(err => {
                            console.log(err)
                        })
                    image_url = "";
                } else {
                    image_url = poster.url;
                }
            }
            if (image_url.length > 0) {
                resolve({
                    img_url: image_url
                });
            } else {
                http.request("poster-goods", request)
                    .then((res) => {
                        let posters = wx.getStorageSync('posters') || [];
                        let posterStorage = {
                            key: key,
                            url: res.img_url,
                            last_time: Date.parse(new Date()),
                        }
                        console.log(posterStorage)
                        posters.push(posterStorage);
                        wx.setStorageSync('posters', posters);
                        resolve(res);
                    }).catch((err) => {
                        reject(err);
                    });
            }
        });
    },

    /**
     * 店铺海报
     */
    queryShopPoster: function (page, scene, avatarImg, posterShopImg, autoLoading = false) {
        return new Promise((resolve, reject) => {
            let posters = wx.getStorageSync('posters') || [];
            let request = {
                page: page,
                scene: scene,
                avatar_img: avatarImg,
                poster_shop_img: posterShopImg
            }
            let key = JSON.stringify(request);
            let poster = posters.find((y) => {
                return y.key == key
            });
            console.log(poster)
            let image_url = "";
            if (poster) {
                if ((Date.parse(new Date()) - expire) > poster.last_time) {
                    //过期
                    let posterIdx = posters.findIndex(y => y.key === key);
                    posters.splice(posterIdx, 1);
                    wx.setStorageSync('posters', posters);
                    this.clearStorageImage(poster.url)
                        .then(res => {

                        }).catch(err => {
                            console.log(err)
                        })
                    image_url = "";
                } else {
                    image_url = poster.url;
                }
            }
            console.log(image_url)
            if (image_url.length > 0) {
                resolve({
                    img_url: image_url
                });
            } else {
                if (autoLoading) {
                    wx.showLoading({
                        title: '加载中',
                    })
                }
                http.request("poster-shop", request)
                    .then((res) => {
                        let posters = wx.getStorageSync('posters') || [];
                        let posterStorage = {
                            key: key,
                            url: res.img_url,
                            last_time: Date.parse(new Date()),
                        }
                        console.log(posterStorage)
                        posters.push(posterStorage);
                        wx.setStorageSync('posters', posters);
                        resolve(res);
                    }).catch((err) => {
                        reject(err);
                    });
            }
        });
    },

    /**
     * 店铺海报图片列表
     */
    queryPosterList: function () {
        return new Promise((resolve, reject) => {
            http.request("poster-shop-list", {})
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    getStorageImage: function (url) {
        return new Promise((resolve, reject) => {
            let webImages = wx.getStorageSync('webImages') || [];
            let webImage = webImages.find(y => y.web_path === url);
            let imagePath = "";
            console.log("getStorageImage");
            console.log(url);
            console.log(webImage);
            if (webImage) {
                try {
                    const fileSystem = wx.getFileSystemManager();
                    fileSystem.accessSync(webImage.local_path);
                    console.log("fileSystem.accessSync")
                    if ((Date.parse(new Date()) - expire) > webImage.last_time) {
                        let webImageIdx = webImages.findIndex(y => y.web_path === url)
                        webImages.splice(webImageIdx, 1)
                        wx.setStorageSync('webImages', webImages)
                        console.log("删除过期临时文件:" + webImage.local_path);
                        fileSystem.removeSavedFile({
                            filePath: webImage.local_path
                        })
                    } else {
                        imagePath = webImage.local_path;
                    }
                } catch (e) {
                    let webImageIdx = webImages.findIndex(y => y.web_path === url)
                    webImages.splice(webImageIdx, 1)
                    wx.setStorageSync('webImages', webImages)
                }
            }
            if (imagePath.length > 0) {
                //本地文件存在
                console.log("本地文件存在 imagePath:" + imagePath);
                resolve(imagePath);
            } else {
                //本地文件不存在
                console.log("本地文件不存在");
                wx.downloadFile({
                    url: url,
                    success: function (res) {
                        let filePath = res.tempFilePath;
                        let webImageStorage = wx.getStorageSync('webImages') || []
                        let storage = {
                            web_path: url,
                            local_path: filePath,
                            last_time: Date.parse(new Date()),
                        }
                        webImageStorage.push(storage)
                        wx.setStorageSync('webImages', webImageStorage)
                        console.log("下载图片并缓存 filePath:" + filePath);
                        console.log(webImageStorage);
                        resolve(filePath);
                    },
                    fail: function (err) {
                        console.log(err);
                        reject(err);
                    }
                })
            }
        });
    },
    clearStorageImage: function (url) {
        return new Promise((resolve, reject) => {
            let webImages = wx.getStorageSync('webImages') || [];
            let webImage = webImages.find(y => y.web_path === url);
            if (webImage) {
                try {
                    const fileSystem = wx.getFileSystemManager();
                    fileSystem.accessSync(webImage.local_path);
                    if ((Date.parse(new Date()) - expire) > webImage.last_time) {
                        let webImageIdx = webImages.findIndex(y => y.web_path === url)
                        webImages.splice(webImageIdx, 1)
                        wx.setStorageSync('webImages', webImages)
                        console.log("删除过期临时文件:" + webImage.local_path);
                        fileSystem.removeSavedFile({
                            filePath: webImage.local_path
                        })
                    }
                    resolve();
                } catch (e) {
                    let webImageIdx = webImages.findIndex(y => y.web_path === url)
                    webImages.splice(webImageIdx, 1)
                    wx.setStorageSync('webImages', webImages)
                    reject("本地缓存文件不存在");
                }
            }
        });
    }
};
