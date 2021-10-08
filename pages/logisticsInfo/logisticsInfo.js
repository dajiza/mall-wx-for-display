import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';
const logisticsModel = require("../../models/logistics");
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        navTitle: '物流信息',
        statusBarHeight: app.globalData.statusBarHeight,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',
        steps: [],
        stepsList: [],
        is_received: false, // 是否签收
        logistics_company_name: '', // 物流公司名称
        logistics_no: '', // 物流单号
        shipping_address: '', // 收货地址
        logistics_status: '', // 当前物流状态
        courier_tel: '', // 快递员手机号
        order_detail_id: -1, // 订单详情id
        order_id: -1, // 订单id
        apply_id: -1, // 售后id
        isPullDown: false, // 下拉刷新操作
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const eventChannel = this.getOpenerEventChannel();
        const _this = this;
        // 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
        eventChannel.on('acceptDataFromOpenerPage', function (res) {
            _this.setData({
                order_detail_id: res.order_detail_id ? Number(res.order_detail_id) : -1,
                order_id: res.order_id ? Number(res.order_id) : -1,
                apply_id: res.apply_id ? Number(res.apply_id) : -1
            })
            // 请求物流数据
            _this.queryListData();
        })

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        /*setTimeout(()=>{
            let query = wx.createSelectorQuery();
            query.select('.content').boundingClientRect(rect=>{
                let clientHeight = rect.height;
                let clientWidth = rect.width;
                let ratio = 750 / clientWidth;
                let height = clientHeight * ratio;
                console.log('height', height);
            }).exec();
        },300)*/
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        //调用刷新时将执行的方法
        // console.log('下拉');
        this.setData({
            isPullDown: true
        })
        this.queryListData();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    // onShareAppMessage: function () {

    // },

    ClickBack() {
        let pages = getCurrentPages();
        if (pages.length === 1) {
            wx.switchTab({
                url: '../index/index'
            })
        } else {
            wx.navigateBack({
                delta: 1
            });
        }
    },

    /**
     * 请求物流信息数据
     */
    queryListData() {
        // logisticsModel
        const params = {
            order_id: this.data.order_id,
            order_detail_id: this.data.order_detail_id,
            apply_id: this.data.apply_id
        };
        const _this = this;
        let courierTel = '';       // 快递员手机号
        let steps_list = [];       // 物流信息
        let logistics_status = ''; // 物流状态
        let _address = '';         // 收货地址
        let logistics_company_name = ''; // 物流公司名称
        let logistics_no = ''; // 物流单号
        //在当前页面显示导航条加载动画
        wx.showNavigationBarLoading();
        //显示 loading 提示框。需主动调用 wx.hideLoading 才能关闭提示框
        if (this.data.isPullDown) {
            wx.showLoading({
                title: '刷新中...',
            })
        } else {
            wx.showLoading({
                title: '加载中...',
            })
        }
        logisticsModel.queryLogisticsInfo(params).then((res) => {
            //隐藏loading 提示框
            wx.hideLoading();
            //隐藏导航条加载动画
            wx.hideNavigationBarLoading();
            if (_this.data.isPullDown) {
                //停止下拉刷新
                wx.stopPullDownRefresh();
            }
            if(res.address_data){
                const province = res.address_data.logistics_province;
                const city = res.address_data.logistics_city;
                const area = res.address_data.logistics_area;
                const address = res.address_data.logistics_address;
                _address = '[收货地址] ' + province + city + area + ' ' + address;
            }
            if(res.logistics){
                logistics_company_name = res.logistics.logistics_company_name;
                logistics_no = res.logistics.logistics_no;
            }
            if (res.lists) {
                let new_arr = res.lists.reverse();
                logistics_status = new_arr[0].type;
                new_arr.forEach((ev, index) => {
                    const time = this.formatDate(ev.time);
                    const date = time.split(' ')[0];
                    const sj = time.split(' ')[1];
                    let params = {
                        content: ev.message,
                        timestamp: this.formatDate(ev.time),
                        currentDate: date,
                        currentTime: sj,
                        type: ev.type,
                        hasTel: false,
                        TelContArr: []
                    }
                    if(_this.mobilePhoneArray(ev.message).length >0){
                        let telContArr = _this.mobilePhoneArray(ev.message);
                        params['hasTel'] = true;
                        params['TelContArr'] = telContArr;
                    }
                    steps_list.push(params);
                })
            }
            _this.setData({
                stepsList: steps_list,
                courier_tel: courierTel,
                logistics_status: logistics_status,
                shipping_address: _address,
                logistics_company_name: logistics_company_name,
                logistics_no: logistics_no
            })
        })
        /*const _list = [
            //已发货
                {message: "包裹正在等待揽收", time: 1603264819, type: "已发货"},
                {message: "在分拨中心浙江义乌分拨中心进行称重扫描", time: 1599445186, type: "运输中"},
                {message: "在浙江义乌分拨中心进行装车 扫描，发往：浙江杭州分拨中心", time: 1599445186, type: "运输中"},
                {message: "在分拨中心浙江杭州分拨中心进行卸车扫描", time: 1599445186, type: "运输中"},
                {message: "从浙江杭州分拨中心发出，本次转运目的地：浙江杭州西湖区溪畔公司", time: 1599445186, type: "运输中"},
                {message: "在浙江杭州西湖去溪畔公司进行派件扫描；派送业务员：陈卫中   联系电话：17816197313", time: 1599445186, type: "派件中"}
            ];*/
    },

    formatDate(val) {
        if (val) {
            let dt;
            if (val.length > 10) {
                dt = new Date(Number(val));
            } else {
                dt = new Date(Number(val) * 1000);
            }
            let year = dt.getFullYear(); //年
            let month = dt.getMonth() + 1; //月
            let date = dt.getDate(); //日
            let hh = dt.getHours(); //时
            let mm = dt.getMinutes(); //分
            let ss = dt.getSeconds(); //秒
            month = month < 10 ? "0" + month : month;
            date = date < 10 ? "0" + date : date;
            hh = hh < 10 ? "0" + hh : hh;
            mm = mm < 10 ? "0" + mm : mm;
            ss = ss < 10 ? "0" + ss : ss;
            let new_time = ''
            new_time = month + "-" + date + ' ' + hh + ':' + mm;
            return new_time;
        }
    },

    /**
     * 联系快递员
     */
    callCourier(e) {
        wx.makePhoneCall({
            phoneNumber: e.currentTarget.dataset.phone
        });
    },

    /**
     * 匹配获取手机号或者座机号
     */
    mobilePhoneArray (strContent){
        if (strContent==='') {
            return
        }
        let mobileReg = /[1][3,4,5,7,6,8,9][0-9]{9}|\d{3,4}-\d{7,8}/g
        var telephoneReg
        let phoneList = strContent.match(mobileReg)
        let textList = strContent.split(/[1][3,4,5,7,6,8,9][0-9]{9}|\d{3,4}-\d{7,8}/), list = []
        console.log('phoneList', phoneList);
        console.log('textList', textList);
        if(phoneList){
            for (let i in textList) {
                if (textList[i] == '') {
                    i == 0 && list.push({ type: 'phone', val: phoneList[0] })
                } else {
                    list.push({ type: 'text', val: textList[i] })
                    list.push({ type: 'phone', val: phoneList[i] })
                }
            }
        }
        return list
    },
    // 复制
    handleCopy: function (e) {
        let content = this.data.logistics_no.toString()
        console.log('content', content)
        wx.setClipboardData({
            data: content,
            success(res) {
                // wx.showToast({
                //     title: '复制成功'
                // })
            },
        })
    },
})
