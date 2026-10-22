'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {sanitizePages}=require('../server/site-editor.cjs');

test('subsection navigation follows chapter order and excludes owner-only screens',()=>{
 const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/admin-navigation.js'),'utf8'),context);
 const pages=[{path:'craft/guitar.html',group:'craft',title:'吉他'},{path:'craft/writing.html',group:'craft',title:'写作'},{path:'craft/go.html',group:'craft',title:'围棋'},{path:'craft/joseki-detail.html',group:'craft',title:'讲解模板'},{path:'interaction/owner.html',group:'interaction',title:'站主'}];
 const api=context.window.CHENEY_ADMIN_NAVIGATION;
 assert.deepEqual(Array.from(api.pages({pages},{group:'craft'}),p=>p.path),['craft/writing.html','craft/go.html','craft/guitar.html']);
 assert.equal(api.pages({pages},{group:'interaction'}).length,0);
});

test('admin chapters follow homepage sections and reference existing art',()=>{
 const root=path.resolve(__dirname,'..'),context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'assets/admin-chapters.js'),'utf8'),context);
 const chapters=context.window.CHENEY_ADMIN_CHAPTERS.chapters;
 assert.deepEqual(Array.from(chapters,c=>c.title),['开篇','关于我','行旅','技艺','志趣','作品','足迹','仰止','文存','读书','互动','联络']);
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const c of chapters){assert.ok(home.includes('id="'+c.section+'"'),c.title+' has no homepage target');assert.ok(fs.existsSync(path.join(root,'assets/ink/'+c.art+'.webp')),c.title+' artwork missing');assert.ok(c.tools.length);}
});

