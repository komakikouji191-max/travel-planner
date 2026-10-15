Page({
  data: {
    current: 0,
    titles: ['足迹地图', '城市胶卷', '日出与日落', '纪念品收藏柜'],
    images: ['/assets/design-1.jpg', '/assets/design-2.jpg', '/assets/design-3.jpg', '/assets/design-4.jpg'],
  },
  change(e) { this.setData({ current: e.detail.current }); },
  preview(e) { wx.previewImage({ current: e.currentTarget.dataset.url, urls: this.data.images }); },
  overview() { wx.previewImage({ current: '/assets/design-board.jpg', urls: ['/assets/design-board.jpg'] }); },
});
