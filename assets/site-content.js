/* Apply owner-published text and media changes without replacing chapter layouts. */
(() => {
  'use strict';
  const latest=new Map(),saved=new Map(); let active=[],timer,applying=false;
  const remember=(target,key)=>{let map=saved.get(target);if(!map){map=new Map();saved.set(target,map);}if(!map.has(key))map.set(key,key==='nodeValue'?target.nodeValue:key==='backgroundImage'||key==='objectFit'?target.style[key]:target.getAttribute(key));};
  function reset(){for(const [target,values]of saved)for(const [key,value]of values){if(key==='nodeValue')target.nodeValue=value;else if(key==='backgroundImage'||key==='objectFit')target.style[key]=value;else if(value===null)target.removeAttribute(key);else target.setAttribute(key,value);}saved.clear();latest.clear();document.querySelectorAll('[data-cms-block]').forEach(n=>n.remove());}
  const allowed=value=>{try{const u=new URL(value,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  const matching=p=>{try{const target=document.querySelector(p.selector);return target&&!target.closest('head,script,style,input,textarea,select,iframe')?target:null;}catch{return null;}};
  function block(p){
    if(document.querySelector('[data-cms-block="'+CSS.escape(p.id)+'"]'))return;
    const anchor=matching(p);if(!anchor)return;
    const section=document.createElement('section');section.className='cheney-owner-block';section.dataset.cmsBlock=p.id;
    if(p.title){const h=document.createElement('h3');h.textContent=p.title;section.append(h);}
    if(p.format==='text'){for(const paragraph of p.value.split(/\n\s*\n/)){const el=document.createElement('p');el.textContent=paragraph;section.append(el);}}
    else if(p.format==='link'){const a=document.createElement('a');a.href=allowed(p.value);a.textContent=p.caption||p.title||'打开链接 ↗';section.append(a);}
    else{const media=document.createElement(p.format==='image'?'img':p.format);const url=allowed(p.value);if(!url)return;media.src=url;if(p.format==='image'){media.alt=p.alt||p.caption||p.title;media.loading='lazy';}else{media.controls=true;media.preload='metadata';media.playsInline=true;if(p.poster)media.poster=allowed(p.poster);}section.append(media);if(p.caption){const caption=document.createElement('p');caption.className='cheney-owner-caption';caption.textContent=p.caption;section.append(caption);}}
    anchor.insertAdjacentElement(p.position==='beforeend'?'beforeend':'afterend',section);
  }
  function apply(patches){
    if(applying)return;applying=true;
    if(patches!==undefined){reset();active=patches;}
    try{for(const p of active){if(p.device==='mobile'&&innerWidth>760||p.device==='desktop'&&innerWidth<=760)continue;if(p.type==='block'){block(p);continue;}const target=matching(p);if(!target)continue;const key=p.id||p.type+':'+p.selector+':'+p.textIndex;
      if(p.type==='text'){const text=[...target.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE)[p.textIndex];if(!text||text.nodeValue===p.value)continue;if(text.nodeValue!==p.original&&text.nodeValue!==latest.get(key))continue;remember(text,'nodeValue');text.nodeValue=p.value;latest.set(key,p.value);continue;}
      const url=allowed(p.value);if(!url)continue;
      if(p.type==='image'){if(target.tagName!=='IMG')continue;const current=target.getAttribute('src');if(current!==p.original&&current!==p.value&&current!==latest.get(key))continue;['src','srcset','alt','objectFit'].forEach(k=>remember(target,k));if(current!==p.value){target.src=p.value;target.removeAttribute('srcset');const picture=target.closest('picture');if(picture)picture.querySelectorAll('source').forEach(s=>{remember(s,'srcset');s.removeAttribute('srcset');});}if(target.alt!==p.alt)target.alt=p.alt;target.style.objectFit=p.fit;latest.set(key,p.value);}
      if(p.type==='video'){if(!['VIDEO','AUDIO'].includes(target.tagName))continue;const current=target.getAttribute('src')||target.querySelector('source')?.getAttribute('src')||'';if(current!==p.original&&current!==p.value&&current!==latest.get(key))continue;['src','poster','controls'].forEach(k=>remember(target,k));if(target.getAttribute('src')!==p.value){target.src=p.value;target.load();}target.controls=true;if(p.poster)target.poster=allowed(p.poster);latest.set(key,p.value);}
      if(p.type==='link'&&target.tagName==='A'){const current=target.getAttribute('href');if(current!==p.original&&current!==p.value&&current!==latest.get(key))continue;remember(target,'href');if(current!==p.value)target.href=p.value;latest.set(key,p.value);}
      if(p.type==='background'){remember(target,'backgroundImage');target.style.backgroundImage='url('+JSON.stringify(url)+')';}
    }}finally{applying=false;}
  }
  function key(){let pathname=(document.querySelector('meta[name="cheney-page-path"]')?.content||location.pathname).replace(/^\//,'');if(!pathname||pathname.endsWith('/'))pathname+='index.html';const search=new URLSearchParams(location.search);['v','cms-edit','cms-preview','writing','fit','ink'].forEach(x=>search.delete(x));search.sort();return pathname+(search.size?'?'+search:'');}
  const ready=fetch('/api/site-edits',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(data=>{const exact=key(),base=exact.split('?')[0];active=[...(data.pages?.[base]?.patches||[]),...(exact!==base?data.pages?.[exact]?.patches||[]:[])];apply();const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>apply(),100);});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['src','srcset','href','poster']});let mobile=innerWidth<=760;addEventListener('resize',()=>{if(mobile!==(innerWidth<=760)){mobile=innerWidth<=760;apply([...active]);}});}).catch(()=>{});
  window.CHENEY_PAGE_CONTENT={ready,apply,key};
})();
