(() => {
 'use strict';
 const network=window.fetch.bind(window);let endpoint='',sessionToken='',csrf='';
 const ready=network('/assets/interaction-service.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(async config=>{
  if(!config?.url)return false;const u=new URL(config.url);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)return false;
  endpoint=u.origin;const r=await network(endpoint+'/api/health',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)}),health=await r.json();
  return r.ok&&health.service==='cheney-interaction-v1'&&health.privateLetters===true;
 }).catch(()=>false);
 async function request(path,options={}){
  if(!await ready)throw new Error('留言服务暂未连接，请稍后重试。');
  const headers=new Headers(options.headers||{});if(options.admin){if(!sessionToken)throw Object.assign(new Error('请先解锁私人信箱'),{status:401});headers.set('Authorization','Bearer '+sessionToken);if(options.method&&options.method!=='GET')headers.set('X-CSRF-Token',csrf);}
  let body=options.body;if(body&&typeof body!=='string'){headers.set('Content-Type','application/json');body=JSON.stringify(body);}
  const r=await network(endpoint+path,{method:options.method||'GET',headers,body,cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000)});
  const data=await r.json().catch(()=>({error:'服务暂时没有响应，请稍后重试'}));
  if(!r.ok){if(r.status===401)lock();throw Object.assign(new Error(data.error||'操作未完成'),{status:r.status});}return data;
 }
 function lock(){sessionToken='';csrf='';window.dispatchEvent(new Event('cheney-inbox-locked'));}
 async function login(password){const data=await request('/api/admin/login',{method:'POST',body:{password}});sessionToken=data.sessionToken;csrf=data.csrfToken;if(!/^[a-f0-9]{64}$/.test(sessionToken||'')||!csrf){lock();throw new Error('信箱登录失败');}}
 async function logout(){try{if(sessionToken)await request('/api/admin/logout',{method:'POST',body:{},admin:true});}finally{lock();}}
 window.CHENEY_INTERACTION_SERVICE={ready,request,login,logout,lock,get authenticated(){return !!sessionToken;}};
})();
