import test from 'node:test';
import assert from 'node:assert/strict';
import {createInteractionGateway} from '../server/interaction-gateway.mjs';

test('cross-site gateway keeps letters private and requires an authenticated inbox session',async()=>{
 const records=new Map(),kv={get:async key=>records.has(key)?JSON.parse(records.get(key)):null,put:async(k,v)=>records.set(k,v),delete:async key=>records.delete(key),list:async({prefix})=>({keys:[...records.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})),complete:true})};
 const origin='https://cheney-xiri.github.io',password='test-only-inbox-password-2026';
 const gateway=createInteractionGateway(kv,password);let sequence=0;
 const call=async(path,{method='GET',body,headers={}}={})=>{
  const r=await gateway(new Request('https://cheney-test.netlify.app'+path,{method,headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined}),{clientIp:'test-'+(++sequence)});
  return {status:r.status,headers:r.headers,data:r.status===204?null:await r.json()};
 };
 const health=await call('/api/health');assert.equal(health.data.service,'cheney-interaction-v1');assert.equal(health.data.privateLetters,true);
 assert.equal((await call('/api/admin/messages')).status,401);
 assert.equal((await call('/api/admin/messages',{headers:{Origin:'https://untrusted.example'}})).status,403);
 assert.equal((await call('/api/admin/backup')).status,404);
 assert.equal((await call('/api/content')).status,404);
 assert.equal((await call('/api/messages',{method:'OPTIONS'})).status,204);
 for(const kind of ['wall','ally','featured','letter']){
  const post=await call('/api/messages',{method:'POST',body:{kind,text:'这是 '+kind+' 的测试留言',visibility:kind==='letter'?'public':'private'}});assert.equal(post.status,201);assert.equal(post.data.visibility,kind==='letter'?'private':'public');
  const feed=await call('/api/messages?kind='+kind);assert.equal(feed.data.messages.length,kind==='letter'?0:1);assert.equal(feed.headers.get('Access-Control-Allow-Origin'),origin);assert.match(feed.headers.get('Cache-Control'),/no-store/);
 }
 const mirrorOrigin='https://cheney-xiri.pages.dev';
 const mirrorHeaders={Origin:mirrorOrigin};
 const mirrorFeed=await call('/api/messages?kind=wall',{headers:mirrorHeaders});
 assert.equal(mirrorFeed.status,200);assert.equal(mirrorFeed.data.messages.length,1);
 assert.equal(mirrorFeed.headers.get('Access-Control-Allow-Origin'),mirrorOrigin);
 assert.deepEqual(mirrorFeed.data.messages,(await call('/api/messages?kind=wall')).data.messages);
 assert.equal((await call('/api/messages?kind=letter',{headers:mirrorHeaders})).data.messages.length,0);
 assert.equal((await call('/api/admin/messages',{headers:mirrorHeaders})).status,401);
 const mirrorLetter=await call('/api/messages',{method:'POST',headers:mirrorHeaders,body:{kind:'letter',text:'来自镜像入口的私人尺素',visibility:'public'}});
 assert.equal(mirrorLetter.status,201);assert.equal(mirrorLetter.data.visibility,'private');
 assert.equal((await call('/api/messages?kind=letter')).data.messages.length,0);
 const invalid=await call('/api/admin/login',{method:'POST',body:{password:'wrong'}});assert.equal(invalid.status,401);
 const login=await call('/api/admin/login',{method:'POST',body:{password}});assert.equal(login.status,200);assert.match(login.data.sessionToken,/^[a-f0-9]{64}$/);assert.equal(login.headers.has('Set-Cookie'),false);
 const auth={Authorization:'Bearer '+login.data.sessionToken};const inbox=await call('/api/admin/messages',{headers:auth});assert.equal(inbox.status,200);assert.equal(inbox.data.messages.filter(m=>m.kind==='letter').length,2);
 const letter=inbox.data.messages.find(m=>m.kind==='letter');assert.equal((await call('/api/owner/delete',{method:'POST',headers:auth,body:{id:letter.id}})).status,403);
 const csrf={...auth,'X-CSRF-Token':login.data.csrfToken};assert.equal((await call('/api/owner/delete',{method:'POST',headers:csrf,body:{id:letter.id}})).status,200);
 assert.equal((await call('/api/admin/messages',{headers:auth})).data.messages.length,4);
 await call('/api/admin/logout',{method:'POST',headers:csrf,body:{}});assert.equal((await call('/api/admin/messages',{headers:auth})).status,401);
 const unconfigured=createInteractionGateway(kv,'');const rejected=await unconfigured(new Request('https://example.net/api/messages?kind=wall'));assert.equal(rejected.status,503);
});
