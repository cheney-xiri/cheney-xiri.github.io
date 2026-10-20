'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'cheney-admin-test-'));process.env.CHENEY_DATA_DIR=directory;process.env.CHENEY_LOCAL_EDIT='0';process.env.CHENEY_POST_GAP_MS='0';const {server}=require('../server');
test('admin authentication, drafts, publication, history and private messages',async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let cookie='',csrf='';
 async function call(route,method='GET',body,auth=true,headers={}){const r=await fetch(base+route,{method,headers:{...(auth?{Cookie:cookie,'X-CSRF-Token':csrf}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});return{status:r.status,data:await r.json(),headers:r.headers};}
 try{
  assert.equal((await call('/api/admin/entries?collection=articles','GET',undefined,false)).status,401);
  const setup=await call('/api/admin/setup','POST',{password:'test-only-long-password-2026'},false);assert.equal(setup.status,200);cookie=setup.headers.get('set-cookie').split(';')[0];csrf=setup.data.csrfToken;assert.ok(setup.headers.get('set-cookie').includes('HttpOnly'));assert.ok(setup.headers.get('set-cookie').includes('SameSite=Strict'));
  const meta=await call('/api/admin/meta');assert.equal(meta.status,200);assert.equal(meta.data.counts.quotes,210);assert.ok(meta.data.counts.music>=330);
  const pages=await call('/api/admin/site-catalog');assert.ok(pages.data.pages.some(x=>x.path==='index.html'));assert.ok(pages.data.media.length>1000);
  assert.equal((await call('/api/admin/site-catalog','GET',undefined,false)).status,401);
  const pageBefore=(await call('/api/admin/page?path=index.html')).data.record;
  const pagePatch={id:'local-test',type:'text',selector:'.hero-name',textIndex:0,original:'Cheney',value:'仅本地隔离测试'};
  const pageBody={path:'index.html',revision:pageBefore.revision,patches:[pagePatch]};
  assert.equal((await call('/api/admin/page','POST',pageBody)).status,200);
  assert.equal((await call('/api/site-edits','GET',undefined,false)).data.pages['index.html']?.patches?.[0]?.value===pagePatch.value,false);
  assert.equal((await call('/api/admin/page','POST',{...pageBody,publish:true})).status,200);
  assert.equal((await call('/api/site-edits','GET',undefined,false)).data.pages['index.html'].patches[0].value,pagePatch.value);
  assert.equal((await call('/api/admin/page','POST',{...pageBody,publish:true})).status,409);
  assert.equal((await call('/api/admin/source?path=.site-data/owner.json')).status,400);
  const video=Buffer.from([0,0,0,16,102,116,121,112,105,115,111,109,0,0,0,0]);
  const uploaded=await fetch(base+'/api/admin/media',{method:'POST',headers:{Cookie:cookie,'X-CSRF-Token':csrf,'Content-Type':'video/mp4'},body:video});assert.equal(uploaded.status,200);const videoUrl=(await uploaded.json()).url;
  const media=await fetch(base+videoUrl);assert.equal(media.headers.get('content-type'),'video/mp4');assert.equal((await media.arrayBuffer()).byteLength,video.length);
  const badUpload=await fetch(base+'/api/admin/media',{method:'POST',headers:{Cookie:cookie,'X-CSRF-Token':csrf,'Content-Type':'video/mp4'},body:'not-a-video'});assert.equal(badUpload.status,400);
  const before=await call('/api/content?collection=articles');
  let r=await call('/api/admin/save','POST',{collection:'articles',draft:{title:'测试草稿 <img src=x onerror=alert(1)>',body:'## 第一节\n\n尚未公开的正文。',summary:'简介',category:'测试',order:-1}});assert.equal(r.status,200);let item=r.data.item;assert.equal(item.published,null);
  assert.equal((await call('/api/content?collection=articles')).data.items.length,before.data.items.length);
  assert.equal((await call('/api/content?collection=articles&preview=1','GET',undefined,false)).status,401);
  const preview=await call('/api/content?collection=articles&preview=1');assert.ok(preview.data.items.some(x=>x.id===item.id));
  const noCsrf=await call('/api/admin/save','POST',{id:item.id,collection:'articles',revision:item.revision,draft:item.draft,publish:true},true,{'X-CSRF-Token':''});assert.equal(noCsrf.status,401);
  assert.equal((await call('/api/admin/save','POST',{collection:'articles',draft:{title:'bad',cover:'javascript:alert(1)'}})).status,400);
  assert.equal((await call('/api/admin/save','POST',{collection:'articles',draft:{title:'bad'}},true,{Origin:'https://other.example'})).status,403);
  r=await call('/api/admin/save','POST',{id:item.id,collection:'articles',revision:item.revision,draft:item.draft,publish:true});assert.equal(r.status,200);const stale=item.revision;item=r.data.item;assert.equal(item.touched,true);
  assert.ok((await call('/api/content?collection=articles')).data.items.some(x=>x.id===item.id));
  const html=await(await fetch(base+'/writing/entry.html?id='+encodeURIComponent(item.id))).text();assert.ok(html.includes('\\u003cimg'));assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  assert.equal((await call('/api/admin/save','POST',{id:item.id,collection:'articles',revision:stale,draft:item.draft})).status,409);
  const history=(await call('/api/admin/history?id='+encodeURIComponent(item.id))).data.items;assert.ok(history.length);
  const draft={...item.draft,body:'第二版尚未发布'};r=await call('/api/admin/save','POST',{id:item.id,collection:'articles',revision:item.revision,draft});item=r.data.item;assert.equal(item.published.body,'## 第一节\n\n尚未公开的正文。');
  r=await call('/api/admin/unpublish','POST',{id:item.id,revision:item.revision});item=r.data.item;assert.ok(!(await call('/api/content?collection=articles')).data.items.some(x=>x.id===item.id));
  const letter=await call('/api/messages','POST',{kind:'letter',text:'这是一封私信。',visibility:'private'},false);assert.equal(letter.status,201);assert.equal((await call('/api/messages?kind=letter')).data.messages.length,0);assert.ok((await call('/api/admin/messages')).data.messages.some(x=>x.id===letter.data.id));
  const backup=await call('/api/admin/backup');assert.ok(backup.data.entries.some(x=>x.id===item.id));assert.ok(!JSON.stringify(backup.data).includes(csrf));assert.ok(!JSON.stringify(backup.data).includes('test-only-long-password-2026'));
  assert.equal((await fetch(base+'/server/content-store.cjs')).status,404);assert.equal((await fetch(base+'/tmp/admin-smoke-data/owner.json')).status,404);
  const logout=await call('/api/admin/logout','POST',{});assert.equal(logout.status,200);assert.equal((await call('/api/admin/meta')).status,401);
  assert.ok(fs.existsSync(path.join(directory,'content.sqlite')));
 }finally{await new Promise(r=>server.close(r));}
});
