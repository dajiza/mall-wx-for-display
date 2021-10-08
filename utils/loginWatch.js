const authorizeWatch = require('./authorizeWatch')

module.exports = {
    observer: function (page, callback, path = '', isTab = false) {
        authorizeWatch.loginObserver(page, callback, path, isTab)
    },
    onNext: function (page, isLogin) {
        authorizeWatch.loginOnNext(page, isLogin)
    },
}
