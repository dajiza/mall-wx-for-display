//Page Object
import areaList from './area'
import loading from '../../../utils/loading_util'
import screenConfig from '../../../utils/screen_util'
import util from '../../../utils/util'

const addressModel = require('../../../models/address')

const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX)
const isDefaultAddressKey = 'address.is_default'
const fullAreaKey = 'address.full_area'

App.Page({
    data: {
        isDefaultAddress: false,
        itemIndex: -1,
        isEdit: false,
        address: {
            id: 0,
            name: '',
            phone: '',
            province: '',
            city: '',
            area: '',
            address: '',
            area_code: '',
            area_code_van: '',
            is_default: 1,
        },
        saveDisabled: true,
        showAreaPicker: false,
        showDeleteConfirmDialog: false,
        safeAreaInsetBottom: safeAreaInsetBottom,
        defaultText: '',
    },
    events: {
        initEditAddress: function (editAddress) {
            console.log('initEditAddress')
            this.data.itemIndex = editAddress.index
            //深拷贝，避免编辑后不保存却依然会影响到原始数据的bug
            var _obj = JSON.stringify(editAddress.address)
            this.data.address = JSON.parse(_obj)
            console.log(this.data)
        },
    },
    //options(Object)
    onLoad: function (options) {
        console.log(options)
        console.log(this.data)
        // this.data.itemIndex = options.item_index;
        let itemIndex = this.data.itemIndex
        console.log(itemIndex)
        if (itemIndex >= 0) {
            //编辑模式
            //从缓存中取出地址列表信息
            console.log(itemIndex)
            let address = this.data.address
            //校验地址是否正确
            let vaildAddress = this.checkAddress(address)
            if (vaildAddress) {
                address.full_area = address.province + '-' + address.city + '-' + address.area
            }
            //转换area_code
            address.area_code_van = address.area_code.substring(0, 6)
            //更新UI
            this.setData({
                address: address,
                isEdit: true,
                saveDisabled: !vaildAddress,
                isDefaultAddress: address.is_default == 2,
            })
            console.log(this.data)
        } else {
            this.setData({
                isDefaultAddress: addressModel.cacheAddressList.length == 0,
            })
        }
    },
    onReady: function () {},
    onShow: function () {},
    onHide: function () {},
    onUnload: function () {},
    onPop: function (e) {
        wx.navigateBack({
            delta: 1,
        })
    },
    setDefaultAddress: function ({ detail }) {
        this.setData({
            [isDefaultAddressKey]: detail ? 2 : 1,
        })
    },
    nameValueChange: function ({ detail }) {
        this.data.address.name = detail
        let vaildAddress = this.checkAddress(this.data.address)
        this.setData({
            saveDisabled: !vaildAddress,
        })
        console.log(this.data.address)
    },
    phoneValueChange: function ({ detail }) {
        this.data.address.phone = detail
        let vaildAddress = this.checkAddress(this.data.address)
        this.setData({
            saveDisabled: !vaildAddress,
        })
        console.log(this.data.address)
    },
    addressValueChange: function ({ detail }) {
        console.log('输出 ~ detail', detail)
        let area = this.data.address.province + this.data.address.city + this.data.address.area
        ''.replace()
        let addressDetail = detail.replace(area, '')
        let vaildAddress = this.checkAddress(this.data.address)
        this.setData({
            saveDisabled: !vaildAddress,
            'address.address': addressDetail,
        })
        console.log(this.data.address)
    },
    areaPick: function () {
        if (this.data.areaList) {
            this.setData({
                showAreaPicker: true,
            })
        } else {
            this.setData({
                showAreaPicker: true,
                areaList: areaList,
            })
        }
        console.log(this.data)
    },
    onAreaPickerClose: function () {
        this.setData({
            showAreaPicker: false,
        })
    },
    // 省市区选择
    onAreaPickerConfirm: function ({ detail }) {
        let areaCode = detail.values[2].code
        let address = this.data.address
        address.province = detail.values[0].name
        address.city = detail.values[1].name
        address.area = detail.values[2].name
        address.full_area = address.province + '-' + address.city + '-' + address.area
        address.area_code_van = areaCode
        let vaildAddress = this.checkAddress(address)
        this.setData({
            address: address,
            [fullAreaKey]: address.full_area,
            showAreaPicker: false,
            saveDisabled: !vaildAddress,
        })
        console.log(this.data.address)
    },
    onAreaPickerCancel: function () {
        console.log('onAreaPickerCancel')
        this.setData({
            showAreaPicker: false,
        })
    },
    //删除选中列表 begin
    deleteConfirm: function (event) {
        let showDeleteConfirmDialog = this.data.showDeleteConfirmDialog
        this.setData({
            showDeleteConfirmDialog: !showDeleteConfirmDialog,
        })
    },
    onDeleteConfirmDialogClose: function (event) {
        this.setData({
            showDeleteConfirmDialog: false,
        })
    },
    onDeleteConfirm: function (event) {
        this.delete()
    },
    //保存
    save: function () {
        if (this.data.address.phone.length < 11) {
            wx.showToast({
                title: '手机号长度不足11位',
                icon: 'none',
                duration: 2000,
            })
            return
        }
        let is_default = this.data.address.is_default
        if (this.data.isDefaultAddress) {
            //默认地址的形式进入页面，会隐藏是否设置默认的选项，非默认地址的形式进入，才可以重新设置
            //默认地址强制设置默认
            //设计意图为添加的第一个地址强制设置为默认地址
            is_default = 2
        }
        let area_code_van = this.data.address.area_code_van
        let request = {
            name: this.data.address.name,
            phone: this.data.address.phone,
            province_code: area_code_van.substring(0, 2),
            city_code: area_code_van.substring(0, 4) + '00000000',
            area_code: area_code_van + '000000',
            address: this.data.address.address,
            is_default: is_default,
        }
        let promise
        if (this.data.isEdit) {
            //编辑
            request.id = this.data.address.id
            promise = addressModel.editAddress(request)
        } else {
            //新建
            promise = addressModel.addAddress(request)
        }
        loading.showLoading()
        promise
            .then((res) => {
                loading.hideLoading()
                this.notifyAddressListPage()
            })
            .catch((err) => {
                loading.hideLoading()
                console.log(err)
            })
    },
    delete: function () {
        loading.showLoading()
        addressModel
            .deleteAddress(this.data.address.id)
            .then((res) => {
                loading.hideLoading()
                this.notifyAddressListPage()
            })
            .catch((err) => {
                loading.hideLoading()
                console.log(err)
            })
    },
    notifyAddressListPage: function () {
        // let pages = getCurrentPages();
        // if (pages.length > 1) {
        //     let addressListPage = pages[pages.length - 2];
        //     addressListPage.setData({
        //         addressList: addressModel.cacheAddressList,
        //     });
        //     wx.navigateBack({
        //         delta: 1,
        //     });
        // }
        this.post({
            eventName: 'updateAddress',
            eventParams: addressModel.cacheAddressList,
        })
        let is_default = this.data.address.is_default
        if (is_default) {
            this.post({
                eventName: 'updateDefaultAddress',
                eventParams: addressModel.cacheAddressList[0],
            })
        }
        wx.navigateBack({
            delta: 1,
        })
    },
    checkAddress: function (address) {
        if (address) {
            if (this.isEmpty(address.name)) return false
            // if (util.hasEmoji(address.name)) {
            //     wx.showToast({
            //         title: "姓名不能包含特殊字符或者表情符号",
            //         icon: "none",
            //         duration: 2000,
            //     });
            //     return false;
            // }
            if (this.isEmpty(address.phone)) return false
            // if (address.phone.length < 11) return false
            if (this.isEmpty(address.province)) return false
            if (this.isEmpty(address.city)) return false
            if (this.isEmpty(address.area)) return false
            if (this.isEmpty(address.address)) return false
            // if (util.hasEmoji(address.address)) {
            //     wx.showToast({
            //         title: "地址不能包含特殊字符或者表情符号",
            //         icon: "none",
            //         duration: 2000,
            //     });
            //     return false;
            // }
            return true
        }
        return false
    },
    isEmpty: function (str) {
        if (typeof str == null || str == '' || str == 'undefined') {
            return true
        } else {
            return false
        }
    },
    closeTextarea(event) {
        this.selectComponent('#textarea').close()
    },
    openTextarea(event) {
        this.setData({
            defaultText: this.data.address.province + this.data.address.city + this.data.address.area + this.data.address.address,
        })
        console.log('输出 ~ defaultText', this.data.defaultText)
        this.selectComponent('#textarea').show()
    },
    getTetx(e) {
        console.log('输出 ~ getTetx', e)
        this.addressValueChange(e)
    },
})
