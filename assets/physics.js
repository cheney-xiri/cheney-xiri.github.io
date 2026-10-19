(function(){
 'use strict';
 const $=id=>document.getElementById(id),node=$('space-image-data');if(!node)return;
 const images=JSON.parse(node.textContent),byId=new Map(images.map(x=>[x.id,x])),viewer=$('space-viewer'),origin=$('space-origin');
 const collections=[...document.querySelectorAll('[data-collection]')],limits=new Map(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let query='',current=0,scope='all',returnFocus=null,visibleImage=byId.get('cliffs')||images[0],priorOpen=[];
 const matches=x=>!query||[x.title,x.officialTitle,x.category,x.dateLabel,x.year,x.id].some(v=>String(v||'').toLowerCase().includes(query));
 const itemsFor=category=>images.filter(x=>x.category===category&&matches(x));
 function setOrigin(x){origin.href=x.sourcePage;origin.title=x.title+' · '+x.credit;origin.setAttribute('aria-label','NASA 官方图源：'+x.title);}
 const visible=new Map(),observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting&&e.target.getClientRects().length)visible.set(e.target,e.intersectionRatio);else visible.delete(e.target);});
  const best=[...visible].filter(([el])=>el.isConnected&&el.getClientRects().length).sort((a,b)=>b[1]-a[1])[0]?.[0];
  if(best){visibleImage=byId.get(best.dataset.spaceImage)||visibleImage;if(!viewer.open)setOrigin(visibleImage);}
 },{threshold:[0,.25,.5,.75,1]}):null;
 function observe(root){root.querySelectorAll('[data-space-image]').forEach(link=>observer?.observe(link));}
 function card(x,category){return `<figure class="space-album-item"><a class="space-image-link" href="../${esc(x.local)}" data-space-image="${esc(x.id)}" data-image-scope="${esc(category)}" aria-label="放大查看${esc(x.title)}"><img src="../${esc(x.thumbnail)}" alt="${esc(x.alt)}" width="${x.width}" height="${x.height}" loading="lazy" decoding="async"><span class="space-zoom">查看全图 ↗</span></a><figcaption><strong>${esc(x.title)}</strong><time${x.date?` datetime="${esc(x.date)}"`:''}>${esc(x.dateLabel||x.year||'日期未注明')}</time>${x.id==='blackhole'?'<small>科学可视化</small>':''}</figcaption></figure>`;}
 function renderCollection(details){const category=details.dataset.collection,selected=itemsFor(category),limit=limits.get(category)||12,grid=details.querySelector('[data-collection-grid]');
  grid.querySelectorAll('[data-space-image]').forEach(link=>{observer?.unobserve(link);visible.delete(link);});
  grid.innerHTML=selected.slice(0,limit).map(x=>card(x,category)).join('');observe(grid);
  details.querySelector('[data-collection-status]').textContent=`已展开 ${Math.min(limit,selected.length)} / ${selected.length} 幅`;
  const more=details.querySelector('[data-more-collection]');more.hidden=limit>=selected.length;more.textContent=`再看 ${Math.min(12,selected.length-limit)} 幅 ↓`;
 }
 collections.forEach(details=>{
  details.addEventListener('toggle',()=>{if(details.open)renderCollection(details);});
  details.querySelector('[data-more-collection]').addEventListener('click',()=>{const cat=details.dataset.collection,old=limits.get(cat)||12;limits.set(cat,old+12);renderCollection(details);details.querySelectorAll('[data-space-image]')[old]?.focus({preventScroll:true});});
  details.querySelector('[data-close-collection]').addEventListener('click',()=>{details.open=false;details.querySelector('summary').focus({preventScroll:true});details.scrollIntoView({block:'start',behavior:reduce?'instant':'smooth'});});
 });
 $('space-collapse').addEventListener('click',()=>{collections.forEach(d=>d.open=false);$('space-gallery').scrollIntoView({block:'start',behavior:reduce?'instant':'smooth'});});
 let timer;
 $('space-search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{
  const value=$('space-search').value.trim().toLowerCase();if(!query&&value)priorOpen=collections.filter(d=>d.open).map(d=>d.dataset.collection);query=value;
  let count=0;collections.forEach(d=>{const found=itemsFor(d.dataset.collection);count+=found.length;d.hidden=!found.length;limits.set(d.dataset.collection,12);d.open=query?!!found.length:priorOpen.includes(d.dataset.collection);if(d.open)renderCollection(d);});
  $('space-gallery-count').textContent=query?`找到 ${count} 幅影像`:`${collections.length} 个主题 · ${images.length} 幅影像`;$('space-gallery-empty').hidden=!!count;
 },180);});
 document.querySelectorAll('[data-open-category]').forEach(b=>b.addEventListener('click',()=>{
  if(query){$('space-search').value='';query='';collections.forEach(d=>d.hidden=false);$('space-gallery-count').textContent=`${collections.length} 个主题 · ${images.length} 幅影像`;$('space-gallery-empty').hidden=true;}
  const d=collections.find(d=>d.dataset.collection===b.dataset.openCategory);if(d){d.open=true;renderCollection(d);d.scrollIntoView({block:'start',behavior:reduce?'instant':'smooth'});d.querySelector('summary').focus({preventScroll:true});}
 }));
 const sequence=()=>scope==='landmarks'?images.filter(x=>x.landmark).sort((a,b)=>String(a.timelineYear||a.year).localeCompare(String(b.timelineYear||b.year))):scope==='all'?images:itemsFor(scope);
 function renderViewer(){const x=images[current],selected=sequence();$('viewer-image').src='../'+x.local;$('viewer-image').alt=x.alt;$('viewer-title').textContent=x.title;
  $('viewer-position').textContent=String(selected.findIndex(v=>v.id===x.id)+1).padStart(2,'0')+' / '+String(selected.length).padStart(2,'0');
  $('viewer-date').textContent=x.dateLabel||x.year||'日期未注明';$('viewer-type').textContent=x.type;$('viewer-english').textContent=x.officialTitle||'';$('viewer-english').hidden=!x.officialTitle||x.officialTitle===x.title;
  $('viewer-description').textContent=x.description||'';$('viewer-description').hidden=!x.description;setOrigin(x);
 }
 document.addEventListener('click',event=>{const link=event.target.closest('[data-space-image]');if(!link||!viewer.showModal)return;if(document.body.dataset.timelineDragged==='true'){event.preventDefault();return;}const x=byId.get(link.dataset.spaceImage);if(!x)return;event.preventDefault();scope=link.dataset.imageScope||'all';current=images.indexOf(x);returnFocus=link;renderViewer();viewer.append(origin);viewer.showModal();});
 function next(delta){const selected=sequence();if(!selected.length)return;const pos=selected.findIndex(x=>x.id===images[current].id);current=images.indexOf(selected[(pos+delta+selected.length)%selected.length]);renderViewer();}
 $('viewer-prev').addEventListener('click',()=>next(-1));$('viewer-next').addEventListener('click',()=>next(1));$('viewer-close').addEventListener('click',()=>viewer.close());
 viewer.addEventListener('close',()=>{document.body.append(origin);setOrigin(visibleImage);returnFocus?.focus({preventScroll:true});});
 viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();next(-1);}if(e.key==='ArrowRight'){e.preventDefault();next(1);}});
 viewer.addEventListener('click',e=>{if(e.target!==viewer)return;const r=viewer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)viewer.close();});observe(document);

})();
