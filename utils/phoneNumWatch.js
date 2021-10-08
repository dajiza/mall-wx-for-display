const authorizeWatch = require("./authorizeWatch");
module.exports = {
    observer: function (page, callback, force = false) {
        authorizeWatch.phoneNumObserver(page,callback,force)
    },
    onNext: function (page, isLogin) {
        authorizeWatch.phoneNumOnNext(page,isLogin)
    },
};
