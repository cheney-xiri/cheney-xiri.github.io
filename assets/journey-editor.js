(function () {
  'use strict';
  var names = { university:'辽宁石油化工大学', senior:'唐河县第一高级中学', junior:'昝岗二中' };
  var requested = new URLSearchParams(location.search).get('stage');
  var stage = Object.prototype.hasOwnProperty.call(names, requested) ? requested : 'university';
  var apiBase = location.protocol === 'http:' && location.port === '3000' ? location.protocol + '//' + location.hostname + ':3001' : '';
  var secret = sessionStorage.getItem('cheney-owner-secret') || '';
  var photos = [];
  var auth = document.getElementById('editor-auth');
  var authForm = document.getElementById('editor-auth-form');
  var authNote = document.getElementById('editor-auth-note');
  var authStatus = document.getElementById('editor-auth-status');
  var panel = document.getElementById('editor-panel');
  var form = document.getElementById('editor-form');
  var momentList = document.getElementById('editor-moments');
  var photoList = document.getElementById('editor-photos');
  var uploadStatus = document.getElementById('editor-upload-status');
  var saveStatus = document.getElementById('editor-save-status');
  var photoInput = document.getElementById('editor-photo-input');
  var saveButton = document.getElementById('editor-save-button');

  document.getElementById('editor-heading').textContent = names[stage];
  document.getElementById('editor-preview').href = stage + '.html';
  document.querySelectorAll('[data-stage-link]').forEach(function (link) {
    if (link.dataset.stageLink === stage) {
      link.setAttribute('aria-current', 'page');
      link.removeAttribute('target');
    }
  });

  function status(node, message, state) {
    node.textContent = message;
    node.dataset.state = state || '';
  }

  async function request(route, options) {
    var response = await fetch(apiBase + route, options || {});
    var result;
    try { result = await response.json(); } catch { result = {}; }
    if (!response.ok) throw new Error(result.error || '请求未完成，请稍后重试');
    return result;
  }

  function field(label, value, max, type) {
    var wrapper = document.createElement('label');
    wrapper.className = 'editor-field';
    wrapper.append(document.createTextNode(label));
    var input = document.createElement(type === 'text' ? 'input' : 'textarea');
    if (type === 'text') input.type = 'text';
    else input.rows = 2;
    input.maxLength = max;
    input.value = value || '';
    wrapper.append(input);
    return wrapper;
  }

  function removeButton(label, onClick) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'editor-remove';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function addMoment(item) {
    if (momentList.children.length >= 12) {
      status(saveStatus, '重要时刻最多添加 12 条。', 'error');
      return;
    }
    item = item || {};
    var card = document.createElement('div');
    card.className = 'editor-moment';
    var top = document.createElement('div');
    top.className = 'editor-moment-top';
    top.append(field('时间', item.date, 28, 'text'), field('标题', item.title, 80, 'text'));
    card.append(top, field('这一刻', item.text, 800, 'textarea'));
    card.append(removeButton('删除这条', function () { card.remove(); }));
    momentList.append(card);
  }

  function renderPhotos() {
    photoList.replaceChildren();
    photos.forEach(function (photo, index) {
      var card = document.createElement('div');
      card.className = 'editor-photo';
      var image = document.createElement('img');
      image.src = apiBase + '/api/journey/media/' + encodeURIComponent(photo.id);
      image.alt = photo.caption || '阶段照片';
      var inputs = document.createElement('div');
      inputs.className = 'editor-photo-fields';
      var date = field('拍摄时间', photo.date, 28, 'text');
      var caption = field('照片说明', photo.caption, 100, 'text');
      date.querySelector('input').addEventListener('input', function (event) { photo.date = event.target.value; });
      caption.querySelector('input').addEventListener('input', function (event) { photo.caption = event.target.value; });
      inputs.append(date, caption, removeButton('移除照片', function () { photos.splice(index, 1); renderPhotos(); }));
      card.append(image, inputs);
      photoList.append(card);
    });
  }

  async function defaultSchoolIntro() {
    var response = await fetch(stage + '.html', { cache:'no-store' });
    if (!response.ok) return '';
    var documentCopy = new DOMParser().parseFromString(await response.text(), 'text/html');
    return documentCopy.querySelector('[data-field="schoolIntro"]')?.textContent.trim() || '';
  }

  async function openEditor() {
    var result = await request('/api/journey?stage=' + stage);
    var content = result.content || {};
    form.elements.schoolIntro.value = content.schoolIntro || await defaultSchoolIntro();
    form.elements.story.value = content.story || '';
    form.elements.growth.value = content.growth || '';
    form.elements.reflection.value = content.reflection || '';
    momentList.replaceChildren();
    (content.moments || []).forEach(addMoment);
    photos = (content.photos || []).slice();
    renderPhotos();
    auth.hidden = true;
    panel.hidden = false;
  }

  async function verify(candidate) {
    await request('/api/owner/verify', { headers:{ Authorization:'Bearer ' + candidate } });
    secret = candidate;
    sessionStorage.setItem('cheney-owner-secret', secret);
    await openEditor();
  }

  async function initialize() {
    try {
      var owner = await request('/api/owner/status');
      if (owner.localEditing) {
        await openEditor();
        return;
      }
      if (!owner.configured) {
        authNote.textContent = '统一后台尚未启用。请在运行网站的电脑上整理行旅。';
        return;
      }
      authNote.textContent = '输入站主密钥，即可整理这一阶段的内容。';
      authForm.hidden = false;
      if (secret) {
        try { await verify(secret); }
        catch { sessionStorage.removeItem('cheney-owner-secret'); secret = ''; }
      }
    } catch (error) {
      status(authStatus, error.message + '。请确认网站服务正在运行。', 'error');
    }
  }

  authForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    status(authStatus, '正在验证……');
    try {
      await verify(document.getElementById('editor-password').value);
      status(authStatus, '');
      document.getElementById('editor-password').value = '';
    } catch (error) { status(authStatus, error.message, 'error'); }
  });

  document.getElementById('editor-add-moment').addEventListener('click', function () { addMoment({}); });

  async function imageBlob(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 照片');
    var url = URL.createObjectURL(file);
    try {
      var picture = new Image();
      picture.src = url;
      await picture.decode();
      var ratio = Math.min(1, 1600 / Math.max(picture.naturalWidth, picture.naturalHeight));
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(picture.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(picture.naturalHeight * ratio));
      canvas.getContext('2d').drawImage(picture, 0, 0, canvas.width, canvas.height);
      var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/jpeg', .84); });
      if (!blob || blob.size > 5 * 1024 * 1024) throw new Error('这张照片处理后仍超过 5 MB');
      return blob;
    } finally { URL.revokeObjectURL(url); }
  }

  photoInput.addEventListener('change', async function () {
    var files = Array.from(photoInput.files || []);
    photoInput.disabled = true;
    try {
      for (var file of files) {
        if (photos.length >= 60) throw new Error('每段行旅最多保留 60 项影像');
        status(uploadStatus, '正在上传 ' + file.name + ' ……');
        var blob = await imageBlob(file);
        var result = await request('/api/journey/photo?stage=' + stage, { method:'POST', headers:{ Authorization:'Bearer ' + secret, 'Content-Type':'image/jpeg' }, body:blob });
        photos.push({ id:result.id, date:'', caption:'' });
        renderPhotos();
      }
      status(uploadStatus, files.length ? '照片已上传，请点击“保存并发布”完成展示。' : '', 'success');
    } catch (error) { status(uploadStatus, error.message, 'error'); }
    finally { photoInput.value = ''; photoInput.disabled = false; }
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var moments = Array.from(momentList.children).map(function (card) {
      var inputs = card.querySelectorAll('input, textarea');
      return { date:inputs[0].value.trim(), title:inputs[1].value.trim(), text:inputs[2].value.trim() };
    }).filter(function (item) { return item.date || item.title || item.text; });
    var body = {
      schoolIntro:form.elements.schoolIntro.value,
      story:form.elements.story.value,
      moments:moments,
      photos:photos,
      growth:form.elements.growth.value,
      reflection:form.elements.reflection.value
    };
    saveButton.disabled = true;
    status(saveStatus, '正在保存……');
    try {
      var result = await request('/api/journey?stage=' + stage, { method:'POST', headers:{ Authorization:'Bearer ' + secret, 'Content-Type':'application/json' }, body:JSON.stringify(body) });
      photos = result.content.photos;
      status(saveStatus, '已保存并发布。打开展示页或刷新已打开的页面即可查看。', 'success');
    } catch (error) { status(saveStatus, error.message, 'error'); }
    finally { saveButton.disabled = false; }
  });

  initialize();
})();
