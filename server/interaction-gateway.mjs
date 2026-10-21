import {createEdgeHandler} from './edge-runtime.mjs';

// Only the interaction API is exposed; content, uploads and setup are excluded.
const routes=new Map([
 ['/api/health',['GET']],['/api/messages',['GET','POST']],
 ['/api/admin/login',['POST']],['/api/admin/logout',['POST']],
 ['/api/admin/messages',['GET']],['/api/owner/delete',['POST']]
]);
export function createInteractionGateway(kv,password,{allowedOrigins=['https://cheney-xiri.github.io','https://cheney-xiri.pages.dev']}={}){
 const runtime=createEdgeHandler(kv,{entries:[]},{labels:{},profileFields:{}},password);
 return async(request,{clientIp='anonymous'}={})=>{
  const url=new URL(request.url),origin=request.headers.get('Origin'),allowed=origin===url.origin||allowedOrigins.includes(origin);
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','Vary':'Origin','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  if(allowed)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-CSRF-Token','Access-Control-Max-Age':'600'});
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&!allowed)return json({error:'来源不被允许'},403);
  const methods=routes.get(url.pathname);
  if(!methods)return json({error:'接口不存在'},404);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!methods.includes(request.method))return json({error:'方法不支持'},405);
  if(!kv||typeof password!=='string'||password.length<12)return json({error:'留言服务尚未完成配置'},503);
  if(request.method==='POST'&&!allowed)return json({error:'请从网站页面提交'},403);
  const limit=url.pathname==='/api/admin/login'?4096:16384;
  if(Number(request.headers.get('Content-Length')||0)>limit)return json({error:'内容过长'},413);
  const bytes=request.method==='POST'?await request.arrayBuffer():null;
  if(bytes&&bytes.byteLength>limit)return json({error:'内容过长'},413);
  const forwarded=new Headers(request.headers);forwarded.delete('Origin');forwarded.delete('Cookie');forwarded.delete('Authorization');
  const token=/^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('Authorization')||'')?.[1];
  if(token)forwarded.set('Cookie','cheney_admin='+token);
  const response=await runtime({request:new Request(request.url,{method:request.method,headers:forwarded,body:bytes}),clientIp});
  const data=await response.json();
  if(response.ok&&url.pathname==='/api/admin/login'){
   const sessionToken=/cheney_admin=([a-f0-9]{64})/.exec(response.headers.get('Set-Cookie')||'')?.[1];
   if(!sessionToken)return json({error:'信箱登录失败'},500);
   data.sessionToken=sessionToken;
  }
  if(response.ok&&url.pathname==='/api/health')Object.assign(data,{service:'cheney-interaction-v1',privateLetters:true});
  return json(data,response.status);
 };
}
