(() => {
 'use strict';
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const hiddenPages=new Set(['craft/joseki-detail.html','pastimes/anime-scene.html','pastimes/anime-work.html','pastimes/game.html','pastimes/detail.html','works/entry.html','writing/entry.html']);
 const name=p=>p.title.replace(/\s*[·|｜]\s*Cheney.*$/i,'').replace(/^(志趣|技艺|作品|文存|互动)\s*[·｜]\s*/,'');
 const ordered={craft:['craft/writing.html','craft/poetry.html','craft/photography.html','craft/go.html','craft/dizi.html','craft/guitar.html','craft/joseki.html'],about:['about/index.html','about/ai.html'],works:['works/unsent-summer/index.html','works/future-letter/index.html']};
 function pages(catalog,chapter){const order=ordered[chapter.group]||[];return catalog.pages.filter(p=>p.group===chapter.group&&!/owner\.html|editor\.html/.test(p.path)&&!hiddenPages.has(p.path)&&(!p.path.includes('?')||/topic=|city=|stage=/.test(p.path))).sort((a,b)=>{const x=order.indexOf(a.path),y=order.indexOf(b.path);return (x<0?999:x)-(y<0?999:y);});}
 function mount({nav,mobile,catalog,chapters,navigate}){
  nav.querySelectorAll('.admin-subnav').forEach(n=>n.remove());
  for(const c of chapters){
   const parent=nav.querySelector('[data-view="chapter:'+c.key+'"]');if(!parent)continue;
   const children=el('div');children.className='admin-subnav';children.dataset.chapter=c.key;children.hidden=true;
   for(const p of pages(catalog,c)){const b=el('button',name(p));b.type='button';b.dataset.page=p.path;b.onclick=()=>navigate('chapter:'+c.key,{tool:'pages',scope:{chapter:c.key,section:c.section,group:c.group,sources:c.sources,path:p.path}});children.append(b);}
   parent.after(children);
  }
  mobile.replaceChildren();for(const b of nav.querySelectorAll(':scope > [data-view]')){
   const o=el('option',b.textContent);o.value=b.dataset.view;mobile.append(o);
   if(b.dataset.view.startsWith('chapter:')){const c=chapters.find(c=>c.key===b.dataset.view.slice(8));for(const p of pages(catalog,c)){const child=el('option','　'+c.title+' / '+name(p));child.value='subpage:'+c.key+':'+encodeURIComponent(p.path);mobile.append(child);}}
  }
  mobile.onchange=()=>{const match=/^subpage:([^:]+):(.+)$/.exec(mobile.value);if(!match){navigate(mobile.value);return;}const c=chapters.find(c=>c.key===match[1]);navigate('chapter:'+c.key,{tool:'pages',scope:{chapter:c.key,section:c.section,group:c.group,sources:c.sources,path:decodeURIComponent(match[2])}});};
  function sync({chapter,key}={}){
   const current=chapter||chapters.find(c=>pages(catalog,c).some(p=>p.path===key))?.key;
   for(const group of nav.querySelectorAll('.admin-subnav'))group.hidden=group.dataset.chapter!==current;
   for(const b of nav.querySelectorAll('[data-page]')){const yes=b.dataset.page===key;b.classList.toggle('is-active',yes);if(yes)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
   const option=current&&key&&[...mobile.options].find(o=>o.value==='subpage:'+current+':'+encodeURIComponent(key));if(option)mobile.value=option.value;
  }
  return {sync};
 }
 window.CHENEY_ADMIN_NAVIGATION={mount,pages,name};
})();
