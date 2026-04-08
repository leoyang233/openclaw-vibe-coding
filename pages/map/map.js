const app = getApp();

Page({
  data: {
    mapLatitude: 34.0,
    mapLongitude: 112.0,
    markers: [],
    locations: [],
    characters: [],
    currentFilter: 'all',
    searchKeyword: '',
    selectedItem: null
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.updateMarkers();
  },

  loadData() {
    const storyData = app.globalData.storyData;
    this.setData({
      locations: storyData.locations,
      characters: storyData.characters
    });
    this.updateMarkers();
  },

  updateMarkers() {
    const { locations, characters, currentFilter, searchKeyword } = this.data;
    const markers = [];

    locations.forEach((loc, index) => {
      if (currentFilter !== 'all' && loc.type !== currentFilter) return;
      if (searchKeyword && !loc.name.includes(searchKeyword) && !loc.ancientName.includes(searchKeyword)) return;

      markers.push({
        id: index,
        latitude: loc.lat,
        longitude: loc.lng,
        title: loc.name,
        iconPath: '/assets/icons/location-main.png',
        width: 32,
        height: 32,
        callout: {
          content: loc.name,
          color: '#8B0000',
          fontSize: 12,
          borderRadius: 4,
          padding: 6,
          display: 'BYCLICK'
        }
      });
    });

    characters.forEach((char, index) => {
      if (searchKeyword && !char.name.includes(searchKeyword)) return;

      const faction = this.getFactionGroup(char.faction);
      if (currentFilter !== 'all' && currentFilter !== faction) return;

      markers.push({
        id: 100 + index,
        latitude: char.lat,
        longitude: char.lng,
        title: char.name,
        iconPath: this.getCharacterIcon(char.faction),
        width: 28,
        height: 28,
        callout: {
          content: char.name,
          color: '#333',
          fontSize: 11,
          borderRadius: 4,
          padding: 4,
          display: 'BYCLICK'
        }
      });
    });

    this.setData({ markers });
  },

  getFactionGroup(faction) {
    if (['刘备', '诸葛亮', '关羽', '张飞', '赵云'].includes(faction)) return '蜀';
    if (faction === '曹操') return '魏';
    if (faction === '孙吴' || faction === '孙权' || faction === '孙坚' || faction === '周瑜') return '吴';
    return 'other';
  },

  getCharacterIcon(faction) {
    return '/assets/icons/location-related.png';
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ currentFilter: filter });
    this.updateMarkers();
  },

  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.updateMarkers();
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId;
    const { locations, characters } = this.data;

    let item = null;
    if (markerId < 100) {
      item = locations[markerId];
    } else {
      item = characters[markerId - 100];
    }

    if (item) {
      this.setData({ selectedItem: item });
    }
  },

  closeSheet() {
    this.setData({ selectedItem: null });
  },

  onRegionChange() {},

  viewDetail() {
    const { selectedItem } = this.data;
    if (!selectedItem) return;

    if (selectedItem.birthplace) {
      wx.navigateTo({
        url: `/pages/character/character?name=${encodeURIComponent(selectedItem.name)}`
      });
    } else {
      wx.navigateTo({
        url: `/pages/location/location?name=${encodeURIComponent(selectedItem.name)}`
      });
    }
    this.closeSheet();
  },

  goToChapter() {
    const { selectedItem } = this.data;
    if (!selectedItem) return;

    const storyData = app.globalData.storyData;
    const chapter = storyData.chapters.find(c =>
      c.location === selectedItem.name ||
      c.characters.includes(selectedItem.name)
    );

    if (chapter) {
      wx.navigateTo({
        url: `/pages/read/read?id=${chapter.id}`
      });
    } else {
      wx.showToast({
        title: '暂无相关章节',
        icon: 'none'
      });
    }
    this.closeSheet();
  }
});
