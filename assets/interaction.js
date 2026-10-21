(function () {
  'use strict';
  var kind = document.body.dataset.interactionKind;
  if (!['wall','letter','ally','featured'].includes(kind)) return;
  var apiBase = location.protocol === 'http:' && location.port === '3000' ? location.protocol + '//' + location.hostname + ':3001' : '';
  var form = document.getElementById('interaction-form');
  var list = document.getElementById('interaction-list');
  var status = document.getElementById('interaction-status');
  var submit = form.querySelector('button[type="submit"]');
  var cancel = document.getElementById('cancel-reply');
  var parentInput = form.elements.parentId;
  var visibilityField = form.querySelector('.interaction-visibility');
  var heading = document.getElementById('compose-heading');

  document.querySelectorAll('.interaction-switch a').forEach(function (link) {
    if (link.dataset.kind === kind) link.setAttribute('aria-current', 'page');
  });
  document.querySelectorAll('[data-only]').forEach(function (field) {
    field.hidden = field.dataset.only !== kind;
  });

  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state || '';
  }
  function node(tag, className, value) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (value != null) el.textContent = value;
    return el;
  }
  function messageDate(value) {
    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' }).format(date);
  }
  function disclosesContact(fields) {
    var text = fields.join(' ').normalize('NFKC').replace(/[零〇一二三四五六七八九]/g, function (char) { return ({零:'0',〇:'0',一:'1',二:'2',三:'3',四:'4',五:'5',六:'6',七:'7',八:'8',九:'9'})[char]; });
    var digits = text.replace(/\D/g, '');
    return /1[3-9]\d{9}/.test(digits) || /(?:微信号?|wechat|wxid|vx)\s*[:：号id\s-]*[a-z0-9_-]{5,}/i.test(text);
  }
  function resetReply() {
    parentInput.value = '';
    heading.textContent = '写下你的话';
    cancel.hidden = true;
    if (visibilityField) visibilityField.hidden = true;
  }
  cancel.addEventListener('click', resetReply);

  function startReply(message) {
    parentInput.value = message.id;
    heading.textContent = '回复 ' + message.name;
    cancel.hidden = false;
    if (kind === 'letter') return;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.elements.text.focus({ preventScroll: true });
  }

  function makeMessage(message, isReply) {
    var card = node('article', 'interaction-message');
    var header = node('div', 'interaction-message-head');
    header.appendChild(node('strong', '', message.name || '匿名访客'));
    var time = node('time', '', messageDate(message.createdAt));
    time.dateTime = message.createdAt;
    header.appendChild(time);
    card.appendChild(header);
    if (message.article) card.appendChild(node('p','interaction-message-context','读后 · ' + message.article));
    if (message.siteName || message.siteUrl) {
      var context = node('p','interaction-message-context','结盟 · ');
      if (message.siteUrl) {
        try {
          var url = new URL(message.siteUrl);
          if (['http:','https:'].includes(url.protocol)) {
            var link = node('a','',message.siteName || url.hostname);
            link.href = url.href;
            link.target = '_blank';
            link.rel = 'nofollow noopener noreferrer';
            context.appendChild(link);
          }
        } catch {}
      } else context.appendChild(document.createTextNode(message.siteName));
      card.appendChild(context);
    }
    card.appendChild(node('p','interaction-message-text',message.text));
    if (!isReply) {
      var button = node('button','interaction-message-reply','回应此条');
      button.type = 'button';
      button.addEventListener('click', function () { startReply(message); });
      card.appendChild(button);
    }
    return card;
  }

  function renderMessages(messages) {
    list.replaceChildren();
    if (!messages.length) {
      list.appendChild(node('p','interaction-empty',kind === 'letter' ? '还没有公开的尺素。' : '这里还没有留言，欢迎留下第一笔。'));
      return;
    }
    var ids = new Set(messages.map(function (item) { return item.id; }));
    var roots = messages.filter(function (item) { return !item.parentId || !ids.has(item.parentId); });
    roots.forEach(function (message) {
      var card = makeMessage(message, false);
      var replies = messages.filter(function (item) { return item.parentId === message.id; }).reverse();
      if (replies.length) {
        var thread = node('div','interaction-replies');
        replies.forEach(function (reply) { thread.appendChild(makeMessage(reply, true)); });
        card.appendChild(thread);
      }
      list.appendChild(card);
    });
  }

  async function loadMessages() {
    if(kind==='letter'){list.replaceChildren();list.hidden=true;return;}
    try {
      var response = await fetch(apiBase + '/api/messages?kind=' + encodeURIComponent(kind), { cache: 'no-store' });
      if (!response.ok) throw new Error('服务暂时不可用');
      var data = await response.json();
      if(data.preview){list.replaceChildren(node('p','interaction-empty','评论服务尚未开放，开放后留言会展示在这里。'));return;}renderMessages(data.messages || []);
    } catch {
      list.replaceChildren(node('p','interaction-error','留言服务暂时没有连接，请稍后刷新重试。'));
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var fields = new FormData(form);
    var payload = {
      kind: kind,
      name: String(fields.get('name') || '').trim(),
      text: String(fields.get('text') || '').trim(),
      siteName: String(fields.get('siteName') || '').trim(),
      siteUrl: String(fields.get('siteUrl') || '').trim(),
      article: String(fields.get('article') || '').trim(),
      visibility: kind === 'letter' ? 'private' : 'public',
      parentId: kind === 'letter' ? '' : String(fields.get('parentId') || ''),
      confirm: String(fields.get('confirm') || '')
    };
    if (payload.text.length < 2) return setStatus('请至少写下两个字。', 'error');
    if (disclosesContact([payload.name,payload.text,payload.siteName,payload.siteUrl,payload.article])) return setStatus('请勿发布微信号或电话号码。', 'error');
    submit.disabled = true;
    setStatus('正在送出……');
    try {
      var response = await fetch(apiBase + '/api/messages', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || '提交失败');
      form.reset();
      resetReply();
      setStatus(data.visibility === 'private' ? '尺素已送达。仅站主可以阅读，不会公开显示。' : '留言已写入，感谢你的来访。', 'success');
      if (data.visibility === 'public') await loadMessages();
    } catch (error) {
      setStatus(error.message === 'Failed to fetch' ? '留言服务暂时没有连接，请稍后重试。' : error.message, 'error');
    } finally { submit.disabled = false; }
  });

  loadMessages();
})();
