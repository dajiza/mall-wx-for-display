const util = require('../utils/util')

module.exports = {
    introduction: '', //团作介绍详情
    recGoods: [], //团作推荐列表
    // 团作列表-老师 全部
    queryCourseList: function (is_draft, page, limit = 10) {
        return new Promise((resolve, reject) => {
            util.request('course-list', {
                is_draft,
                page,
                limit,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 团作列表-学生 我的
    queryCourseListMy: function (page, limit = 10) {
        return new Promise((resolve, reject) => {
            util.request('course-list-user', {
                page,
                limit,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 团作列表-学生 全部
    queryCourseListStudent: function (page, limit = 10) {
        return new Promise((resolve, reject) => {
            util.request('course-list-student', {
                page,
                limit,
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    /**
     *  团作新增
     *  `title` varchar(20) NOT NULL DEFAULT '' COMMENT '团作名称',
     *  `start_time` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '课程开始时间',
     *  `end_time` timestamp NULL DEFAULT NULL COMMENT '课程结束时间',
     *  `limit_num` int(11) NOT NULL COMMENT '报名限额',
     *  `type` int(11) NOT NULL DEFAULT '1' COMMENT '团作模式：1免费 2付费 3押金',
     *  `course_price` int(11) NOT NULL DEFAULT '0' COMMENT '团作模式价格',
     *  `poster_link` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '海报地址',
     *  `introduction` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '团作介绍',
     *  `is_draft` int(11) NOT NULL DEFAULT '1' COMMENT '是否草稿：\n1 是\n2 不是',
     */
    creatCourse: function (params) {
        return new Promise((resolve, reject) => {
            util.request('course-create', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 团作详情-老师
    queryCourseDetail: function (id) {
        return new Promise((resolve, reject) => {
            util.request('course-data', { id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 团作详情-学生
    queryCourseDetailStudent: function (id) {
        return new Promise((resolve, reject) => {
            util.request('course-data-student', { id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 团作删除
    deleteCourse: function (id) {
        return new Promise((resolve, reject) => {
            util.request('course-delete', { id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    /**
     * 团作修改
     *	`id` int(11) NOT NULL AUTO_INCREMENT,
     *  `title` varchar(20) NOT NULL DEFAULT '' COMMENT '团作名称',
     *  `start_time` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '课程开始时间',
     *  `end_time` timestamp NULL DEFAULT NULL COMMENT '课程结束时间',
     *  `limit_num` int(11) NOT NULL COMMENT '报名限额',
     *  `join_num` int(11) NOT NULL DEFAULT '0' COMMENT '报名人数',
     *  `type` int(11) NOT NULL DEFAULT '1' COMMENT '团作模式：1免费 2付费 3押金',
     *  `course_price` int(11) NOT NULL DEFAULT '0' COMMENT '团作模式价格',
     *  `poster_link` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '海报地址',
     *  `introduction` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '团作介绍',
     *  `is_draft` int(11) NOT NULL DEFAULT '1' COMMENT '是否草稿：\n1 是\n2 不是',
     *
     *  以下为草稿时允许修改
     *  type` int(11) NOT NULL DEFAULT '1' COMMENT '团作模式：1免费 2付费 3押金',
     *  `course_price` int(11) NOT NULL DEFAULT '0' COMMENT '团作模式价格',
     */
    updateCourseDetail: function (params) {
        return new Promise((resolve, reject) => {
            util.request('course-update', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 课件列表
    courseMediaList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('course-media-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 添加课件
    courseMediaAdd: function (params) {
        return new Promise((resolve, reject) => {
            util.request('course-media-add', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 修改课件
    courseMediaUpdate: function (params) {
        return new Promise((resolve, reject) => {
            util.request('course-media-update', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 订阅团作
    updateCourseSub: function (if_sub) {
        return new Promise((resolve, reject) => {
            util.request('course-sub', { if_sub })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //名片信息
    userCardInfo: function (params) {
        let that = this
        return new Promise((resolve, reject) => {
            util.request('user-card-info', params)
                .then((res) => {
                    that._cacheUserCardInfo = { ...res }
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //编辑名片
    userCardEdit: function (params) {
        return new Promise((resolve, reject) => {
            util.request('user-card-edit', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //名片信息缓存
    _cacheUserCardInfo: null,
    cacheUserCardInfo: function () {
        return this._cacheUserCardInfo
    },
    ///名片二维码上传
    wxQRUpload: function (filePath, avatarImgUrl) {
        return new Promise((resolve, reject) => {
            util.uploadFile(filePath, 'wx-qr-upload', { avatar_img_url: avatarImgUrl })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    //学生列表
    studentList: function (params) {
        return new Promise((resolve, reject) => {
            util.request('student-list', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //禁言
    studentBannedTalk: function (params) {
        return new Promise((resolve, reject) => {
            util.request('student-banned-talk', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 团作报名
    updateCourseApply: function (params) {
        return new Promise((resolve, reject) => {
            util.request('course-apply', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    //团作海报
    posterCourse: function (params) {
        return new Promise((resolve, reject) => {
            util.request('poster-course', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    getVideoPic: function (url) {
        return new Promise((resolve, reject) => {
            util.request('get-video-pic', { url })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    /**
     * 团作挑选商品列表
     * 参数较多看文档
     * http://confluence.chuanshui.cn/pages/viewpage.action?pageId=7012437
     */
    queryGoodsListCourse: function (params) {
        return new Promise((resolve, reject) => {
            util.request('shop-goods-list-course', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 商品推荐-删除
    deleteCourseGoods: function (course_id, shop_goods_ids) {
        return new Promise((resolve, reject) => {
            util.request('course-goods-delete', { course_id, shop_goods_ids })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 商品推荐-新增
    addCourseGoods: function (course_id, shop_goods_ids) {
        return new Promise((resolve, reject) => {
            util.request('course-goods-add', { course_id, shop_goods_ids })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    //待审核列表
    courseApplyAttachmentList: function () {
        return new Promise((resolve, reject) => {
            util.request('course-apply-attachment-list', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    // 用户邀请码查询
    checkInviteCode: function (invite_code, course_id) {
        return new Promise((resolve, reject) => {
            util.request('course-invite-code-check', { invite_code, course_id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    //团作报名详情（凭证详情）
    courseApplyData: function (course_apply_id) {
        return new Promise((resolve, reject) => {
            util.request('course-apply-data', { course_apply_id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    //凭证审核操作
    courseApplyAttachmentApprove: function (params) {
        return new Promise((resolve, reject) => {
            util.request('course-apply-attachment-approve', params)
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 提醒已读
    updateNoticRead: function (course_apply_id) {
        return new Promise((resolve, reject) => {
            util.request('course-notic-read', { course_apply_id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    //我的邀请列表
    courseInviteList: function (course_id) {
        return new Promise((resolve, reject) => {
            util.request('course-invite-list', { course_id })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    //团作上次报名信息 用户报名时自动填充
    queryCourseLastInfo: function () {
        return new Promise((resolve, reject) => {
            util.request('course-last-info', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    // 删除新团作通知  course-delete-notice
    deleteTeamWorkNotice: function () {
        return new Promise((resolve, reject) => {
            util.request('course-delete-notice', {})
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
