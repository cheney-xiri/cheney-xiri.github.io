'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), vm = require('node:vm');
const { createStore } = require('../server/content-store.cjs');
const { applyPublishedContent } = require('../server/published-content.cjs');

test('GitHub manager keeps credentials in memory, drafts local, and rejects stale publication', async () => {
  const storage = new Map(), puts = [], token = 'only-a-test-value-not-a-real-credential', password = 'only-a-test-unlock-password';
  let doc = { version: 1, entries: [], journey: {}, animeNotes: {} }, sha = 'one';
  const base = { id: 'articles:example', collection: 'articles', basePath: 'writing/example.html', revision: 1, draft: { title: '原题', body: '原文', order: 0 }, published: { title: '原题', body: '原文', order: 0 } };
  const context = { window: {}, location: { origin: 'https://example.test' }, URL, TextEncoder, TextDecoder, Blob, structuredClone, crypto: require('node:crypto').webcrypto, btoa, atob, localStorage: { getItem: k => storage.get(k) || null, setItem: (k,v) => storage.set(k,v) }, fetch: async (url, options = {}) => {
    if (url === '/admin/catalog.json') return Response.json({ collections: { articles: '文存' }, profileFields: {}, entries: [base],site:{pages:[{path:'index.html',title:'主页',group:'home'}]} });
    assert.equal(new URL(url).origin, 'https://api.github.com');
    assert.equal(options.headers.Authorization, 'Bearer ' + token);
    assert.ok(!JSON.stringify(options).includes(password));
    if (url.endsWith('/user')) return Response.json({ login: 'cheney-xiri' });
    if (url.endsWith('/repos/cheney-xiri/cheney-xiri.github.io')) return Response.json({ permissions: { push: true } });
    if (options.method === 'PUT') {
      const body = JSON.parse(options.body); assert.equal(body.sha, sha);
      doc = JSON.parse(Buffer.from(body.content, 'base64').toString()); sha += 'x'; puts.push(body);
      return Response.json({ content: { sha }, commit: { sha: 'commit' } });
    }
    return Response.json({ sha, content: Buffer.from(JSON.stringify(doc)).toString('base64') });
  } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/admin-vault.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/github-admin.js'), 'utf8'), context);
  const call = context.window.CHENEY_GITHUB_CMS.request;
  await assert.rejects(() => call('/api/admin/entries?collection=articles'), /请先登录/);
  await call('/api/admin/setup', { body: { connectionToken: token, password, confirm: password } });
  assert.ok(!JSON.stringify([...storage]).includes(password));
  let r = await call('/api/admin/save', { method: 'POST', body: { id: base.id, collection: 'articles', revision: 1, draft: { title: '新题', body: '未公开正文', order: 0 }, publish: false } });
  assert.equal(puts.length, 0); assert.equal(r.item.published.title, '原题');
  const local=await call('/api/admin/drafts');
  assert.equal(local.items.length,1);assert.equal(local.items[0].title,'新题');assert.equal(local.items[0].stale,false);assert.ok(local.items[0].savedAt);
  assert.ok(!JSON.stringify([...storage]).includes(token));
  r = await call('/api/admin/save', { method: 'POST', body: { ...r.item, publish: true } });
  assert.equal(puts.length, 1); assert.equal(doc.entries[0].data.title, '新题'); assert.equal(doc.entries[0].revision, 2);
  assert.equal(doc.entries[0].draft, undefined); assert.ok(!JSON.stringify(doc).includes(token));
  assert.equal((await call('/api/admin/drafts')).items.length,0);
  await call('/api/admin/page',{method:'POST',body:{path:'index.html',revision:0,patches:[{type:'text',value:'设备中的草稿'}],publish:false}});
  assert.equal(puts.length,1);
  assert.equal((await call('/api/admin/drafts')).items[0].stale,false);
  doc.pages={'index.html':{revision:1,patches:[]}};
  const conflict=(await call('/api/admin/drafts')).items[0];
  assert.equal(conflict.stale,true);assert.equal(conflict.draft.patches[0].value,'设备中的草稿');
  assert.ok(!JSON.stringify(conflict).includes(token));
  doc.entries[0].revision = 3;
  await assert.rejects(() => call('/api/admin/save', { method: 'POST', body: { ...r.item, publish: true } }), /更新/);
  assert.equal(puts.length, 1);
  await call('/api/admin/logout');
  await assert.rejects(() => call('/api/admin/entries?collection=articles'), /请先登录/);
  await assert.rejects(() => call('/api/admin/login', { body: { password: 'wrong-password' } }), /密码不正确/);
  await call('/api/admin/login', { body: { password } });
  const vault = context.window.CHENEY_ADMIN_VAULT, exported = JSON.stringify(vault.export());
  assert.ok(!exported.includes(password)); assert.ok(!exported.includes(token));
  await vault.change(password, 'new-test-only-password');
  await assert.rejects(() => vault.unlock(password), /密码不正确/);
  assert.equal(await vault.unlock('new-test-only-password'), token);
  vault.import(exported); assert.equal(await vault.unlock(password), token);
  const tampered = JSON.parse(exported); tampered.ciphertext = 'A'.repeat(tampered.ciphertext.length);
  vault.import(JSON.stringify(tampered)); await assert.rejects(() => vault.unlock(password), /密码不正确/);
  await assert.rejects(() => call('/api/admin/setup', { body: { connectionToken: token, password, confirm: password } }), /已经连接/);
  await call('/api/admin/setup', { body: { connectionToken: token, password, confirm: password, reconnect: 'true' } });
  assert.equal(await vault.unlock(password), token);
});

test('public snapshot updates existing routes, adds entries, and preserves unpublished content', () => {
  const root = path.resolve(__dirname, '..'), temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'cheney-published-test-'));
  const store = createStore(root, temporary), original = store.list('articles')[0];
  const fixtureRoot = path.join(temporary, 'fixture'); fs.mkdirSync(path.join(fixtureRoot, 'data'), { recursive: true });
  try {
    const snapshot = { version: 1, entries: [{ id: original.id, collection: 'articles', data: { ...original.draft, title: '公开测试标题' }, revision: 2 }, { id: 'articles:new-example', collection: 'articles', data: { title: '新增测试', body: '测试正文' }, revision: 1 }], journey: {}, animeNotes: {} };
    const write = () => fs.writeFileSync(path.join(fixtureRoot, 'data/online-content.json'), JSON.stringify(snapshot));
    write(); applyPublishedContent(store, fixtureRoot);
    assert.equal(store.get(original.id).basePath, original.basePath);
    assert.equal(store.publicState(original.basePath, false).articles.find(x => x.id === original.id).data.title, '公开测试标题');
    assert.ok(store.publicState('writing/entry.html', false).articles.some(x => x.id === 'articles:new-example'));
    snapshot.entries[0].data = null; snapshot.entries[0].revision = 3; write(); applyPublishedContent(store, fixtureRoot);
    assert.equal(store.get(original.id).published, null);
    snapshot.entries.push(snapshot.entries[1]); write();
    assert.throws(() => applyPublishedContent(store, fixtureRoot), /重复/);
    assert.equal(store.get(original.id).revision, 3);
  } finally { store.db.close(); fs.rmSync(temporary, { recursive: true, force: true }); }
});
