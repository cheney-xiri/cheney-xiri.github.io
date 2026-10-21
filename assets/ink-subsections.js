/* Topic illustration layer. Original media remain on disk and all content stays in place. */
(function(){
 'use strict';
 if(document.documentElement.dataset.inkPreserve||document.body.id==='ink-home')return;
 const assetRoot=new URL('.',document.currentScript.src);
 const type=document.body.dataset.inkPage;
 const source=document.querySelector('meta[name="cheney-page-path"]')?.content;
 const path=source?'/'+source:location.pathname;
 const topic=new URLSearchParams(location.search).get('topic');
 const imageUrl=key=>new URL('ink/subsections/'+key+'-v1.webp',assetRoot).href;
 // Each subsection chooses a scene independently of its foreground illustrations.
 const backdrop=()=>{
  let key=({profile:'portrait',journey:'study',editor:'study',books:'reading',henan:'river',
   'joseki-index':'go','joseki-detail':'go',summer:'summer',future:'future',digital:'digital',
   travel:'river','writing-index':'essays','writing-article':'essays',lines:'quotes',owner:'letter'})[type];
  if(type==='craft')key=document.body.dataset.craftSkill;
  if(type==='pastime')key=topic==='videos'?'videos':topic==='music'?'music':'reading';
  if(type==='interaction')key=document.body.dataset.interactionKind;
  if(type==='anime-game')key=/\/(?:game|games)\.html$/.test(path)?'games':'animation';
  if(type==='figure')key=({'mao':'resolve','qu':'river','li':'poetry','ke':'go','jay':'music','tfboys':'youth'})[path.split('/').pop().replace('.html','')];
  if(type==='digital'&&path.includes('z-image'))key='digital-light';
  if(type==='journey')key=path.includes('junior')?'study-spring':path.includes('senior')?'study-evening':'study';
  if(type==='writing-article'){
   const category=document.querySelector('.wen-breadcrumb')?.textContent||'';
   key=category.includes('自处')?'quotes':category.includes('关系')?'ally':category.includes('遗憾')?'letter':category.includes('分寸')?'wall':'essays';
  }
  document.body.dataset.inkBackdrop=key||'reading';
 };
 backdrop();
 const replace=(selector,key)=>{
  const img=document.querySelector(selector);if(!img||img.src===imageUrl(key))return;
  if(img.getAttribute('src'))img.dataset.originalIllustration=img.getAttribute('src');
  img.dataset.subsectionArt=key;img.width=1672;img.height=941;img.src=imageUrl(key);img.removeAttribute('srcset');
 };
 const add=(parent,key,extra='')=>{
  if(!parent||parent.querySelector('[data-subsection-art="'+key+'"]'))return;
  const fig=document.createElement('figure');fig.className='subsection-art '+extra;fig.dataset.subsectionArt=key;
  const img=document.createElement('img');img.src=imageUrl(key);img.alt='';img.width=1672;img.height=941;img.decoding='async';
  fig.setAttribute('aria-hidden','true');fig.append(img);parent.append(fig);
 };
 function apply(){
  if(type==='craft'){
   const key=document.body.dataset.craftSkill;
   if(['writing','poetry','go','dizi','guitar'].includes(key))replace('#craft-detail-image',key);
  }
  if(type==='pastime'&&['music','videos'].includes(topic))replace('#pastime-hero-image',topic);
  if(type==='writing-index')add(document.querySelector('.wen-hero'),'essays');
  if(type==='lines')add(document.querySelector('.wen-lines-hero>div:first-child'),'quotes');
  if(type==='books')add(document.querySelector('.catalog-heading'),'reading');
  if(type==='interaction'){
   const header=document.querySelector('.interaction-hero'),key=document.body.dataset.interactionKind;
   if(header&&!header.querySelector('.subsection-hero-copy')){
    const copy=document.createElement('div');copy.className='subsection-hero-copy';
    while(header.firstChild)copy.append(header.firstChild);header.append(copy);
   }
   if(['wall','letter','ally','featured'].includes(key))add(header,key);
  }
  if(type==='anime-game'){
   const hero=document.querySelector('.ac-hero')||document.querySelector('.catalog-hero');
   if(hero&&['/games.html','/anime.html','/animation.html'].some(s=>path.endsWith(s))){
    hero.classList.add('subsection-media-hero');
    add(hero,path.endsWith('/games.html')?'games':'animation');
   }
  }
 }
 apply();
 document.addEventListener('DOMContentLoaded',apply,{once:true});
 let pending=false;
 const main=document.querySelector('main');
 if(main&&['craft','pastime','anime-game'].includes(type))new MutationObserver(()=>{
  if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply();});
 }).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
})();
