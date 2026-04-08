const app = getApp();

Page({
  data: {
    chapters: []
  },

  onLoad() {
    const storyData = app.globalData.storyData;
    this.setData({
      chapters: storyData.chapters
    });
  },

  readChapter(e) {
    const chapterId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/read/read?id=${chapterId}`
    });
  },

  goToMap() {
    wx.switchTab({
      url: '/pages/map/map'
    });
  },

  goToCharacters() {
    wx.navigateTo({
      url: '/pages/character/character'
    });
  },

  goToLocations() {
    wx.navigateTo({
      url: '/pages/location/location'
    });
  }
});
