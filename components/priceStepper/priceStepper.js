// components/priceStepper/priceStepper.js
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
function add(num1, num2) {
  var cardinal = Math.pow(10, 10);
  return Math.round((num1 + num2) * cardinal) / cardinal;
}
function equal(value1, value2) {
  return String(value1) === String(value2);
}
function isDef(value) {
  return value !== undefined && value !== null;
}
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    value: {
      type: null,
      observer: function (value) {
        if (!equal(value, this.data.currentValue)) {
          this.setData({ currentValue: this.format(value) });
        }
      },
    },
    integer: {
      type: Boolean,
      observer: 'check',
    },
    step: {
      type: null,
      value: 1,
    },
    disabled: Boolean,
    inputWidth: {
      type: String,
      value: "364rpx"
    },
    asyncChange: Boolean,
    disableInput: Boolean,
    decimalLength: {
      type: Number,
      value: null,
      observer: 'check',
    },
    min: {
      type: null,
      value: 1,
      observer: 'check',
    },
    max: {
      type: null,
      value: Number.MAX_SAFE_INTEGER,
      observer: 'check',
    },
    disablePlus: Boolean,
    disableMinus: Boolean,
    customClass: {
      type: String,
      value: ""
    },
    inputCustomClass: {
      type: String,
      value: ""
    },
    percentage: Boolean
  },

  /**
   * 组件的初始数据
   */
  data: {
    currentValue: '',
  },

  lifetimes: {
    created: function () {
      this.setData({
        currentValue: this.format(this.data.value),
      });
    }
  },

  created: function () {
    this.setData({
      currentValue: this.format(this.data.value),
    });
  },

  /**
   * 组件的方法列表
   */
  methods: {
    check: function () {
      var val = this.format(this.data.currentValue);
      if (!equal(val, this.data.currentValue)) {
        this.setData({ currentValue: val });
      }
    },
    isDisabled: function (type) {
      if (type === 'plus') {
        return (
          this.data.disabled ||
          this.data.currentValue >= this.data.max
        );
      }
      return (
        this.data.disabled ||
        this.data.currentValue <= this.data.min
      );
    },
    onFocus: function (event) {
      this.triggerEvent("focus", event.detail);
    },
    onBlur: function (event) {
      var value = this.format(event.detail.value);
      if (event.detail.value === '') {
        value = this.format(this.data.currentValue);
      } else {
        let inputValueStr = this.filter(event.detail.value);
        let inputValue = Number(inputValueStr)
        if (inputValue < this.data.min) {
          //小于最小值，提示
          this.triggerEvent("overlimit", 'inputMinus');
        }
      }
      this.emitChange(value);
      this.triggerEvent("blur", __assign(__assign({}, event.detail), { value: value }));
    },
    filter: function (value) {
      value = String(value).replace(/[^0-9.-]/g, '');
      let values = value.split('.')
      if (value.indexOf('.') !== -1 && values.length > 2) {
        //包含.且多个. 重新拼接
        let values = value.split('.')
        value = values[0] + "." + values[1]
      }
      if (this.data.integer && value.indexOf('.') !== -1) {
        value = value.split('.')[0];
      }
      return value;
    },
    format: function (value) {
      value = this.filter(value);
      // format range
      value = value === '' ? 0 : +value;
      value = Math.max(Math.min(this.data.max, value), this.data.min);
      // format decimal
      if (isDef(this.data.decimalLength)) {
        value = value.toFixed(this.data.decimalLength);
      }
      return value;
    },
    onInput: function (event) {
      // var _a = (event.detail || {}).value,
      //   value = _a === void 0 ? '' : _a;
      // // allow input to be empty
      // if (value === '') {
      //   return;
      // }
      // var formatted = this.filter(value);
      // // limit max decimal length
      // if (
      //   isDef(this.data.decimalLength) &&
      //   formatted.indexOf('.') !== -1
      // ) {
      //   var pair = formatted.split('.');
      //   formatted = pair[0] + '.' + pair[1].slice(0, this.data.decimalLength);
      // }
      // this.emitChange(formatted);
    },
    emitChange: function (value) {
      if (!this.data.asyncChange) {
        this.setData({ currentValue: value });
      }
      this.triggerEvent("change", value);
    },
    onChange: function () {
      var type = this.type;
      if (this.isDisabled(type)) {
        this.triggerEvent("overlimit", type);
        return;
      }
      var diff = type === 'minus' ? -this.data.step : +this.data.step;
      var value = this.format(add(+this.data.currentValue, diff));
      this.emitChange(value);
      this.triggerEvent(type);
    },
    onTap: function (event) {
      var type = event.currentTarget.dataset.type;
      this.type = type;
      this.onChange();
    },
  }
})
