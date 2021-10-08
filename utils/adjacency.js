// 邻接矩阵类

class Adjoin {
    constructor(vertex) {
        this.vertex = vertex;
        this.quantity = vertex.length;
        this.init();
    }

    // 初始化一个n*n的矩阵，n为顶点数
    init() {
        this.adjoinArray = Array.from({
            length: this.quantity * this.quantity,
        });
    }

    // 获取某个顶点所在列
    getVertexRow(id) {
        const index = this.vertex.indexOf(id);
        const col = [];
        this.vertex.forEach((item, pIndex) => {
            col.push(this.adjoinArray[index + this.quantity * pIndex]);
        });
        return col;
    }

    // 获取某个顶点的邻接点
    getAdjoinVertexs(id) {
        return this.getVertexRow(id)
            .map((item, index) => (item ? this.vertex[index] : ""))
            .filter(Boolean);
    }

    // 设置某个顶点的邻接点
    setAdjoinVertexs(id, sides) {
        const index = this.vertex.indexOf(id);
        sides.forEach((item) => {
            const pIndex = this.vertex.indexOf(item);
            this.adjoinArray[index + this.quantity * pIndex] = 1;
        });
    }

    // 获取多个顶点所在列的合并数组
    getRowTotal(params) {
        params = params.map((id) => this.getVertexRow(id));
        const adjoinNames = [];
        this.vertex.forEach((item, index) => {
            const rowTotal = params
                .map((value) => value[index])
                .reduce((total, current) => {
                    total += current || 0;
                    return total;
                }, 0);

            adjoinNames.push(rowTotal);
        });

        return adjoinNames;
    }

    // 求多列邻接点的交集
    getUnions(params) {
        return this.getRowTotal(params)
            .map((item, index) => item >= params.length && this.vertex[index])
            .filter(Boolean);
    }

    // 求多列邻接点的并集
    getCollection(params) {
        return this.getRowTotal(params)
            .map((item, index) => item && this.vertex[index])
            .filter(Boolean);
    }
}

// 进一步具体化的sku选择类
class ShopAdjoin extends Adjoin {
    constructor(commoditySpecs, data) {
        super(
            commoditySpecs.reduce(
                (total, current) => [...total, ...current.list],
                []
            )
        );
        this.commoditySpecs = commoditySpecs;
        this.data = data.filter((item) => item.stock > 0);

        // 初始化各个产品之间邻接关系
        this.initCommodity();

        // 初始化同类顶点之间邻接关系
        this.initSimilar();
    }

    initCommodity() {
        this.data.forEach((item) => {
            this.applyCommodity(item.specs);
        });
    }

    initSimilar() {
        // 获取所有可选项
        const specsOption = this.getCollection(this.vertex);
        this.commoditySpecs.forEach((item) => {
            const params = [];
            specsOption.forEach((value) => {
                if (item.list.indexOf(value) > -1) {
                    params.push(value);
                }
            });
            this.applyCommodity(params);
        });
    }

    // 购物类注册邻接点，这里把自己也算进去，即自己的邻接点包含自己，符合商品sku选择实际情况
    applyCommodity(params) {
        params.forEach((param) => {
            this.setAdjoinVertexs(param, params);
        });
    }

    // 根据传入的选项筛出可选项
    querySpecsOption(params) {
        let res = [];
        // 判断一下有无传入参数
        if (params.some(Boolean)) {
            res = this.getUnions(params.filter(Boolean));
        } else {
            res = this.getCollection(this.vertex);
        }

        return res;
    }
}

// // 产品信息
// const data = [
//     { id: "1", specs: ["紫色", "套餐一", "64G"] },
//     { id: "2", specs: ["紫色", "套餐一", "128G"] },
//     { id: "3", specs: ["紫色", "套餐二", "128G"] },
//     { id: "4", specs: ["黑色", "套餐三", "256G"] },
// ];
// // 规格信息
// const commoditySpecs = [
//     { title: "颜色", list: ["红色", "紫色", "白色", "黑色"] },
//     { title: "套餐", list: ["套餐一", "套餐二", "套餐三", "套餐四"] },
//     { title: "内存", list: ["64G", "128G", "256G"] },
// ];

module.exports = {
    ShopAdjoin,
};
