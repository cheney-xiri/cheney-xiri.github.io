(() => {
 'use strict';
 const pagePath=()=>{const source=document.querySelector('meta[name="cheney-page-path"]')?.content;return source?'/'+source:location.pathname;};
 const $=(s,r=document)=>r.querySelector(s), make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const url=(s)=>{try{const u=new URL(s,location.href);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
 const link=(text,href,cls)=>{const a=make('a',text,cls);a.href=url(href)||'#';return a;};
 const number=i=>String(i+1).padStart(2,'0');
 const route=item=>item.basePath?'/'+item.basePath:'/'+(item.id.startsWith('articles:')?'writing':'works')+'/entry.html?id='+encodeURIComponent(item.id);
 const sorted=items=>items.filter(x=>x.data).sort((a,b)=>a.data.order-b.data.order);
 function prose(host,text,nav){host.replaceChildren();if(nav)nav.replaceChildren(make('span','本篇'));let section=null,i=0;for(const block of (text||'').split(/\n\s*\n/).filter(Boolean)){if(/^##\s/.test(block)){section=make('section');section.id='section-'+(++i);const h=make('h2');h.append(make('span',number(i-1)),document.createTextNode(block.replace(/^##\s+/,'')));section.append(h);host.append(section);if(nav)nav.append(link(number(i-1)+' '+block.replace(/^##\s+/,''),'#'+section.id));}else{if(!section){section=make('section');host.append(section);}section.append(make('p',block));}}}
 function articles(items){
  const curated=$('.wen-curated-list');if(curated){curated.replaceChildren();sorted(items).slice(0,3).forEach((item,i)=>{const d=item.data,li=make('li'),a=link('',route(item)),copy=make('div');copy.append(make('span',d.category,'wen-meta'),make('h4',d.title),make('p',d.summary));a.append(make('span',number(i),'wen-curated-number'),copy,make('span','↗'));li.append(a);curated.append(li);});}
  const list=$('.wen-entries');if(list){list.replaceChildren();const filters=$('.wen-filters'),cats=['全部',...new Set(sorted(items).map(x=>x.data.category||'随记'))];if(filters){filters.replaceChildren();cats.forEach(c=>{const b=make('button',c);b.type='button';b.dataset.filter=c;b.setAttribute('aria-pressed',String(c==='全部'));filters.append(b);});}
   sorted(items).forEach((item,i)=>{const d=item.data,li=make('li'),a=link('',route(item)),body=make('div');li.dataset.essay='';li.dataset.category=d.category||'随记';li.dataset.search=[d.title,d.summary,d.body].join(' ');body.append(make('span',d.category,'wen-meta'),make('h2',d.title),make('p',d.summary));a.append(make('span',number(i),'wen-number'),body,make('span','↗'));li.append(a);list.append(li);});
  }
  if($('.wen-article-head'))detail(items,'articles');
 }
 function detail(items,collection){
  const path=pagePath().replace(/^\//,''),id=new URLSearchParams(location.search).get('id');const item=items.find(x=>id?x.id===id:x.basePath===path);const generic=/\/entry\.html$/.test(pagePath());
  if(!item){if(generic)unavailable();return;}if(!item.data){unavailable();return;}
  if(!generic&&!item.touched)return;
  const d=item.data;document.title=d.title+' · Cheney';const head=$('.wen-article-head')||$('.novel-hero-copy')||$('.digital-hero-copy');if(head){const h=$('h1',head);if(h)h.textContent=d.title;const kicker=$('.wen-kicker',head);if(kicker)kicker.textContent=d.category+' / '+(collection==='works'?'作品':'文存');const deck=$('.wen-deck',head)||$('.novel-hero-question',head);if(deck)deck.textContent=d.summary;}
  const host=$('.wen-prose')||$('.summer-intro')||$('.novel-intro');if(host){if(collection==='works'&&!generic){host.replaceChildren(make('h2','作品简介'));d.summary.split(/\n\s*\n/).forEach(p=>host.append(make('p',p)));if(d.body)prose(host,d.summary+'\n\n'+d.body);}else prose(host,d.body||d.summary,$('.wen-reading-aside nav'));}const digital=$('.digital-intro');if(digital)digital.textContent=d.summary;
  const image=$('.novel-hero-art img')||$('.digital-hero-art img')||$('[data-entry-cover]');if(image&&d.cover){image.src=url(d.cover);image.alt=d.title;image.hidden=false;}const state=$('.novel-status');if(state)state.textContent=d.status;
 }
 function unavailable(){const main=$('main');if(main){main.replaceChildren(make('h1','这份内容暂未公开'),link('返回文存','/writing/index.html'));main.style.padding='18vh 8vw';}}
 function quotes(items){const groups=$('.wen-line-groups');if(!groups)return;const old=new Map([...groups.children].map(g=>[$('h2',g)?.textContent,{id:g.id,note:$('header p',g)?.textContent}]));groups.replaceChildren();const nav=$('.wen-line-index nav');if(nav)nav.replaceChildren();const map=new Map();for(const item of sorted(items)){const d=item.data,cat=d.category||'随手摘记';if(!map.has(cat))map.set(cat,[]);map.get(cat).push(item);}let gi=0,total=0;for(const[cat,items]of map){const original=old.get(cat),id=original?.id||'lines-'+gi,g=make('section',undefined,'wen-line-group'),header=make('header'),ol=make('ol');g.id=id;header.append(make('span',number(gi),'wen-number'),make('h2',cat),make('p',original?.note||''));g.append(header,ol);if(nav){const a=link('', '#'+id);a.append(make('span',number(gi)),document.createTextNode(cat));nav.append(a);}items.forEach((item,i)=>{const d=item.data,li=make('li'),copy=make('div',undefined,'wen-line-copy'),p=make('p',d.title,'wen-verse'),b=make('button','复制');li.dataset.line='';li.dataset.category=cat;li.dataset.kind='classic';p.dataset.lineText='';copy.append(p);b.type='button';b.dataset.copy='';b.setAttribute('aria-label','复制：'+d.title);li.append(make('span',number(i),'wen-line-number'),copy,b);ol.append(li);total++;});groups.append(g);gi++;}const count=$('[data-line-count]');if(count)count.textContent='共 '+total+' 则 · 诗词与话语';if(!total){const draw=$('[data-draw]');if(draw)draw.disabled=true;const picked=$('[data-picked]');if(picked)picked.textContent='暂未收录公开句笺';}}
 function works(items){
  const archive=$('[data-works-archive]'),grid=$('.works-grid');if(archive||grid){const host=archive||grid,old=[...host.querySelectorAll('.works-entry')];host.replaceChildren();const all=sorted(items),visible=archive?all:all.slice(0,4);for(const item of visible){const d=item.data,existing=old.find(x=>{const a=$('a',x);return a&&new URL(a.href).pathname==='/'+item.basePath;});if(existing&&!item.touched){host.append(existing);continue;}const art=make('article',undefined,'works-entry works-entry-book'),a=link('',route(item),'works-thumb');if(d.cover){const img=make('img');img.src=url(d.cover);img.alt=d.title;img.loading='lazy';a.append(img);}const meta=make('div',undefined,'works-entry-meta');meta.append(make('span',d.category),make('span',d.status,'novel-status'));const h=make('h3');h.append(link(d.title,route(item)));art.append(a,meta,h,make('p',d.summary,'works-entry-summary'),link('查看详情 ↗',route(item),'works-entry-link'));host.append(art);}if(grid&&!$('[data-all-works]')){const a=link('全部作品 ↗','/works/archive.html','works-entry-link');a.dataset.allWorks='';grid.after(a);}}
  if(!archive&&!grid)detail(items,'works');
 }
 function profile(items){
  const item=items.find(x=>x.data);if(!item)return;const d=item.data,fields=d.fields||{};
  document.querySelectorAll('[data-profile-field]').forEach(target=>{const key=target.dataset.profileField;target.textContent=fields[key]||'—';});
  document.querySelectorAll('[data-profile-identity]').forEach(card=>{const value=fields[card.dataset.profileIdentity];const p=$('.personality-value',card);if(p)p.textContent=value||'尚未填写';card.classList.toggle('is-unfilled',!value);});
  document.querySelectorAll('[data-profile-name]').forEach(target=>target.textContent=d.title||'Cheney');
  document.querySelectorAll('[data-profile-greeting]').forEach(target=>target.textContent='你好，我是 '+(d.title||'Cheney'));
  const narrative=$('.personality-narrative');if(narrative){if(d.body)prose(narrative,d.body);else narrative.replaceChildren(make('p','这一页，留给自己的话。','narrative-empty'),make('p','性格、近况、想法，或是想成为的样子。','narrative-hint'));}
  document.querySelectorAll('[data-profile-portrait]').forEach(image=>{image.src=url(d.cover||'/assets/portrait.jpg');image.alt=(d.title||'Cheney')+' 的画像';});
 }
 async function init(){let state={};const embedded=$('#cheney-content-state');if(embedded){state=JSON.parse(embedded.textContent).state||{};}else{
   const p=pagePath();if(!(/^\/(writing\/|works\/|about\/index\.html|books\.html$|index\.html$|$)/.test(p)||p==='/pastimes/detail.html'&&new URLSearchParams(location.search).get('topic')==='music'))return;
   const response=await fetch('/api/content-state?path='+encodeURIComponent(p)+(new URLSearchParams(location.search).get('preview')==='1'?'&preview=1':''),{cache:'no-store'});if(!response.ok)return;state=(await response.json()).state||{};
  }
  if(window.CHENEY_LATEST_SNAPSHOT){
   // Render the deployed copy immediately while checking for a newer publication.
   window.CHENEY_CONTENT_STATE=state;if(state.articles)articles(state.articles);if(state.quotes)quotes(state.quotes);if(state.works)works(state.works);if(state.profile)profile(state.profile);
   const snapshot=await window.CHENEY_LATEST_SNAPSHOT;
   if(snapshot){const p=pagePath();const groups=p==='/'||p==='/index.html'||p==='/cheney/'?['works','articles','books','profile']:p.startsWith('/writing/')?['articles','quotes']:p.startsWith('/works/')?['works']:p==='/about/index.html'?['profile']:p==='/books.html'?['books']:p==='/pastimes/detail.html'&&new URLSearchParams(location.search).get('topic')==='music'?['music']:[];
    const changes=snapshot.entries.filter(x=>groups.includes(x.collection));
    if(changes.length){const baseline=await window.CHENEY_PUBLIC_BASELINE();for(const group of groups.filter(g=>changes.some(x=>x.collection===g))){const merged=new Map(baseline.filter(x=>x.collection===group).map(x=>[x.id,x]));for(const item of changes.filter(x=>x.collection===group)){const before=merged.get(item.id);merged.set(item.id,{...before,...item,basePath:before?.basePath||'',touched:true});}state[group]=[...merged.values()];}}
   }
  }
  window.CHENEY_CONTENT_STATE=state;if(state.articles)articles(state.articles);if(state.quotes)quotes(state.quotes);if(state.works)works(state.works);if(state.profile)profile(state.profile);
  if(/\/entry\.html$/.test(pagePath())&&!state.articles&&!state.works)unavailable();
 }
 window.CHENEY_CONTENT_READY=init().catch(()=>{if(/\/entry\.html$/.test(pagePath()))unavailable();});
})();
