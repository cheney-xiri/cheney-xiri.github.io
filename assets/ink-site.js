/* Shared page atmosphere. The three preserved sections leave before any DOM changes. */
(function(){
 'use strict';
 const root=document.documentElement;
 if(root.dataset.inkPreserve)return;
 const body=document.body;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const type=body.dataset.inkPage;
 if(type==='pastime')body.dataset.inkTopic=new URLSearchParams(location.search).get('topic')||'';
 const headerSelectors={profile:'.profile-hero',journey:'.stage-hero',editor:'.editor-hero',owner:'.owner-heading',books:'.catalog-heading',henan:'.henan-hero',craft:'.craft-detail-hero','joseki-index':'.catalog-hero','joseki-detail':'.lesson-heading',figure:'.fp-hero',summer:'.summer-hero',future:'.novel-hero',digital:'.digital-hero',travel:'.travel-hero, .travel-credits-head','writing-index':'.wen-hero','writing-article':'.wen-article-head',lines:'.wen-lines-hero',interaction:'.interaction-hero',pastime:'.pastime-hero','anime-game':'.ac-hero, .aw-hero, .detail-hero, .catalog-hero, .scene-hero'};
 const decorateHeaders=()=>document.querySelectorAll(headerSelectors[type]||'.ink-no-header').forEach(header=>{
  header.classList.add('ink-page-opening');
  const title=header.querySelector('h1');
  if(title&&title.textContent.trim().length<=12)title.classList.add('ink-calligraphy');
 });
 decorateHeaders();
 // These pages replace their initial markup when their existing data has loaded.
 // Decorate that actual header too, without changing its content or renderer.
 if(['pastime','anime-game','joseki-detail','travel'].includes(type)){
  const content=document.querySelector('main');let pending=false;
  if(content)new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;decorateHeaders();});}).observe(content,{childList:true,subtree:true});
 }
 if(type==='home'){
  const hero=document.querySelector('.hero');
  const chapters=[hero,...document.querySelectorAll('section.juan')];
  const nav=document.querySelector('.nav');let navFrame=0;
  document.querySelectorAll('.hero-drift .drift-line').forEach(line=>{
   const lane=parseFloat(line.style.getPropertyValue('--y'));
   if(!matchMedia('(max-width:768px)').matches){
    const lanes={13:14,30:23,47:76,62:86};
    if(lanes[lane])line.style.setProperty('--y',lanes[lane]+'%');
   }
   const lower=reduced.matches||parseFloat(line.style.getPropertyValue('--y'))>60;
   line.style.setProperty('--ink-poem-color',lower?'#dcebe4':'#24454e');
  });
  const navState=()=>{if(nav)nav.dataset.inkNav=scrollY>Math.max(50,hero.offsetHeight*.65)?'light':'dark';};
  addEventListener('scroll',()=>{if(navFrame)return;navFrame=requestAnimationFrame(()=>{navState();navFrame=0;});},{passive:true});
  navState();
  let frame=0,visible=true;
  if('IntersectionObserver'in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(!visible)hero.style.removeProperty('--ink-drift');}).observe(hero);
  hero.addEventListener('pointermove',e=>{if(frame||reduced.matches||!visible||e.pointerType==='touch')return;frame=requestAnimationFrame(()=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--ink-drift',((e.clientX-r.left)/r.width-.5).toFixed(3));frame=0;});},{passive:true});
  hero.addEventListener('pointerleave',()=>hero.style.setProperty('--ink-drift','0'));
  document.querySelectorAll('section.juan').forEach((section,i)=>section.style.setProperty('--ink-order',i));
 }
 const targets=document.querySelectorAll('.ink-page-opening,.fp-section-head,.novel-section-head,.digital-section-heading,.stage-section-head,.craft-more-head,.wen-line-group>header');
 if(!reduced.matches&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('ink-is-visible');io.unobserve(e.target);}}),{threshold:.06});targets.forEach(n=>{n.classList.add('ink-can-reveal');io.observe(n);});}
 if(type==='lines'){
  document.querySelectorAll('.wen-line-group').forEach((n,i)=>n.dataset.inkVerse=String(i));
 }
 // All effects stop while this document is hidden. Readable content remains visible.
 const pause=()=>root.classList.toggle('ink-paused',document.hidden);
 document.addEventListener('visibilitychange',pause);pause();
})();
