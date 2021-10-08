module.exports = {
  showLoading:function(){
    wx.showLoading({
      title: '加载中',
    })
    // let pages = getCurrentPages() || []
    // if(pages.length>0){
    //   let loading = pages[pages.length-1].selectComponent("#loading");
    //   if(loading){
    //     if(loading.data.show == false){
    //       loading.setData({
    //         show:true,
    //       });
    //     }
    //   }
    // }
  },
  hideLoading:function(){
    wx.hideLoading();
    // let pages = getCurrentPages() || []
    // if(pages.length>0){
    //   let loading = pages[pages.length-1].selectComponent("#loading");
    //   if(loading){
    //     if(loading.data.show){
    //       loading.setData({
    //         show:false,
    //       });
    //     }
    //   }
    // }
  }
}