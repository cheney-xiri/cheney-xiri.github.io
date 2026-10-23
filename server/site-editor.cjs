'use strict';
const fs = require('node:fs'), path = require('node:path');
const groups = { home:'首页与章节', about:'关于我与 AI 探索', journey:'行旅', craft:'技艺', pastimes:'志趣', works:'作品', travels:'足迹', figures:'仰止与追星', writing:'文存与句笺', interaction:'互动', books:'读书', other:'其他页面' };
const sources = [
  ['assets/pastime-library.json','志趣 · 动漫片单与游戏目录'],
  ['assets/travels.json','足迹 · 城市与到访记录'], ['assets/pastimes.json','志趣 · 各项爱好资料'],
  ['assets/music-selection.json','听歌 · 常听歌曲与完整歌单'], ['assets/joseki-books.json','围棋 · 书中棋谱资料'],
  ['assets/joseki-josekle.json','围棋 · 定式棋谱'], ['assets/joseki-pachi.json','围棋 · 传统定式'], ['assets/joseki-variations.json','围棋 · 变化分支']
].map(([file,label])=>({path:file,label}));
function catalog(root, files) {
  const pages = files.filter(f=>f.endsWith('.html')&&!f.startsWith('admin/')&&!/editor\.html$/.test(f)).map(file=>{
    const html=fs.readFileSync(path.join(root,file),'utf8');
    const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||file).replace(/&amp;/g,'&').replace(/<[^>]+>/g,'').trim();
    const folder=file.split('/')[0], group=file==='index.html'?'home':file==='books.html'?'books':groups[folder]?folder:'other';
    return {path:file,title,group};
  });
  const media=files.filter(f=>/\.(?:webp|png|jpe?g|gif|svg|mp4|webm|mp3|ogg|wav)$/i.test(f)).map(file=>({path:file,name:path.basename(file),type:/\.(mp4|webm)$/i.test(file)?'video':/\.(mp3|ogg|wav)$/i.test(file)?'audio':'image',bytes:fs.statSync(path.join(root,file)).size}));
  const home=fs.readFileSync(path.join(root,'index.html'),'utf8'), chapters=[];
  for(const match of home.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?<h2\b[^>]*>([\s\S]*?)<\/h2>/g))chapters.push({id:match[1],title:match[2].replace(/<[^>]+>/g,'').trim()});
  const known=new Set(pages.map(x=>x.path));
  for(const page of [...pages]){
    const html=fs.readFileSync(path.join(root,page.path),'utf8');
    for(const match of html.matchAll(/href=["']([^"']+\.html\?[^"']+)["']/g)){
      try{const url=new URL(match[1].replace(/&amp;/g,'&'),'https://site.local/'+page.path);if(url.origin!=='https://site.local')continue;['v','writing','fit','ink'].forEach(k=>url.searchParams.delete(k));url.searchParams.sort();const key=url.pathname.slice(1)+(url.searchParams.size?'?'+url.searchParams:'');const base=pages.find(x=>x.path===url.pathname.slice(1));if(base&&url.searchParams.size&&!known.has(key)){known.add(key);pages.push({...base,path:key,title:match[1].includes('topic=')?'志趣 · '+url.searchParams.get('topic'):base.title+' · '+[...url.searchParams.values()].join(' / ')});}}catch{}
    }
  }
  const pastimes=path.join(root,'assets/pastimes.json');if(fs.existsSync(pastimes))for(const t of JSON.parse(fs.readFileSync(pastimes,'utf8')).topics||[]){const key='pastimes/detail.html?topic='+encodeURIComponent(t.id),existing=pages.find(x=>x.path===key);if(existing)existing.title='志趣 · '+t.name;else if(known.has('pastimes/detail.html'))pages.push({path:key,title:'志趣 · '+t.name,group:'pastimes'});}
  return {groups,pages,media,chapters,sources:sources.filter(x=>fs.existsSync(path.join(root,x.path)))};
}
const clean = value=>String(value??'').slice(0,65000);
function safeUrl(value) { const s=String(value||'').trim(); if(s.startsWith('/')&&!s.startsWith('//')&&!/[\\\x00-\x1f]/.test(s)&&!s.split('/').includes('..'))return s;try{const u=new URL(s);if(['https:','http:'].includes(u.protocol))return u.href;}catch{}throw new Error('请使用有效的图片、视频或网页地址'); }
const copyTags=new Set('a article aside audio b blockquote br caption cite code dd details div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i img li ol p picture pre section small source span strong sub summary sup table tbody td th thead tr ul video'.split(' '));
const copyAttrs=new Set('class title href target rel src alt width height poster controls loop muted playsinline loading decoding aria-label role open colspan rowspan'.split(' '));
function sanitizeTemplate(tree,depth=0,budget={left:1500}){
  if(depth>30||--budget.left<0)throw new Error('复制模块过大，请选择更小的区域');if(typeof tree==='string')return clean(tree);
  if(!tree||!copyTags.has(tree.tag)||!Array.isArray(tree.children))throw new Error('复制模块的内容不正确');
  const attrs={};for(const [key,value]of Object.entries(tree.attrs||{})){if(!copyAttrs.has(key)||typeof value!=='string')continue;attrs[key]=['src','href','poster'].includes(key)?value?safeUrl(value):'':value.slice(0,4000);}
  return {tag:tree.tag,attrs,children:tree.children.map(n=>sanitizeTemplate(n,depth+1,budget))};
}
function sanitizePages(pages) {
  if(!pages||typeof pages!=='object'||Array.isArray(pages))return {};
  const result={};
  for(const [key,record]of Object.entries(pages)){
    if(!/^(?:index\.html|books\.html|henan\.html|(?:about|journey|craft|pastimes|works|travels|figures|writing|interaction)\/[a-zA-Z0-9_./-]+\.html)(?:\?[^#]*)?$/.test(key)||key.includes('..'))throw new Error('页面地址不在可编辑范围内');
    if(!Array.isArray(record.patches)||record.patches.length>500)throw new Error('单页编辑项超出限制');
    const patches=record.patches.map(p=>{
      if(!['text','image','video','link','background','block','duplicate','hide'].includes(p.type)||typeof p.selector!=='string'||p.selector.length>1800||!p.selector||/(?:^|[ >+~,])(?:script|style|head|input|textarea)(?:[ .#:[>+~,]|$)/i.test(p.selector))throw new Error('页面编辑目标不正确');
      const item={id:clean(p.id).slice(0,120),type:p.type,selector:p.selector,original:clean(p.original),value:clean(p.value),textIndex:Math.max(0,Number(p.textIndex)||0)};
      if(p.type==='text')return item;
      if(p.type==='hide')return item;
      if(p.type==='duplicate'){if(!item.id)throw new Error('复制模块缺少编号');item.position=p.position==='beforebegin'?'beforebegin':'afterend';if(p.template)item.template=sanitizeTemplate(p.template);return item;}
      if(p.type==='link'){item.value=safeUrl(p.value);return item;}
      if(p.type==='block'){
        if(!['text','image','video','audio','link'].includes(p.format))throw new Error('新增内容类型不正确');
        item.format=p.format;item.title=clean(p.title).slice(0,300);item.caption=clean(p.caption).slice(0,2000);item.position=['beforebegin','afterbegin','beforeend','afterend'].includes(p.position)?p.position:'afterend';
        if(['image','video'].includes(p.format)){if(['inline','gallery'].includes(p.layout))item.layout=p.layout;item.previewCount=Math.max(1,Math.min(24,Math.floor(Number(p.previewCount)||6)));}
        if(p.format!=='text')item.value=safeUrl(p.value);
      }else item.value=safeUrl(p.value);
      item.alt=clean(p.alt).slice(0,2000);item.poster=p.poster?safeUrl(p.poster):'';item.fit=p.fit==='contain'?'contain':'cover';item.device=['mobile','desktop'].includes(p.device)?p.device:'all';
      return item;
    });
    result[key]={revision:Math.max(1,Number(record.revision)||1),patches};
  }
  return result;
}
module.exports={catalog,sources,sanitizePages,safeUrl};
