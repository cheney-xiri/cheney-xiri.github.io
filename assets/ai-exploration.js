(() => {
 'use strict';
 const data=JSON.parse(document.getElementById('ai-model-data').textContent);
 const models=new Map(data.models.map(m=>[m.id,m]));
 const categories=new Map(data.categories.map(c=>[c.id,c]));
 const accessNames={web:'网页体验',api:'API 开发',weights:'开放权重'};
 const $=id=>document.getElementById(id);
 const search=$('model-search'),access=$('access-filter'),filters=[...document.querySelectorAll('[data-category]')];
 const cards=[...document.querySelectorAll('.ai-model')];
 const params=new URLSearchParams(location.search);
 let category=categories.has(params.get('category'))?params.get('category'):'all';
 let limit=12;
 search.value=params.get('q')||'';
 access.value=Object.hasOwn(accessNames,params.get('access'))?params.get('access'):'all';
 const normalize=s=>s.toLowerCase().normalize('NFKC').replace(/[\s·._-]+/g,'');
 const haystack=new Map(data.models.map(m=>[m.id,normalize([m.name,m.provider,m.series,m.summary,...m.uses,...m.topics.map(t=>categories.get(t).name),...m.access.map(a=>accessNames[a])].join(' '))]));
 function syncUrl(){
  const url=new URL(location.href);
  for(const key of ['category','access','q'])url.searchParams.delete(key);
  if(category!=='all')url.searchParams.set('category',category);
  if(access.value!=='all')url.searchParams.set('access',access.value);
  if(search.value.trim())url.searchParams.set('q',search.value.trim());
  history.replaceState(null,'',url);
 }
 function render(updateUrl=true){
  const query=normalize(search.value.trim());
  const matches=data.models.filter(m=>(category==='all'||m.topics.includes(category))&&(access.value==='all'||m.access.includes(access.value))&&(!query||haystack.get(m.id).includes(query)));
  const shown=new Set(matches.slice(0,limit).map(m=>m.id));
  cards.forEach(card=>{card.hidden=!shown.has(card.dataset.id);});
  filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
  $('clear-search').hidden=!search.value;
  $('model-empty').hidden=matches.length>0;
  $('model-results').textContent=matches.length?`找到 ${matches.length} 个模型系列`:'没有匹配的模型';
  $('category-description').textContent=category==='all'?'文字、代码、影像与声音，在这里相遇。':categories.get(category).description;
  const remaining=Math.max(0,matches.length-limit);
  $('load-more').hidden=remaining===0;
  $('load-more').textContent=`继续浏览 · 还有 ${remaining} 个 ↓`;
  $('model-progress').textContent=matches.length?`已展开 ${shown.size} / ${matches.length}`:'';
  if(updateUrl)syncUrl();
 }
 function setCategory(id,jump=false){category=id;limit=12;render();if(jump)$('model-atlas').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
 filters.forEach(button=>button.addEventListener('click',()=>setCategory(button.dataset.category)));
 document.querySelectorAll('[data-jump-category]').forEach(button=>button.addEventListener('click',()=>setCategory(button.dataset.jumpCategory,true)));
 search.addEventListener('input',()=>{limit=12;render();});
 access.addEventListener('change',()=>{limit=12;render();});
 $('clear-search').addEventListener('click',()=>{search.value='';limit=12;render();search.focus();});
 $('reset-filters').addEventListener('click',()=>{search.value='';access.value='all';category='all';limit=12;render();search.focus();});
 $('load-more').addEventListener('click',()=>{
  const wasHidden=new Set(cards.filter(c=>c.hidden).map(c=>c.dataset.id));
  limit+=12;render(false);
  cards.find(c=>!c.hidden&&wasHidden.has(c.dataset.id))?.querySelector('.ai-model-open').focus({preventScroll:true});
 });
 render(false);

 const dialog=$('model-dialog');let opener;
 function openModel(id,trigger){
  const model=models.get(id);if(!model)return;
  opener=trigger;
  $('dialog-model-category').textContent=categories.get(model.category).code+' / '+categories.get(model.category).name;
  $('dialog-model-name').textContent=model.name;
  $('dialog-model-mark').textContent=model.mark;
  $('dialog-model-provider').textContent=model.provider;
  $('dialog-model-summary').textContent=model.summary;
  $('dialog-model-series').textContent=model.series;
  $('dialog-model-start').textContent=model.start;
  $('dialog-model-uses').replaceChildren(...model.uses.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  $('dialog-model-access').replaceChildren(...model.access.map(key=>{const span=document.createElement('span');span.textContent=accessNames[key];return span;}));
  $('dialog-model-url').href=model.url;
  $('dialog-model-source').href=model.source;
  dialog.style.setProperty('--ai-accent',categories.get(model.category).color);
  dialog.showModal();dialog.scrollTop=0;
 }
 document.querySelectorAll('[data-open-model]').forEach(button=>button.addEventListener('click',()=>openModel(button.dataset.openModel,button)));
 dialog.querySelector('.ai-dialog-close').addEventListener('click',()=>dialog.close());
 let backdropDown=false;
 dialog.addEventListener('pointerdown',event=>{backdropDown=event.target===dialog;});
 dialog.addEventListener('click',event=>{if(backdropDown&&event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}backdropDown=false;});
 dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));

 // Project a small 3D network. It pauses when out of view or in a hidden tab.
 const canvas=$('ai-network-canvas'),ctx=canvas.getContext('2d');
 if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let playing=!reduced.matches,visible=false,frame=0,angle=.3,pitch=.25,last=0,drag=null,w=1,h=1;
 const motion=$('network-motion');
 const points=data.models.map((model,i)=>{const y=1-(i+.5)/data.models.length*2;const a=i*Math.PI*(3-Math.sqrt(5));const radius=Math.sqrt(1-y*y);return {x:Math.cos(a)*radius,y,z:Math.sin(a)*radius,color:categories.get(model.category).color};});
 const edges=[];
 points.forEach((p,i)=>{
  points.map((q,j)=>({j,d:(p.x-q.x)**2+(p.y-q.y)**2+(p.z-q.z)**2})).filter(q=>q.j!==i).sort((a,b)=>a.d-b.d).slice(0,3).forEach(q=>{if(q.j>i)edges.push([i,q.j]);});
 });
 function project(p){
  const x=p.x*Math.cos(angle)-p.z*Math.sin(angle),z0=p.x*Math.sin(angle)+p.z*Math.cos(angle);
  const y=p.y*Math.cos(pitch)-z0*Math.sin(pitch),z=p.y*Math.sin(pitch)+z0*Math.cos(pitch);
  const scale=Math.min(w,h)*.34*(2.7/(2.7+z*.55));
  return {x:w/2+x*scale,y:h*.48+y*scale,z,color:p.color};
 }
 function draw(){
  ctx.clearRect(0,0,w,h);
  const projected=points.map(project);
  const radius=Math.min(w,h)*.35;
  ctx.lineWidth=.6;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(w/2,h*.48,radius*(1+i*.11),radius*(.24+i*.045),-.45+i*.48,0,Math.PI*2);ctx.strokeStyle=i===1?'rgba(142,231,219,.16)':'rgba(142,185,202,.10)';ctx.stroke();}
  edges.forEach(([a,b])=>{const p=projected[a],q=projected[b];ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=`rgba(137,216,217,${.075+(2-p.z-q.z)*.048})`;ctx.lineWidth=.6;ctx.stroke();});
  projected.sort((a,b)=>b.z-a.z).forEach(p=>{const alpha=.38+(1-p.z)*.29;ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(p.x,p.y,2.2+(1-p.z)*1.1,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,5.5+(1-p.z)*1.5,0,Math.PI*2);ctx.strokeStyle=p.color;ctx.globalAlpha=alpha*.16;ctx.lineWidth=.8;ctx.stroke();});
  ctx.globalAlpha=1;
  // Sparse ticks give the field a precise frame, without a moving background.
  ctx.strokeStyle='rgba(142,231,219,.18)';ctx.lineWidth=.6;
  for(let i=0;i<40;i++){const a=i/40*Math.PI*2,r=radius*1.24;ctx.beginPath();ctx.moveTo(w/2+Math.cos(a)*r,h*.48+Math.sin(a)*r);ctx.lineTo(w/2+Math.cos(a)*(r+(i%5?3:7)),h*.48+Math.sin(a)*(r+(i%5?3:7)));ctx.stroke();}
 }
 function tick(time){frame=0;if(!visible||document.hidden||!playing||drag)return;if(time-last>=32){angle+=Math.min(64,time-last)*.00008;last=time;draw();}frame=requestAnimationFrame(tick);}
 function stop(){if(frame)cancelAnimationFrame(frame);frame=0;}
 function resume(){if(!frame&&visible&&!document.hidden&&playing&&!drag){last=performance.now();frame=requestAnimationFrame(tick);}}
 function motionLabel(){motion.textContent=playing?'暂停旋转':'开始旋转';motion.setAttribute('aria-pressed',String(playing));}
 motion.addEventListener('click',()=>{playing=!playing;motionLabel();if(playing)resume();else stop();});
 motionLabel();
 new ResizeObserver(()=>{const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}).observe(canvas);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else stop();},{threshold:.05}).observe(canvas);
 document.addEventListener('visibilitychange',()=>document.hidden?stop():resume());
 reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;stop();motionLabel();draw();}});
 canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);stop();});
 let dragFrame=0;
 canvas.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;angle+=(event.clientX-drag.x)*.006;pitch=Math.max(-.85,Math.min(.85,pitch+(event.clientY-drag.y)*.004));drag.x=event.clientX;drag.y=event.clientY;if(!dragFrame)dragFrame=requestAnimationFrame(()=>{dragFrame=0;draw();});});
 const endDrag=()=>{drag=null;resume();};
 canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
})();
