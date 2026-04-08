const app = getApp();

Page({
  data: {
    character: {},
    relatedChapters: [],
    markers: []
  },

  onLoad(options) {
    const name = decodeURIComponent(options.name);
    this.loadCharacter(name);
  },

  loadCharacter(name) {
    const storyData = app.globalData.storyData;
    const character = storyData.characters.find(c => c.name === name);

    if (character) {
      const relatedChapters = storyData.chapters.filter(c =>
        c.characters.includes(character.name)
      );

      const markers = [{
        id: 0,
        latitude: character.lat,
        longitude: character.lng,
        title: character.name,
        iconPath: '/assets/icons/location-main.png',
        width: 32,
        height: 32,
        callout: {
          content: character.name,
          color: '#8B0000',
          fontSize: 12,
          borderRadius: 4,
          padding: 6,
          display: 'ALWAYS'
        }
      }];

      this.setData({
        character,
        relatedChapters,
        markers
      });

      wx.setNavigationBarTitle({
        title: character.name
      });
    }
  },

  readChapter(e) {
    const chapterId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/read/read?id=${chapterId}`
    });
  }
});
