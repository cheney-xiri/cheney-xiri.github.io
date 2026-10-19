(function () {
  'use strict';
  var apiBase = location.protocol === 'http:' && location.port === '3000' ? location.protocol + '//' + location.hostname + ':3001' : '';
  var form = document.getElementById('owner-form');
  var input = form.elements.password;
  var mode = document.getElementById('owner-mode');
  var status = document.getElementById('owner-status');
  var submit = document.getElementById('owner-submit');
  var inbox = document.getElementById('owner-inbox');
  var list = document.getElementById('owner-list');
  var filters = Array.from(document.querySelectorAll('[data-filter]'));
  var secret = sessionStorage.getItem('cheney-owner-secret') || '';
  var currentFilter = 'private';

  function say(message, error) { status.textContent = message; status.dataset.state = error ? 'error' : 'success'; }
  async function request(url, options) {
    var response = await fetch(apiBase + url, options || {});
    var data = await response.json();
    if (!response.ok) throw new Error(data.error || '信箱暂时无法打开');
    return data;
  }
  function make(tag, className, content) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (content != null) element.textContent = content;
    return element;
  }
  function render(messages) {
    list.replaceChildren();
    if (!messages.length) { list.appendChild(make('p','interaction-empty','这一栏还没有来信。')); return; }
    messages.forEach(function (message) {
      var card = make('article','interaction-message' + (currentFilter === 'private' ? ' owner-private' : ''));
      var head = make('div','interaction-message-head');
      head.append(make('strong','',message.name || '匿名访客'));
      var date = make('time','',new Date(message.createdAt).toLocaleDateString('zh-CN'));
      date.dateTime = message.createdAt;
      head.append(date);
      card.append(head);
      if (message.article) card.append(make('p','interaction-message-context','题跋 · ' + message.article));
      if (message.kind === 'anime' && message.subject) {
        var work = (window.CHENEY_ANIME_WORKS || []).find(function (item) { return String(item.id) === message.subject; });
        var context = make('p','interaction-message-context','观影 · ');
        var link = make('a','',work ? work.title : '作品 ' + message.subject);
        link.href = '../pastimes/anime-work.html?id=' + encodeURIComponent(message.subject);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        context.append(link);
        card.append(context);
      }
      if (message.siteName) card.append(make('p','interaction-message-context','站名 · ' + message.siteName));
      card.append(make('p','interaction-message-text',message.text));
      var remove = make('button','owner-delete','删除这条留言');
      remove.type = 'button';
      remove.addEventListener('click', async function () {
        if (!window.confirm('确定删除这条留言？')) return;
        try {
          await request('/api/owner/delete', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer ' + secret}, body:JSON.stringify({id:message.id}) });
          say('留言已删除。');
          await load(currentFilter);
        } catch (error) { say(error.message, true); }
      });
      card.append(remove);
      list.append(card);
    });
  }
  async function load(filter) {
    currentFilter = filter;
    filters.forEach(function (button) { button.setAttribute('aria-current', button.dataset.filter === filter ? 'page' : 'false'); });
    list.replaceChildren(make('p','interaction-loading','正在翻阅……'));
    try {
      var data = filter === 'private'
        ? await request('/api/owner/messages', { headers:{'Authorization':'Bearer ' + secret} })
        : filter === 'anime'
        ? await request('/api/owner/messages?kind=anime', { headers:{'Authorization':'Bearer ' + secret} })
        : await request('/api/messages?kind=' + encodeURIComponent(filter));
      render(data.messages || []);
    } catch (error) { list.replaceChildren(make('p','interaction-error',error.message)); }
  }
  filters.forEach(function (button) { button.addEventListener('click', function () { load(button.dataset.filter); }); });

  async function showInbox() {
    await request('/api/owner/messages', { headers:{'Authorization':'Bearer ' + secret} });
    if (secret) sessionStorage.setItem('cheney-owner-secret', secret);
    form.hidden = true;
    inbox.hidden = false;
    document.body.classList.add('owner-unlocked');
    mode.textContent = secret ? '身份已验证。' : '本机整理模式已开启。';
    say('信箱已打开。');
    await load('private');
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    secret = input.value;
    submit.disabled = true;
    try {
      await showInbox();
    } catch (error) { say(error.message, true); }
    finally { submit.disabled = false; }
  });

  (async function init() {
    try {
      var state = await request('/api/owner/status');
      if (state.localEditing) {
        mode.textContent = '本机整理模式：可直接阅读和管理留言。';
        await showInbox();
        return;
      }
      if (!state.configured) {
        mode.textContent = '统一后台尚未启用。请在运行网站的电脑上整理留言。';
        form.hidden = true;
        return;
      } else mode.textContent = '请输入站主密钥，阅读仅你可见的尺素。';
      form.hidden = false;
      if (secret && state.configured) {
        try { await showInbox(); } catch { sessionStorage.removeItem('cheney-owner-secret'); secret = ''; }
      }
    } catch { mode.textContent = '留言服务暂时没有连接，请稍后刷新重试。'; }
  })();
})();
