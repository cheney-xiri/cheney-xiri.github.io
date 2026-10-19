'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cheney-journey-test-'));
const password = 'journey-test-owner-password-2026';
process.env.CHENEY_DATA_DIR = testDir;
process.env.CHENEY_LOCAL_EDIT = '0';
process.env.CHENEY_OWNER_PASSWORD = password;
process.env.CHENEY_PRIVATE_PHONE = '13800138000';
process.env.CHENEY_PRIVATE_WECHAT = 'private-wechat-id';
const { server, containsPrivateContact } = require('../server');

test('separate school years do not look like a phone number', () => {
  assert.equal(containsPrivateContact(['学校始建于 1939 年，1950 年迁址。', '2023 年读书，2024 年毕业。']), false);
  assert.equal(containsPrivateContact(['请拨打 138 0013 8000。']), true);
  assert.equal(containsPrivateContact(['请拨打一三八〇〇一三八〇〇〇。']), true);
});

test('owner can publish school text and photos while public readers cannot edit', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const route = '/api/journey?stage=senior';
  const original = { schoolIntro:'唐河县第一高级中学始建于 1939 年。校训：“志存高远，脚踏实地”。', story:'我的一段真实经历。', moments:[{date:'2023',title:'一次活动',text:'留下这一刻。'}], photos:[], growth:'2024 年继续读书与练习。', reflection:'继续向前。' };
  try {
    let response = await fetch(base + route);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).content.story, '');

    response = await fetch(base + route, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(original) });
    assert.equal(response.status, 401);
    response = await fetch(base + '/api/owner/verify', { headers:{Authorization:'Bearer ' + password} });
    assert.equal(response.status, 200);

    response = await fetch(base + route, { method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer ' + password}, body:JSON.stringify(original) });
    assert.equal(response.status, 200);
    response = await fetch(base + route);
    assert.deepEqual((await response.json()).content, original);

    response = await fetch(base + route, { method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer ' + password}, body:JSON.stringify({...original,story:'请加 private-wechat-id'}) });
    assert.equal(response.status, 400);
    response = await fetch(base + route);
    assert.equal((await response.json()).content.story, original.story);

    const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64');
    response = await fetch(base + '/api/journey/photo?stage=senior', { method:'POST', headers:{Authorization:'Bearer ' + password,'Content-Type':'image/png'}, body:tinyPng });
    assert.equal(response.status, 201);
    const uploaded = await response.json();
    response = await fetch(base + uploaded.url);
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), tinyPng);
    response = await fetch(base + route, { method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer ' + password}, body:JSON.stringify({...original,photos:[{id:uploaded.id,caption:'校园',date:'2023'}]}) });
    assert.equal(response.status, 200);
    response = await fetch(base + route);
    assert.equal((await response.json()).content.photos[0].caption, '校园');
  } finally {
    await new Promise(resolve => server.close(resolve));
    const target = path.resolve(testDir);
    if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('Unexpected test directory');
    fs.rmSync(target, { recursive:true, force:true });
  }
});
