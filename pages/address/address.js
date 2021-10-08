//Page Object
import loading from '../../utils/loading_util';
import screenConfig from '../../utils/screen_util';

const addressModel = require("../../models/address");

const safeAreaInsetBottom = screenConfig.getSafeAreaBottomPadding(screenConfig.TYPE_RPX);

App.Page({
    data: {
        addressList: [],
        isFirstLoad: true,
        isSelectModel: false,
        safeAreaInsetBottom: safeAreaInsetBottom,
    },
    events: {
        updateAddress: function (addressLists) {
            this.setData({
                addressList: addressLists,
            });
        }
    },
    //options(Object)
    onLoad: function (options) {
        let isSelectModel = options.select || false;
        loading.showLoading();
        addressModel.getAddressList()
            .then((addresses) => {
                loading.hideLoading();
                this.setData({
                    isSelectModel: isSelectModel,
                    isFirstLoad: false,
                    addressList: addresses
                })
            }).catch((err) => {
                console.log(err)
                loading.hideLoading();
                this.setData({
                    isSelectModel: isSelectModel,
                })
            });
    },
    onReady: function () { },
    onShow: function () { },
    onHide: function () { },
    onUnload: function () { },
    onPop: function (e) {
        wx.navigateBack({
            delta: 1
        });
    },
    addressChoose: function (e) {
        let addressList = this.data.addressList
        if (this.data.isSelectModel) {
            let itemIndex = e.currentTarget.dataset.itemIndex;
            this.post({
                eventName: "getSelectedAddress",
                eventParams: addressList[itemIndex],
            });
            this.onPop();
        } else {
            this.addressEdit(e);
        }
    },
    addressEdit: function (e) {
        let itemIndex = e.currentTarget.dataset.itemIndex
        let params = ""
        if (itemIndex >= 0) {
            //编辑地址
            params = "?item_index=" + itemIndex
            console.log("addressEdit params:" + params)
            //示范eventBus粘性事件
            if (addressModel.cacheAddressList.length > itemIndex) {
                this.post({
                    eventName: "initEditAddress",
                    eventParams: {
                        address: addressModel.cacheAddressList[itemIndex],
                        index: itemIndex,
                    },
                    isSticky: true,
                })
            }
        }
        wx.navigateTo({
            url: '/pages/address/address-edit/address-edit' + params
        })
    },
});
