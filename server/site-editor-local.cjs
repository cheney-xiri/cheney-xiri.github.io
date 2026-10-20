'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {catalog,sources,sanitizePages}=require('./site-editor.cjs');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function createLocalSite(ctx){
 const file=path.join(ctx.dataDir,'page-content.json'),uploads=path.join(ctx.dataDir,'uploads');
 const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{pages:{}};
 const write=data=>{const temp=file+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(data),{mode:0o600});fs.renameSync(temp,file);};
 const fail=(message,status=400)=>Object.assign(new Error(message),{statusCode:status,status});
 function published(){const data=read(),pages={};const original=path.join(ctx.root,'data/online-content.json');if(fs.existsSync(original))Object.assign(pages,JSON.parse(fs.readFileSync(original,'utf8')).pages||{});for(const[k,v]of Object.entries(data.pages))if(v.published)pages[k]=v.published;return sanitizePages(pages);}
 function inventory(){const files=[];function scan(dir){for(const e of fs.readdirSync(path.join(ctx.root,dir),{withFileTypes:true})){const f=path.posix.join(dir,e.name);if(e.isDirectory()){if(f!=='assets/design')scan(f);}else if(/\.(html|webp|png|jpe?g|gif|svg|mp4|webm|mp3|ogg|wav)$/i.test(f))files.push(f);}}
 for(const dir of ['about','craft','journey','pastimes','works','travels','figures','writing','interaction','assets'])if(fs.existsSync(path.join(ctx.root,dir)))scan(dir);
 for(const f of fs.readdirSync(ctx.root))if(/\.(html|webp|png|jpe?g)$/i.test(f))files.push(f);
 return catalog(ctx.root,files);}
 async function handle(req,res,url){
 const reply=data=>ctx.respond(res,200,data),p=url.pathname;
 if(p==='/api/admin/site-catalog'){reply(inventory());return true;}
 if(p==='/api/admin/page'){
  const body=req.method==='POST'?await ctx.readBody(req,16*1024*1024):{},key=url.searchParams.get('path')||body.path;
  if(typeof key!=='string'||key.includes('..')||!inventory().pages.some(x=>x.path.split('?')[0]===key.split('?')[0]))throw fail('请在目录中选择可编辑页面');
  const data=read(),pub=published()[key]||{revision:0,patches:[]},draft=data.pages[key]?.draft;
  if(req.method==='POST'){
   if(body.revision!==pub.revision)throw fail('页面已更新，请重新打开',409);
   const record=sanitizePages({[key]:{revision:body.publish?pub.revision+1:pub.revision,patches:body.patches}})[key];record.revision=body.publish?pub.revision+1:pub.revision;
   data.pages[key]||={};if(body.publish){data.pages[key].published=record;delete data.pages[key].draft;}else data.pages[key].draft=record;write(data);reply({ok:true,record});
  }else reply({record:draft?.revision===pub.revision?draft:pub,published:pub,localDraft:!!draft,staleDraft:!!draft&&draft.revision!==pub.revision});return true;
 }
 if(p==='/api/admin/source'){
  const body=req.method==='POST'?await ctx.readBody(req,16*1024*1024):{},key=url.searchParams.get('path')||body.path;
  if(!sources.some(x=>x.path===key))throw fail('资料不在可编辑范围');const target=path.join(ctx.root,key),original=fs.readFileSync(target),sha=digest(original);
  if(req.method==='POST'){if(body.sha!==sha)throw fail('资料已在其他设备更新，请重新读取',409);if(body.data===null||typeof body.data!=='object'||Array.isArray(body.data)!==Array.isArray(JSON.parse(original)))throw fail('请保留资料原有结构');const bytes=JSON.stringify(body.data,null,2)+'\n',temp=target+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,bytes);fs.renameSync(temp,target);reply({ok:true,sha:digest(bytes)});}else reply({sha,data:JSON.parse(original)});return true;
 }
 if(p==='/api/admin/media'){
  if(req.method==='POST'){
   const mime=(req.headers['content-type']||'').split(';')[0],bytes=await ctx.readBytes(req,20*1024*1024),formats={'image/gif':['gif',b=>b.subarray(0,6).toString().startsWith('GIF8')],'video/mp4':['mp4',b=>b.subarray(4,8).toString()==='ftyp'],'video/webm':['webm',b=>b.subarray(0,4).equals(Buffer.from([26,69,223,163]))],'audio/mpeg':['mp3',b=>b.subarray(0,3).toString()==='ID3'||b[0]===255&&(b[1]&224)===224],'audio/ogg':['ogg',b=>b.subarray(0,4).toString()==='OggS'],'audio/wav':['wav',b=>b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WAVE']};
   const ext=ctx.photoExtension(mime,bytes)||(formats[mime]?.[1](bytes)?formats[mime][0]:null);if(!ext)throw fail('文件格式与实际内容不符');const id=crypto.randomUUID()+'.'+ext;fs.writeFileSync(path.join(uploads,id),bytes,{flag:'wx',mode:0o600});reply({ok:true,id,url:'/api/uploads/'+id});
  }else{const existing=inventory().media;for(const name of fs.readdirSync(uploads))if(/\.(png|jpg|webp|gif|mp4|webm|mp3|ogg|wav)$/.test(name))existing.push({path:'api/uploads/'+name,url:'/api/uploads/'+name,name,type:/\.(mp4|webm)$/.test(name)?'video':/\.(mp3|ogg|wav)$/.test(name)?'audio':'image',bytes:fs.statSync(path.join(uploads,name)).size});reply({items:existing});}return true;
 }return false;
 }
 return {handle,published,backup:read};
}
module.exports={createLocalSite};
