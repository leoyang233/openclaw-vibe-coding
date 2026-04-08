const app = getApp();

Page({
  data: {
    chapterId: 1,
    chapter: {},
    chapters: [],
    mapLatitude: 34.75,
    mapLongitude: 112.45,
    markers: [],
    showMap: false,
    totalChapters: 10
  },

  onLoad(options) {
    const chapterId = parseInt(options.id) || 1;
    this.setData({ chapterId });
    this.loadChapter();

    const storyData = app.globalData.storyData;
    this.setData({
      chapters: storyData.chapters,
      totalChapters: storyData.chapters.length
    });
  },

  loadChapter() {
    const storyData = app.globalData.storyData;
    const chapter = storyData.chapters.find(c => c.id === this.data.chapterId);

    if (chapter) {
      const location = chapter.locationDetail;
      const markers = this.generateMarkers(chapter);

      this.setData({
        chapter,
        mapLatitude: location.lat,
        mapLongitude: location.lng,
        markers
      });

      wx.setNavigationBarTitle({
        title: `第${chapter.id}回`
      });
    }
  },

  generateMarkers(chapter) {
    const markers = [];
    const location = chapter.locationDetail;

    markers.push({
      id: 0,
      latitude: location.lat,
      longitude: location.lng,
      title: location.name,
      iconPath: '/assets/icons/location-main.png',
      width: 30,
      height: 30,
      callout: {
        content: location.name,
        color: '#8B0000',
        fontSize: 12,
        borderRadius: 4,
        padding: 6,
        display: 'ALWAYS'
      }
    });

    chapter.relatedCharacters.forEach((char, index) => {
      const offsetLat = (Math.random() - 0.5) * 0.5;
      const offsetLng = (Math.random() - 0.5) * 0.5;
      markers.push({
        id: index + 1,
        latitude: char.lat + offsetLat,
        longitude: char.lng + offsetLng,
        title: char.name,
        iconPath: this.getFactionIcon(char.faction),
        width: 24,
        height: 24,
        callout: {
          content: char.name,
          color: '#333',
          fontSize: 11,
          borderRadius: 4,
          padding: 4,
          display: 'ALWAYS'
        }
      });
    });

    return markers;
  },

  getFactionIcon(faction) {
    return '/assets/icons/location-related.png';
  },

  toggleMap() {
    this.setData({
      showMap: !this.data.showMap
    });
  },

  showOnMap() {
    this.setData({ showMap: true });
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId;
    const marker = this.data.markers[markerId];
    if (marker && markerId > 0) {
      this.viewCharacter({ currentTarget: { dataset: { name: marker.title } } });
    }
  },

  viewCharacter(e) {
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/pages/character/character?name=${encodeURIComponent(name)}`
    });
  },

  prevChapter() {
    if (this.data.chapterId > 1) {
      this.setData({ chapterId: this.data.chapterId - 1 });
      this.loadChapter();
      this.setData({ showMap: false });
    }
  },

  nextChapter() {
    if (this.data.chapterId < this.data.totalChapters) {
      this.setData({ chapterId: this.data.chapterId + 1 });
      this.loadChapter();
      this.setData({ showMap: false });
    }
  }
});
