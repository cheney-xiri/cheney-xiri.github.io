/* GitHub verifies publication rights; its credential is encrypted locally by admin-vault.js. */
(() => {
  'use strict';
  const REPO = 'cheney-xiri/cheney-xiri.github.io';
  const FILE = 'data/online-content.json';
  const API = 'https://api.github.com';
  const DRAFT_KEY = 'cheney-local-drafts-v1:' + REPO;
  let token = '', catalog, documentState, fileSha = '', queue = Promise.resolve();
  const noteReads = new Map();
  const empty = () => ({ version: 1, entries: [], journey: {}, animeNotes: {} });
  const encode = text => { let s = ''; for (const byte of new TextEncoder().encode(text)) s += String.fromCharCode(byte); return btoa(s); };
  const decode = text => new TextDecoder().decode(Uint8Array.from(atob(text.replace(/\s/g, '')), x => x.charCodeAt(0)));
  function drafts() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; } }
  function keepDraft(id, value) { const all = drafts(); if (value) all[id] = value; else delete all[id]; localStorage.setItem(DRAFT_KEY, JSON.stringify(all)); }
  async function github(path, options = {}) {
    if (!token) throw new Error('请先输入此仓库的 GitHub 管理凭据');
    const response = await fetch(API + path, { ...options, headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, ...options.headers }, cache: 'no-store', referrerPolicy: 'no-referrer' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = response.status === 401 ? '管理凭据无效或已过期，请重新登录' : response.status === 403 ? '没有写入权限或请求过多。请确认只授权此仓库，并给 Contents 读写权限' : response.status === 409 || response.status === 422 ? '其他设备已修改内容，请重新打开条目再发布' : 'GitHub 暂时无法完成操作，请稍后重试';
      throw Object.assign(new Error(message), { status: response.status });
    }
    return data;
  }
  async function readDocument(ref = 'main') {
    try {
      const data = await github('/repos/' + REPO + '/contents/' + FILE + '?ref=' + encodeURIComponent(ref));
      const doc = data.content ? JSON.parse(decode(data.content)) : await github('/repos/' + REPO + '/contents/' + FILE + '?ref=' + encodeURIComponent(ref), { headers: { Accept: 'application/vnd.github.raw+json' } });
      if (doc.version !== 1 || !Array.isArray(doc.entries)) throw new Error('在线内容格式不正确');
      if (ref === 'main') { documentState = doc; fileSha = data.sha; }
      return doc;
    } catch (error) {
      if (error.status !== 404) throw error;
      const doc = empty(); if (ref === 'main') { documentState = doc; fileSha = ''; } return doc;
    }
  }
  function merged(collection, doc = documentState) {
    const items = new Map(catalog.entries.filter(x => x.collection === collection).map(x => [x.id, structuredClone(x)]));
    for (const item of doc.entries.filter(x => x.collection === collection)) {
      const before = items.get(item.id);
      items.set(item.id, { ...before, id: item.id, collection, basePath: before?.basePath || '', published: item.data, draft: item.data || before?.draft || { title: '已撤下内容' }, revision: item.revision, touched: true });
    }
    for (const item of Object.values(drafts()).filter(x => x.collection === collection)) {
      const before = items.get(item.id);
      // A stale local draft never replaces a newer publication from another device.
      if (!before || item.revision === before.revision) items.set(item.id, { ...before, ...item, published: before?.published || null });
    }
    return [...items.values()].sort((a, b) => Number(a.draft.order) - Number(b.draft.order));
  }
  async function writeDocument(mutate, message) {
    const run = async () => {
      await readDocument();
      const next = structuredClone(documentState);
      mutate(next);
      const body = { message, branch: 'main', content: encode(JSON.stringify(next, null, 2) + '\n'), ...(fileSha ? { sha: fileSha } : {}) };
      const result = await github('/repos/' + REPO + '/contents/' + FILE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      documentState = next; fileSha = result.content.sha;
      return result;
    };
    const task = queue.then(run, run); queue = task.catch(() => {}); return task;
  }
  async function save(body) {
    const collection = body.collection;
    if (!catalog.collections[collection]) throw new Error('内容分类不正确');
    await readDocument();
    const existing = body.id ? merged(collection).find(x => x.id === body.id) : null;
    if (body.id && !existing) throw new Error('内容不存在，请重新打开');
    if (existing && body.revision !== existing.revision) throw new Error('内容已在其他设备更新，请重新打开');
    const draft = structuredClone(body.draft);
    if (!String(draft?.title || '').trim()) throw new Error('请填写标题或句子');
    const id = existing?.id || collection + ':' + crypto.randomUUID();
    const item = { ...existing, id, collection, basePath: existing?.basePath || '', revision: existing?.revision || 0, draft, published: existing?.published || null };
    if (!body.publish) { keepDraft(id, item); return { ok: true, item }; }
    await writeDocument(next => {
      const remote = next.entries.find(x => x.id === id);
      const base = catalog.entries.find(x => x.id === id);
      if ((remote?.revision ?? base?.revision ?? 0) !== item.revision) throw new Error('内容已在其他设备更新，请重新打开后发布');
      const record = { id, collection, data: draft, revision: item.revision + 1 };
      next.entries = next.entries.filter(x => x.id !== id); next.entries.push(record);
    }, 'Publish ' + collection + ' content from website manager');
    keepDraft(id, null);
    return { ok: true, item: merged(collection).find(x => x.id === id) };
  }
  async function request(path, options = {}) {
    const u = new URL(path, location.origin), p = u.pathname, body = options.body || {};
    if (p === '/api/admin/session') { const configured = window.CHENEY_ADMIN_VAULT.configured(); return { authenticated: !!token, configured, canSetup: !configured, mode: 'github' }; }
    if (p === '/api/admin/login' || p === '/api/admin/setup') {
      const first = p.endsWith('/setup');
      if (first && window.CHENEY_ADMIN_VAULT.configured() && body.reconnect !== 'true') throw new Error('这台设备已经连接，请使用解锁密码登录');
      if (first && body.password !== body.confirm) throw new Error('两次解锁密码不一致');
      token = first ? String(body.connectionToken || '').trim() : await window.CHENEY_ADMIN_VAULT.unlock(String(body.password || ''));
      try {
        const user = await github('/user');
        if (String(user.login || '').toLowerCase() !== REPO.split('/')[0]) throw new Error('仅站主的 GitHub 账号可以连接和发布');
        const repo = await github('/repos/' + REPO);
        if (!repo.permissions?.push) throw new Error('此凭据没有该仓库的编辑权限');
        const response = await fetch('/admin/catalog.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('管理目录加载失败，请刷新重试');
        catalog = await response.json(); await readDocument();
        if (first) await window.CHENEY_ADMIN_VAULT.create(token, body.password);
      } catch (error) { token = ''; throw error; }
      return { ok: true, csrfToken: '' };
    }
    if (p === '/api/admin/logout') { token = ''; catalog = null; documentState = null; fileSha = ''; noteReads.clear(); return { ok: true }; }
    if (!token) throw new Error('请先登录后台');
    if (p === '/api/admin/password') { await window.CHENEY_ADMIN_VAULT.change(body.currentPassword, body.password); return { ok: true, csrfToken: '' }; }
    if (p === '/api/admin/meta') return { collections: catalog.collections, profileFields: catalog.profileFields, storage: 'github', extraViews: ['journey', 'anime'] };
    if (p === '/api/admin/entries') { await readDocument(); return { items: merged(u.searchParams.get('collection')) }; }
    if (p === '/api/admin/save') return save(body);
    if (p === '/api/admin/unpublish') {
      const existing = Object.keys(catalog.collections).flatMap(c => merged(c)).find(x => x.id === body.id);
      if (!existing) throw new Error('内容不存在');
      await writeDocument(next => {
        const remote = next.entries.find(x => x.id === body.id);
        const base = catalog.entries.find(x => x.id === body.id);
        if ((remote?.revision ?? base?.revision ?? 0) !== body.revision) throw new Error('内容已更新，请重新打开');
        next.entries = next.entries.filter(x => x.id !== body.id);
        next.entries.push({ id: body.id, collection: existing.collection, data: null, revision: body.revision + 1 });
      }, 'Unpublish content from website manager');
      keepDraft(body.id, { ...existing, revision: body.revision + 1, published: null });
      return { ok: true, item: merged(existing.collection).find(x => x.id === body.id) };
    }
    if (p === '/api/admin/history') {
      const commits = await github('/repos/' + REPO + '/commits?path=' + FILE + '&per_page=5');
      const result = await Promise.allSettled(commits.map(async commit => {
        const doc = await readDocument(commit.sha), entry = doc.entries.find(x => x.id === u.searchParams.get('id'));
        return entry?.data ? { id: commit.sha, revision: entry.revision, draft: entry.data, updatedAt: commit.commit.author.date } : null;
      }));
      return { items: result.filter(x => x.status === 'fulfilled' && x.value).map(x => x.value) };
    }
    if (p === '/api/admin/restore-version') {
      const old = (await readDocument(body.version)).entries.find(x => x.id === body.id);
      if (!old?.data) throw new Error('这个历史版本没有此条内容');
      return save({ id: body.id, collection: old.collection, revision: body.revision, draft: old.data, publish: false });
    }
    if (p === '/api/admin/upload' || p === '/api/journey/photo') {
      const blob = options.body;
      if (!(blob instanceof Blob) || !['image/webp','image/png','image/jpeg'].includes(blob.type) || blob.size > 700 * 1024) throw new Error('请上传压缩后的 JPG、PNG 或 WebP 图片');
      const ext = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[blob.type];
      const id = crypto.randomUUID() + '.' + ext, file = 'assets/cms-uploads/' + id;
      let binary = ''; for (const byte of new Uint8Array(await blob.arrayBuffer())) binary += String.fromCharCode(byte);
      await github('/repos/' + REPO + '/contents/' + file, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Upload content image', branch: 'main', content: btoa(binary) }) });
      return { ok: true, id, url: 'https://raw.githubusercontent.com/' + REPO + '/main/' + file, photo: { id, url: 'https://raw.githubusercontent.com/' + REPO + '/main/' + file } };
    }
    if (p === '/api/journey' || p === '/api/anime-note') {
      const isJourney = p === '/api/journey', key = u.searchParams.get(isJourney ? 'stage' : 'id'), group = isJourney ? 'journey' : 'animeNotes';
      const readKey = group + ':' + key;
      if (isJourney ? !['junior','senior','university'].includes(key) : !/^\d{1,9}$/.test(key)) throw new Error('内容编号不正确');
      if (options.method === 'POST') {
        await writeDocument(next => { next[group] ||= {}; if (!noteReads.has(readKey) || JSON.stringify(next[group][key] || null) !== noteReads.get(readKey)) throw new Error('内容已在其他设备更新，请重新打开后发布'); next[group][key] = body; }, 'Publish ' + group + ' content from website manager');
        noteReads.set(readKey, JSON.stringify(body));
        return { ok: true, content: body };
      }
      await readDocument(); noteReads.set(readKey, JSON.stringify(documentState[group]?.[key] || null)); return { content: documentState[group]?.[key] || catalog[group]?.[key] || null };
    }
    if (p === '/api/admin/backup') return { format: 'cheney-public-content-v1', exportedAt: new Date().toISOString(), ...documentState, localDrafts: drafts() };
    throw new Error('此管理功能不适用于 GitHub 内容服务');
  }
  window.CHENEY_GITHUB_CMS = { request, repo: REPO };
})();
