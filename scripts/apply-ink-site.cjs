'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const version = '20261019-review-02';
const sections = [['about','壹 · 小像'],['journey','贰 · 求学'],['craft','叁 · 技艺'],['pastimes','肆 · 志趣'],['works','伍 · 作品'],['travels','陆 · 足迹'],['admire','柒 · 仰止'],['writing','捌 · 文存'],['reading','玖 · 书卷'],['links','拾 · 往来'],['contact','终 · 联络']];
const builders = ['build-profile.cjs','build-physics.cjs','build-writing.cjs','build-works.cjs','build-digital-works.cjs','build-figure-pages.cjs'];
function pages(){const out=[];for(const p of ['index.html','books.html','henan.html'])if(fs.existsSync(path.join(root,p)))out.push(p);for(const d of ['about','journey','craft','pastimes','works','travels','figures','writing','interaction']){const walk=folder=>{for(const e of fs.readdirSync(path.join(root,folder),{withFileTypes:true})){const f=folder+'/'+e.name;if(e.isDirectory())walk(f);else if(e.name.endsWith('.html'))out.push(f);}};walk(d);}return out;}
function classify(p){if(p==='index.html')return'home';if(p==='books.html')return'books';if(p==='henan.html')return'henan';if(p.startsWith('writing/'))return p.endsWith('lines.html')?'lines':p.endsWith('index.html')?'writing-index':'writing-article';if(p.startsWith('works/'))return p.includes('summer')?'summer':p.includes('future-letter')?'future':'digital';if(p.startsWith('figures/'))return'figure';if(p.startsWith('craft/'))return p.includes('joseki-detail')?'joseki-detail':p.includes('joseki')?'joseki-index':'craft';if(p.startsWith('journey/'))return p.includes('edit')?'editor':'journey';if(p.startsWith('travels/'))return'travel';if(p.startsWith('about/'))return'profile';if(p.startsWith('interaction/'))return p.includes('owner')?'owner':'interaction';if(p.includes('physics'))return'physics';if(p.endsWith('/detail.html'))return'pastime';return'anime-game';}
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function backup(list){const dir=path.join(root,'tmp','before-ink-site-20261017-01');fs.mkdirSync(dir,{recursive:true});const manifest={pages:{},protected:{},data:{}};for(const p of [...list,...builders.map(n=>'scripts/'+n)]){const f=path.join(root,p),b=path.join(dir,p);if(!fs.existsSync(b)){fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(f,b);}manifest.pages[p]=sha(b);}for(const p of ['assets/physics.css','assets/physics.js','assets/space-chronicle.css','assets/space-chronicle.js','assets/craft-scenes.css','assets/craft-scenes.js','assets/pastime-scenes.css','assets/pastimes-detail.js','assets/music-room.js','assets/music-selection.json'])manifest.protected[p]=sha(path.join(root,p));for(const n of fs.readdirSync(path.join(root,'data')))if(n.endsWith('.json'))manifest.data['data/'+n]=sha(path.join(root,'data',n));const record=path.join(dir,'manifest.json');if(!fs.existsSync(record))fs.writeFileSync(record,JSON.stringify(manifest,null,2));return dir;}
function home(html){
  html=html.replace(/<link rel="stylesheet" href="assets\/creative-refresh\.css[^\"]*"[^>]*>\s*/,'');
  if(!html.includes('ink-landscape'))html=html.replace(/(<header class="hero" id="top">)/,'$1\n<div class="ink-landscape" aria-hidden="true"><div class="ink-mountains ink-mountains-far"></div><div class="ink-mountains ink-mountains-near"></div><div class="ink-mist"></div><svg class="ink-sword" viewBox="0 0 1000 250"><path d="M20 221C330 209 684 138 970 25"/><path d="M52 224C360 217 709 135 978 23"/></svg><span class="ink-landscape-note">山水之间 · 所思所见</span></div>');
  for(const [id,label] of sections){html=html.replace(new RegExp('(<section\\b[^>]*\\bid="'+id+'"[^>]*)(>)'),(m,open,end)=>open.replace(/\sdata-ink-label="[^"]*"/,'')+' data-ink-label="'+label+'"'+end);}
  html=html.replace("if (document.documentElement.classList.contains('snap-on') && !document.documentElement.classList.contains('ink-site')) {","if (document.documentElement.classList.contains('snap-on')) {");
  if(!html.includes('ink-touch-poem-guard'))html=html.replace('var mark = function (on) {',"var mark = function (on) {\n      // ink-touch-poem-guard: touch hover must not freeze the poem stream.\n      if (on && window.matchMedia('(hover: none), (pointer: coarse)').matches) return;");
  return html;
}
function applyInkSite(options={}){
 const list=pages().filter(p=>!options.only||options.only.includes(p));const before=options.backup===false?null:backup(list);let changed=0;
 for(const p of list){const file=path.join(root,p);let s=fs.readFileSync(file,'utf8'),old=s;
  s=s.replace(/\n?<!-- ink-site:start -->[\s\S]*?<!-- ink-site:end -->\n?/g,'\n');
  const prefix='../'.repeat(p.split('/').length-1);
  const entry=`<!-- ink-site:start -->\n<script>(function(){var h=document.documentElement,p=location.pathname,q=new URLSearchParams(location.search);h.classList.add('ink-site');if(p.endsWith('/pastimes/physics.html'))h.dataset.inkPreserve='physics';else if(p.endsWith('/craft/photography.html'))h.dataset.inkPreserve='photography';else if(p.endsWith('/pastimes/detail.html')&&q.get('topic')==='editing')h.dataset.inkPreserve='editing';})();</script>\n<link rel="stylesheet" href="${prefix}assets/ink-site.css?v=${version}">\n<link rel="stylesheet" href="${prefix}assets/ink-atmosphere.css?v=${version}">\n<link rel="stylesheet" href="${prefix}assets/ink-subsections.css?v=${version}">\n<link rel="stylesheet" href="${prefix}assets/ink-backgrounds.css?v=${version}">
<link rel="stylesheet" href="${prefix}assets/ink-chapters.css?v=${version}">\n<script src="${prefix}assets/ink-site.js?v=${version}" defer></script>\n<script src="${prefix}assets/ink-subsections.js?v=${version}" defer></script>\n<!-- ink-site:end -->`;
  s=s.replace('</head>',entry+'\n</head>');
  // Retain the separate portrait backgrounds when a page is regenerated.
  const mobileMarkup = require('./apply-mobile-ink.cjs').mobileInkMarkup(p);
  s=s.replace(/\n?<!-- mobile-ink:start -->[\s\S]*?<!-- mobile-ink:end -->\n?/g,'\n');
  if(mobileMarkup)s=s.replace('</head>',mobileMarkup+'\n</head>');
  s=s.replace(/<body\b([^>]*)>/,(m,a)=>'<body'+a.replace(/\sdata-ink-page="[^"]*"/,'')+' data-ink-page="'+classify(p)+'">');
  if(p==='index.html'){s=s.replace(/<body\b([^>]*)>/,(_m,a)=>'<body'+a.replace(/\sid="ink-home"/,'')+' id="ink-home">');s=home(s);}
  if(s!==old){fs.writeFileSync(file,s);changed++;}
 }
 return {version,pages:list.length,changed,backup:before};
}
function integrateBuilders(){for(const name of builders){const f=path.join(__dirname,name);let s=fs.readFileSync(f,'utf8');if(!s.includes("require('./apply-ink-site.cjs')")){s+="\n// Keep the shared ink design when regenerating this page.\nrequire('./apply-ink-site.cjs').applyInkSite({backup:false});\n";fs.writeFileSync(f,s);}}}
module.exports={applyInkSite,pages,classify,version};
if(require.main===module){const result=applyInkSite();integrateBuilders();console.log(JSON.stringify(result));}
