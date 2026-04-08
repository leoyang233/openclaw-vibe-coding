// 应用状态
let currentChapterId = 1;
let selectedMapItem = null;
let mapFilter = 'all';
let locationFilter = 'all';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
});

function handleHashChange() {
  const hash = window.location.hash || '#/';
  const [path, query] = hash.slice(1).split('?');
  const params = new URLSearchParams(query || '');

  hideAllPages();

  switch (path) {
    case '/':
      showPage('index');
      renderChapterList();
      break;
    case '/read':
      const chapterId = parseInt(params.get('id')) || 1;
      showPage('read');
      loadChapter(chapterId);
      break;
    case '/map':
      showPage('map');
      renderMap();
      break;
    case '/characters':
      showPage('characters');
      renderCharactersList();
      break;
    case '/character':
      const name = params.get('name');
      if (name) {
        showPage('character-detail');
        loadCharacter(decodeURIComponent(name));
      }
      break;
    case '/locations':
      showPage('locations');
      renderLocationsList();
      break;
    default:
      showPage('index');
      renderChapterList();
  }

  updateNavLinks();
}

function hideAllPages() {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
}

function showPage(pageId) {
  document.getElementById('page-' + pageId).classList.add('active');
}

function updateNavLinks() {
  const hash = window.location.hash || '#/';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === hash || (href === '#/' && hash === '#') || (href === '#/map' && hash.startsWith('#/map'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// 导航
function navigateTo(page, params = {}) {
  const query = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  window.location.hash = `/${page}${query ? '?' + query : ''}`;
}

// 首页 - 章节列表
function renderChapterList() {
  const container = document.getElementById('chapter-list');
  container.innerHTML = storyData.chapters.map(chapter => `
    <div class="chapter-card" onclick="navigateTo('read', { id: ${chapter.id} })">
      <div class="chapter-header-card">
        <span class="chapter-num-card">第${chapter.id}回</span>
        <span class="chapter-tag">${chapter.location}</span>
      </div>
      <div class="chapter-title-card">${chapter.title}</div>
      <div class="chapter-summary-card">${chapter.summary}</div>
      <div class="chapter-footer">
        <div class="chapter-characters">
          ${chapter.characters.map(c => `<span class="char-tag">${c}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

// 阅读页
function loadChapter(id) {
  const chapter = storyData.chapters.find(c => c.id === id);
  if (!chapter) return;

  currentChapterId = id;

  document.getElementById('read-chapter-num').textContent = `第${chapter.id}回`;
  document.getElementById('read-chapter-title').textContent = chapter.title;
  document.getElementById('read-location-name').textContent = chapter.location;
  document.getElementById('read-location-desc').textContent = chapter.locationDetail.description;
  document.getElementById('read-content').textContent = chapter.content;

  // 更新按钮状态
  document.getElementById('prev-btn').disabled = id <= 1;
  document.getElementById('next-btn').disabled = id >= storyData.chapters.length;

  // 渲染相关人物
  const charsContainer = document.getElementById('read-characters');
  charsContainer.innerHTML = chapter.relatedCharacters.map(char => `
    <div class="character-card" onclick="navigateTo('character', { name: '${char.name}' })">
      <div class="char-avatar ${char.faction}">${char.name[0]}</div>
      <span class="char-name-card">${char.name}</span>
      <span class="char-faction-card faction-${char.faction}">${char.faction}</span>
    </div>
  `).join('');

  // 渲染地图
  renderReadMap(chapter);
}

function renderReadMap(chapter) {
  const container = document.getElementById('map-container-read');
  const location = chapter.locationDetail;

  // 显示位置信息和跳转链接
  container.innerHTML = `
    <div class="map-location-info">
      <div class="map-location-name">${location.name}</div>
      <div class="map-location-coords">${location.lat.toFixed(2)}°N, ${location.lng.toFixed(2)}°E</div>
    </div>
    <a class="map-btn" href="https://maps.apple.com/?ll=${location.lat},${location.lng}&q=${encodeURIComponent(location.name)}" target="_blank">
      在地图中查看
    </a>
  `;
}

function getFactionColor(faction) {
  const colors = {
    '刘备': 'green',
    '曹操': 'blue',
    '孙吴': 'purple',
    '董卓': 'red',
    '袁绍': 'orange',
    '吕布': 'red'
  };
  return colors[faction] || 'red';
}

function toggleMap() {
  const mapDiv = document.getElementById('read-map');
  mapDiv.classList.toggle('expanded');
}

function showOnMap() {
  navigateTo('map');
}

function prevChapter() {
  if (currentChapterId > 1) {
    navigateTo('read', { id: currentChapterId - 1 });
  }
}

function nextChapter() {
  if (currentChapterId < storyData.chapters.length) {
    navigateTo('read', { id: currentChapterId + 1 });
  }
}

// 地图页
function renderMap() {
  const container = document.getElementById('main-map');
  updateMapMarkers();
}

function updateMapMarkers() {
  const container = document.getElementById('main-map');
  const search = document.getElementById('map-search')?.value || '';

  let locations = storyData.locations;
  let characters = storyData.characters;

  if (mapFilter !== 'all') {
    if (mapFilter === '蜀') {
      characters = characters.filter(c => ['刘备', '关羽', '张飞', '诸葛亮', '赵云'].includes(c.name));
    } else if (mapFilter === '魏') {
      characters = characters.filter(c => c.name === '曹操');
    } else if (mapFilter === '吴') {
      characters = characters.filter(c => ['孙权', '孙坚', '孙策', '周瑜'].includes(c.name));
    }
  }

  if (search) {
    locations = locations.filter(l =>
      l.name.includes(search) || l.ancientName.includes(search)
    );
    characters = characters.filter(c => c.name.includes(search));
  }

  // 显示位置列表
  const allItems = [
    ...locations.map(l => ({ ...l, type: 'location' })),
    ...characters.map(c => ({ ...c, type: 'character' }))
  ];

  if (allItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">未找到相关地点或人物</div>';
    return;
  }

  container.innerHTML = `
    <div style="padding:15px;overflow-y:auto;height:100%;">
      <h3 style="margin-bottom:15px;font-size:14px;color:#8B0000;">共 ${allItems.length} 个标记点</h3>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${allItems.map(item => `
          <div style="background:#fff;padding:12px;border-radius:8px;cursor:pointer;" onclick="openInMap('${item.name}', ${item.lat}, ${item.lng})">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:16px;">${item.type === 'location' ? '📍' : '👤'}</span>
              <div>
                <div style="font-weight:bold;color:#333;">${item.name}</div>
                <div style="font-size:11px;color:#999;">${item.lat.toFixed(2)}°N, ${item.lng.toFixed(2)}°E</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openInMap(name, lat, lng) {
  // 尝试使用 Apple Maps 或 Google Maps
  const url = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`;
  window.open(url, '_blank');
}

function onMapSearch() {
  updateMapMarkers();
}

function setMapFilter(filter) {
  mapFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });
  updateMapMarkers();
}

function viewDetail() {
  if (!selectedMapItem) return;

  if (selectedMapItem.birthplace) {
    navigateTo('character', { name: selectedMapItem.name });
  } else {
    navigateTo('locations');
  }
  closeSheet();
}

function goToChapter() {
  if (!selectedMapItem) return;

  const chapter = storyData.chapters.find(c =>
    c.location === selectedMapItem.name ||
    c.characters.includes(selectedMapItem.name)
  );

  if (chapter) {
    navigateTo('read', { id: chapter.id });
  } else {
    alert('暂无相关章节');
  }
  closeSheet();
}

function closeSheet() {
  document.getElementById('bottom-sheet').classList.add('hidden');
  selectedMapItem = null;
}

// 人物页
function renderCharactersList() {
  const container = document.getElementById('characters-list');
  container.innerHTML = storyData.characters.map(char => `
    <div class="char-grid-card" onclick="navigateTo('character', { name: '${char.name}' })">
      <div class="char-grid-avatar ${char.faction}">${char.name[0]}</div>
      <div class="char-grid-name">${char.name}</div>
      <span class="char-grid-faction faction-${char.faction}">${char.faction}</span>
    </div>
  `).join('');
}

function loadCharacter(name) {
  const char = storyData.characters.find(c => c.name === name);
  if (!char) return;

  document.getElementById('char-avatar').textContent = char.name[0];
  document.getElementById('char-avatar').className = `char-avatar-large ${char.faction}`;
  document.getElementById('char-name').textContent = char.name;
  document.getElementById('char-courtesy').textContent = char.courtesy;
  document.getElementById('char-faction').textContent = char.faction;
  document.getElementById('char-faction').className = `faction-tag faction-${char.faction}`;
  document.getElementById('char-birthplace').querySelector('span').textContent = char.birthplace;
  document.getElementById('char-desc').textContent = char.description;
  document.getElementById('char-story').textContent = char.story;

  // 相关章节
  const relatedChapters = storyData.chapters.filter(c => c.characters.includes(char.name));
  const chaptersContainer = document.getElementById('char-chapters');
  chaptersContainer.innerHTML = relatedChapters.map(ch => `
    <div class="chapter-item" onclick="navigateTo('read', { id: ${ch.id} })">
      <div class="chapter-info">
        <span class="chapter-num">第${ch.id}回</span>
        <span class="chapter-title">${ch.title}</span>
      </div>
      <span>→</span>
    </div>
  `).join('') || '<p style="padding:15px;color:#999;">暂无相关章节</p>';

  // 地图
  const mapContainer = document.getElementById('char-map');
  mapContainer.innerHTML = `
    <div style="padding:40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:15px;">📍</div>
      <div style="font-size:16px;font-weight:bold;color:#333;margin-bottom:5px;">${char.birthplace}</div>
      <div style="font-size:13px;color:#999;margin-bottom:20px;">${char.lat.toFixed(2)}°N, ${char.lng.toFixed(2)}°E</div>
      <a class="map-btn" href="https://maps.apple.com/?ll=${char.lat},${char.lng}&q=${encodeURIComponent(char.birthplace)}" target="_blank">
        在地图中查看
      </a>
    </div>
  `;
}

// 地点页
function renderLocationsList() {
  updateLocationsList();
}

function updateLocationsList() {
  const searchInput = document.getElementById('location-search');
  const search = searchInput?.value || '';

  let locations = storyData.locations;

  if (locationFilter !== 'all') {
    locations = locations.filter(l => l.type === locationFilter);
  }

  if (search) {
    locations = locations.filter(l =>
      l.name.includes(search) || l.ancientName.includes(search)
    );
  }

  const container = document.getElementById('locations-list');
  if (locations.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">未找到相关地点</p>';
    return;
  }

  container.innerHTML = locations.map(loc => `
    <div class="location-card" onclick="showLocationDetail(${loc.id})">
      <div class="location-icon">📍</div>
      <div class="location-info">
        <div class="location-name-row">
          <span class="location-name">${loc.name}</span>
          <span class="location-ancient">(${loc.ancientName})</span>
        </div>
        <span class="location-type tag-${loc.type}">${loc.type}</span>
        <div class="location-desc">${loc.description}</div>
      </div>
    </div>
  `).join('');
}

function setLocationFilter(type) {
  locationFilter = type;
  document.querySelectorAll('#page-locations .filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.type === type);
  });
  updateLocationsList();
}

function showLocationDetail(id) {
  const loc = storyData.locations.find(l => l.id === id);
  if (!loc) return;

  const chapter = storyData.chapters.find(c => c.location === loc.name);

  let content = `${loc.ancientName}\n类型：${loc.type}\n\n${loc.description}`;
  if (chapter) {
    content += `\n\n相关章节：第${chapter.id}回 ${chapter.title}`;
  }

  if (confirm(content)) {
    if (chapter) {
      navigateTo('read', { id: chapter.id });
    }
  }
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (window.location.hash.startsWith('#/read')) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      prevChapter();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextChapter();
    }
  }
});
