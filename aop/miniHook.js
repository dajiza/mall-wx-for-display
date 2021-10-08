class MiniHook {
  constructor(option) {
    let {
      methods = {},
      pageListener = {},
    } = option;
    const pageLife = [
      "onLoad",
      "onShow",
      "onReady",
      "onHide",
      "onUnload",
      "onShareAppMessage",
      "onTabItemTap",
    ];
    const originPage = Page;
    App.Page = function (o = {}, ...args) {
      //行为注入
      Object.keys(methods).forEach((key) => {
        //不能是周期事件
        if (
          typeof methods[key] === "function" &&
          !pageLife.some((item) => item === key)
        ) {
          o[key] = methods[key];
        }
      });

      Object.keys(pageListener).forEach((key) => {
        if (
          typeof pageListener[key] === "function" &&
          pageLife.some((item) => item === key)
        ) {
          const originLife = o[key];
          o[key] = function () {
            pageListener[key].call(this, [this, o, arguments]);
            originLife && originLife.apply(this, arguments);
          };
        }
      });
      o.lifecyclerWatch = {
        lifecyclerCallback: [],
        addLifecyclerCallback: function (callback) {
          console.log(callback)
          this.lifecyclerCallback.push(callback)
        },
        removeLifecyclerCallback: function (callback) {
          let index = this.lifecyclerCallback.indexOf(callback)
          if (index >= 0) {
            this.lifecyclerCallback.splice(index, 1)
          }
        }
      }

      originPage(o, ...args);
    }
    const originComponent = Component;
    App.Component = function (o = {}, ...args) {
      //行为注入
      Object.keys(methods).forEach((key) => {
        //不能是周期事件
        if (
          typeof methods[key] === "function" &&
          !pageLife.some((item) => item === key)
        ) {
          o.methods || (o.methods = {});
          o.methods[key] = methods[key];
        }
      });
      originComponent(o, ...args);
    }
  }
}

module.exports = {
  config: function (...options) {
    let optionAll = {
      methods: {},
      pageListener: [],
    };
    options.forEach((option) => {
      let {
        methods = {},
        pageListener = {},
      } = option;
      optionAll.methods = Object.assign(optionAll.methods, methods);
      Object.keys(pageListener).forEach(key => {
        if (typeof pageListener[key] === "function") {
          optionAll.pageListener.push(pageListener[key]);
        }
      });
    })
    let pageListener = optionAll.pageListener;
    return new MiniHook({
      methods: optionAll.methods || {},
      pageListener: {
        onLoad: function (page) {
          let p = page[0];
          p.lifecycler = "onLoad";
          p.lifecyclerWatch.lifecyclerCallback.forEach(callback => {
            callback("onLoad");
          })
          Object.keys(pageListener).forEach(key => {
            if (
              typeof pageListener[key] === "function" && pageListener[key].name === "onLoad"
            ) {
              pageListener[key](page);
            }
          });
        },
        onUnload: function (page) {
          let p = page[0];
          p.lifecycler = "onUnload";
          p.lifecyclerWatch.lifecyclerCallback.forEach(callback => {
            callback("onUnload");
          })
          Object.keys(pageListener).forEach(key => {
            if (
              typeof pageListener[key] === "function" && pageListener[key].name === "onUnload"
            ) {
              pageListener[key](page);
            }
          });
        },
        onReady: function (page) {
          let p = page[0];
          p.lifecycler = "onReady";
          p.lifecyclerWatch.lifecyclerCallback.forEach(callback => {
            callback("onReady");
          })
          Object.keys(pageListener).forEach(key => {
            if (
              typeof pageListener[key] === "function" && pageListener[key].name === "onReady"
            ) {
              pageListener[key](page);
            }
          });
        },
        onShow: function (page) {
          console.log(page)
          let p = page[0];
          p.lifecycler = "onShow";
          p.lifecyclerWatch.lifecyclerCallback.forEach(callback => {
            callback("onShow")
          })
          Object.keys(pageListener).forEach(key => {
            if (
              typeof pageListener[key] === "function" && pageListener[key].name === "onShow"
            ) {
              pageListener[key](page);
            }
          });
        },
        onHide: function (page) {
          let p = page[0];
          p.lifecycler = "onHide";
          p.lifecyclerWatch.lifecyclerCallback.forEach(callback => {
            callback("onHide");
          })
          Object.keys(pageListener).forEach(key => {
            if (
              typeof pageListener[key] === "function" && pageListener[key].name === "onHide"
            ) {
              pageListener[key](page);
            }
          });
        },
      }
    });
  },
}
