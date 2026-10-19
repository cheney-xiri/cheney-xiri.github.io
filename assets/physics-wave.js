(function(){
 'use strict';
 const scene=document.getElementById('wave-scene');if(!scene)return;
 const canvas=document.getElementById('wave-canvas'),ctx=canvas.getContext('2d'),nodes=[...scene.querySelectorAll('[data-wave-index]')],stories=[...document.querySelectorAll('[data-wave-story]')],slider=document.getElementById('wave-slider');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,total=nodes.length;
 let active=0,focus=0,target=0,width=1000,height=280,raf=0,visible=false,last=0,drag=null,dragged=false,viewX=0,viewY=0;
 // Perspective projection of a helical wave, with depth, ribbon edges and a ground grid.
 function project(t,side=0,lift=0){const u=t-focus,x=u*88,y=Math.sin(t*.72)*78+lift,z=Math.cos(t*.72)*155+side;
  const yaw=-.31+viewX*.22,tilt=.56+viewY*.14,xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw),yy=y*Math.cos(tilt)-zz*Math.sin(tilt),depth=y*Math.sin(tilt)+zz*Math.cos(tilt),scale=740/(860+depth);
  return {x:width*.46+xx*scale,y:height*.53+yy*scale,s:scale,z:depth};
 }
 function draw(time=0){ctx.clearRect(0,0,width,height);const glow=ctx.createRadialGradient(width*.5,height*.58,5,width*.5,height*.58,width*.52);glow.addColorStop(0,'rgba(35,112,165,.16)');glow.addColorStop(1,'rgba(5,14,28,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  // A cylindrical mesh gives the wave a visible body and a shaded back surface.
  for(let i=0;i<65;i++){const sx=(Math.sin(i*127.1)*43758.54)%1,sy=(Math.sin(i*73.7)*19423.17)%1;ctx.fillStyle='rgba(157,196,220,'+(.1+(i%3)*.07)+')';ctx.fillRect(Math.abs(sx)*width,Math.abs(sy)*height,.8,.8);}
  const strands=30;for(let k=0;k<strands;k++){const angle=k/strands*Math.PI*2,front=Math.sin(angle),lift=Math.cos(angle)*45,side=front*45;ctx.beginPath();for(let j=0;j<=240;j++){const t=focus-9+j/240*18,p=project(t,side,lift);if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.strokeStyle='rgba('+(front>0?'142,215,251':'63,126,174')+','+(front>0?.19:.06)+')';ctx.lineWidth=front>0?.8:.5;ctx.stroke();}
  for(let i=0;i<70;i++){const t=focus-9+i/70*18;ctx.beginPath();for(let k=0;k<=26;k++){const a=k/26*Math.PI*2,p=project(t,Math.sin(a)*34,Math.cos(a)*34);if(k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.strokeStyle='rgba(99,182,228,.075)';ctx.lineWidth=.6;ctx.stroke();}
  ctx.beginPath();for(let j=0;j<=320;j++){const p=project(focus-9+j/320*18);if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.strokeStyle='rgba(191,232,255,.95)';ctx.lineWidth=1.4;ctx.shadowColor='#64c8ff';ctx.shadowBlur=15;ctx.stroke();
  ctx.shadowBlur=0;
  // A second fine wave follows the same spatial route, suggesting a luminous ribbon.
  for(let i=0;i<35;i++){const t=focus-8+((i/35+time*.000025)%1)*16,p=project(t);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.7,1.2*p.s),0,Math.PI*2);ctx.fillStyle='rgba(193,234,255,.75)';ctx.fill();}
  nodes.forEach((node,i)=>{const p=project(i),shown=p.x>24&&p.x<width-24;node.style.left=p.x+'px';node.style.top=p.y+'px';node.style.transform='translate(-50%,-50%) scale('+p.s+')';node.style.zIndex=String(Math.round(1000-p.z));node.style.opacity=shown?String(i===active?1:Math.max(.25,.76-Math.abs(i-active)*.07)):'0';node.style.pointerEvents=shown?'auto':'none';node.tabIndex=shown?0:-1;node.querySelector('span').style.visibility=Math.abs(i-active)<(width<500?2:3)?'visible':'hidden';});
 }
 function frame(now){raf=0;if(!visible)return;if(!reduce&&now-last<32){raf=requestAnimationFrame(frame);return;}const delta=Math.min(50,now-last||32);last=now;focus+=(target-focus)*(reduce?1:1-Math.exp(-delta/150));if(Math.abs(focus-target)<.001)focus=target;draw(reduce?0:now);if(!reduce||focus!==target)raf=requestAnimationFrame(frame);}
 function wake(){if(!raf&&visible)raf=requestAnimationFrame(frame);}
 function resize(){const r=scene.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);draw();wake();}
 function select(index){active=Math.max(0,Math.min(total-1,index));target=active;if(reduce)focus=target;
  nodes.forEach((node,i)=>{node.classList.toggle('is-active',i===active);if(i===active)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');});
  stories.forEach((story,i)=>story.hidden=i!==active);slider.value=active;slider.setAttribute('aria-valuetext',nodes[active].getAttribute('aria-label'));document.getElementById('wave-position').textContent=String(active+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
  document.querySelector('[data-wave-step="-1"]').disabled=active===0;document.querySelector('[data-wave-step="1"]').disabled=active===total-1;wake();draw();
 }
 nodes.forEach(node=>node.addEventListener('click',event=>{if(dragged){event.preventDefault();return;}select(Number(node.dataset.waveIndex));}));
 document.querySelectorAll('[data-wave-step]').forEach(b=>b.addEventListener('click',()=>select(active+Number(b.dataset.waveStep))));slider.addEventListener('input',()=>select(Number(slider.value)));
 scene.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();select(active+(event.key==='ArrowLeft'?-1:1));}if(event.key==='Home'){event.preventDefault();select(0);}if(event.key==='End'){event.preventDefault();select(total-1);}});
 scene.addEventListener('pointerdown',event=>{if(event.button!==0&&event.pointerType==='mouse')return;dragged=false;drag={id:event.pointerId,x:event.clientX,y:event.clientY,start:active,captured:false};});
 scene.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||reduce||drag)return;const box=scene.getBoundingClientRect();viewX=(event.clientX-box.left)/width-.5;viewY=(event.clientY-box.top)/height-.5;});
 scene.addEventListener('pointerleave',()=>{viewX=0;viewY=0;});
 scene.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.captured&&Math.abs(dy)>Math.abs(dx)+8){drag=null;return;}if(!drag.captured&&Math.abs(dx)>8){scene.setPointerCapture(event.pointerId);drag.captured=true;dragged=true;scene.classList.add('is-dragging');}if(drag.captured){event.preventDefault();select(drag.start-Math.round(dx/(width<600?52:80)));}});
 function finish(){if(!drag)return;if(scene.hasPointerCapture(drag.id))scene.releasePointerCapture(drag.id);drag=null;scene.classList.remove('is-dragging');setTimeout(()=>dragged=false,100);}
 scene.addEventListener('pointerup',finish);scene.addEventListener('pointercancel',finish);window.addEventListener('pointerup',finish);
 new ResizeObserver(resize).observe(scene);new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)wake();else if(raf){cancelAnimationFrame(raf);raf=0;}},{rootMargin:'100px'}).observe(scene);select(0);resize();
})();
