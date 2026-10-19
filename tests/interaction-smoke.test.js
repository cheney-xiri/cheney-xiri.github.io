'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cheney-interaction-test-'));
process.env.CHENEY_DATA_DIR = testDir;
process.env.CHENEY_POST_GAP_MS = '0';
process.env.CHENEY_LOCAL_EDIT = '0';
process.env.CHENEY_PRIVATE_PHONE = '13800138000';
process.env.CHENEY_PRIVATE_WECHAT = 'private-wechat-id';
const { server } = require('../server');

async function request(base, route, method, body, password) {
  const response = await fetch(base + route, {
    method: method || 'GET',
    headers: { ...(body ? { 'Content-Type':'application/json' } : {}), ...(password ? { Authorization:'Bearer ' + password } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: response.status, data: await response.json() };
}

test('public replies, private letters and contact blocking stay separate', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const publicPost = await request(base, '/api/messages', 'POST', {kind:'wall',name:'访客',text:'你好，初次来访。'});
    assert.equal(publicPost.status, 201);
    const reply = await request(base, '/api/messages', 'POST', {kind:'wall',name:'另一位访客',text:'欢迎来访！',parentId:publicPost.data.id});
    assert.equal(reply.status, 201);
    const wall = await request(base, '/api/messages?kind=wall');
    assert.equal(wall.data.messages.length, 2);
    assert.equal(wall.data.messages[0].parentId, publicPost.data.id);

    const privatePost = await request(base, '/api/messages', 'POST', {kind:'letter',name:'写信人',text:'只给站主看的内容。',visibility:'private'});
    assert.equal(privatePost.status, 201);
    assert.equal(privatePost.data.visibility, 'private');
    const publicLetters = await request(base, '/api/messages?kind=letter');
    assert.deepEqual(publicLetters.data.messages, []);
    const withoutPassword = await request(base, '/api/owner/messages');
    assert.equal(withoutPassword.status, 401);

    const ownerPassword = 'this-is-a-long-owner-password';
    const setup = await request(base, '/api/owner/setup', 'POST', {password:ownerPassword});
    assert.equal(setup.status, 201);
    const inbox = await request(base, '/api/owner/messages', 'GET', null, ownerPassword);
    assert.equal(inbox.status, 200);
    assert.equal(inbox.data.messages.length, 1);
    assert.equal(inbox.data.messages[0].text, '只给站主看的内容。');

    const blockedPhone = await request(base, '/api/messages', 'POST', {kind:'wall',text:'请打 138 0013 8000 找我。'});
    assert.equal(blockedPhone.status, 400);
    const blockedWechat = await request(base, '/api/messages', 'POST', {kind:'wall',text:'请加 private-wechat-id 交流。'});
    assert.equal(blockedWechat.status, 400);
    const wallAfter = await request(base, '/api/messages?kind=wall');
    assert.equal(wallAfter.data.messages.length, 2);

    const firstAnime = await request(base, '/api/messages', 'POST', {kind:'anime',subject:'101',name:'甲',text:'雨夜车站让我想起等待的漫长。'});
    assert.equal(firstAnime.status, 201);
    const secondAnime = await request(base, '/api/messages', 'POST', {kind:'anime',subject:'102',name:'乙',text:'这一部的结尾我有不同理解。'});
    assert.equal(secondAnime.status, 201);
    const firstComments = await request(base, '/api/messages?kind=anime&subject=101');
    assert.equal(firstComments.data.messages.length, 1);
    assert.equal(firstComments.data.messages[0].subject, '101');
    const crossReply = await request(base, '/api/messages', 'POST', {kind:'anime',subject:'102',text:'不应挂在另一部作品下面',parentId:firstAnime.data.id});
    assert.equal(crossReply.status, 400);
    const animeReply = await request(base, '/api/messages', 'POST', {kind:'anime',subject:'101',name:'丙',text:'我也记得那段等待。',parentId:firstAnime.data.id});
    assert.equal(animeReply.status, 201);

    const emptyNote = await request(base, '/api/anime-note?id=101');
    assert.equal(emptyNote.data.content, null);
    const forbiddenSave = await request(base, '/api/anime-note?id=101', 'POST', {note:'访客试写',diary:'',date:''});
    assert.ok([401,429].includes(forbiddenSave.status));
    const savedNote = await request(base, '/api/anime-note?id=101', 'POST', {note:'只属于这部作品的片段与解读。',diary:'',date:''}, ownerPassword);
    assert.equal(savedNote.status, 200);
    const publishedNote = await request(base, '/api/anime-note?id=101');
    assert.deepEqual(publishedNote.data.content, {note:'只属于这部作品的片段与解读。',diary:'',date:''});
    const ownerAnime = await request(base, '/api/owner/messages?kind=anime', 'GET', null, ownerPassword);
    assert.equal(ownerAnime.status, 200);
    assert.equal(ownerAnime.data.messages.length, 3);
    process.env.CHENEY_LOCAL_EDIT = '1';
    const localStatus = await request(base, '/api/owner/status');
    assert.equal(localStatus.data.localEditing, true);
    const localSave = await request(base, '/api/anime-note?id=102', 'POST', {note:'本机整理的新片段',diary:'',date:''});
    assert.equal(localSave.status, 200);
    const localInbox = await request(base, '/api/owner/messages?kind=anime');
    assert.equal(localInbox.status, 200);
  } finally {
    process.env.CHENEY_LOCAL_EDIT = '0';
    await new Promise(resolve => server.close(resolve));
    const target = path.resolve(testDir);
    const parent = path.resolve(os.tmpdir()) + path.sep;
    if (!target.startsWith(parent)) throw new Error('Test data is outside the temporary directory');
    fs.rmSync(target, { recursive:true, force:true });
  }
});