test('writing and interaction entry links resolve to real public pages',()=>{
 const root=path.resolve(__dirname,'..');
 for(const name of ['index.html',...fs.readdirSync(path.join(root,'writing')).filter(x=>x.endsWith('.html')).map(x=>'writing/'+x),...fs.readdirSync(path.join(root,'interaction')).filter(x=>x.endsWith('.html')).map(x=>'interaction/'+x)]){
  const html=fs.readFileSync(path.join(root,name),'utf8');for(const match of html.matchAll(/href=["']([^"']+\.html(?:\?[^"']*)?(?:#[^"']*)?)["']/g)){
   const url=new URL(match[1].replaceAll('&amp;','&'),'https://site.local/'+name);if(url.origin==='https://site.local')assert.ok(fs.existsSync(path.join(root,url.pathname.slice(1))),name+' links to missing '+url.pathname);
  }
 }
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(html,/class="chapter-entry-title" href="writing\/index.html"/);assert.match(html,/class="chapter-entry-title" href="interaction\/index.html"/);
});

test('page publication sanitizes targets, media addresses and inserted blocks',()=>{
 const patch={id:'one',type:'block',selector:'#works',format:'video',title:'创作过程',value:'/assets/clip.mp4',poster:'/assets/cover.webp',position:'beforeend'};
 const pages=sanitizePages({'index.html':{revision:2,patches:[patch]}});
 assert.equal(pages['index.html'].patches[0].format,'video');
 assert.equal(pages['index.html'].patches[0].position,'beforeend');
 const layout=sanitizePages({'index.html':{patches:[{...patch,layout:'inline',previewCount:3},{...patch,id:'gallery',layout:'gallery',previewCount:999}]}})['index.html'].patches;
 assert.equal(layout[0].layout,'inline');assert.equal(layout[0].previewCount,3);assert.equal(layout[1].previewCount,24);
  const visual=sanitizePages({'index.html':{revision:3,patches:[{id:'copy',type:'duplicate',selector:'.craft-card',position:'beforebegin',value:''},{id:'hide',type:'hide',selector:'[data-cms-copy="copy"]',value:''},{...patch,position:'afterbegin'}]}})['index.html'].patches;
  assert.equal(visual[0].position,'beforebegin');assert.equal(visual[1].type,'hide');assert.equal(visual[2].position,'afterbegin');
  assert.throws(()=>sanitizePages({'index.html':{patches:[{id:'bad',type:'duplicate',selector:'script',value:''}]}}),/目标/);
  const copied={id:'safe-copy',type:'duplicate',selector:'.craft-card',template:{tag:'a',attrs:{href:'https://example.test',onclick:'alert(1)',id:'do-not-duplicate'},children:['新卡片']}};
  const template=sanitizePages({'index.html':{patches:[copied]}})['index.html'].patches[0].template;
  assert.equal(template.attrs.onclick,undefined);assert.equal(template.attrs.id,undefined);assert.equal(template.children[0],'新卡片');
  assert.throws(()=>sanitizePages({'index.html':{patches:[{...copied,template:{tag:'script',attrs:{},children:[]}}]}}),/复制模块/);
  assert.throws(()=>sanitizePages({'index.html':{patches:[{...copied,template:{tag:'a',attrs:{href:'javascript:alert(1)'},children:[]}}]}}),/地址/);
 for(const value of ['javascript:alert(1)','data:text/html,test','//other.test/file','/../.site-data/owner.json'])assert.throws(()=>sanitizePages({'index.html':{patches:[{...patch,value}]}}),/地址/);
 assert.throws(()=>sanitizePages({'admin/index.html':{patches:[patch]}}),/页面地址/);
 assert.throws(()=>sanitizePages({'index.html':{patches:[{...patch,selector:'head > script'}]}}),/目标/);
 assert.throws(()=>sanitizePages({'index.html':{patches:Array(501).fill(patch)}}),/限制/);
});

test('page drafts stay local; publication preserves other sections and rejects conflicts',async()=>{
 let doc={version:1,entries:[{id:'quotes:keep',data:{title:'保留句笺'}}],journey:{junior:{story:'保留行旅'}},pages:{}},sha='a',puts=0,source={topics:[{id:'music',name:'听歌'}]},sourceSha='source-a';
 const storage=new Map(),catalog={collections:{quotes:'句笺'},entries:[],site:{pages:[{path:'index.html'},{path:'pastimes/detail.html?topic=music'}],sources:[{path:'assets/pastimes.json'}],media:[]}};
 const context={window:{CHENEY_ADMIN_VAULT:{configured:()=>false,create:async()=>{}}},location:{origin:'https://local.test'},URL,TextEncoder,TextDecoder,Blob,structuredClone,crypto:require('node:crypto').webcrypto,btoa,atob,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},fetch:async(url,options={})=>{
  if(url==='/admin/catalog.json')return Response.json(catalog);
  if(url.endsWith('/user'))return Response.json({login:'cheney-xiri'});
  if(url.endsWith('/repos/cheney-xiri/cheney-xiri.github.io'))return Response.json({permissions:{push:true}});
  if(url.includes('/contents/assets/pastimes.json')){if(options.method==='PUT'){const b=JSON.parse(options.body);assert.equal(b.sha,sourceSha);source=JSON.parse(Buffer.from(b.content,'base64'));sourceSha+='x';puts++;return Response.json({content:{sha:sourceSha}});}return Response.json({sha:sourceSha,content:Buffer.from(JSON.stringify(source)).toString('base64')});}
  if(options.method==='PUT'){const b=JSON.parse(options.body);assert.equal(b.sha,sha);doc=JSON.parse(Buffer.from(b.content,'base64'));sha+='x';puts++;return Response.json({content:{sha}});}
  return Response.json({sha,content:Buffer.from(JSON.stringify(doc)).toString('base64')});
 }};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/github-admin.js'),'utf8'),context);const call=context.window.CHENEY_GITHUB_CMS.request;
 await call('/api/admin/setup',{body:{connectionToken:'dummy-test-token',password:'test-only-password',confirm:'test-only-password'}});
 const patches=[{id:'one',type:'text',selector:'#title',textIndex:0,original:'原题',value:'新题'}];
 await call('/api/admin/page',{method:'POST',body:{path:'index.html',revision:0,patches,publish:false}});assert.equal(puts,0);assert.equal((await call('/api/admin/page?path=index.html')).localDraft,true);
 await call('/api/admin/page',{method:'POST',body:{path:'index.html',revision:0,patches,publish:true}});assert.equal(puts,1);assert.equal(doc.pages['index.html'].revision,1);assert.equal(doc.journey.junior.story,'保留行旅');assert.equal(doc.entries[0].data.title,'保留句笺');
 await assert.rejects(()=>call('/api/admin/page',{method:'POST',body:{path:'index.html',revision:0,patches,publish:true}}),/其他设备/);assert.equal(puts,1);
 await assert.rejects(()=>call('/api/admin/page?path=admin/index.html'),/可编辑页面/);
 await assert.rejects(()=>call('/api/admin/source?path=.site-data/owner.json'),/范围/);
 const read=await call('/api/admin/source?path=assets/pastimes.json');
 await call('/api/admin/source',{method:'POST',body:{path:'assets/pastimes.json',sha:read.sha,data:{topics:[{id:'music',name:'更新听歌'}]}}});assert.equal(source.topics[0].name,'更新听歌');
 await assert.rejects(()=>call('/api/admin/source',{method:'POST',body:{path:'assets/pastimes.json',sha:read.sha,data:source}}),/其他设备/);
 assert.ok(!JSON.stringify([...storage]).includes('dummy-test-token'));
});
