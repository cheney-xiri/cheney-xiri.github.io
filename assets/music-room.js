(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('topic') !== 'music') return;

  const room = document.getElementById('music-room');
  const list = document.getElementById('music-track-list');
  const count = document.getElementById('music-count');
  const artButton = document.getElementById('music-art-button');
  const artStatus = document.getElementById('music-art-status');
  const exportButton = document.getElementById('music-art-export');
  const playlistLink = document.getElementById('music-playlist-link');
  const linksHost = document.getElementById('music-art-links');
  if (!room || !list) return;

  const tabs = [...room.querySelectorAll('[data-library]')];
  const order = ['favorites', 'jay', 'tfboys'];
  const groupMeta = {
    favorites: { title: '常听歌曲', subtitle: '熟悉的旋律，各有来处。' },
    jay: { title: '周杰伦', subtitle: '自《Jay》至《最伟大的作品》，十五张专辑。' },
    tfboys: { title: 'TFBOYS', subtitle: '组合发行的专辑、EP 与单曲。' }
  };
  /* 生成的封面只用这组配色，避免和宣纸 / 朱砂 / 鎏金的主色打架 */
  const artPalettes = [
    ['#8a4a3c', '#d9b071'], ['#3f5d55', '#c9b184'], ['#4a5570', '#c5a878'],
    ['#6d4a5c', '#d6b184'], ['#5a6246', '#cfbc8a'], ['#7a5236', '#dcb977'],
    ['#3d5a6b', '#c9b489'], ['#6b4f3f', '#d3ae7c'], ['#4c5a48', '#c8b787'],
    ['#7b4a49', '#dbb884'], ['#3e4f5e', '#ccb07e'], ['#63495e', '#d0ab7c']
  ];
  const artStoreKey = 'cheney-music-art-v2';
  const pageStoreKey = 'cheney-music-page-v2';
  const missStoreKey = 'cheney-music-miss-v2';

  let groups = null;
  let playlists = {};
  let active = 'favorites';
  let artwork = readStore(artStoreKey);
  let pages = readStore(pageStoreKey);
  let misses = readStore(missStoreKey);
  let baked = { artwork: {}, pages: {} };
  let artTried = {};
  let busy = false;
  /* 站主从平台曲目页粘贴进来的曲目，按歌单分别存，导出时一并带上 */
  const importStoreKey = 'cheney-music-imports-v1';
  let imported = readStore(importStoreKey);
  /* 平台（尤其酷狗）返回的歌曲信息，用于核对歌名/歌手/专辑 */
  const infoStoreKey = 'cheney-music-info-v1';
  let infos = readStore(infoStoreKey);

  room.hidden = false;

  /* ── 本地存储 ── */
  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch (error) { return {}; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* 无痕模式等，忽略 */ }
  }

  /* ── 工具 ── */
  function normalized(value) {
    return String(value == null ? '' : value).toLocaleLowerCase().normalize('NFKC')
      .replace(/[\s\p{P}\p{S}]/gu, '');
  }
  function matchName(value) {
    return String(value == null ? '' : value).toLocaleLowerCase().normalize('NFKC')
      .replace(/[（(【[].*?[）)】\]]/g, '')
      .replace(/[\s\p{P}\p{S}]/gu, '');
  }
  function labelArtName(label) {
    const found = /《([^》]+)》/.exec(String(label || ''));
    return found ? found[1] : '';
  }
  function hash(value) {
    let total = 0;
    for (let index = 0; index < value.length; index++) total = (total * 31 + value.charCodeAt(index)) % 100000;
    return total;
  }
  function palette(seed) {
    return artPalettes[hash(seed || '歌') % artPalettes.length];
  }
  function upsize(url) {
    return String(url || '').replace(/\/\d+x\d+bb\./, '/600x600bb.');
  }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function tracks(key) { return (groups && groups[key]) || []; }
  function usable(track) {
    return Boolean(track.artist) && !/待确认|尚未确定|未知/.test(track.artist);
  }

  /* ── 跳转：国内平台优先，直达歌曲页；取不到才给搜索入口 ── */
  function domesticSearch(artist, title) {
    const term = usable({ artist }) ? artist + ' ' + title : title;
    return 'https://y.qq.com/n/ryqq/search?w=' + encodeURIComponent(term) + '&t=song';
  }
  function linkFor(selection, key, title, artist) {
    const page = selection.songPages && selection.songPages[key] && selection.songPages[key][title];
    if (page && page.url) return { url: page.url, action: page.platform || '歌曲页面' };
    return { url: domesticSearch(artist, title), action: '搜索', search: true };
  }
  function resolvedLink(track) {
    if (track.managedLink) return track.managedLink;
    if (track.pinned && track.link && !track.link.search) return track.link;
    const page = (baked.pages && baked.pages[track.artKey]) || pages[track.artKey];
    if (!track.link) return page && page.url ? { url: page.url, action: page.platform || '专辑页' } : null;
    if (page && page.url) return { url: page.url, action: page.platform || '歌曲页' };
    return track.link;
  }

  /* ── 曲目组装：专辑按发行顺序，EP / 单曲 / 合唱接在其后（数据里已按年份排好） ── */
  function playlistEntries(playlist) {
    const out = [];
    if (!playlist) return out;
    (playlist.albums || []).forEach(album => {
      const titles = album.tracks || [];
      titles.forEach(title => out.push({
        title,
        album: album.name + '（' + album.year + '）',
        artKey: album.name,
        artSeed: album.name,
        artMark: String(album.name).slice(0, 1),
        cover: album.cover
      }));
      if (album.pending) {
        /* 专辑里还有未知曲目：如实留一行待补，不编造曲名 */
        out.push({
          title: titles.length ? String(album.pending) : album.name + '（曲目待补）',
          album: titles.length ? album.name + '（' + album.year + '）' : album.year + ' · ' + album.pending,
          artKey: album.name,
          artSeed: album.name,
          artMark: String(album.name).slice(0, 1),
          cover: album.cover,
          pending: true,
          pendingLink: album.link
        });
      }
    });
    (playlist.extras || []).forEach(item => {
      const label = item.collection || '单曲';
      out.push({
        title: item.title,
        album: label,
        artist: item.artist,
        artKey: item.title,
        artSeed: item.artist || label,
        artMark: String(item.title).slice(0, 1),
        cover: item.cover
      });
    });
    if (!out.length) (playlist.tracks || []).forEach(title => out.push({ title, artSeed: title, artMark: title.slice(0, 1) }));
    return out;
  }
  function buildPlaylist(selection, key) {
    const playlist = (selection.playlists && selection.playlists[key]) || {};
    const defaultArtist = playlist.artist || groupMeta[key].title;
    const entries = playlistEntries(playlist).map((entry, index) => {
      const artist = entry.artist || (playlist.artistOf && playlist.artistOf[entry.title]) || defaultArtist;
      const meta = [];
      if (entry.album) meta.push(entry.album);
      if (artist !== defaultArtist) meta.push(artist);
      return {
        id: key + ':' + index,
        title: entry.title,
        artist,
        group: key,
        meta: meta.join(' · ') || defaultArtist,
        artKey: key + '|' + (entry.artKey || entry.title),
        artSeed: entry.artSeed || entry.title,
        artMark: entry.artMark || String(entry.title).slice(0, 1),
        cover: entry.cover,
        pending: Boolean(entry.pending),
        link: entry.pending
          ? (entry.pendingLink ? { url: entry.pendingLink, action: 'Apple Music' } : null)
          : linkFor(selection, key, entry.title, defaultArtist)
      };
    });
    /* 有 order 的歌单按热度排；没上榜的曲目保持原有专辑顺序，排在后面 */
    if (!Array.isArray(playlist.order) || !playlist.order.length) return entries;
    const position = new Map();
    playlist.order.forEach((title, index) => { if (!position.has(title)) position.set(title, index); });
    const rank = title => (position.has(title) ? position.get(title) : Number.MAX_SAFE_INTEGER);
    return entries
      .map((entry, index) => ({ entry, index }))
      .sort((a, b) => rank(a.entry.title) - rank(b.entry.title) || a.index - b.index)
      .map(item => item.entry);
  }

  /* ── 界面 ── */
  function updateCover() {
    const index = order.indexOf(active);
    document.getElementById('music-cover-number').textContent =
      String(index + 1).padStart(2, '0') + ' / ' + String(order.length).padStart(2, '0');
    const playlist = playlists[active] || {};
    document.getElementById('music-cover-title').textContent = playlist.title || groupMeta[active].title;
    document.getElementById('music-cover-subtitle').textContent = playlist.subtitle || groupMeta[active].subtitle;
    const featured = tracks('favorites').find(track => track.pinned);
    const featureLink = document.getElementById('music-feature-link');
    if (featured && featureLink) {
      featureLink.href = resolvedLink(featured).url;
      document.getElementById('music-feature-title').textContent = featured.title;
      document.getElementById('music-feature-artist').textContent = featured.meta;
      const sleeve = room.querySelector('.music-record-sleeve');
      const cover = artUrl(featured);
      if (sleeve && cover && !sleeve.querySelector('.music-feature-cover')) {
        const image = document.createElement('img');
        image.className = 'music-feature-cover';
        image.alt = '坂本龙一 Playing the Piano USA 2010 / Korea 2011 专辑封面';
        image.width = 640;
        image.height = 561;
        image.addEventListener('load', () => sleeve.classList.add('has-album-cover'));
        image.addEventListener('error', () => { image.remove(); sleeve.classList.remove('has-album-cover'); });
        image.src = cover;
        sleeve.append(image);
      }
    }
    if (playlistLink) { playlistLink.hidden = true; playlistLink.removeAttribute('href'); }
    if (linksHost) {
      linksHost.replaceChildren();
      const links = Array.isArray(playlist.links) ? playlist.links
        : (playlist.playlist && playlist.playlist.url ? [playlist.playlist] : []);
      links.forEach(item => {
        if (!item || !item.url) return;
        const anchor = document.createElement('a');
        anchor.className = 'music-art-button';
        anchor.href = item.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener';
        anchor.textContent = (item.label || '平台完整歌单') + ' ↗';
        linksHost.append(anchor);
      });
    }
  }
  function visibleTracks() {
    const term = normalized(document.getElementById('music-search').value.trim());
    return tracks(active).filter(track => !term || normalized(track.title).includes(term) || normalized(track.meta).includes(term));
  }
  function artUrl(track) {
    return track.cover || (baked.artwork && baked.artwork[track.artKey]) || artwork[track.artKey] || '';
  }
  function markFor(track) {
    const mark = document.createElement('span');
    mark.textContent = track.artMark || '歌';
    return mark;
  }
  function makeArt(track) {
    const wrap = document.createElement('span');
    wrap.className = 'music-song-art';
    const colors = palette(track.artSeed);
    wrap.style.setProperty('--art-a', colors[0]);
    wrap.style.setProperty('--art-b', colors[1]);
    const url = artUrl(track);
    if (url) {
      const image = document.createElement('img');
      image.src = url;
      image.alt = '';
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('error', () => {
        image.remove();
        wrap.append(markFor(track));
      }, { once: true });
      wrap.append(image);
    } else {
      wrap.append(markFor(track));
    }
    return wrap;
  }
  function render() {
    if (!groups) return;
    const keepScroll = list.scrollTop;
    list.replaceChildren();
    const visible = visibleTracks();
    const links = visible.map(resolvedLink);
    const direct = links.filter(link => link && !link.search).length;
    const searched = links.filter(link => link && link.search).length;
    const pending = links.filter(link => !link).length;
    const covered = visible.filter(track => artUrl(track)).length;
    count.textContent = visible.length + ' 首 · ' + direct + ' 首直达歌曲页'
      + (searched ? ' · ' + searched + ' 首为搜索入口' : '')
      + (pending ? ' · ' + pending + ' 首待补' : '')
      + (covered ? ' · ' + covered + ' 张封面' : '');
    const fragment = document.createDocumentFragment();
    visible.forEach((track, index) => {
      const link = links[index];
      const row = document.createElement(link ? 'a' : 'span');
      row.className = 'music-song' + (link ? (link.search ? ' is-search' : '') : ' is-pending');
      if (track.pinned) row.classList.add('is-pinned');
      if (link) {
        row.href = link.url;
        row.target = '_blank';
        row.rel = 'noopener';
        row.setAttribute('aria-label', track.title + '，' + track.meta + '，在新标签打开' + (link.search ? '搜索入口' : link.action));
      } else {
        row.setAttribute('aria-label', track.title + '，' + track.meta + '，曲目待补');
      }
      const text = document.createElement('span');
      text.className = 'music-song-text';
      const title = document.createElement('strong');
      title.textContent = track.title;
      const meta = document.createElement('small');
      meta.textContent = track.meta;
      text.append(title, meta);
      if (track.pinned) {
        const badge = document.createElement('span');
        badge.className = 'music-pin-label';
        badge.textContent = '置顶';
        text.prepend(badge);
      }
      /* 行尾不再显示平台标签；跳转目标写进 title 与 aria-label，鼠标悬停/读屏仍可知道会去哪 */
      row.title = link ? (link.search ? '打开搜索页' : '打开' + link.action) : '曲目待补';
      row.append(makeArt(track), text);
      fragment.append(row);
    });
    list.append(fragment);
    list.scrollTop = keepScroll;
    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'music-list-empty';
      empty.textContent = '没有找到这首歌。';
      list.append(empty);
    }
  }
  function setActive(key) {
    if (order.indexOf(key) < 0) return;
    active = key;
    document.getElementById('music-search').value = '';
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.library === key)));
    updateCover();
    render();
    loadArtwork(key, false);
  }

  /* ── 封面与歌曲页：优先手填，其次 Apple Music / Deezer / QQ音乐 公开接口
       三家都在访客浏览器里直接取，不需要密钥；Apple 与 Deezer 支持 JSONP，
       QQ音乐 走公开的搜索联想 + 单曲详情接口，顺带拿到国内可打开的歌曲页地址。 ── */
  function jsonp(url, timeout) {
    return new Promise(resolve => {
      const name = 'cheneyMusicArt' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      let settled = false;
      const timer = setTimeout(() => finish(null), timeout || 9000);
      function finish(data) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { delete window[name]; } catch (error) { window[name] = undefined; }
        script.remove();
        resolve(data);
      }
      window[name] = data => finish(data);
      script.onerror = () => finish(null);
      script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + name;
      document.head.append(script);
    });
  }
  function report(text) { if (artStatus) artStatus.textContent = text; }
  function refreshArtButton(remaining) {
    if (!artButton) return;
    artButton.textContent = remaining ? '继续查找封面与歌曲页（还剩 ' + remaining + ' 首）' : '重新查找封面与歌曲页';
  }
  function applyHit(target, hit) {
    if (!hit || !hit.cover) return 0;
    let added = 0;
    if (!artwork[target.artKey]) added++;
    artwork[target.artKey] = hit.cover;
    if (hit.page) pages[target.artKey] = { url: hit.page, platform: hit.platform || '歌曲页' };
    delete misses[target.artKey];
    return added;
  }
  /* 单曲级来源，返回 { cover, page, platform, info? } */
  async function fromApple(track) {
    if (!usable(track)) return null;
    const data = await jsonp('https://itunes.apple.com/search?term='
      + encodeURIComponent(track.artist + ' ' + track.title) + '&entity=song&limit=1&country=cn');
    const item = ((data && data.results) || [])[0];
    if (!item || !item.artworkUrl100) return null;
    return { cover: upsize(item.artworkUrl100), page: item.trackViewUrl || '', platform: 'Apple Music' };
  }
  async function fromDeezer(track) {
    if (!usable(track)) return null;
    const data = await jsonp('https://api.deezer.com/search?q='
      + encodeURIComponent(track.artist + ' ' + track.title) + '&limit=1&output=jsonp');
    const item = ((data && data.data) || [])[0];
    if (!item || !item.album) return null;
    const cover = item.album.cover_xl || item.album.cover_big || item.album.cover_medium || '';
    return cover ? { cover, page: '', platform: '' } : null;
  }
  async function fromQQ(track) {
    if (!usable(track)) return null;
    const keyword = encodeURIComponent(track.artist + ' ' + track.title);
    const smart = await jsonp('https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key=' + keyword + '&format=jsonp');
    const songs = smart && smart.data && smart.data.song && smart.data.song.itemlist;
    if (!songs || !songs.length || !songs[0].mid) return null;
    const mid = songs[0].mid;
    const detail = await jsonp('https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid='
      + encodeURIComponent(mid) + '&format=jsonp');
    const album = detail && detail.data && detail.data[0] && detail.data[0].album;
    if (!album || !album.mid) return null;
    return {
      cover: 'https://y.gtimg.cn/music/photo_new/T002R300x300M000' + album.mid + '.jpg',
      page: 'https://y.qq.com/n/ryqq/songDetail/' + mid,
      platform: 'QQ音乐'
    };
  }
  /* 酷狗：公开搜索接口，用来核对歌曲信息（歌名/歌手/专辑），顺带取封面与歌曲页。
     演唱者未确认的曲目只按歌名搜——但这正是"用酷狗核对信息"的用处。 */
  function kugouRecord(item) {
    if (!item) return null;
    const rawCover = item.Image || (item.trans_param && item.trans_param.union_cover)
      || (item.AlbumID ? 'https://imge.kugou.com/stdmusic/240/' + item.AlbumID + '.jpg' : '');
    const rawPage = item.EMixSongID ? 'https://www.kugou.com/mixsong/' + item.EMixSongID + '.html'
      : (item.FileHash ? 'https://www.kugou.com/song/#hash=' + item.FileHash : '');
    return {
      cover: /^https:\/\//i.test(rawCover) ? rawCover : '',
      page: /^https:\/\//i.test(rawPage) ? rawPage : '',
      platform: '酷狗音乐',
      info: {
        title: String(item.SongName || '').slice(0, 60),
        artist: String(item.SingerName || '').slice(0, 60),
        album: String(item.AlbumName || '').slice(0, 60)
      }
    };
  }
  async function fromKugou(track) {
    const keyword = usable(track) ? track.artist + ' ' + track.title : track.title;
    const data = await jsonp('https://songsearch.kugou.com/song_search_v2?keyword=' + encodeURIComponent(keyword)
      + '&page=1&pagesize=5&platform=WebFilter&filter=2&iscorrection=1&privilege_filter=0');
    const lists = data && data.data && data.data.lists;
    if (!Array.isArray(lists) || !lists.length) return null;
    const want = normalized(track.title);
    const match = lists.find(item => {
      const name = normalized(item && item.SongName);
      return Boolean(name) && (name === want || name.indexOf(want) >= 0 || want.indexOf(name) >= 0);
    });
    if (!match) return null;   /* 歌名对不上就不用，避免贴错封面 */
    return kugouRecord(match);
  }
  /* 国内网络下 Deezer 会超时，故不入链；QQ音乐 与 酷狗 已覆盖中文曲库 */
  const artChain = [fromApple, fromQQ, fromKugou];

  async function fillMissing(key, manual, unlimited) {
    const now = Date.now();
    const cap = unlimited ? 500 : (manual ? 40 : 10);
    const missing = tracks(key).filter(track => !track.pending && !artUrl(track)
      && (manual || !misses[track.artKey] || now - misses[track.artKey] > 12 * 3600 * 1000));
    const queue = missing.slice(0, cap);
    let added = 0;
    let fails = 0;
    let aborted = false;
    for (let index = 0; index < queue.length; index++) {
      const track = queue[index];
      if (manual) report('正在从 Apple Music / Deezer / QQ音乐 查找… ' + (index + 1) + ' / ' + queue.length);
      let hit = null;
      for (const source of artChain) {
        try { hit = await source(track); } catch (error) { hit = null; }
        if (hit) break;
      }
      if (hit) {
        if (hit.info) infos[track.artKey] = hit.info;
        added += applyHit(track, hit);
        fails = 0;
        render();
      } else {
        misses[track.artKey] = Date.now();
        fails++;
        /* 连续多首各来源都没响应，说明网络或平台接口不通，别让后台空转 */
        if (fails >= 3) { aborted = true; break; }
      }
      await sleep(manual ? 300 : 450);
    }
    if (added) writeStore(artStoreKey, artwork);
    writeStore(pageStoreKey, pages);
    writeStore(missStoreKey, misses);
    writeStore(infoStoreKey, infos);
    const failed = queue.filter(track => !artUrl(track)).length;
    return { added, aborted, remaining: missing.length - queue.length + failed };
  }

  async function loadArtwork(key, manual, unlimited) {
    if (!manual && (artTried[key] || !navigator.onLine)) return;
    artTried[key] = true;
    // A complete saved collection needs no platform lookup on each visit.
    if (!manual && tracks(key).every(track => track.pending || artUrl(track))) {
      refreshArtButton(0);
      return { added: 0, remaining: 0, aborted: false };
    }
    if (manual) report('正在取封面与歌曲页…');
    let added = 0;

    if (key === 'favorites') {
      /* 常听歌曲：按各曲的 Apple 专辑 id 批量查一次，拿到单曲封面 + 单曲页 */
      const ids = [...new Set(tracks('favorites').map(track => track.albumId).filter(Boolean))];
      if (ids.length) {
        const data = await jsonp('https://itunes.apple.com/lookup?id=' + ids.join(',') + '&entity=song&country=cn');
        const byAlbum = {};
        const byTitle = {};
        ((data && data.results) || []).forEach(item => {
          if (item.collectionId && item.artworkUrl100) {
            byAlbum['favorites|' + item.collectionId] =
              { cover: upsize(item.artworkUrl100), page: item.collectionViewUrl || '', platform: 'Apple Music' };
          }
          if (item.wrapperType === 'track' && item.trackName && item.artworkUrl100) {
            byTitle[matchName(item.trackName)] =
              { cover: upsize(item.artworkUrl100), page: item.trackViewUrl || '', platform: 'Apple Music' };
          }
        });
        tracks('favorites').forEach(track => {
          const hit = byTitle[matchName(track.title)] || byAlbum[track.artKey];
          if (hit) added += applyHit(track, hit);
        });
      }
    } else {
      /* 周杰伦 / TFBOYS：一次搜回该歌手全部专辑，按专辑名归一化匹配 */
      const artist = key === 'jay' ? '周杰伦' : 'TFBOYS';
      const data = await jsonp('https://itunes.apple.com/search?term=' + encodeURIComponent(artist)
        + '&entity=album&limit=200&country=cn');
      const byName = {};
      ((data && data.results) || []).forEach(item => {
        if (!item.collectionName || !item.artworkUrl100) return;
        byName[matchName(item.collectionName)] =
          { cover: upsize(item.artworkUrl100), page: item.collectionViewUrl || '', platform: 'Apple Music' };
      });
      ((playlists[key] && playlists[key].albums) || []).forEach(album => {
        const hit = byName[matchName(album.name)];
        if (hit) added += applyHit({ artKey: key + '|' + album.name }, hit);
      });
      /* EP / 单曲：先按 collection 里的《EP 名》找，再按歌名找 */
      ((playlists[key] && playlists[key].extras) || []).forEach(extra => {
        const names = [labelArtName(extra.collection), extra.title].filter(Boolean);
        let hit = null;
        for (const name of names) {
          hit = byName[matchName(name)];
          if (hit) break;
        }
        if (hit) added += applyHit({ artKey: key + '|' + extra.title }, hit);
      });
    }

    if (added) writeStore(artStoreKey, artwork);
    writeStore(pageStoreKey, pages);
    updateCover();
    render();

    const filled = await fillMissing(key, manual, unlimited);
    const total = added + filled.added;
    refreshArtButton(filled.remaining);
    if (!manual) return filled;
    report(filled.aborted
      ? '接口连续没响应，先停下了：可能是本机网络或平台限制，稍后再点一次即可。'
      : (total
        ? '已补上 ' + total + ' 首的封面与歌曲页（会记住，下次直接显示）'
          + (filled.remaining ? '；还有 ' + filled.remaining + ' 首，可再点一次继续查找' : '')
        : '没有找到新的结果：Apple Music、Deezer、QQ音乐 三家都没命中，或该曲演唱者尚未确认；这些曲目继续用生成的封面。'));
    return filled;
  }

  /* 一次性把三个歌单全部补齐，并允许把结果导出成文件带走（用于写进项目数据） */
  function countMissing() {
    return order.reduce((sum, key) => sum + tracks(key).filter(track => !track.pending && !artUrl(track)).length, 0);
  }
  async function resolveAll(mode) {
    if (busy || !groups) { if (!groups) report('歌单还没载入完，稍等一下再点。'); return; }
    const automatic = mode === 'automatic';
    busy = true;
    if (artButton) { artButton.disabled = true; artButton.textContent = '正在补齐全部封面…'; }
    let added = 0;
    let aborted = false;
    for (const key of order) {
      if (automatic && tracks(key).every(track => track.pending || artUrl(track))) continue;
      const before = Object.keys(artwork).length;
      const result = await loadArtwork(key, !automatic, true);
      added += Object.keys(artwork).length - before;
      if (result && result.aborted) { aborted = true; break; }
    }
    busy = false;
    if (artButton) { artButton.disabled = false; }
    const remaining = countMissing();
    refreshArtButton(remaining);
    if (aborted) {
      report('接口连续没响应，先停下了（网络或平台限制）；已经取到的封面会保留，稍后再点一次继续。');
      return;
    }
    const pushed = added ? await pushCovers() : false;
    report('三个歌单已查完：新增 ' + added + ' 张封面'
      + (remaining ? '，仍有 ' + remaining + ' 首没找到（多为演唱者未确认或平台没有）' : '，已全部有封面')
      + (pushed
        ? '。已写回项目数据（assets/music-selection.json），之后所有人打开都直接显示，不再联网查找。'
        : '。点「导出封面表」把结果交给我，我写进项目。'));
  }
  function exportCovers() {
    const payload = {
      note: '由「志趣 · 听歌」页面导出。artwork 是歌曲封面地址，pages 是歌曲页地址，键名与 assets/music-selection.json 的 artKey 规则一致（favorites|<专辑id>、jay|<专辑名或歌名>、tfboys|<专辑名或歌名>）。',
      exportedAt: new Date().toISOString(),
      artwork,
      pages,
      info: infos,
      imported
    };
    const text = JSON.stringify(payload, null, 2);
    let saved = false;
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cheney-music-covers.json';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      saved = true;
    } catch (error) { saved = false; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    report('已导出 ' + Object.keys(artwork).length + ' 张封面、' + Object.keys(pages).length + ' 个歌曲页地址'
      + (saved ? '：文件名 cheney-music-covers.json，在浏览器的下载目录里' : '（下载被拦截，已尝试复制到剪贴板）')
      + '。把它交给我，我写进项目数据。');
  }

  /* ── 站主粘贴曲目：解析平台页面复制出来的文字，合并进当前歌单 ── */
  function makeImported(key, item, index) {
    const playlist = playlists[key] || {};
    const artist = item.artist || playlist.artist || groupMeta[key].title;
    return {
      id: key + ':paste:' + index,
      title: item.title,
      artist,
      group: key,
      meta: item.meta || '粘贴导入',
      artKey: key + '|' + item.title,
      artSeed: artist || item.title,
      artMark: String(item.title).slice(0, 1),
      pasted: true,
      link: { url: domesticSearch(artist, item.title), action: '搜索', search: true }
    };
  }
  function parsePasted(text) {
    const seen = new Set();
    const out = [];
    String(text || '').split(/\r?\n/).forEach(raw => {
      let line = raw.replace(/\u00a0/g, ' ').replace(/[《》""]/g, '').trim();
      if (!line) return;
      if (/^(全部歌曲|热门歌曲|最新歌曲|专辑|单曲|MV|音乐视频|歌手|酷狗音乐|网易云音乐|播放|下载|更多|收起)/.test(line)) return;
      line = line.replace(/^\s*\d+\s*[.、)）]\s*/, '').replace(/\s*\d{1,2}:\d{2}\s*$/, '').replace(/^[\-–—·•]\s*/, '').trim();
      const parts = line.split(/\s+[-–—]\s+|\t+|\s{2,}/).map(part => part.trim()).filter(Boolean);
      const title = (parts[0] || line).trim();
      if (!title || title.length > 40) return;
      const key = normalized(title);
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push({ title, artist: parts[1] || '', meta: parts.slice(1).join(' · ') });
    });
    return out;
  }
  function applyPasted() {
    const box = document.getElementById('music-paste');
    const parsed = parsePasted(box ? box.value : '');
    if (!parsed.length) { report('没解析出歌名：把曲目页的文字整段复制过来，一行一首也行。'); return; }
    const key = active;
    const existing = new Set(tracks(key).map(track => normalized(track.title)));
    const fresh = parsed.filter(item => !existing.has(normalized(item.title)));
    if (!fresh.length) { report('解析出 ' + parsed.length + ' 首，但当前歌单里都已有，没有新增。'); return; }
    imported[key] = (Array.isArray(imported[key]) ? imported[key] : []).concat(fresh);
    writeStore(importStoreKey, imported);
    if (groups && groups[key]) {
      fresh.forEach((item, index) => groups[key].push(makeImported(key, item, groups[key].length + index)));
    }
    if (box) box.value = '';
    render();
    report('已加入 ' + fresh.length + ' 首（解析 ' + parsed.length + ' 首，其余已存在）。'
      + '它们和其它曲目一样会自动取封面；点「导出封面表」会把曲目与封面一起带出，交给我就能固化进项目数据。');
  }

  /* 本机预览时把结果写回项目数据（server.js 的 /api/music-covers，只允许本机）；失败就退回"导出封面表" */
  async function pushCovers() {
    if (!/^https?:$/.test(location.protocol)) return false;
    try {
      const response = await fetch('/api/music-covers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artwork, pages, info: infos })
      });
      if (!response.ok) return false;
      const data = await response.json().catch(() => null);
      return Boolean(data && data.ok && (data.addedCover || data.addedPage || data.addedInfo));
    } catch (error) { return false; }
  }

  /* 首次打开就把三个歌单的封面补齐（只跑一次，之后靠缓存；不打扰后续访问） */
  const bootKey = 'cheney-music-art-boot-v1';
  async function autoFill() {
    let seen = false;
    try { seen = Boolean(localStorage.getItem(bootKey)); } catch (error) { seen = true; }
    if (seen || busy || !groups) return;
    if (order.every(key => tracks(key).every(track => track.pending || artUrl(track)))) {
      try { localStorage.setItem(bootKey, '1'); } catch (error) { /* Storage is optional. */ }
      return;
    }
    report('首次打开：正在为歌曲补齐封面（只跑这一次，之后直接显示）…');
    await resolveAll('automatic');
    try { localStorage.setItem(bootKey, '1'); } catch (error) { /* 无痕模式：下次再跑一遍，可接受 */ }
  }

  tabs.forEach(tab => tab.addEventListener('click', () => setActive(tab.dataset.library)));
  document.getElementById('music-search').addEventListener('input', render);
  if (artButton) artButton.addEventListener('click', resolveAll);
  if (exportButton) exportButton.addEventListener('click', exportCovers);
  const pasteButton = document.getElementById('music-paste-apply');
  if (pasteButton) pasteButton.addEventListener('click', applyPasted);

  fetch('../assets/music-selection.json', { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(async selection => {
      await (window.CHENEY_CONTENT_READY || Promise.resolve());
      playlists = selection.playlists || {};
      baked = { artwork: selection.covers || {}, pages: selection.pages || {} };
      const favorites = (selection.favorites || []).map((track, index) => ({
        id: 'favorites:' + index,
        title: track.title,
        artist: track.artist || '',
        pinned: Boolean(track.pinned),
        albumId: track.album || '',
        group: 'favorites',
        meta: (track.artist || '') + (track.pinned && track.note ? ' · ' + track.note.replace(/^坂本龙一\s*·\s*/, '') : ''),
        artKey: 'favorites|' + (track.album || track.title),
        artSeed: track.artist || track.title,
        artMark: String(track.title).slice(0, 1),
        link: linkFor(selection, 'favorites', track.title, track.artist || '')
      })).sort((a, b) => Number(b.pinned) - Number(a.pinned));
      groups = {
        favorites,
        jay: buildPlaylist(selection, 'jay'),
        tfboys: buildPlaylist(selection, 'tfboys')
      };
      if (window.CHENEY_CONTENT_STATE?.music) {
        const original=groups;groups={favorites:[],jay:[],tfboys:[]};
        window.CHENEY_CONTENT_STATE.music.filter(x=>x.data).sort((a,b)=>a.data.order-b.data.order).forEach(item=>{
          const d=item.data,parts=item.basePath.split(':'),base=original[parts[1]]?.[Number(parts[2])],key=d.category==='周杰伦'?'jay':d.category==='TFBOYS'?'tfboys':'favorites';
          const track={...(base||{}),id:item.id,title:d.title,artist:d.author,group:key,meta:d.summary||d.author,artKey:base?.artKey||'managed|'+item.id,artSeed:d.author||d.title,artMark:d.title.slice(0,1)};
          if(d.cover)track.cover=d.cover;
          if(d.url)track.managedLink={url:d.url,action:'歌曲页面'};
          else if(!base||d.title!==base.title||d.author!==base.artist)track.managedLink={url:domesticSearch(d.author,d.title),action:'搜索',search:true};
          groups[key].push(track);
        });
      }
      /* 把之前粘贴进来的曲目接回各自歌单 */
      ['favorites', 'jay', 'tfboys'].forEach(key => {
        const extra = Array.isArray(imported[key]) ? imported[key] : [];
        extra.forEach((item, index) => groups[key].push(makeImported(key, item, groups[key].length + index)));
      });
      setActive(order.indexOf(location.hash.replace('#', '')) >= 0 ? location.hash.replace('#', '') : 'favorites');
      autoFill();
    })
    .catch(() => {
      count.textContent = '歌单读取失败';
      const empty = document.createElement('p');
      empty.className = 'music-list-empty';
      empty.textContent = '歌单暂时无法加载，请刷新页面重试。';
      list.replaceChildren(empty);
    });
})();
