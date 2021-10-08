const app = getApp()

const TYPE_PX = 1
const TYPE_RPX = 2

let initScreenConfig = function () {
    let systemInfo = wx.getSystemInfoSync()
    app.globalData.screenConfig = {
        windowWidth: systemInfo.windowWidth,
        windowHeight: systemInfo.windowHeight,
        safeArea: systemInfo.safeArea,
    }
    return app.globalData.screenConfig
}

module.exports = {
    TYPE_PX,
    TYPE_RPX,
    getPX: function (rpx) {
        let screenConfig = initScreenConfig()
        return rpx * (screenConfig.windowWidth / 750)
    },
    getRPX: function (px) {
        let screenConfig = initScreenConfig()
        return px * (750 / screenConfig.windowWidth)
    },
    getSafeAreaHeight: function (type) {
        let screenConfig = initScreenConfig()
        if (TYPE_RPX == type) {
            return this.getRPX(screenConfig.safeArea.height)
        }
        return screenConfig.safeArea.height
    },
    getSafeAreaTopPadding: function (type) {
        let screenConfig = initScreenConfig()
        if (TYPE_RPX == type) {
            return this.getRPX(screenConfig.safeArea.top)
        }
        return screenConfig.safeArea.top
    },
    getSafeAreaBottomPadding: function (type) {
        let screenConfig = initScreenConfig()
        // console.log(screenConfig)
        let safeAreaInsetBottom = screenConfig.windowHeight - screenConfig.safeArea.bottom
        if (TYPE_RPX == type) {
            return this.getRPX(safeAreaInsetBottom)
        }
        return safeAreaInsetBottom
    },
    getWindowWidth: function (type) {
        let screenConfig = initScreenConfig()
        if (TYPE_RPX == type) {
            return this.getRPX(screenConfig.windowWidth)
        }
        return screenConfig.windowWidth
    },
    getWindowHeight: function (type) {
        let screenConfig = initScreenConfig()
        if (TYPE_RPX == type) {
            return this.getRPX(screenConfig.windowHeight)
        }
        return screenConfig.windowHeight
    },
}
