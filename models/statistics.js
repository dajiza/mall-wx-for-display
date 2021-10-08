const http = require("../utils/util");

module.exports = {
  // 获取购物车列表
  agenOrderReport: function (request = {}) {
    let currentDate = new Date()
    let defaultStartDate = currentDate.format("yyyy-MM-dd") + " 00:00:00"
    let defaultEndDate = currentDate.format("yyyy-MM-dd hh:mm:ss")
    let {
      limit = 10,
      page = 1,
      startDate = defaultStartDate,
      endDate = defaultEndDate
    } = request
    return http.request("agent-order-report-goods", {
      limit: limit,
      page: page,
      created_time_le: endDate,
      created_time_ge: startDate
    });
  },
}