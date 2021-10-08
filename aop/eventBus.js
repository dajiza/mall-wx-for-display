const eventStickyMap = new Map()

const EventBus = {
    configOption: {
        methods: {
            post: function (event) {
                console.log(event)
                let key = event.eventName
                let params = event.eventParams
                let isSticky = event.isSticky || false
                getCurrentPages().forEach((page) => {
                    if (page) {
                        let originFun = page[key]
                        originFun && originFun.apply(page, [params])
                    }
                })
                if (isSticky) {
                    eventStickyMap.set(key, params)
                }
            },
        },
        pageListener: {
            onLoad: function (e) {
                let page = e[0]
                let o = e[1]
                if (o.events) {
                    let events = o.events
                    Object.keys(events).forEach((key) => {
                        if (typeof events[key] === 'function') {
                            o[key] = events[key]
                            page[key] = events[key]
                            if (eventStickyMap.has(key)) {
                                page[key].apply(page, [eventStickyMap.get(key)])
                                eventStickyMap.delete(key)
                            }
                        }
                    })
                }
            },
            onUnload: function (e) {
                let page = e[0]
                let o = e[1]
                if (o.events) {
                    let events = o.events
                    Object.keys(events).forEach((key) => {
                        if (typeof events[key] === 'function') {
                            delete page[key]
                            delete o[key]
                        }
                    })
                }
            },
        },
    },
}
App.EventBus = EventBus

module.exports = {
    configOption: App.EventBus.configOption,
}
