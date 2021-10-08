Component({
  properties: {
    sku_img:{
      type:String,
      value:''
    },
    goods_name:{
      type:String,
      value:''
    },
    label:{
      type:String,
      value:'',
      observer: function (newVal, oldVal) {
        // console.log('newVal',newVal)
        const isJSON = this.isJSON(newVal)
        let attr_list = [],
            _label = ''
        if(isJSON){
          if (newVal) {
            const sku_attr = JSON.parse(newVal)
            attr_list = sku_attr.map((e) => {
              return e['Value']
            })
            _label = attr_list.join('；')
          }
        } else {
          _label = newVal
        }
        this.setData({
          label: _label
        })
      }
    },
    sku_price:{
      type:Number,
      value:0
    }
  },
  data: {
    label: ''
  },
  methods: {
    isJSON(str) {
      if (typeof str == 'string') {
        try {
          let obj=JSON.parse(str);
          if(typeof obj == 'object' && obj ){
            return true;
          }else{
            return false;
          }

        } catch(e) {
          // console.log('error：'+str+'!!!'+e);
          return false;
        }
      } else {
        return false;
      }
      // console.log('It is not a string!')
    }
  }
})
