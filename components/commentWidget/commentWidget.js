Component({
  /**
   * 组件的属性列表
   */
  properties: {
    value:{
      type: Number,
      value: 0,
    },
    checked:{
      type:Boolean,
      value:false,
      observer: function (newVal, oldVal) {
        this.setData({
          checked: newVal
        })
      }
    },
    type:{
      type: Number,
      value: 0,
      observer: function (newVal, oldVal) {
        this.setData({
          type: newVal
        })
      }
    },
    icon_width:{
      type: String,
      value: '36rpx',
    },
    icon_height:{
      type: String,
      value: '36rpx',
    },
    label_custom_class:{
      type: String,
      value: '',
    },
    custom_class:{
      type: String,
      value: '',
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    type: 0,
    checked: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClick:function(e){
      this.triggerEvent("click");
    }
  }
})
