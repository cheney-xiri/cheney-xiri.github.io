(async function () {
  'use strict';
  await window.CHENEY_PASTIME_LIBRARY?.ready;
  if (document.body.dataset.page !== 'work') return;

  const $ = id => document.getElementById(id);
  const works = window.CHENEY_ANIME_WORKS || [];
  const work = works.find(item => String(item.id) === new URLSearchParams(location.search).get('id'));
  if (!work) return;
  const apiBase = location.protocol === 'http:' && location.port === '3000'
    ? location.protocol + '//' + location.hostname + ':3001' : '';
  const noteUrl = apiBase + '/api/anime-note?id=' + encodeURIComponent(work.id);
  const commentsUrl = apiBase + '/api/messages?kind=anime&subject=' + encodeURIComponent(work.id);
  const defaultNote = window.CHENEY_ANIME_NOTES?.[work.title] || '';
  let published = null;
  let ownerSecret = '';
  let editorAuthorized = false;
  let localReady = false;

  function make(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content != null) element.textContent = content;
    return element;
  }
  function renderNote(content) {
    const entry = content || { note:defaultNote, diary:'', date:'' };
    $('published-note').textContent = entry.note || '这一页尚待补充。';
    $('published-diary').textContent = entry.diary || '';
    $('published-diary-wrap').hidden = !entry.diary;
    $('published-date').textContent = entry.date ? '观影日期 · ' + entry.date : '';
    $('published-date').hidden = !entry.date;
  }
  function fillEditor(content) {
    const entry = content || { note:defaultNote, diary:'', date:'' };
    $('watch-note').value = entry.note || '';
    $('watch-diary').value = entry.diary || '';
    $('watch-date').value = entry.date || '';
  }
  async function request(url, options) {
    const response = await fetch(url, options || {});
    let data;
    try { data = await response.json(); } catch { throw new Error('服务暂时无法连接'); }
    if (!response.ok) throw new Error(data.error || '请求未完成');
    return data;
  }

  renderNote(null);
  fillEditor(null);
  const noteRequest = request(noteUrl, { cache:'no-store' }).then(data => {
    published = data.content;
    renderNote(published);
    if ($('watch-editor').hidden) fillEditor(published);
  }).catch(() => {
    $('watch-auth-status').textContent = '公开手记暂时无法同步。';
  });

  function legacyNote() {
    try {
      const saved = JSON.parse(localStorage.getItem('cheney-anime-note-v1-' + work.id) || 'null');
      return saved && typeof saved === 'object' ? saved : null;
    } catch { return null; }
  }
  async function unlock(secret, local) {
    if (!local) await request(apiBase + '/api/owner/verify', { headers:{ Authorization:'Bearer ' + secret } });
    await noteRequest;
    ownerSecret = secret;
    editorAuthorized = true;
    if (secret) sessionStorage.setItem('cheney-owner-secret', secret);
    const legacy = !published && legacyNote();
    fillEditor(published || legacy);
    $('watch-editor').hidden = false;
    $('watch-auth').hidden = true;
    $('watch-unlock').hidden = true;
    $('watch-auth-status').textContent = legacy ? '已载入本机旧手记。确认内容后，请保存发布。' : local ? '本机整理模式已开启。' : '已解锁，修改后点击保存。';
  }
  request(apiBase + '/api/owner/status', { cache:'no-store' }).then(state => {
    if (state.localEditing) {
      localReady = true;
      $('watch-unlock').textContent = '编辑手记';
      $('watch-auth-status').textContent = '本机可直接编辑。';
    }
    else if (!state.configured) {
      $('watch-unlock').hidden = true;
      $('watch-auth-status').textContent = '手记暂时只在本机整理。';
    }
  }).catch(() => {});
  $('watch-unlock').addEventListener('click', async () => {
    if (localReady) { await unlock('', true); return; }
    const remembered = sessionStorage.getItem('cheney-owner-secret') || '';
    if (remembered) {
      try { await unlock(remembered); return; }
      catch { sessionStorage.removeItem('cheney-owner-secret'); }
    }
    $('watch-auth').hidden = false;
    $('watch-password').focus();
  });
  $('watch-login').addEventListener('click', async () => {
    const secret = $('watch-password').value;
    $('watch-auth-status').textContent = '正在验证…';
    try {
      await unlock(secret);
      $('watch-password').value = '';
    } catch (error) { $('watch-auth-status').textContent = error.message; }
  });
  $('watch-password').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); $('watch-login').click(); }
  });
  $('save-watch-note').addEventListener('click', async () => {
    if (!editorAuthorized) return;
    const button = $('save-watch-note');
    const content = { note:$('watch-note').value, diary:$('watch-diary').value, date:$('watch-date').value };
    button.disabled = true;
    $('save-status').textContent = '正在保存…';
    try {
      const data = await request(noteUrl, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + ownerSecret },
        body:JSON.stringify(content)
      });
      published = data.content;
      renderNote(published);
      try { localStorage.setItem('cheney-anime-note-v1-' + work.id, JSON.stringify(published)); } catch {}
      $('save-status').textContent = '已发布，访客现在可以看到更新。';
    } catch (error) { $('save-status').textContent = error.message; }
    finally { button.disabled = false; }
  });

  const form = $('anime-comment-form');
  const list = $('anime-comment-list');
  const status = $('anime-comment-status');
  const cancel = $('anime-cancel-reply');
  function commentDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' }).format(date);
  }
  function resetReply() {
    form.elements.parentId.value = '';
    $('anime-compose-heading').textContent = '写下你的看法';
    cancel.hidden = true;
  }
  cancel.addEventListener('click', resetReply);
  function makeComment(message, isReply) {
    const card = make('article', 'aw-comment' + (isReply ? ' aw-comment-reply' : ''));
    const head = make('div', 'aw-comment-head');
    head.append(make('strong', '', message.name || '匿名访客'));
    const time = make('time', '', commentDate(message.createdAt));
    time.dateTime = message.createdAt;
    head.append(time);
    card.append(head, make('p', 'aw-comment-body', message.text));
    if (!isReply) {
      const reply = make('button', 'aw-reply-button', '回应这条');
      reply.type = 'button';
      reply.addEventListener('click', () => {
        form.elements.parentId.value = message.id;
        $('anime-compose-heading').textContent = '回应 ' + message.name;
        cancel.hidden = false;
        form.scrollIntoView({ behavior:'smooth', block:'start' });
        form.elements.text.focus({ preventScroll:true });
      });
      card.append(reply);
    }
    return card;
  }
  function renderComments(messages) {
    list.replaceChildren();
    if (!messages.length) {
      list.append(make('p', 'aw-comment-empty', '还没有留言。你记住了哪一个画面？'));
      return;
    }
    const ids = new Set(messages.map(item => item.id));
    for (const message of messages.filter(item => !item.parentId || !ids.has(item.parentId))) {
      const card = makeComment(message, false);
      const replies = messages.filter(item => item.parentId === message.id).reverse();
      if (replies.length) {
        const thread = make('div', 'aw-comment-thread');
        for (const reply of replies) thread.append(makeComment(reply, true));
        card.append(thread);
      }
      list.append(card);
    }
  }
  async function loadComments() {
    try {
      const data = await request(commentsUrl, { cache:'no-store' });
      renderComments(data.messages || []);
    } catch {
      list.replaceChildren(make('p', 'aw-comment-empty', '评论暂时无法加载，请稍后重试。'));
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = {
      kind:'anime',
      subject:String(work.id),
      name:form.elements.name.value.trim(),
      text:form.elements.text.value.trim(),
      parentId:form.elements.parentId.value,
      confirm:form.elements.confirm.value
    };
    if (payload.text.length < 2) { status.textContent = '请至少写下两个字。'; return; }
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    status.textContent = '正在送出…';
    try {
      await request(apiBase + '/api/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify(payload)
      });
      form.reset();
      resetReply();
      status.textContent = '留言已发布。';
      await loadComments();
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
  loadComments();
})();
