/**
 * 邀请模块逻辑类
 */

const http = require('../utils/util')
const config = require('../config/config')

module.exports = {
    // 邀请海报
    // pages/inviteReceive/inviteReceive
    queryPoster: function (scene, avatar_img, page = 'pages/inviteReceive/inviteReceive') {
        return new Promise((resolve, reject) => {
            http.request('poster-invite', {
                scene,
                avatar_img,
                page, //例如 pages/index/index, 根路径前不要填加 /,不能携带参数（参数请放在scene字段里），如果不填写这个字段，默认跳主页面
            })
                .then((res) => {
                    resolve(res)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
