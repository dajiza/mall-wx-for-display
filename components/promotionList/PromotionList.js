
Component({
  properties: {},
  data: {
    isShow: false, //组件整体显示
    img: "",
    price: 0,
    label: "",
    promotionList: [],
    promotionId: "",
    tag: null,
  },
  methods: {
    onBeforeEnter() {
      let systemInfo = wx.getSystemInfoSync()
      let windowHeight = systemInfo.windowHeight
      let safeArea = systemInfo.safeArea
      let safeAreaInsetBottom = windowHeight - safeArea.bottom
      this.setData({
        safeAreaInsetBottom: safeAreaInsetBottom,
      })
    },
    onEnter() { },
    confirm: function (e) {
      this.setData({
        isShow: false,
      })
      this.triggerEvent('onConfirm', {
        tag: this.data.tag,
        promotionId: Number(this.data.promotionId)
      })
    },
    show(props) {
      let {
        img = "",
        price = 0,
        label = "",
        promotionList = [],
        promotionId = "",
        tag = null,
      } = props
      let newList = promotionList.map(promotion => {
        let rules = promotion.rules || []
        let type = promotion.type
        let labels = []
        //排序
        rules.sort((a, b) => {
          return a.needNum - b.needNum
        })
        rules.forEach(rule => {
          if (type == 1) {
            //每满减
            labels.push("每满" + (rule.needNum / 100) + "元减" + (rule.subNum / 100) + "元")
          } else if (type == 2) {
            //满减
            labels.push('满' + (rule.needNum / 100) + '元减' + (rule.subNum / 100) + '元')
          } else if (type == 3) {
            //满折
            if(promotion.topMoney>0){
              let topMoney = (promotion.topMoney/100)
              labels.push('满' + (rule.needNum / 100) + '元打' + (rule.subNum / 10) + '折,最高减'+topMoney+'元')
            }else{
              labels.push('满' + (rule.needNum / 100) + '元打' + (rule.subNum / 10) + '折')
            }
          } else if (type == 4) {
            //满件折
            if(promotion.topMoney>0){
              let topMoney = (promotion.topMoney/100)
              labels.push('满' + (rule.needNum) + '件打' + (rule.subNum / 10) + '折,最高减'+topMoney+'元')
            }else{
              labels.push('满' + (rule.needNum) + '件打' + (rule.subNum / 10) + '折')
            }
          } else if (type == 5) {
            //加价购
            labels.push('满' + (rule.needNum / 100) + '元加' + (rule.subNum / 100) + '元可换购')
          } else if (type == 6) {
            //满券
            let name = rule.objName
            if (!name.endsWith('优惠券')) {
              name = name + '优惠券'
            }
            labels.push('满' + (rule.needNum / 100) + '元送' + name)
          }
        });
        let label = labels.join(';')
        return {
          id: promotion.id,
          label: label,
          multi: rules.length > 1
        }
      })
      this.setData({
        isShow: true,
        img: img,
        price: price,
        label: label,
        promotionList: newList,
        promotionId: promotionId + "",
        tag: tag
      })
    },
    onChange: function (e) {
      this.setData({
        promotionId: e.detail
      })
    },
    close(e) {
      this.setData({
        isShow: false,
      })
    },
    preventTouchMove() { },
  }
})
