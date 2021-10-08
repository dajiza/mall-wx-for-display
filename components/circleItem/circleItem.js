const circleModel = require("../../models/circle");
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        content: {
            type: Object,
            observer: function (value) {
                if(value.comment_id){
                    // console.log('value===10', value)
                    this.transformData(value)
                    this.setData({
                        detailInfo: value,
                    },()=>{
                        this.isShowOpen()
                    })
                }
            }
        },
        navTitle:{
            type: String,
            observer: function (value) {
                // console.log('value', value)
                this.setData({
                    sourceType: value == '作业墙' ? 2:1
                })
            }
        },
        isTeacher:{
            type: Boolean,
            observer: function (value) {
                // console.log('value', value)
                this.setData({
                    isTeacher: value
                })
            }
        },
        userId:{
            type: Number,
            observer: function (value) {
                // console.log('value', value)
                this.setData({
                    userId: value
                })
            }
        },
        shopId:{
            type: Number,
            observer: function (value) {
                // console.log('value', value)
                this.setData({
                    shopId: value
                })
            }
        },
        activeIndex:{
            type: Number,
            observer: function (value) {
                // console.log('value', value)
                this.setData({
                    activeIndex: value
                })
            }
        },
    },
    options: {
        multipleSlots: true,
    },

    /**
     * 组件的初始数据
     */
    data: {
        attribute: [],
        detailInfo: {},
        sourceType: 1, // 1 圈子 2 作业墙
        commentList:[],
        isTeacher: false,
        quest_loading: false,
        userId: 0,
        shopId: 0,
        activeIndex: 0
    },
    ready: function () {},
    /**
     * 组件的方法列表
     */
    methods: {
        formatAttr() {
            let goods = this.data.goods
            let attribute = []
            if (goods.attr) {
                attribute = goods.attr.map((item) => item.value)
            } else if (goods.attrRefund) {
                attribute = JSON.parse(goods.attrRefund).map((item) => item.Value)
            } else {
                attribute = goods.attrValue
            }

            this.setData({
                attribute,
            })
        },
        transformData(res){
            // console.log('res', res);
        },
        // 预览图片
        previewImage: function (e) {
            // 获取data-src
            let src = e.currentTarget.dataset.src + '!upyun520/fw/3000'
            // 获取data-list
            let imgList = this.data.detailInfo.medias.map((item) => item.media_url + '!upyun520/fw/3000')
            wx.previewImage({
                current: src, // 当前显示图片的http链接
                urls: imgList, // 需要预览的图片http链接列表
                success: function (res) {
                    console.log('success')
                },
                fail: function (res) {
                    console.log('fail')
                },
            })
        },
        /**
         * 视频错误回调
         */
        videoErrorCallback(){
            console.log('err')
        },

        isShowOpen(){
            let detail_info = this.data.detailInfo
            // detail_info['openBtnShow'] = false
            if(detail_info['openBtnShow']){
                return
            }
            const _this = this
            const rem = wx.getSystemInfoSync().windowWidth / 750;
            const _height = 40 * 4 * rem // 4行文字高度  行高 40rpx
            var query = wx.createSelectorQuery().in(_this)
            setTimeout(()=>{
                const dom = '#text-box-copy-' + detail_info.comment_id
                query
                    .select(dom)
                    .boundingClientRect((rect) => {
                        // console.log('rect', rect)
                        if (rect != null) {
                            const height = rect.height
                            // console.log('height', height)
                            if (height > _height) { //Line-height 22 * 6 行
                                detail_info['openBtnShow'] = true
                                _this.setData({
                                    detailInfo: detail_info
                                })
                                const params = {
                                    id:detail_info.comment_id
                                }
                                _this.triggerEvent("showAllText", params);
                            }
                        }
                    })
                    .exec()
            },10)
        },

        /**
         * 展开操作
         */
        openOperating(e){
            // console.log('showMore', this.data.detailInfo.showMore)
            const _id = Number(e.currentTarget.dataset.id)
            const params = {
                id: _id,
            }
            this.triggerEvent("onMore", params);
        },

        /**
         * 点赞
         */
        handleOnLike(e){
            const _grade = Number(e.currentTarget.dataset.grade)
            const _id = Number(e.currentTarget.dataset.id)

            const params = {
                id: _id,
                grade: _grade
            }
            this.triggerEvent("onLike", params);
        },

        /**
         * 评论
         */
        onClickComment(e) {
            const user_id = Number(e.currentTarget.dataset.user)
            const _type = Number(e.currentTarget.dataset.type)
            const comment_id = Number(e.currentTarget.dataset.commentId) // comment_id
            const reply_comment_id = Number(e.currentTarget.dataset.replyCommentId) // reply_comment_id
            const _grade = Number(e.currentTarget.dataset.grade)
            const user_name = e.currentTarget.dataset.name
            const is_mute = e.currentTarget.dataset.mute
            const params = {
                type: _type, // 1 评论圈子 2 回复他人
                comment_id: comment_id,
                reply_comment_id: reply_comment_id,
                grade: _grade,
                at_user_id: user_id,
                at_user_name: user_name,
                is_mute: is_mute
            }
            console.log('params', params);

            this.triggerEvent("onComment", params);
        },

        /**
         * 删除圈子
         */
        onDel(e){
            const _id = Number(e.currentTarget.dataset.id)
            const params = {
                id: _id
            }
            this.triggerEvent("onDelete", params);
        },

        /**
         * 禁言
         */
        onMute(e) {
            const _id = Number(e.currentTarget.dataset.id)
            const user_id = Number(e.currentTarget.dataset.user)
            const params = {
                id: _id,
                userId: user_id
            }
            this.triggerEvent("onMute", params);
        },

        /**
         * 展开收起全文
         */
        openOrClose(e){
            const _id = Number(e.currentTarget.dataset.id)
            const _obj = this.data.detailInfo
            const _bol = !_obj['isShowAll']
            const params = {
                id: _id,
                bol: _bol
            }
            this.triggerEvent("openAllText", params);
        },
        /**
         * 展开更多操作
         */
        showMore(e){
            const _id = Number(e.currentTarget.dataset.id)
            const _obj = this.data.detailInfo
            const _bol = !_obj['showMore']
            const params = {
                id: _id,
                bol: _bol
            }
            this.triggerEvent("showMoreOperation", params);
        },

        clickOperation(){

        }

    },
})
