(function(){
  'use strict';
  const scenes=window.CHENEY_ANIME_SCENES||[];
  const $=id=>document.getElementById(id);
  const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n};
  const href=scene=>`anime-scene.html?scene=${encodeURIComponent(scene.id)}`;
  if(document.body.dataset.page==='anime-index'){
    const grid=$('scene-grid');
    scenes.forEach(scene=>{
      const link=el('a',`scene-card scene-card--${scene.id}`);link.href=href(scene);link.target='_blank';link.rel='noopener noreferrer';
      const visual=el('span','scene-card-visual');visual.append(el('span','scene-card-mark',scene.mark),el('span','scene-card-index',scene.number));
      const copy=el('span','scene-card-copy');copy.append(el('small','',`第 ${scene.number} 幕`),el('strong','',scene.label),el('span','',scene.subtitle),el('em','','翻阅这一幕  ›'));
      link.append(visual,copy);grid.append(link);
    });
  }
  if(document.body.dataset.page==='anime-scene'){
    const id=new URLSearchParams(location.search).get('scene');const scene=scenes.find(item=>item.id===id);
    if(!scene){$('scene-title').textContent='这一幕尚未收录';$('scene-subtitle').textContent='请返回放映室，选择已有的观影主题。';document.querySelector('.scene-reading').hidden=true;return}
    document.body.dataset.scene=scene.id;document.title=`${scene.label} · 动漫放映室 · Cheney`;
    $('scene-crumb').textContent=scene.label;$('scene-number').textContent=`第 ${scene.number} 幕 / 动漫放映室`;$('scene-title').textContent=scene.label;$('scene-subtitle').textContent=scene.subtitle;$('scene-mark').textContent=scene.mark;$('scene-intro').textContent=scene.intro;$('scene-lead').textContent=scene.lead;
    scene.notes.forEach(([title,text],index)=>{const item=el('article','scene-note');item.append(el('small','',String(index+1).padStart(2,'0')),el('h3','',title),el('p','',text));$('scene-notes').append(item)});
    scenes.filter(item=>item.id!==scene.id).forEach(item=>{const a=el('a','scene-nav-link');a.href=href(item);a.target='_blank';a.rel='noopener noreferrer';a.append(el('span','',item.mark),el('strong','',item.label));$('scene-nav').append(a)});
  }
})();
