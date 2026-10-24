/* 城市与到访内容统一从 travels.json 读取，首页和城市页共用这一份资料。 */
(function () {
  'use strict';

  const homeList = document.getElementById('travel-cities');
  const cityPage = document.body.classList.contains('travel-page') && !homeList;
  const directoryPage = document.body.classList.contains('travel-directory-page');
  if (!homeList && !cityPage) return;

  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const mediaURL = value => {if(typeof value!=='string'||!value.trim())return '';try {const u=new URL(value,location.origin+'/');return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
  const monthText = value => {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value || '');
    return match ? `${match[1]} 年 ${Number(match[2])} 月` : String(value || '');
  };
  const orderedVisits = city => (city.visits || []).slice().sort((a, b) => a.month.localeCompare(b.month));
  const empty = (where, text) => where.append(make('p', 'travel-empty', text));
  const cityGroups = [
    { title: '中原', ids: ['zhengzhou', 'luoyang', 'kaifeng'] },
    { title: '京津', ids: ['beijing', 'tianjin'] },
    { title: '东北', ids: ['harbin', 'shenyang', 'liaoyang', 'dalian'] },
    { title: '荆襄', ids: ['xiangyang'] },
    { title: '巴渝', ids: ['chongqing'] },
    { title: '齐鲁', ids: ['jinan', 'zibo', 'taian'] }
  ];
  const regionByCity = new Map(cityGroups.flatMap(group => group.ids.map(id => [id, group.title])));
  const regionForCity = city => regionByCity.get(city.id) || ({河南:'中原',北京:'京津',天津:'京津',辽宁:'东北',吉林:'东北',黑龙江:'东北',湖北:'荆襄',重庆:'巴渝',山东:'齐鲁'})[city.province] || '其他';
  const citySequence = cities => {
    const byId = new Map(cities.map(city => [city.id, city]));
    const ids = cityGroups.flatMap(group => group.ids);
    return [...ids.map(id => byId.get(id)).filter(Boolean), ...cities.filter(city => !ids.includes(city.id))];
  };

  function renderHome(cities) {
    const total = cities.reduce((sum, city) => sum + (city.visits || []).length, 0);
    const count = document.getElementById('travel-atlas-count');
    if (count) count.textContent = `${cities.length} 座城 · ${total} 次抵达`;
    const limit = Number(homeList.dataset.homeLimit) || 0;
    const displayedCities = limit
      ? citySequence(cities.slice().sort((a, b) => {
          const visitsA = orderedVisits(a);
          const visitsB = orderedVisits(b);
          const latestA = visitsA.length ? visitsA[visitsA.length - 1].month : '';
          const latestB = visitsB.length ? visitsB[visitsB.length - 1].month : '';
          return latestB.localeCompare(latestA);
        }).slice(0, limit))
      : directoryPage ? citySequence(cities) : cities;
    const cityCards = [];
    displayedCities.forEach((city, index) => {
      const item = make('li', 'travel-city');
      item.dataset.cityId = city.id;
      item.dataset.region = regionForCity(city);
      const visual = make('div', 'travel-city-visual');
      const image = make('img', 'travel-city-image');
      image.alt = `${city.name}·${city.cover || '城市风景'}，城市印象照片`;
      image.loading = directoryPage && index < 4 ? 'eager' : 'lazy';
      image.decoding = 'async';
      if (!directoryPage) image.fetchPriority = 'low';
      image.addEventListener('error',()=>{image.src='/assets/ink/scroll-river-v1.webp';},{once:true});
      image.src = mediaURL(city.image) || `${directoryPage ? '../' : ''}assets/travel-covers/${city.id}.jpg`;
      visual.append(image);
      visual.append(make('span', 'travel-city-number', String(index + 1).padStart(2, '0')));
      visual.append(make('span', 'travel-city-province', city.province));
      item.append(visual);
      const info = make('div', 'travel-city-info');
      info.append(make('h3', 'travel-city-name', city.name));
      info.append(make('span', 'travel-city-landmark', city.cover || '城市印象'));
      const foot = make('div', 'travel-city-foot');
      foot.append(make('span', 'travel-city-visits', `${city.visits.length} 次到访`));
      const link = make('a', 'travel-city-open', '翻阅此城');
      link.href = `${directoryPage ? 'city.html' : 'travels/city.html'}?city=${encodeURIComponent(city.id)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `翻阅${city.name}的足迹，${city.visits.length}次到访`);
      foot.append(link);
      info.append(foot);
      item.append(info);
      cityCards.push(item);
    });
    cityCards.forEach(card => homeList.append(card));
    const moreCount = document.getElementById('travel-more-count');
    if (moreCount) moreCount.textContent = `${cities.length} 座城市`;
    const directoryCities = document.getElementById('travel-directory-cities');
    if (directoryCities) directoryCities.textContent = String(cities.length).padStart(2, '0');
    const directoryVisits = document.getElementById('travel-directory-visits');
    if (directoryVisits) directoryVisits.textContent = `${total} 次抵达`;

    if (directoryPage) {
      const search = document.getElementById('travel-city-search');
      const emptyState = document.getElementById('travel-search-empty');
      const filters = document.getElementById('travel-region-filters');
      const result = document.getElementById('travel-directory-result');
      const cityById = new Map(cities.map(city => [city.id, city]));
      let activeRegion = '全部';
      const addFilter = (title, cityCount) => {
        const button = make('button', 'travel-region-filter', title);
        button.type = 'button';
        button.dataset.region = title;
        button.setAttribute('aria-pressed', title === activeRegion ? 'true' : 'false');
        button.append(make('small', '', String(cityCount).padStart(2, '0')));
        filters.append(button);
      };
      addFilter('全部', cities.length);
      cityGroups.forEach(group => {
        const cityCount = cities.filter(city=>regionForCity(city)===group.title).length;
        if (cityCount) addFilter(group.title, cityCount);
      });
      const otherCount=cities.filter(city=>regionForCity(city)==='其他').length;if(otherCount)addFilter('其他',otherCount);
      const applyFilter = () => {
        const query = (search?.value || '').trim().toLocaleLowerCase();
        let visible = 0;
        cityCards.forEach(card => {
          const city = cityById.get(card.dataset.cityId);
          const matches = city && (activeRegion === '全部' || card.dataset.region === activeRegion)
            && `${city.name} ${city.province} ${city.cover || ''}`.toLocaleLowerCase().includes(query);
          card.hidden = !matches;
          if (matches) visible += 1;
        });
        if (result) result.textContent = `${activeRegion} · ${visible} 座城市`;
        if (emptyState) emptyState.hidden = visible > 0;
      };
      search?.addEventListener('input', applyFilter);
      filters?.addEventListener('click', event => {
        const button = event.target.closest('button[data-region]');
        if (!button) return;
        activeRegion = button.dataset.region;
        filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', item === button ? 'true' : 'false'));
        applyFilter();
      });
      applyFilter();
    }
  }

  function renderCity(cities) {
    const id = new URLSearchParams(location.search).get('city');
    const city = cities.find(item => item.id === id);
    const name = document.getElementById('travel-name');
    if (!city) {
      document.title = '未找到城市 · Cheney';
      name.textContent = '未找到这座城市';
      document.querySelector('.travel-lead').textContent = '返回足迹索引，继续翻阅已记录的城市。';
      document.querySelectorAll('.travel-block,.travel-small-blocks,.travel-section-nav').forEach(node => { node.hidden = true; });
      return;
    }

    const visits = orderedVisits(city);
    document.title = `${city.name} · 足迹 · Cheney`;
    document.getElementById('travel-crumb-name').textContent = city.name;
    document.getElementById('travel-region').textContent = `${city.province} · 城市档案`;
    name.textContent = city.name;
    document.getElementById('travel-total').textContent = String(visits.length).padStart(2, '0');

    const heroImage = document.getElementById('travel-hero-image');
    const heroCaption = document.getElementById('travel-hero-caption');
    if (heroImage) {
      const hero = heroImage.closest('.travel-hero');
      heroImage.alt = `${city.name} · ${city.cover || '城市风景'}，城市印象照片`;
      heroImage.style.objectPosition = city.heroPosition || '50% 35%';
      heroImage.addEventListener('load', () => {
        heroImage.hidden = false;
        hero.classList.add('has-city-image');
        if (heroCaption) {
          heroCaption.textContent = `城市印象 · ${city.cover || city.name} ↗`;
          heroCaption.href=mediaURL(city.image)||'credits.html';
          heroCaption.hidden = heroImage.dataset.placeholder==='true'||(city.image||'').includes('/assets/ink/');
        }
      }, { once: true });
      heroImage.addEventListener('error', () => {
        heroImage.dataset.placeholder='true';heroImage.src='/assets/ink/scroll-river-v1.webp';
        if (heroCaption) heroCaption.hidden = true;
      }, { once: true });
      heroImage.src = mediaURL(city.image) || `../assets/travel-covers/${city.id}.jpg`;
    }

    const visitList = document.getElementById('travel-visit-list');
    const places = document.getElementById('travel-place-list');
    const photos = document.getElementById('travel-photo-list');
    const notes = document.getElementById('travel-note-list');
    const flavors = document.getElementById('travel-flavor-list');
    const placeItems = [];
    const photoItems = [];
    const noteItems = [];
    const flavorItems = [];

    visits.forEach((visit, index) => {
      const row = make('li', 'travel-visit');
      row.append(make('span', 'travel-visit-index', String(index + 1).padStart(2, '0')));
      const date = make('time', 'travel-visit-date', monthText(visit.month));
      date.dateTime = visit.month;
      row.append(date);
      row.append(make('span', 'travel-visit-label', index === 0 ? '初至' : '再访'));
      visitList.append(row);

      (visit.places || []).forEach(place => { if(typeof place==='string')place={name:place};if (place && place.name) {placeItems.push({ month: visit.month, ...place });for(const photo of place.photos||[])photoItems.push({month:visit.month,...photo,type:'image',place:place.name});for(const video of place.videos||[])photoItems.push({month:visit.month,...video,type:'video',place:place.name});} });
      [...(visit.photos||[]).map((x,i)=>({...x,type:'image',order:x.order??i})),...(visit.videos||[]).map((x,i)=>({...x,type:'video',order:x.order??(visit.photos||[]).length+i}))].sort((a,b)=>a.order-b.order).forEach(item=>{if(item&&(item.src||item.url))photoItems.push({month:visit.month,...item});});
      if (visit.note && visit.note.trim()) noteItems.push({ month: visit.month, text: visit.note.trim() });
      (visit.flavors || []).forEach(flavor => { if (typeof flavor === 'string' && flavor.trim()) flavorItems.push({ month: visit.month, text: flavor.trim() }); });
    });

    const landscapeNames=[...new Set([...placeItems.map(p=>p.name),...photoItems.map(p=>p.place||'')])];
    const landscapeIds=new Map(landscapeNames.map((name,i)=>[name,'travel-landscape-'+i]));
    if (placeItems.length) {
      const list = make('ul', 'travel-place-items');
      placeItems.forEach(place => {
        const row = make('li', 'travel-place-item');
        row.append(make('span', 'travel-item-month', monthText(place.month)));
        const placeLink=make('a','travel-place-gallery-link',place.name);placeLink.href='#'+landscapeIds.get(place.name);row.append(placeLink);
        if (place.note) row.append(make('p', '', place.note));
        list.append(row);
      });
      places.append(list);
    } else empty(places, '去过的具体地点，待续入此卷。');

    if (landscapeNames.length) {
      const index=make('nav','travel-landscape-index');index.setAttribute('aria-label','按地点查看沿途风景');
      landscapeNames.forEach(place=>{const link=make('a','',place||'沿途风景');link.href='#'+landscapeIds.get(place);index.append(link);});photos.append(index);
      landscapeNames.forEach(place=>{
        const group=make('section','travel-landscape-group');group.id=landscapeIds.get(place);
        const matching=photoItems.filter(photo=>(photo.place||'')===place&&mediaURL(photo.src||photo.url));
        const heading=make('header','travel-landscape-head');heading.append(make('h3','',place||'沿途风景'),make('span','',matching.length+' 项影像'));group.append(heading);
        const grid=make('div','travel-photo-grid');
        matching.forEach(photo=>{
          const source=mediaURL(photo.src||photo.url),figure=make('figure','travel-photo');
          if(photo.type==='video'){
            const video=make('video');video.src=source;video.controls=true;video.preload='none';video.playsInline=true;video.setAttribute('aria-label',photo.caption||city.name+'旅途视频');if(photo.poster&&mediaURL(photo.poster))video.poster=mediaURL(photo.poster);figure.append(video);
          }else{
            const link=make('a','travel-photo-link');link.href=source;link.target='_blank';link.rel='noopener noreferrer';const img=make('img');img.src=source;img.alt=photo.caption||city.name+'旅途照片';img.loading='lazy';link.append(img);figure.append(link);
          }
          figure.append(make('figcaption','',monthText(photo.month)+(photo.date?' · '+photo.date:'')+(photo.caption?' · '+photo.caption:'')));grid.append(figure);
        });
        if(matching.length)group.append(grid);else empty(group,'这里的风景，等影像慢慢续上。');
        photos.append(group);
      });
    } else empty(photos, '沿途的照片与视频，会在这里按地点收好。');

    if (noteItems.length) {
      noteItems.forEach(note => {
        const article = make('article', 'travel-note');
        article.append(make('span', 'travel-item-month', monthText(note.month)));
        article.append(make('p', '', note.text));
        notes.append(article);
      });
    } else empty(notes, '旅途中的一件事、一句话，可以记在这里。');

    if (flavorItems.length) {
      const list = make('ul', 'travel-flavor-items');
      flavorItems.forEach(flavor => {
        const row = make('li');
        row.append(make('span', 'travel-item-month', monthText(flavor.month)));
        row.append(make('span', '', flavor.text));
        list.append(row);
      });
      flavors.append(list);
    } else empty(flavors, '食物、声音与街巷风物，等你慢慢补记。');

    const neighbors = document.getElementById('travel-neighbors');
    const sequence = citySequence(cities);
    const current = sequence.findIndex(item => item.id === id);
    [[sequence[current - 1], '前一城'], [sequence[current + 1], '后一城']].forEach(([next, label]) => {
      if (!next) return;
      const link = make('a', '', next.name);
      link.href = `city.html?city=${encodeURIComponent(next.id)}`;
      link.prepend(make('small', '', label));
      neighbors.append(link);
    });
  }

  const source = cityPage || directoryPage ? '../assets/travels.json' : 'assets/travels.json';
  fetch(source, { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error('城市资料暂不可用'); return response.json(); })
    .then(data => {
      const cities = Array.isArray(data.cities) ? data.cities : [];
      if (homeList) renderHome(cities);
      else renderCity(cities);
    })
    .catch(() => {
      if (homeList) {
        const item = make('li', 'travel-load-error');
        item.textContent = '城市资料暂时无法载入，请稍后刷新。';
        homeList.append(item);
      }
      else document.querySelector('.travel-lead').textContent = '城市资料暂时无法载入，请稍后刷新。';
    });
})();
