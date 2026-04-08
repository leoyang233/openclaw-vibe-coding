const app = getApp();

Page({
  data: {
    locations: [],
    filteredLocations: [],
    currentType: 'all',
    searchKeyword: ''
  },

  onLoad() {
    const storyData = app.globalData.storyData;
    this.setData({
      locations: storyData.locations,
      filteredLocations: storyData.locations
    });
  },

  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.filterLocations();
  },

  setType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ currentType: type });
    this.filterLocations();
  },

  filterLocations() {
    const { locations, currentType, searchKeyword } = this.data;
    let filtered = locations;

    if (currentType !== 'all') {
      filtered = filtered.filter(loc => loc.type === currentType);
    }

    if (searchKeyword) {
      filtered = filtered.filter(loc =>
        loc.name.includes(searchKeyword) ||
        loc.ancientName.includes(searchKeyword)
      );
    }

    this.setData({ filteredLocations: filtered });
  },

  viewLocation(e) {
    const locationId = e.currentTarget.dataset.id;
    const location = this.data.locations.find(loc => loc.id === locationId);

    if (location) {
      const storyData = app.globalData.storyData;
      const chapter = storyData.chapters.find(c => c.location === location.name);

      wx.showModal({
        title: location.name,
        content: `${location.ancientName}\n类型：${location.type}\n\n${location.description}${chapter ? `\n\n相关章节：第${chapter.id}回 ${chapter.title}` : ''}`,
        confirmText: chapter ? '阅读章节' : '关闭',
        cancelText: '关闭',
        success: (res) => {
          if (res.confirm && chapter) {
            wx.navigateTo({
              url: `/pages/read/read?id=${chapter.id}`
            });
          }
        }
      });
    }
  }
});
