'use strict';
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {createStore}=require('./content-store.cjs');
function createAdmin(ctx){
 const store=createStore(ctx.root,ctx.dataDir),failed=new Map(),uploads=path.join(ctx.dataDir,'uploads');fs.mkdirSync(uploads,{recursive:true});
 const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 const eq=(a,b)=>{const x=Buffer.from(hash(String(a))),y=Buffer.from(hash(String(b)));return crypto.timingSafeEqual(x,y);};
 const cookie=req=>{const value=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cheney_admin='));return value?value.slice(13):'';};
 const session=req=>{const value=cookie(req);if(!/^[a-f0-9]{64}$/.test(value))return null;return store.db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires_at>?').get(hash(value),Date.now())||null;};
 const secure=req=>req.socket.encrypted||(process.env.CHENEY_TRUST_PROXY==='1'&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&req.headers['x-forwarded-proto']==='https');
 function allowed(req,write=false){const s=session(req);if(!s)return false;return !write||eq(req.headers['x-csrf-token']||'',s.csrf);}
 function guard(req,res){if(!allowed(req,!['GET','HEAD'].includes(req.method))){ctx.respond(res,401,{error:'请先登录后台；如页面停留较久，请刷新后重试'});return false;}return true;}
 function start(req,res){store.db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());const value=crypto.randomBytes(32).toString('hex'),csrf=crypto.randomBytes(24).toString('hex');store.db.prepare('INSERT INTO sessions(token_hash,csrf,expires_at) VALUES(?,?,?)').run(hash(value),csrf,Date.now()+8*3600000);res.setHeader('Set-Cookie','cheney_admin='+value+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800'+(secure(req)?'; Secure':''));return csrf;}
 const reply=(res,data,status=200)=>ctx.respond(res,status,data);
 const site=require('./site-editor-local.cjs').createLocalSite(ctx);
 async function handle(req,res,url){
  if(url.pathname==='/api/site-edits'&&req.method==='GET'){res.setHeader('Cache-Control','no-store');reply(res,{pages:site.published()});return true;}
  if(url.pathname.startsWith('/api/uploads/')&&req.method==='GET'){const id=url.pathname.slice(13);if(!/^[a-f0-9-]+\.(png|jpg|webp|gif|mp4|webm|mp3|ogg|wav)$/.test(id))return reply(res,{error:'素材不存在'},404),true;const f=path.join(uploads,id);if(!fs.existsSync(f))return reply(res,{error:'素材不存在'},404),true;const types={png:'image/png',jpg:'image/jpeg',webp:'image/webp',gif:'image/gif',mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav'};res.writeHead(200,{'Content-Type':types[id.split('.').pop()],'Content-Length':fs.statSync(f).size,'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'});fs.createReadStream(f).pipe(res);return true;}
  if(url.pathname==='/api/content'&&req.method==='GET'){const group=url.searchParams.get('collection');if(!store.labels[group])return reply(res,{error:'类别不存在'},404),true;const preview=url.searchParams.get('preview')==='1';if(preview&&!guard(req,res))return true;const id=url.searchParams.get('id');let items=preview?store.list(group):store.published(group);if(id)items=items.filter(x=>x.id===id);reply(res,{items:items.map(x=>({id:x.id,basePath:x.basePath,data:preview?x.draft:x.published}))});return true;}
  if(!url.pathname.startsWith('/api/admin/'))return false;
  res.setHeader('Cache-Control','no-store');
  if(url.pathname==='/api/admin/session'&&req.method==='GET'){const s=session(req);reply(res,{authenticated:!!s,configured:ctx.ownerConfigured(),canSetup:process.env.NODE_ENV!=='production'&&ctx.localRequest(req)&&!ctx.ownerConfigured(),csrfToken:s?.csrf||null,requiresHttps:process.env.NODE_ENV==='production'&&!secure(req)});return true;}
  if(['/api/admin/login','/api/admin/setup'].includes(url.pathname)&&req.method==='POST'){
   if(process.env.NODE_ENV==='production'&&!secure(req)){reply(res,{error:'请使用 HTTPS 地址登录后台'},403);return true;}
   const ip=ctx.clientAddress(req),now=Date.now(),attempt=failed.get(ip);if(attempt&&attempt.until>now&&attempt.count>=6){reply(res,{error:'尝试次数较多，请十五分钟后再试'},429);return true;}
   const body=await ctx.readBody(req),password=String(body.password||'');if(password.length>128){reply(res,{error:'密码格式不正确'},400);return true;}
   if(url.pathname.endsWith('/setup')){
    if(process.env.NODE_ENV==='production'||!ctx.localRequest(req)||ctx.ownerConfigured()){reply(res,{error:'请先在本机设置后台密码'},403);return true;}
    if(password.length<12){reply(res,{error:'密码至少需要 12 个字符'},400);return true;}
    const salt=crypto.randomBytes(16).toString('hex');fs.writeFileSync(ctx.ownerFile,JSON.stringify({salt,hash:crypto.scryptSync(password,salt,64).toString('hex')}),{flag:'wx',mode:0o600});
   }else if(!ctx.verifyOwner(password)){if(failed.size>10000)for(const[k,v]of failed)if(v.until<now)failed.delete(k);const current=attempt?.until>now?attempt:{count:0,until:now+15*60*1000};current.count++;failed.set(ip,current);reply(res,{error:'密码不正确'},401);return true;}
   failed.delete(ip);reply(res,{ok:true,csrfToken:start(req,res)});return true;
  }
  if(!guard(req,res))return true;
  if(await site.handle(req,res,url))return true;
  if(url.pathname==='/api/admin/logout'&&req.method==='POST'){store.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(cookie(req)));res.setHeader('Set-Cookie','cheney_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+(secure(req)?'; Secure':''));reply(res,{ok:true});return true;}
  if(url.pathname==='/api/admin/meta'&&req.method==='GET'){reply(res,{collections:store.labels,profileFields:store.profileFields,extraViews:['pages','media','sources','journey','anime','messages'],counts:Object.fromEntries(Object.keys(store.labels).map(k=>[k,store.list(k).length]))});return true;}
  if(url.pathname==='/api/admin/entries'&&req.method==='GET'){const collection=url.searchParams.get('collection');if(!store.labels[collection])throw store.fail('类别不存在',404);reply(res,{items:store.list(collection)});return true;}
  if(url.pathname==='/api/admin/save'&&req.method==='POST'){reply(res,{ok:true,item:store.save(await ctx.readBody(req,128*1024))});return true;}
  if(url.pathname==='/api/admin/unpublish'&&req.method==='POST'){const b=await ctx.readBody(req);reply(res,{ok:true,item:store.unpublish(String(b.id),b.revision)});return true;}
  if(url.pathname==='/api/admin/history'&&req.method==='GET'){reply(res,{items:store.history(url.searchParams.get('id'))});return true;}
  if(url.pathname==='/api/admin/restore-version'&&req.method==='POST'){const b=await ctx.readBody(req);reply(res,{ok:true,item:store.restore(String(b.id),Number(b.version),b.revision)});return true;}
  if(url.pathname==='/api/admin/upload'&&req.method==='POST'){const bytes=await ctx.readBytes(req,8*1024*1024),ext=ctx.photoExtension((req.headers['content-type']||'').split(';')[0],bytes);if(!ext)throw store.fail('请上传 JPG、PNG 或 WebP 图片');const id=crypto.randomUUID()+'.'+ext;fs.writeFileSync(path.join(uploads,id),bytes,{flag:'wx',mode:0o600});reply(res,{ok:true,url:'/api/uploads/'+id},201);return true;}
  if(url.pathname==='/api/admin/messages'&&req.method==='GET'){reply(res,{messages:ctx.loadStore().messages.slice(-1000).reverse()});return true;}
  if(url.pathname==='/api/admin/anime-notes'&&req.method==='GET'){reply(res,{notes:ctx.loadAnimeNotes()});return true;}
  if(url.pathname==='/api/admin/backup'&&req.method==='GET'){res.setHeader('Content-Disposition','attachment; filename="cheney-content-backup-'+new Date().toISOString().slice(0,10)+'.json"');reply(res,{format:'cheney-content-v1',exportedAt:new Date().toISOString(),pageContent:site.backup(),entries:Object.keys(store.labels).flatMap(k=>store.list(k)),journey:ctx.loadJourney(),animeNotes:ctx.loadAnimeNotes(),messages:ctx.loadStore().messages,mediaNote:'图片文件另存于持久化数据目录 uploads 和 journey-media，请与数据一起备份。'});return true;}
  if(url.pathname==='/api/admin/password'&&req.method==='POST'){const b=await ctx.readBody(req);if(process.env.CHENEY_OWNER_PASSWORD)throw store.fail('当前密码由服务器配置管理，请在服务器配置中修改');if(!ctx.verifyOwner(String(b.currentPassword||'')))throw store.fail('原密码不正确',403);const password=String(b.password||'');if(password.length<12||password.length>128)throw store.fail('新密码需要 12 到 128 个字符');const salt=crypto.randomBytes(16).toString('hex'),temp=ctx.ownerFile+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify({salt,hash:crypto.scryptSync(password,salt,64).toString('hex')}),{mode:0o600});fs.renameSync(temp,ctx.ownerFile);store.db.prepare('DELETE FROM sessions').run();reply(res,{ok:true,csrfToken:start(req,res)});return true;}
  reply(res,{error:'接口不存在'},404);return true;
 }
 function decorate(relative,html,req){
  const preview=new URL(req.url,'http://localhost').searchParams.get('preview')==='1'&&allowed(req);
  const state=store.publicState(relative,preview);
  const json=JSON.stringify({state,relative,preview}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const injection='<script id="cheney-content-state" type="application/json">'+json+'</script><script src="/assets/content-live.js?v=20261019-admin-01" defer></script><link rel="stylesheet" href="/assets/site-content.css?v=20261020-05"><script src="/assets/site-content.js?v=20261020-05" defer></script>';
  return html.replace(/<head(?:\s[^>]*)?>/i,m=>m+injection);
 }
 return{handle,decorate,allowed,store};
}
module.exports={createAdmin};
