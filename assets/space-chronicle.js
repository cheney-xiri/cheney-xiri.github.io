(function(){
 'use strict';
 const scene=document.getElementById('chronicle-scene');if(!scene)return;
 const canvas=document.getElementById('chronicle-canvas');
 const section=scene.closest('.space-chronicle'),nodes=[...scene.querySelectorAll('[data-chronicle-index]')],eras=[...section.querySelectorAll('[data-chronicle-era]')],stories=[...section.querySelectorAll('[data-chronicle-story]')],rail=document.getElementById('chronicle-years'),slider=document.getElementById('chronicle-slider'),counter=document.getElementById('chronicle-position');
 const motionQuery=matchMedia('(prefers-reduced-motion: reduce)'),total=nodes.length;
 let reduced=motionQuery.matches,width=1000,height=480,dpr=1,active=0,focus=0,visible=false,raf=0,last=0,motion=null,drag=null,suppressClick=false;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const ctx = canvas.getContext('2d');
 function ruler() {
   const capacity = Math.min(total, Math.max(3, Math.min(9, Math.floor(width / 105))));
   const margin = Math.min(58, width * .115);
   const step = (width - margin * 2) / Math.max(1, capacity - 1);
   const start = clamp(focus - (capacity - 1) / 2, 0, total - capacity);
   return { step, origin: margin - start * step, y: Math.round(height * .57) };
 }
 function paint() {
   const { step, origin, y } = ruler();
   if (ctx) {
     ctx.clearRect(0, 0, width, height);
     const lastX = origin + (total - 1) * step;
     const focusX = origin + focus * step;
     ctx.lineWidth = 1;
     ctx.strokeStyle = '#526e7b';
     ctx.beginPath();
     ctx.moveTo(Math.max(0, origin), y + .5);
     ctx.lineTo(Math.min(lastX, width), y + .5);
     ctx.stroke();
     ctx.strokeStyle = '#d9bb82';
     ctx.beginPath();
     ctx.moveTo(Math.max(0, origin), y + .5);
     ctx.lineTo(focusX, y + .5);
     ctx.stroke();
     // Intermediate marks divide the distance between events, not calendar years.
     ctx.strokeStyle = '#8eabb850';
     ctx.beginPath();
     for (let tick = 1; tick < (total - 1) * 5; tick++) {
       const x = Math.round(origin + tick * step / 5) + .5;
       if (tick % 5 && x > 0 && x < width) {
         ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 3);
       }
     }
     ctx.stroke();
   }
   nodes.forEach((node, index) => {
     const x = origin + index * step;
     const shown = x >= 25 && x <= width - 25;
     node.style.left = x + 'px';
     node.style.top = y + 'px';
     node.style.opacity = shown ? '1' : '0';
     node.style.zIndex = index === active ? '2' : '1';
     node.style.pointerEvents = shown ? 'auto' : 'none';
     node.tabIndex = shown ? 0 : -1;
   });
 }
 function frame(now){raf=0;if(!visible)return;if(!reduced&&now-last<32){raf=requestAnimationFrame(frame);return;}last=now;
  if(motion){const u=clamp((now-motion.start)/motion.duration,0,1),ease=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;focus=motion.from+(motion.to-motion.from)*ease;if(u===1)motion=null;}
  paint(now);if(motion)raf=requestAnimationFrame(frame);
 }
 function wake(){if(visible&&!raf)raf=requestAnimationFrame(frame);}
 function resize(){const rect=scene.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);dpr=Math.min(devicePixelRatio||1,width<600?1.4:1.75);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);paint(0);wake();}
 function update(){nodes.forEach((node,i)=>{node.classList.toggle('is-active',i===active);if(i===active)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');});eras.forEach((node,i)=>{if(i===active)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');});stories.forEach((story,i)=>story.hidden=i!==active);slider.value=active;slider.setAttribute('aria-valuetext',nodes[active].getAttribute('aria-label'));counter.textContent=String(active+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');section.querySelector('[data-chronicle-step="-1"]').disabled=active===0;section.querySelector('[data-chronicle-step="1"]').disabled=active===total-1;
  const item=eras[active],left=item.offsetLeft-(rail.clientWidth-item.clientWidth)/2;rail.scrollTo({left,behavior:reduced?'instant':'smooth'});
 }
 function select(index,animate=true){const next=clamp(index,0,total-1);active=next;update();if(animate&&!reduced){motion={from:focus,to:active,start:performance.now(),duration:Math.min(850,360+Math.abs(active-focus)*22)};}else{focus=active;motion=null;}paint(0);wake();}
 nodes.forEach(node=>node.addEventListener('click',event=>{if(suppressClick){event.preventDefault();return;}select(Number(node.dataset.chronicleIndex));}));eras.forEach(node=>node.addEventListener('click',()=>select(Number(node.dataset.chronicleEra))));
 section.querySelectorAll('[data-chronicle-step]').forEach(button=>button.addEventListener('click',()=>select(active+Number(button.dataset.chronicleStep))));slider.addEventListener('input',()=>select(Number(slider.value),false));
 scene.addEventListener('keydown',event=>{let next=null;if(event.key==='ArrowLeft')next=active-1;if(event.key==='ArrowRight')next=active+1;if(event.key==='Home')next=0;if(event.key==='End')next=total-1;if(next!==null){event.preventDefault();select(next);}});
 rail.addEventListener('keydown',event=>{let next=null;if(event.key==='ArrowLeft')next=active-1;if(event.key==='ArrowRight')next=active+1;if(event.key==='Home')next=0;if(event.key==='End')next=total-1;if(next!==null){event.preventDefault();select(next);eras[active].focus({preventScroll:true});}});
 scene.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;suppressClick=false;drag={id:event.pointerId,x:event.clientX,y:event.clientY,focus,captured:false};});
 scene.addEventListener('pointermove',event=>{if(!drag)return;if(drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.captured&&Math.abs(dy)>Math.abs(dx)+8){drag=null;return;}if(!drag.captured&&Math.abs(dx)>8){scene.setPointerCapture(event.pointerId);drag.captured=true;suppressClick=true;scene.classList.add('is-dragging');}if(drag.captured){event.preventDefault();motion=null;focus=clamp(drag.focus-dx/ruler().step,0,total-1);const chosen=Math.round(focus);if(chosen!==active){active=chosen;update();}paint(0);wake();}});
 
 function finish(){if(!drag)return;const captured=drag.captured;if(scene.hasPointerCapture(drag.id))scene.releasePointerCapture(drag.id);drag=null;scene.classList.remove('is-dragging');if(captured)select(active);setTimeout(()=>suppressClick=false,100);}
 scene.addEventListener('pointerup',finish);scene.addEventListener('pointercancel',finish);window.addEventListener('pointerup',finish);
 scene.dataset.renderer='event-ruler';
 new ResizeObserver(resize).observe(scene);new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)wake();else if(raf){cancelAnimationFrame(raf);raf=0;}},{rootMargin:'100px'}).observe(scene);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}else wake();});motionQuery.addEventListener('change',()=>{reduced=motionQuery.matches;if(reduced){motion=null;focus=active;}wake();paint(0);});update();resize();
})();
