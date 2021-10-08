const app = getApp()
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        popupShow: {
            type: Boolean,
            value: false,
            observer: function (show) {
                this.setData({
                    show: show
                },()=>{
                    if(show){
                        console.log('cateScrollLeft', this.data.cateScrollLeft)
                        this.setSelected()
                    }
                })
            },
        },

        goodsCate: {
            type: Object,
            observer: function (value) {
                const arr = Object.keys(value)
                if(arr.length > 0){
                    this.transformCategoryData(value)
                }

            }
        },

        fillterList:{
            type: Object,
            observer: function (value) {
                this.setData({
                    search_List: value.list || [],
                    attr_show_list: value.attr_list || [],
                    tag_show_list: value.tag_list || [],
                    call_back_type: Number(value.selectedType) || -1,
                    otherId: value.otherCateId || -1
                })
                // if(this.data.popupShow){
                //     this.setSelected()
                // }
                this.setSelected()
            }
        },
        currentAttr:{
            type: Array,
            observer: function (value) {
                this.setData({
                    current_attr: value || []
                })
            }
        },
        currentLabel:{
            type: Array,
            observer: function (value) {
                this.setData({
                    current_label: value || []
                })
            }
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        show: false,
        navHeight: Number(app.globalData.statusBarHeight) + 46 + 'px',

        is_other: false, // 是布还是其它
        search_List: [],

        attr_list: [], // 筛选 属性
        cloth_list: [], // 布料属性 列表
        other_list: [], // 其它商品属性 列表
        finished_cloth_list: [],  // 布组属性

        label_list: [],
        cloth_tag_list: [], // 布料标签
        other_tag_list: [], // 其它标签
        finished_tag_list: [], // 布组标签

        selectedType: -1,
        cateList:[],  // 布组/其它下的类别
        otherId: -1,
        call_back_type: -1,
        other_id: -1,
        other_name: '',
        attr_show_list: [],
        tag_show_list: [],
        current_attr: [],
        current_label: [],
        cateAllList:[], // 全部可用分类数据

        cateScrollLeft: '0px'
    },
    // 不用于数据绑定的全局数据
    tempData: {

    },

    /**
     * 组件的方法列表
     */
    methods: {
        back_sort(arr){
            arr.sort(function(a,b){
                return a.asc - b.asc
            })
        },
        /**
         * 组件的数据赋值
         */
        transformCategoryData(res) {
            // 属性 数据  clothObj:布料 otherObj:其它商品 finishedClothObj: 布组
            const clothObj = res.attr.cloth;
            const otherObj = res.attr.other;
            const finishedClothObj = res.attr.finished_cloth;
            let clothAttrData = []; // 布料属性
            let groupAttrData = []; // 布组属性
            let otherAttrData = []; // 其它属性
            for (let key in clothObj) {
                let _obj = {};
                _obj['list'] = clothObj[key];
                _obj['attr_key'] = key;
                _obj['showAll'] = false;
                if (_obj['list']) {
                    _obj['list'].forEach((ev) => {
                        ev['is_selected'] = false;
                    })
                }
                if (key === 'brand') {
                    _obj['attr_name'] = '品牌';
                } else if (key === 'material') {
                    _obj['attr_name'] = '材质';
                } else if (key === 'origin') {
                    _obj['attr_name'] = '产地';
                } else if (key === 'unit') {
                    _obj['attr_name'] = '单位';
                } else if (key === 'pattern') {
                    _obj['attr_name'] = '花纹';
                } else if (key === 'color') {
                    _obj['attr_name'] = '颜色';
                }
                if(_obj['attr_key'] == 'brand' || _obj['attr_key'] == 'material' || _obj['attr_key'] == 'pattern' ){
                    clothAttrData.push(_obj)
                }
            }
            clothAttrData.forEach((ev)=>{
                this.back_sort(ev.list)
            })
            groupAttrData.forEach((ev)=>{
                this.back_sort(ev.list)
            })
            otherAttrData.forEach((ev)=>{
                this.back_sort(ev.list)
            })
            for (let key in otherObj) {
                let _obj = {};
                _obj['list'] = otherObj[key];
                _obj['attr_key'] = key;
                _obj['showAll'] = false;
                if (_obj['list']) {
                    _obj['list'].forEach((ev) => {
                        ev['is_selected'] = false;
                    })
                }
                if (key === 'brand') {
                    _obj['attr_name'] = '品牌';
                    otherAttrData.push(_obj);
                }
            }
            for (let key in finishedClothObj) {
                let _obj = {};
                _obj['list'] = finishedClothObj[key];
                _obj['attr_key'] = key;
                _obj['showAll'] = false;
                if(_obj['list']){
                    _obj['list'].forEach((ev) => {
                        ev['is_selected'] = false;
                    })
                }
                if (key === 'brand') {
                    _obj['attr_name'] = '品牌';
                    groupAttrData.push(_obj);
                } else if (key === 'size') {
                    _obj['attr_name'] = '尺寸';
                    groupAttrData.push(_obj);
                }

            }

            // 分类 数据
            const categoryList = res.category;
            let groupCate = categoryList.filter(item =>{return item.type == 2 && item.sons && item.sons.length > 0})
            let OtherCate = categoryList.filter(item =>{return item.type == 1 && item.sons && item.sons.length > 0})
            groupCate.forEach((ev)=>{
                this.back_sort(ev.sons)
            })
            OtherCate.forEach((ev)=>{
                this.back_sort(ev.sons)
            })
            this.back_sort(groupCate)
            this.back_sort(OtherCate)
            const cateAll = groupCate.concat(OtherCate)

            // 标签
            const clothTagList = this.handlerData(res.tag.cloth_tag_info);
            const otherTagList = this.handlerData(res.tag.other_tag_info);
            const finishedClothTagList = this.handlerData(res.tag.finished_tag_info);

            this.setData({
                cateAllList: cateAll,
                cloth_list: clothAttrData,
                other_list: otherAttrData,
                finished_cloth_list: groupAttrData,
                cloth_tag_list: clothTagList,
                other_tag_list: otherTagList,
                finished_tag_list: finishedClothTagList,
                cateList: [],
                attr_list: clothAttrData,
                label_list: clothTagList
            })

            return
            this.setSelected();
        },

        // 格式化数据
        handlerData(arr) {
            let obj = {}, data;
            if (arr) {
                arr.forEach((item, index) => {
                    let { tag_category_id } = item;
                    if (!obj[tag_category_id]) {
                        obj[tag_category_id] = {
                            tag_category_id,
                            tag_category_name: item.tag_category_name,
                            list: []
                        }
                    }
                    obj[tag_category_id].list.push(item);
                });
                data = Object.values(obj);
            } else {
                data = [];
            }
            // 最终输出
            return data;
        },
        /**
         * 确认时获取选中的属性和标签组成的数组
         */
        getSelected() {
            let attr_arr = this.data.attr_list;
            let label_arr = this.data.label_list;
            let filter_arr = []; // 筛选被选中的属性和标签组成的数组
            let attr_list = [];
            let tag_list = [];
            let obj  = {};
            attr_arr.forEach((ev) => {
                ev.list.forEach((item) => {
                    if (item.is_selected) {
                        filter_arr.push(item.name);
                        attr_list.push(item.name);
                    }
                })
            })
            // 筛选被选中 de 标签组成的数组
            label_arr.forEach((ev) => {
                ev.list.forEach((item) => {
                    if (item.is_selected) {
                        filter_arr.push(item.tag_name);
                        tag_list.push(item);
                    }
                })
            })
            filter_arr = [...new Set(filter_arr)];
            obj['attr'] = attr_list;
            obj['tag'] = tag_list;
            return obj
        },
        /**
         * 打开筛选设置选中
         */
        setSelected() {
            const type = this.data.call_back_type;
            let attr_arr = [];
            let label_arr = [];
            let _type = -1;  // -1:布料 1:其它 2:布组
            this.data.cateAllList.forEach((ev)=>{
                if(ev.id === this.data.call_back_type){
                    _type = ev.type
                }
            })
            let cateSons = [] // 2级分类
            if (_type === 1) {
                attr_arr = this.data.other_list;
                label_arr = this.data.other_tag_list;
                cateSons = this.data.cateAllList.filter(item => { return item.id == type })[0].sons
            } else if(_type == 2) {
                attr_arr = this.data.finished_cloth_list;
                label_arr = this.data.finished_tag_list;
                cateSons = this.data.cateAllList.filter(item => { return item.id == type })[0].sons
            } else {
                attr_arr = this.data.cloth_list;
                label_arr = this.data.cloth_tag_list;
            }
            // 2级分类回显
            cateSons.forEach((ev)=>{
                ev.is_selected = false;
                if (ev.id === this.data.otherId) { ev.is_selected = true }
            })

            let searchArr = this.data.search_List;
            let searchAttrArr = this.data.attr_show_list;
            let searchTagArr = this.data.tag_show_list;

            attr_arr.forEach((attr_ev) => {
                this.data.current_attr.forEach((current_attr_ev)=>{
                    if(current_attr_ev.attr_key == attr_ev.attr_key){
                        attr_ev['showAll'] = current_attr_ev.showAll
                    }
                })
                attr_ev.list.forEach((attr_item) => {
                    attr_item.is_selected = false;
                    searchAttrArr.forEach((search_item) => {
                        if (attr_item.name === search_item) {
                            attr_item.is_selected = true;
                        }
                    })
                })
            })
            label_arr.forEach((label_ev) => {
                this.data.current_label.forEach((current_label_ev)=>{
                    if(current_label_ev.tag_category_id == label_ev.tag_category_id){
                        label_ev['showAll'] = current_label_ev.showAll
                    }
                })
                label_ev.list.forEach((label_item) => {
                    label_item.is_selected = false;
                    searchTagArr.forEach((search_item) => {
                        if (label_item.tag_id === search_item.tag_id) {
                            label_item.is_selected = true;
                        }
                    })
                })
            })
            this.setData({
                attr_list: attr_arr,
                label_list: label_arr,
                cateList: cateSons,
                selectedType: this.data.call_back_type
            })
            setTimeout(()=>{
                let _index = 0;
                // console.log('this.data.call_back_type', this.data.call_back_type )
                if (this.data.call_back_type > -1) {
                    this.data.cateAllList.forEach((ev,i)=>{
                        // console.log('ev', ev)
                        if(ev.id == this.data.call_back_type){
                            _index = i + 1
                        }
                    })
                }
                console.log('_index', _index)
                if(_index == 0){
                    this.setData({
                        cateScrollLeft: '0px'
                    });
                }
                const _this = this;
                const query = wx.createSelectorQuery().in(_this)
                query.selectAll('.cate-parent').fields({
                    size: true,
                }, function (res) {
                    // console.log(res)
                    const rem = wx.getSystemInfoSync().windowWidth / 750;
                    const listItemMarginRight = 20 * rem;
                    if(res && res.length > 0 && _this.data.call_back_type > -1){
                        let allWidth = 0;
                        // console.log('_index', _index)
                        if(_index > 0){
                            for(let i=0;i< _index - 1;i++){
                                // console.log('res[i].width', res[i].width)
                                allWidth = allWidth + res[i].width + listItemMarginRight
                            }
                        }
                        // console.log('allWidth', allWidth)
                        _this.setData({
                            cateScrollLeft: allWidth + 'px'
                        });
                    }
                }).exec()
            },200)
        },

        /**
         * 关闭筛选
         */
        onClosePopup() {
            this.triggerEvent("close");
            // 传递 当前分类下 属性和标签 展开情况
            let transfer_obj = {
                attr_list: this.data.attr_list,
                label_list: this.data.label_list
            };
            this.triggerEvent("transfer", transfer_obj);
        },
        /**
         * 切换 展开收起
         * type：attr 属性 type：label 标签
         * selectedType  -1 ：布料   >-1 : 布组+ 其它商品
         */
        onClickShowAll(res) {
            const _index = Number(res.currentTarget.dataset.index);
            let _arr = res.currentTarget.dataset.list;
            _arr[_index]['showAll'] = !_arr[_index]['showAll'];
            let _type = -1;  // -1:布料 1:其它 2:布组
            this.data.cateAllList.forEach((ev)=>{
                if(ev.id === this.data.selectedType){
                    _type = ev.type
                }
            })
            let cloth_list_clone = this.data.cloth_list;
            let other_list_clone = this.data.other_list;
            let finished_cloth_list_clone = this.data.finished_cloth_list;
            let cloth_tag_clone = this.data.cloth_tag_list;
            let other_tag_clone = this.data.other_tag_list;
            let finished_cloth_tag_clone = this.data.finished_tag_list;
            if (res.currentTarget.dataset.type === 'attr') {
                if(_type === -1){
                    cloth_list_clone[_index]['showAll'] = !cloth_list_clone[_index]['showAll']
                }else if(_type === 1){
                    other_list_clone[_index]['showAll'] = !other_list_clone[_index]['showAll']
                }else if(_type === 2){
                    finished_cloth_list_clone[_index]['showAll'] = !finished_cloth_list_clone[_index]['showAll']
                }
                this.setData({
                    cloth_list: cloth_list_clone,
                    other_list: other_list_clone,
                    finished_cloth_list: finished_cloth_list_clone,
                    attr_list: _arr
                })
            } else {
                if(_type === -1){
                    cloth_tag_clone[_index]['showAll'] = !cloth_tag_clone[_index]['showAll']
                }else if(_type === 1){
                    other_tag_clone[_index]['showAll'] = !other_tag_clone[_index]['showAll']
                }else if(_type === 2){
                    finished_cloth_tag_clone[_index]['showAll'] = !finished_cloth_tag_clone[_index]['showAll']
                }
                this.setData({
                    cloth_tag_list: cloth_tag_clone,
                    other_tag_list: other_tag_clone,
                    finished_tag_list: finished_cloth_tag_clone,
                    label_list: _arr
                })
            }
        },

        /**
         * 点击选择属性、标签
         */
        onclickAttr(res) {
            const item = res.currentTarget.dataset.item;
            const _index = Number(res.currentTarget.dataset.index);
            const child_index = Number(res.currentTarget.dataset.childindex);
            let _arr = res.currentTarget.dataset.list;
            let is_selected = !item.is_selected;
            _arr[_index].list[child_index]['is_selected'] = is_selected;
            if (res.currentTarget.dataset.type === 'attr') {
                this.setData({
                    attr_list: _arr
                })
            } else {
                this.setData({
                    label_list: _arr
                })
            }
        },

        /**
         * 重置
         * 恢复为布料 的属性和标签 （设为未选中）
         */
        handleOnReset() {
            let attr_arr = this.data.attr_list;
            let label_arr = this.data.label_list;
            attr_arr.forEach((ev) => {
                ev.list.forEach((item) => {
                    item.is_selected = false;
                })
            })
            label_arr.forEach((ev) => {
                ev.list.forEach((item) => {
                    item.is_selected = false;
                })
            })
            this.setData({
                attr_list: attr_arr,
                label_list: label_arr,
                cateList: [],
                search_List: [],
                other_id: -1,
                other_name: '',
                selectedType: -1,
                cateScrollLeft: '0px'
            });
            wx.nextTick(()=>{
                // 传递 当前分类下 属性和标签 展开情况
                let transfer_obj = {
                    attr_list: this.data.attr_list,
                    label_list: this.data.label_list
                };
                this.triggerEvent("transfer", transfer_obj);
                this.triggerEvent("reset", this.data.search_List);
            })
        },

        /**
         * 确定
         */
        handleOnSure() {
            let filter_arr = []; // 筛选被选中的属性和标签组成的数组
            let new_search = [];
            // filter_arr = this.getSelected();
            let _obj = this.getSelected();
            let new_attr = _obj['attr'] || []; // 筛选被选中的属性组成的数组
            let new_tag = _obj['tag'] || [];   // 筛选被选中的标签组成的数组
            let filter_obj = {};
            let params =  this.setParams();
            filter_obj['otherCateId'] = -1;
            filter_obj['selectedType'] = this.data.selectedType;
            if (this.data.selectedType > -1) {
                params['other_id'] = this.data.selectedType
                const _arr = this.data.cateAllList.filter(item=>{return item.id == this.data.selectedType})
                if(_arr.length>0){
                    params['other_name'] = _arr[0].name
                }

                let cateListData = this.data.cateList || [];
                cateListData.forEach((ev)=>{
                    if(ev.is_selected){
                        filter_obj['otherCateId'] = ev.id;
                        params['other_id'] = ev.id;
                        params['other_name'] = ev.name;
                    }
                })
            }
            filter_obj['list'] = new_search;
            filter_obj['attr_list'] = new_attr;
            filter_obj['tag_list'] = new_tag;
            params["new_search"] = filter_obj;
            // 传递 当前分类下 属性和标签 展开情况
            let transfer_obj = {
                attr_list: this.data.attr_list,
                label_list: this.data.label_list
            };
            this.triggerEvent("transfer", transfer_obj);
            this.triggerEvent("confirm", params);
        },

        preventTouchMove() {

        },

        /**
         * 设置请求参数
         */
        setParams() {
            let attr_obj = {};
            let paramsObj = {
                brand: '',
                material: '',
                origin: '',
                unit: '',
                pattern: '',
                color: '',
                tag_id: '',
                size:''
            };
            let tagIdsArr = [];
            const attr_arr = this.data.attr_list;
            const tag_arr = this.data.label_list;
            let tag_list = [];
            tag_arr.forEach((ev) => {
                ev.list.forEach((item) => {
                    if (item.is_selected) {
                        tagIdsArr.push(item.tag_id);
                        tag_list.push(item);
                    }
                })
            });
            paramsObj['tag_id'] = tagIdsArr.join('||');
            paramsObj['tag_list'] = tag_list;
            attr_arr.forEach((ev) => {
                attr_obj[ev.attr_key] = [];
                ev.list.forEach((item) => {
                    if (item.is_selected) {
                        attr_obj[ev.attr_key].push(item.name);
                    }
                })
            });
            for (let key in attr_obj) {
                let _val = attr_obj[key].join('||');
                if (key === 'brand') {
                    paramsObj['brand'] = _val;
                } else if (key === 'material') {
                    paramsObj['material'] = _val;
                } else if (key === 'origin') {
                    paramsObj['origin'] = _val;
                } else if (key === 'unit') {
                    paramsObj['unit'] = _val;
                } else if (key === 'pattern') {
                    paramsObj['pattern'] = _val;
                } else if (key === 'color') {
                    paramsObj['color'] = _val;
                } else if (key === 'size') {
                    paramsObj['size'] = _val;
                }
            }
            return paramsObj;
        },

        /**
         * 选择布料或者1级分类 （顶部类别切换）
         */
        chooseType(res) {
            const _type = Number(res.currentTarget.dataset.type); // 1 其它商品 2 布组
            const _id = Number(res.currentTarget.dataset.id);
            const _index = Number(res.currentTarget.dataset.index);
            // console.log('_index', _index)
            let attrData = [];
            let tagInfo = [];
            let cateSons = [];
            if(_id > 0){  // 布组和其它商品 1级分类
                cateSons = this.data.cateAllList.filter(item => { return item.id == _id })[0].sons
                cateSons.forEach((ev)=>{
                    ev['is_selected'] = false
                })
                attrData =  _type > 1 ? this.data.finished_cloth_list : this.data.other_list;
                tagInfo = _type > 1 ? this.data.finished_tag_list : this.data.other_tag_list;
            } else { // 布料
                attrData =  this.data.cloth_list;
                tagInfo = this.data.cloth_tag_list;
            }
            attrData.forEach((ev) => {
                ev.list.forEach((item) => {
                    item.is_selected = false;
                })
            })
            tagInfo.forEach((ev) => {
                ev.list.forEach((item) => {
                    item.is_selected = false;
                })
            })

            this.setData({
                selectedType: _id,
                cateList: cateSons,
                attr_list: attrData,
                label_list: tagInfo
            });
            const _this = this;
            const query = wx.createSelectorQuery().in(_this)
            query.selectAll('.cate-parent').fields({
                size: true,
            }, function (res) {
                // console.log(res)
                const rem = wx.getSystemInfoSync().windowWidth / 750;
                const listItemMarginRight = 20 * rem;
                if(res && res.length > 0){
                    let allWidth = 0;
                    if(_index > 0){
                        for(let i=0;i < _index -1 ;i++){
                            allWidth = allWidth + res[i].width + listItemMarginRight
                        }
                    }

                    // console.log('allWidth', allWidth)
                    _this.setData({
                        cateScrollLeft: allWidth + 'px'
                    });
                }
            }).exec()
        },

        /*选择2级分类*/
        onChooseOtherCate(res) {
            const item = res.currentTarget.dataset.item;
            const _index = Number(res.currentTarget.dataset.index);
            let _arr = this.data.cateList;

            if(item['is_selected']){
                _arr[_index]['is_selected'] = false;
            }else {
                _arr.forEach((ev)=>{
                    ev['is_selected'] = false;
                });
                _arr[_index]['is_selected'] = true;
            }
            this.setData({
                cateList: _arr
            })

        },
        cateScroll(event){
            // console.log('event.detail ', event.detail );
        }
    }
})
