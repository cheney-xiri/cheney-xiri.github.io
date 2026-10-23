/* Apply owner-published text and media changes without replacing chapter layouts. */
(() => {
  'use strict';
  const latest=new Map(),saved=new Map(),galleryStates=new Map(); let active=[],timer,applying=false,insertionTails=new Map();
  const remember=(target,key)=>{let map=saved.get(target);if(!map){map=new Map();saved.set(target,map);}if(!map.has(key))map.set(key,key==='nodeValue'?target.nodeValue:key==='backgroundImage'||key==='objectFit'?target.style[key]:target.getAttribute(key));};
  function reset(){for(const [target,values]of saved)for(const [key,value]of values){if(key==='nodeValue')target.nodeValue=value;else if(key==='backgroundImage'||key==='objectFit')target.style[key]=value;else if(value===null)target.removeAttribute(key);else target.setAttribute(key,value);}saved.clear();latest.clear();document.querySelectorAll('[data-cms-block],[data-cms-copy],[data-cms-gallery]').forEach(n=>n.remove());document.querySelectorAll('[data-cms-placeholder]').forEach(n=>{n.hidden=false;n.removeAttribute('data-cms-placeholder');});}
  const allowed=value=>{try{const u=new URL(value,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  const matching=p=>{try{const target=document.querySelector(p.selector);return target&&!target.closest('head,script,style,input,textarea,select,iframe')?target:null;}catch{return null;}};
  const copyTags=new Set('a article aside audio b blockquote br caption cite code dd details div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i img li ol p picture pre section small source span strong sub summary sup table tbody td th thead tr ul video'.split(' '));
  const copyAttrs=new Set('class title href target rel src alt width height poster controls loop muted playsinline loading decoding aria-label role open colspan rowspan'.split(' '));
  function snapshot(n,depth=0,budget={left:1500}){
    if(depth>30||--budget.left<0)return null;if(n.nodeType===3)return n.nodeValue.slice(0,65000);if(n.nodeType!==1||!copyTags.has(n.tagName.toLowerCase()))return null;
    return {tag:n.tagName.toLowerCase(),attrs:Object.fromEntries([...n.attributes].filter(a=>copyAttrs.has(a.name)).map(a=>[a.name,['src','href','poster'].includes(a.name)?allowed(a.value):a.value.slice(0,4000)])),children:[...n.childNodes].map(c=>snapshot(c,depth+1,budget)).filter(c=>c!==null)};
  }
  function fromSnapshot(tree,depth=0,budget={left:1500}){
    if(depth>30||--budget.left<0)return null;if(typeof tree==='string')return document.createTextNode(tree.slice(0,65000));if(!tree||!copyTags.has(tree.tag))return null;
    const n=document.createElement(tree.tag);for(const [key,value]of Object.entries(tree.attrs||{})){if(!copyAttrs.has(key)||typeof value!=='string')continue;const v=['src','href','poster'].includes(key)?allowed(value):value.slice(0,4000);n.setAttribute(key,v);}if(n.tagName==='A'&&n.target==='_blank')n.rel='noopener noreferrer';
    for(const child of (Array.isArray(tree.children)?tree.children:[])){const c=fromSnapshot(child,depth+1,budget);if(c)n.append(c);}return n;
  }
  function insert(anchor,position,node){let tails=insertionTails.get(anchor);if(!tails){tails={};insertionTails.set(anchor,tails);}if((position==='afterend'||position==='afterbegin')&&tails[position]?.isConnected)tails[position].insertAdjacentElement('afterend',node);else anchor.insertAdjacentElement(position,node);tails[position]=node;}
  function mediaPlacement(p){
    if(p.type!=='block'||!['image','video'].includes(p.format)||p.layout==='inline')return {...p};
    const anchor=matching(p),atEnd=!p.layout&&p.position==='beforeend'&&anchor?.matches('main,body');
    if(atEnd){const slot=document.querySelector('#photos .stage-section-content, #travel-photo-list');if(slot)return {...p,selector:slot.id?'#'+slot.id:'#photos .stage-section-content',position:'beforeend'};}
    return {...p};
  }
  function galleryFor(p){
    const placed=mediaPlacement(p),anchor=matching(placed);if(!anchor)return null;
    const group=JSON.stringify([placed.selector,placed.position||'afterend']);
    let gallery=[...document.querySelectorAll('[data-cms-gallery]')].find(n=>n.dataset.cmsGallery===group);
    if(!gallery){gallery=document.createElement('div');gallery.className='cheney-media-gallery';gallery.dataset.cmsGallery=group;gallery.dataset.expanded=String(galleryStates.get(group)===true);
      const grid=document.createElement('div');grid.className='cheney-media-grid';grid.id='cms-gallery-'+p.id;gallery.append(grid);
      const toggle=document.createElement('button');toggle.type='button';toggle.className='cheney-gallery-toggle';toggle.setAttribute('aria-controls',grid.id);toggle.setAttribute('aria-expanded','false');gallery.append(toggle);
      toggle.onclick=()=>{gallery.dataset.expanded=String(gallery.dataset.expanded!=='true');galleryStates.set(group,gallery.dataset.expanded==='true');refreshGallery(gallery);if(gallery.dataset.expanded!=='true')toggle.scrollIntoView({block:'nearest'});};
      insert(anchor,placed.position||'afterend',gallery);
    }
    return gallery;
  }
  function refreshGallery(gallery){
    const grid=gallery.firstElementChild,items=[...grid.children].filter(n=>!n.hasAttribute('data-cms-owner-hidden')),limit=Number(gallery.dataset.previewCount)||6,expanded=gallery.dataset.expanded==='true';
    items.forEach((n,i)=>{const hidden=!expanded&&i>=limit;if(n.hidden!==hidden)n.hidden=hidden;if(hidden)n.querySelectorAll('video').forEach(v=>{if(!v.paused)v.pause();});});
    const toggle=gallery.lastElementChild,label=expanded?'收起影像':`展开其余 ${Math.max(0,items.length-limit)} 项`;
    if(toggle.textContent!==label)toggle.textContent=label;toggle.hidden=items.length<=limit;toggle.setAttribute('aria-expanded',String(expanded));
  }
  function block(p){
    if(document.querySelector('[data-cms-block="'+CSS.escape(p.id)+'"]'))return;
    const anchor=matching(p);if(!anchor)return;
    const section=document.createElement('div');section.className='cheney-owner-block';section.dataset.cmsBlock=p.id;
    if(p.title){const h=document.createElement('h3');h.textContent=p.title;section.append(h);}
    if(p.format==='text'){for(const paragraph of p.value.split(/\n\s*\n/)){const el=document.createElement('p');el.textContent=paragraph;section.append(el);}}
    else if(p.format==='link'){const a=document.createElement('a');a.href=allowed(p.value);a.textContent=p.caption||p.title||'打开链接 ↗';section.append(a);}
    else{const media=document.createElement(p.format==='image'?'img':p.format);const url=allowed(p.value);if(!url)return;media.src=url;if(p.format==='image'){media.alt=p.alt||p.caption||p.title;media.loading='lazy';}else{media.controls=true;media.preload='metadata';media.playsInline=true;if(p.poster)media.poster=allowed(p.poster);}section.append(media);if(p.caption){const caption=document.createElement('p');caption.className='cheney-owner-caption';caption.textContent=p.caption;section.append(caption);}}
    if(['image','video'].includes(p.format)&&p.layout!=='inline'){
      const gallery=galleryFor(p);if(!gallery)return;gallery.dataset.previewCount=String(Math.max(1,Math.min(24,Number(p.previewCount)||6)));gallery.firstElementChild.append(section);
    }else insert(anchor,['beforebegin','afterbegin','beforeend','afterend'].includes(p.position)?p.position:'afterend',section);
  }
  function duplicate(p){
    if(document.querySelector('[data-cms-copy="'+CSS.escape(p.id)+'"]'))return;
    const anchor=matching(p);if(!anchor||['BODY','HTML','MAIN','NAV','HEADER','FOOTER','FORM'].includes(anchor.tagName))return;
    const copy=p.template?fromSnapshot(p.template):anchor.cloneNode(true);if(!copy||copy.nodeType!==1)return;copy.removeAttribute('data-cms-block');copy.dataset.cmsCopy=p.id;
    copy.querySelectorAll('script,style,iframe,object,embed,form,[data-cms-block],[data-cms-copy]').forEach(n=>n.remove());
    for(const n of [copy,...copy.querySelectorAll('*')]){n.removeAttribute('id');for(const a of [...n.attributes])if(/^on/i.test(a.name)||/^data-cheney-edit/.test(a.name)||['contenteditable','autofocus','autoplay'].includes(a.name))n.removeAttribute(a.name);if(['VIDEO','AUDIO'].includes(n.tagName)){n.autoplay=false;n.controls=true;}}
    insert(anchor,p.position==='beforebegin'?'beforebegin':'afterend',copy);
  }
  function apply(patches){
    if(applying)return;applying=true;insertionTails=new Map();
    if(patches!==undefined){for(const g of document.querySelectorAll('[data-cms-gallery]'))galleryStates.set(g.dataset.cmsGallery,g.dataset.expanded==='true');reset();active=patches;}
    try{
     const additions=active.filter(p=>p.type==='block'||p.type==='duplicate');
     for(let pass=0;pass<Math.min(additions.length,30);pass++)for(const p of additions){if(p.type==='block')block(p);else duplicate(p);}
     for(const p of active){if(p.device==='mobile'&&innerWidth>760||p.device==='desktop'&&innerWidth<=760)continue;if(p.type==='block'||p.type==='duplicate')continue;const target=matching(p);if(!target)continue;const key=p.id||p.type+':'+p.selector+':'+p.textIndex;
      if(p.type==='hide'){remember(target,'hidden');remember(target,'data-cms-owner-hidden');target.setAttribute('data-cms-owner-hidden','');target.setAttribute('hidden','');continue;}
      if(p.type==='text'){const text=[...target.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE)[p.textIndex];if(!text||text.nodeValue===p.value)continue;if(text.nodeValue!==p.original&&text.nodeValue!==latest.get(key))continue;remember(text,'nodeValue');text.nodeValue=p.value;latest.set(key,p.value);continue;}
      const url=allowed(p.value);if(!url)continue;
      if(p.type==='image'){if(target.tagName!=='IMG')continue;const current=target.getAttribute('src');if(current!==p.original&&current!==p.value&&current!==latest.get(key))continue;['src','srcset','alt','objectFit'].forEach(k=>remember(target,k));if(current!==p.value){target.src=p.value;target.removeAttribute('srcset');const picture=target.closest('picture');if(picture)picture.querySelectorAll('source').forEach(s=>{remember(s,'srcset');s.removeAttribute('srcset');});}if(target.alt!==p.alt)target.alt=p.alt;target.style.objectFit=p.fit;latest.set(key,p.value);}
      if(p.type==='video'){if(!['VIDEO','AUDIO'].includes(target.tagName))continue;const current=target.getAttribute('src')||target.querySelector('source')?.getAttribute('src')||'';if(current!==p.original&&current!==p.value&&current!==latest.get(key))continue;['src','poster','controls'].forEach(k=>remember(target,k));if(target.getAttribute('src')!==p.value){target.src=p.value;target.load();}target.controls=true;if(p.poster)target.poster=allowed(p.poster);latest.set(key,p.value);}
      if(p.type==='link'&&target.tagName==='A'){const current=target.getAttribute('href');if(current!==p.original&&current!==p.value&&current!==latest.get(key))continue;remember(target,'href');if(current!==p.value)target.href=p.value;latest.set(key,p.value);}
      if(p.type==='background'){remember(target,'backgroundImage');target.style.backgroundImage='url('+JSON.stringify(url)+')';}
    }
    for(const g of document.querySelectorAll('[data-cms-gallery]'))refreshGallery(g);
    if(document.querySelector('#photos [data-cms-gallery]'))document.querySelectorAll('#photos .stage-photo-slot, #photos .stage-photo-note').forEach(n=>{n.dataset.cmsPlaceholder='';n.hidden=true;});
    if(document.querySelector('#travel-photo-list [data-cms-gallery]'))document.querySelectorAll('#travel-photo-list > .travel-empty').forEach(n=>{n.dataset.cmsPlaceholder='';n.hidden=true;});
    }finally{applying=false;}
  }
  function key(){let pathname=(document.querySelector('meta[name="cheney-page-path"]')?.content||location.pathname).replace(/^\//,'');if(!pathname||pathname.endsWith('/'))pathname+='index.html';const search=new URLSearchParams(location.search);['v','cms-edit','cms-preview','writing','fit','ink'].forEach(x=>search.delete(x));search.sort();return pathname+(search.size?'?'+search:'');}
  const ready=fetch('/api/site-edits',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(data=>{const exact=key(),base=exact.split('?')[0];active=[...(data.pages?.[base]?.patches||[]),...(exact!==base?data.pages?.[exact]?.patches||[]:[])];apply();const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>apply(),100);});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['src','srcset','href','poster']});let mobile=innerWidth<=760;addEventListener('resize',()=>{if(mobile!==(innerWidth<=760)){mobile=innerWidth<=760;apply([...active]);}});}).catch(()=>{});
  window.CHENEY_PAGE_CONTENT={ready,apply,key,snapshot,mediaPlacement};
})();
