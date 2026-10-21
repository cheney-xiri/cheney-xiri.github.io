import test from 'node:test';
import assert from 'node:assert/strict';
import {createEdgeHandler} from '../server/edge-runtime.mjs';

test('edge service enforces private letters and authenticated inbox',async()=>{
 const records=new Map();
 const kv={get:async key=>records.has(key)?JSON.parse(records.get(key)):null,put:async(k,v)=>records.set(k,v),delete:async k=>records.delete(k),list:async({prefix})=>({keys:[...records.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})),complete:true})};
 const handle=createEdgeHandler(kv,{entries:[]},{labels:{},profileFields:{}},'test-only-owner-password-2026');
 let cookie='',csrf='',ip=0;
 async function call(path,method='GET',body,auth=false){
  const response=await handle({request:new Request('https://service.example'+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(auth?{Cookie:cookie,'X-CSRF-Token':csrf}:{})},body:body?JSON.stringify(body):undefined}),clientIp:'test-'+(++ip)});
  return {status:response.status,headers:response.headers,data:await response.json()};
 }
 for(const visibility of ['private','public',undefined]){
  const r=await call('/api/messages','POST',{kind:'letter',text:'仅站主可读的内容',visibility});assert.equal(r.status,201);assert.equal(r.data.visibility,'private');
 }
 // Old records marked public must also stay out of the public endpoint.
 records.set('message_old',JSON.stringify({id:'old',kind:'letter',visibility:'public',text:'旧信也不可公开',createdAt:'2026-01-01'}));
 assert.deepEqual((await call('/api/messages?kind=letter')).data.messages,[]);
 assert.equal((await call('/api/admin/messages')).status,401);
 assert.equal((await call('/api/owner/messages')).status,401);
 for(const kind of ['wall','ally','featured']){
  const r=await call('/api/messages','POST',{kind,text:'所有访客可读的评论',visibility:'private'});assert.equal(r.data.visibility,'public');assert.equal((await call('/api/messages?kind='+kind)).data.messages.length,1);
 }
 const login=await call('/api/admin/login','POST',{password:'test-only-owner-password-2026'});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];csrf=login.data.csrfToken;
 assert.equal((await call('/api/owner/messages','GET',undefined,true)).data.messages.length,4);
 const inbox=await call('/api/admin/messages','GET',undefined,true);assert.equal(inbox.status,200);assert.equal(inbox.data.messages.filter(x=>x.kind==='letter').length,4);
});
