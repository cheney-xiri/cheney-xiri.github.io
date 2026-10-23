/* Editable catalogue data extend the established public routes. */
(() => {
 'use strict';
 const ready=fetch('/assets/pastime-library.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('catalogue unavailable');return r.json();}).then(data=>{
  if(data.animeGroups&&typeof data.animeGroups==='object')window.CHENEY_ANIME_GROUPS={...window.CHENEY_ANIME_GROUPS,...data.animeGroups};
  if(Array.isArray(data.anime))window.CHENEY_ANIME_WORKS=data.anime.filter(w=>w&&w.id&&w.title&&!w.deleted);
  if(Array.isArray(data.games)){
   window.CHENEY_GAMES=data.games.filter(g=>g&&g.id&&g.name&&!g.deleted).map(g=>({...g,points:Array.isArray(g.points)?g.points:[]}));
   window.CHENEY_GAME_MEDIA={...window.CHENEY_GAME_MEDIA};window.CHENEY_GAME_INTROS={...window.CHENEY_GAME_INTROS};
   for(const g of window.CHENEY_GAMES){window.CHENEY_GAME_MEDIA[g.id]={src:g.cover||'',kind:g.coverKind||'poster'};window.CHENEY_GAME_INTROS[g.id]=g.intro||g.summary||'';}
  }
 }).catch(()=>{});
 window.CHENEY_PASTIME_LIBRARY={ready};
})();
