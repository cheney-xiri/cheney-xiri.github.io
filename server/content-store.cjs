'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { DatabaseSync } = require('node:sqlite');

const labels = { articles:'文存', quotes:'句笺', works:'作品', books:'书架', music:'歌单', profile:'个性小档' };
const profileFields = { hometown:'家乡', birthday:'生日', zodiac:'星座', mbti:'MBTI', personalityKeywords:'性格关键词', gettingAlong:'相处方式', dailyRhythm:'日常节奏', favoriteSeason:'喜欢的季节', favoriteColor:'喜欢的颜色', relaxation:'放松方式', smallJoys:'日常小确幸', socialStyle:'社交状态', expressionStyle:'表达方式', workStyle:'做事习惯', aloneTime:'独处时刻', motto:'一句座右铭', favoriteWeather:'喜欢的天气', favoriteTime:'喜欢的时段', favoriteFlavor:'喜欢的味道', favoriteScent:'喜欢的气味', favoritePlace:'喜欢的地方', currentGoal:'最近的目标', wantToLearn:'想学习的事' };
const fail = (message,status=400) => Object.assign(new Error(message),{status});
const plain = (v,max=2000) => { const s=String(v??'').normalize('NFC').trim(); if(s.length>max)throw fail('内容太长，请适当缩短');return s; };
function link(value){const s=plain(value,2000);if(!s)return '';if(/^\/(?:api\/uploads\/|assets\/)/.test(s)&&!/[\\\x00-\x1f]/.test(s)&&!s.includes('..'))return s;if(/^assets\/[a-z0-9_./-]+$/i.test(s)&&!s.includes('..'))return '/'+s;try{const u=new URL(s);if(u.protocol==='https:'||u.protocol==='http:')return u.href;}catch{}throw fail('链接需要使用完整的 http 或 https 地址，或已上传的图片');}
function sanitize(collection,body){
 if(!labels[collection]||!body||typeof body!=='object'||Array.isArray(body))throw fail('内容类别或格式不正确');
 const d={title:plain(body.title,collection==='quotes'?2400:180),category:plain(body.category,80),summary:plain(body.summary,2000),body:plain(body.body,60000),cover:link(body.cover),url:link(body.url),author:plain(body.author,140),status:plain(body.status,60),order:Number.isFinite(Number(body.order))?Math.max(-10000,Math.min(100000,Number(body.order))):500};
 if(collection==='quotes'){d.title=plain(body.title,2400);d.body='';}
 if(!d.title)throw fail(collection==='quotes'?'请填写句子':'请填写标题');
 if(collection==='profile'){d.fields={};for(const key of Object.keys(profileFields))d.fields[key]=plain(body.fields?.[key],500);}
 return d;
}
function createStore(root,dataDir){
 fs.mkdirSync(dataDir,{recursive:true});
 const db=new DatabaseSync(path.join(dataDir,'content.sqlite'));
 db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 db.exec(`CREATE TABLE IF NOT EXISTS entries(id TEXT PRIMARY KEY, collection TEXT NOT NULL, base_path TEXT NOT NULL DEFAULT '', draft TEXT NOT NULL, published TEXT, revision INTEGER NOT NULL DEFAULT 1, touched INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS entries_collection ON entries(collection); CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY, entry_id TEXT NOT NULL REFERENCES entries(id), revision INTEGER NOT NULL, draft TEXT NOT NULL, published TEXT, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
 const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
 const insert=db.prepare('INSERT OR IGNORE INTO entries(id,collection,base_path,draft,published,created_at,updated_at) VALUES(?,?,?,?,?,?,?)');
 const now=new Date().toISOString();
 function seed(collection,id,draft,basePath=''){const normalized=sanitize(collection,draft);insert.run(collection+':'+id,collection,basePath,JSON.stringify(normalized),JSON.stringify(normalized),now,now);}
 if(!db.prepare("SELECT value FROM metadata WHERE key='seed-v1'").get()){
  db.exec('BEGIN');
  try{
   const writing=read('data/writing.json');writing.articles.forEach((a,i)=>seed('articles',a.slug,{title:a.title,category:a.category,summary:a.deck,body:a.sections.map(s=>'## '+s.title+'\n\n'+s.paragraphs.join('\n\n')).join('\n\n'),order:i},'writing/'+a.slug+'.html'));
   read('data/lines.json').forEach((g,gi)=>g.items.forEach((q,i)=>seed('quotes',g.id+'-'+i,{title:q.text,category:g.name,author:q.author||'',summary:q.work||'',url:q.url||'',order:gi*1000+i},'quotes:'+g.id+':'+i)));
   for(const[id,file,kind]of [['unsent-summer','data/unsent-summer.json','青春小说'],['future-letter','data/future-letter.json','长篇科幻']]){const a=read(file);seed('works',id,{title:a.title,category:kind,summary:Array.isArray(a.summary)?a.summary.join('\n\n'):a.summary,body:'',cover:a.cover,status:a.status||'作品介绍',order:id==='unsent-summer'?0:1},'works/'+id+'/index.html');}
   read('data/digital-works.json').forEach((a,i)=>seed('works',a.id,{title:a.displayTitle||a.title,category:a.title,summary:a.shortSummary||a.summary,body:a.intro,cover:a.cover,status:'创作流程',order:i+2},'works/'+a.id+'/index.html'));
   const source=fs.readFileSync(path.join(root,'assets/books.js'),'utf8').match(/var books = (\[[\s\S]*?\n  \]);/);
   if(source){const books=vm.runInNewContext('('+source[1]+')',Object.create(null),{timeout:500});books.forEach((a,i)=>seed('books',String(i),{title:a.title,author:a.meta,summary:a.note,cover:a.cover,order:i},'books:'+i));}
   const music=read('assets/music-selection.json');music.favorites.forEach((a,i)=>seed('music','favorites-'+i,{title:a.title,author:a.artist,category:'常听',summary:a.note,order:a.pinned?-100:i},'music:favorites:'+i));
   for(const[group,a]of Object.entries(music.playlists||{})){
    const tracks=[];for(const album of a.albums||[])for(const title of album.tracks||[])tracks.push({title,summary:album.name+'（'+album.year+'）',cover:album.cover});for(const x of a.extras||[])tracks.push({title:x.title,author:x.artist,summary:x.collection||'单曲',cover:x.cover});if(!tracks.length)for(const title of a.tracks||a.order||[])tracks.push({title});
    const rank=t=>a.order?.includes(t)?a.order.indexOf(t):100000;tracks.sort((x,y)=>rank(x.title)-rank(y.title));tracks.forEach((t,i)=>seed('music',group+'-'+i,{title:t.title,author:t.author||a.artistOf?.[t.title]||a.artist,category:group==='jay'?'周杰伦':'TFBOYS',summary:t.summary,cover:t.cover,order:i},'music:'+group+':'+i));
   }
   const profile=read('data/profile.json'),fields={};for(const key of Object.keys(profileFields)){const v=profile[key];fields[key]=key==='zodiac'?(v?.name||''):key==='mbti'?(v?.type||''):Array.isArray(v)?v.join('、'):(v||'');}seed('profile','main',{title:profile.name||'Cheney',body:(profile.selfNarrative||[]).join('\n\n'),cover:profile.portrait,fields,order:0},'about/index.html');
   db.prepare("INSERT INTO metadata(key,value) VALUES('seed-v1',?)").run(now);db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 const shape=row=>row?{id:row.id,collection:row.collection,basePath:row.base_path,draft:JSON.parse(row.draft),published:row.published?JSON.parse(row.published):null,revision:row.revision,touched:!!row.touched,createdAt:row.created_at,updatedAt:row.updated_at}:null;
 function get(id){return shape(db.prepare('SELECT * FROM entries WHERE id=?').get(id));}
 function list(collection){return db.prepare('SELECT * FROM entries WHERE collection=? ORDER BY created_at,id').all(collection).map(shape).sort((a,b)=>a.draft.order-b.draft.order);}
 function published(collection){return list(collection).filter(x=>x.published).sort((a,b)=>a.published.order-b.published.order);}
 function save(payload){
  const collection=payload.collection;if(!labels[collection])throw fail('内容类别不正确');
  const draft=sanitize(collection,payload.draft),existing=payload.id?get(payload.id):null;
  if(payload.id&&!existing)throw fail('内容不存在',404);
  if(existing&&existing.collection!==collection)throw fail('内容类别不能变更');
  if(existing&&payload.revision!==existing.revision)throw fail('这份内容已在其他窗口更新，请重新打开后再保存',409);
  const id=existing?.id||collection+':'+crypto.randomUUID(),time=new Date().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try{if(existing){db.prepare('INSERT INTO history(entry_id,revision,draft,published,updated_at) SELECT id,revision,draft,published,updated_at FROM entries WHERE id=?').run(id);db.prepare('UPDATE entries SET draft=?,published=?,revision=revision+1,touched=?,updated_at=? WHERE id=?').run(JSON.stringify(draft),payload.publish?JSON.stringify(draft):(existing.published?JSON.stringify(existing.published):null),payload.publish?1:Number(existing.touched),time,id);db.prepare('DELETE FROM history WHERE entry_id=? AND id NOT IN (SELECT id FROM history WHERE entry_id=? ORDER BY id DESC LIMIT 30)').run(id,id);}else insert.run(id,collection,'',JSON.stringify(draft),payload.publish?JSON.stringify(draft):null,time,time);if(!existing&&payload.publish)db.prepare('UPDATE entries SET touched=1 WHERE id=?').run(id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
  return get(id);
 }
 function unpublish(id,revision){const row=get(id);if(!row)throw fail('内容不存在',404);if(row.revision!==revision)throw fail('内容已更新，请重新打开',409);db.prepare('INSERT INTO history(entry_id,revision,draft,published,updated_at) SELECT id,revision,draft,published,updated_at FROM entries WHERE id=?').run(id);db.prepare('UPDATE entries SET published=NULL,touched=1,revision=revision+1,updated_at=? WHERE id=?').run(new Date().toISOString(),id);return get(id);}
 function history(id){return db.prepare('SELECT id,revision,draft,updated_at FROM history WHERE entry_id=? ORDER BY id DESC LIMIT 30').all(id).map(x=>({...x,draft:JSON.parse(x.draft)}));}
 function restore(id,version,revision){const row=get(id),old=db.prepare('SELECT draft FROM history WHERE id=? AND entry_id=?').get(version,id);if(!row||!old)throw fail('历史版本不存在',404);return save({id,collection:row.collection,revision,draft:JSON.parse(old.draft),publish:false});}
 function publicState(relative,preview){
  const groups=relative.startsWith('writing/')?['articles','quotes']:relative==='index.html'?['works','articles','books']:relative.startsWith('works/')?['works']:relative==='about/index.html'?['profile']:relative==='books.html'?['books']:relative==='pastimes/detail.html'?['music']:[];
  const state={};for(const group of groups){if(preview||relative==='works/archive.html'||db.prepare('SELECT 1 FROM entries WHERE collection=? AND touched=1 LIMIT 1').get(group))state[group]=(preview?list(group):list(group).filter(x=>x.published||x.touched)).map(x=>({id:x.id,basePath:x.basePath,data:preview?x.draft:x.published,touched:x.touched}));}return state;
 }
 return{db,get,list,published,save,unpublish,history,restore,publicState,labels,profileFields,fail};
}
module.exports={createStore,labels,profileFields,sanitize,link};
