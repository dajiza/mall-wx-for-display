/**
 * 根据命令行运行参数，修改/config.js 里面的项目配置信息，
 */
const fs = require('fs')
const path = require('path')
//源文件
const sourceFiles = {
    prefix: '/config/env/',
    dev: 'dev.json',
    prod: 'prod.json',
    inlet: 'inlet.json',
    mmj: 'mmj.json',

    cxbWxss: '/assets/theme/cxb.wxss',
    inletWxss: '/assets/theme/inlet.wxss',
    mmjWxss: '/assets/theme/mmj.wxss',

    //主包图片
    cxbImage: './主题图片/images-cxb',
    inletImage: './主题图片/images-inlet',
    mmjImage: './主题图片/images-mmj',

    // 分包图片
    cxbImagePackageMainSecondary: '/packageMainSecondary/主题图片/images-cxb',
    inletImagePackageMainSecondary: '/packageMainSecondary/主题图片/images-inlet',

    devAppid: 'xxx',
    prodAppid: 'xx',
    inletAppid: 'xxx',
    mmjAppid: 'xxx',
}
//目标文件
const targetFiles = [
    {
        prefix: '/config/',
        filename: 'config.js',
    },
]
const preText = 'module.exports = '
// 获取命令行参数
const cliArgs = process.argv.splice(2)
const env = cliArgs[0]
// 判断是否是 prod 环境
// const isProd = env.indexOf('prod') > -1 ? true : false
// 根据不同环境选择不同的源文件
// const sourceFile = isProd ? sourceFiles.prod : sourceFiles.dev
// 更改成两个以上配置
let sourceFile, sourceWxss, sourceImage, sourceAppid
if (env.indexOf('prod') > -1) {
    sourceFile = sourceFiles.prod
    sourceWxss = sourceFiles.cxbWxss
    sourceImage = sourceFiles.cxbImage
    sourceImagePackageMainSecondary = sourceFiles.cxbImagePackageMainSecondary
    sourceAppid = sourceFiles.prodAppid
} else if (env.indexOf('dev') > -1) {
    sourceFile = sourceFiles.dev
    sourceWxss = sourceFiles.cxbWxss
    sourceImage = sourceFiles.cxbImage
    sourceImagePackageMainSecondary = sourceFiles.cxbImagePackageMainSecondary
    sourceAppid = sourceFiles.devAppid
} else if (env.indexOf('inlet') > -1) {
    sourceFile = sourceFiles.inlet
    sourceWxss = sourceFiles.inletWxss
    sourceImage = sourceFiles.inletImage
    sourceImagePackageMainSecondary = sourceFiles.inletImagePackageMainSecondary
    sourceAppid = sourceFiles.inletAppid
} else if (env.indexOf('mmj') > -1) {
    sourceFile = sourceFiles.mmj
    sourceWxss = sourceFiles.mmjWxss
    sourceImage = sourceFiles.mmjImage
    sourceImagePackageMainSecondary = sourceFiles.cxbImagePackageMainSecondary
    sourceAppid = sourceFiles.mmjAppid
}
// 根据不同环境处理数据
fs.readFile(__dirname + sourceFiles.prefix + sourceFile, (err, data) => {
    if (err) {
        throw new Error(`Error occurs when reading file ${sourceFile}.nError detail: ${err}`)
        process.exit(1)
    }
    // 获取源文件中的内容
    const targetConfig = JSON.parse(data)
    // 将获取的内容写入到目标文件中
    targetFiles.forEach(function (item, index) {
        let result = null
        if (item.filename === 'config.js') {
            result = preText + JSON.stringify(targetConfig, null, 2)
        }
        console.log(result)
        // 写入文件(这里只做简单的强制替换整个文件的内容)
        fs.writeFile(__dirname + item.prefix + item.filename, result, 'utf8', (err) => {
            if (err) {
                throw new Error(`error occurs when reading file ${sourceFile}. Error detail: ${err}`)
                process.exit(1)
            }
        })
    })
})

// 生成master.wxss
let wxsspath = '/assets/theme/master.wxss'
fs.copyFileSync(__dirname + sourceWxss, __dirname + wxsspath)
console.log('master.wxss文件替换成功,替换为:', sourceWxss)
// 替换图片文件 主包
copyFolder(sourceImage, './assets/images')
// 分包
copyFolder(sourceImagePackageMainSecondary, './packageMainSecondary/static')
// 替换appid
var params = {
    appid: sourceAppid,
}
function changeJson(params) {
    fs.readFile('./project.config.json', function (err, data) {
        if (err) {
            console.error(err)
        }
        var person = data.toString()
        person = JSON.parse(person)
        for (var key in person) {
            for (var keySon in params) {
                if (keySon == key) {
                    person[key] = params[keySon]
                }
            }
        }
        var str = JSON.stringify(person)
        fs.writeFile('./project.config.json', str, function (err) {
            if (err) {
                console.error(err)
            }
            console.log('appid替换成功,替换为:', sourceAppid)
        })
    })
}
changeJson(params) //执行一下;

/**
 * @des 复制文件夹
 * @param { copiedPath: String } (被复制文件的地址，相对地址)
 * @param { resultPath: String } (放置复制文件的地址，相对地址)
 * @param { direct：Boolean } （是否需要处理地址）
 */
function copyFolder(copiedPath, resultPath, direct) {
    if (!direct) {
        copiedPath = path.join(__dirname, copiedPath)
        resultPath = path.join(__dirname, resultPath)
    }
    function createDir(dirPath) {
        fs.mkdirSync(dirPath)
    }
    if (fs.existsSync(copiedPath)) {
        if (!fs.existsSync(resultPath)) {
            createDir(resultPath)
        }
        /**
         * @des 方式一：利用子进程操作命令行方式
         */
        // child_process.spawn('cp', ['-r', copiedPath, resultPath])
        /**
         * @des 方式二：
         */
        const files = fs.readdirSync(copiedPath, { withFileTypes: true })
        for (let i = 0; i < files.length; i++) {
            const cf = files[i]
            const ccp = path.join(copiedPath, cf.name)
            const crp = path.join(resultPath, cf.name)
            if (cf.isFile()) {
                /**
                 * @des 创建文件,使用流的形式可以读写大文件
                 */
                const readStream = fs.createReadStream(ccp)
                const writeStream = fs.createWriteStream(crp)
                readStream.pipe(writeStream)
            } else {
                try {
                    /**
                     * @des 判断读(R_OK | W_OK)写权限
                     */
                    fs.accessSync(path.join(crp, '..'), fs.constants.W_OK)
                    copyFolder(ccp, crp, true)
                } catch (error) {
                    console.log('folder write error:', error)
                }
            }
        }
        console.log('图片替换成功,替换为:', copiedPath)
    } else {
        console.log('复制目标文件夹不存在: ', copiedPath)
    }
}
