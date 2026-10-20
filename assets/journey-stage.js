(function () {
  'use strict';
  var stage = document.body.dataset.journeyStage;
  if (!['junior','senior','university'].includes(stage)) return;
  var apiBase = location.protocol === 'http:' && location.port === '3000' ? location.protocol + '//' + location.hostname + ':3001' : '';

  function element(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = value;
    return node;
  }

  function showText(sectionId, value) {
    if (!value) return;
    var panel = document.querySelector('#' + sectionId + ' .stage-section-content');
    if (!panel) return;
    panel.replaceChildren(element('p', 'stage-user-copy', value));
  }

  function showMoments(moments) {
    if (!Array.isArray(moments) || !moments.length) return;
    var panel = document.querySelector('#moments .stage-section-content');
    if (!panel) return;
    var list = element('ol', 'stage-moments');
    moments.forEach(function (item) {
      var row = element('li', 'stage-moment');
      if (item.date) row.appendChild(element('span', 'stage-moment-date', item.date));
      var body = element('div', 'stage-moment-body');
      if (item.title) body.appendChild(element('h3', '', item.title));
      if (item.text) body.appendChild(element('p', '', item.text));
      row.appendChild(body);
      list.appendChild(row);
    });
    panel.replaceChildren(list);
  }

  function showPhotos(photos,videos) {
    var items=[...(Array.isArray(photos)?photos:[]).map((p,i)=>({...p,type:'image',order:p.order??i})),...(Array.isArray(videos)?videos:[]).map((p,i)=>({...p,type:'video',order:p.order??(photos||[]).length+i}))].sort((a,b)=>a.order-b.order);
    if (!items.length) return;
    var grid = document.querySelector('#photos .stage-photo-grid');
    if (!grid) return;
    grid.replaceChildren();
    items.forEach(function (photo) {
      if (!/^[0-9a-f-]{36}\.(webp|jpg|png|mp4|webm)$/.test(photo.id || '')) return;
      var figure = element('figure', 'stage-photo');
      var video=photo.type==='video',img = element(video?'video':'img', '', null);
      var fallback=window.CHENEY_STATIC_PREVIEW?'/assets/cms-uploads/'+encodeURIComponent(photo.id):apiBase+(video?'/api/uploads/':'/api/journey/media/')+encodeURIComponent(photo.id);
      var valid=function(value){try{var u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
      img.src = photo.url?valid(photo.url)||fallback:fallback;
      if(video){img.controls=true;img.preload='none';img.playsInline=true;img.setAttribute('aria-label',photo.caption||'行旅视频');if(photo.poster)img.poster=valid(photo.poster);}else{img.alt=photo.caption||'求学阶段照片';img.loading='lazy';}
      figure.appendChild(img);
      if (photo.caption || photo.date) figure.appendChild(element('figcaption', '', [photo.date, photo.caption].filter(Boolean).join(' · ')));
      grid.appendChild(figure);
    });
    var note = document.querySelector('#photos .stage-photo-note');
    if (note) note.hidden = true;
  }

  fetch(apiBase + '/api/journey?stage=' + encodeURIComponent(stage), { cache:'no-store' })
    .then(function (response) { if (!response.ok) throw new Error(); return response.json(); })
    .then(function (data) {
      var content = data.content || {};
      var schoolIntro = document.querySelector('[data-field="schoolIntro"]');
      if (schoolIntro && content.schoolIntro) schoolIntro.textContent = content.schoolIntro;
      showText('memory', content.story);
      showMoments(content.moments);
      showPhotos(content.photos,content.videos);
      showText('growth', content.growth);
      showText('reflection', content.reflection);
    })
    .catch(function () { /* The published page remains readable if the editor service is unavailable. */ });
})();
