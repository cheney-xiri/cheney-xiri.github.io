(function(){
  'use strict';
  const games=window.CHENEY_GAMES||[];
  const $=id=>document.getElementById(id);
  const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  const platformName={mobile:'手游',pc:'端游'};
  const media=window.CHENEY_GAME_MEDIA||{};
  const detailHref=game=>`game.html?game=${encodeURIComponent(game.id)}`;
  const link=(game,cls)=>{const a=make('a',cls);a.href=detailHref(game);a.target='_blank';a.rel='noopener noreferrer';return a};
  function art(game,cls,eager=false){
    const wrap=make('span',`${cls} art-kind-${media[game.id]?.kind||'type'}`);
    const fallback=make('span','art-fallback',game.name.slice(0,1));wrap.append(fallback);
    if(media[game.id]?.src){const img=document.createElement('img');img.alt='';img.loading=eager?'eager':'lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.addEventListener('load',()=>wrap.classList.add('art-loaded'));img.addEventListener('error',()=>wrap.classList.add('art-failed'));img.src=media[game.id].src;wrap.append(img)}
    return wrap;
  }
  if(document.body.dataset.page==='catalog'){
    const collage=$('hero-collage');
    ['wzry','delta-pc','it-takes-two','egg-party'].forEach(id=>{const game=games.find(item=>item.id===id);const figure=make('figure','hero-cover');figure.append(art(game,'hero-cover-art',true),make('figcaption','',game.name));collage.append(figure)});
    let platform='mobile',genre='全部',query='';
    $('total-count').textContent=`共 ${games.length} 款游戏，按平台归卷。`;
    for(const key of ['mobile','pc']) $(`${key}-count`).textContent=`${games.filter(g=>g.platform===key).length} 款`;
    const tabs=[...document.querySelectorAll('[role="tab"]')];
    function render(){
      $('platform-title').textContent=platformName[platform];
      $('game-panel').setAttribute('aria-labelledby',`tab-${platform}`);
      tabs.forEach(tab=>{const active=tab.dataset.platform===platform;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
      const genres=['全部',...new Set(games.filter(g=>g.platform===platform).map(g=>g.genre))];
      if(!genres.includes(genre))genre='全部';
      const filters=$('genre-filters');filters.replaceChildren();
      genres.forEach(value=>{const b=make('button','genre-chip',value);b.type='button';b.setAttribute('aria-pressed',String(value===genre));b.addEventListener('click',()=>{genre=value;render()});filters.append(b)});
      const selected=games.filter(g=>g.platform===platform&&(genre==='全部'||g.genre===genre)&&g.name.toLocaleLowerCase().includes(query));
      $('result-count').textContent=`当前 ${selected.length} 款`;
      const grid=$('game-grid');grid.replaceChildren();
      selected.forEach((game,index)=>{const a=link(game,'game-card');a.dataset.genre=game.genre;a.append(make('small','game-card-number',String(index+1).padStart(2,'0')));a.append(art(game,'game-card-art'));const content=make('span','game-card-body');content.append(make('span','game-card-meta',`${game.genre} · ${platformName[game.platform]}`),make('strong','',game.name),make('span','game-card-summary',game.summary),make('span','game-card-open','进入此篇'));a.append(content);grid.append(a)});
      $('empty').hidden=selected.length!==0;
    }
    tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>{platform=tab.dataset.platform;genre='全部';render()});tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click()})});
    $('game-search').addEventListener('input',event=>{query=event.target.value.trim().toLocaleLowerCase();render()});
    render();
  }
  if(document.body.dataset.page==='detail'){
    const id=new URLSearchParams(location.search).get('game');
    const game=games.find(item=>item.id===id);
    if(!game){$('game-title').textContent='未找到这款游戏';$('game-summary').textContent='请返回游戏目录重新选择。';document.querySelector('.detail-layout').hidden=true;return}
    document.title=`${game.name} · 游戏图鉴 · Cheney`;
    $('crumb-name').textContent=game.name;
    $('game-overline').textContent=`${platformName[game.platform]} / ${game.genre} / 游戏图鉴`;
    $('game-title').textContent=game.name;
    $('game-summary').textContent=game.summary;
    $('detail-art').append(art(game,'detail-cover',true));
    $('impression-title').textContent=game.genre==='待核对'?'待补准确名称':game.genre==='合作'?'在合作中前行':game.genre==='恐怖'?'走向未知':game.genre==='模拟'?'把过程看清':game.genre==='策略'?'在选择中布局':game.genre==='竞速'?'沿着赛道前进':'进入这款游戏';
    $('game-impression').textContent=window.CHENEY_GAME_INTROS?.[game.id]||game.summary;
    const meta=$('game-meta');[platformName[game.platform],game.genre].forEach(t=>meta.append(make('span','',t)));
    const facts=$('game-facts');[['平台',platformName[game.platform]],['类型',game.genre],['收录','Cheney 的游戏名单']].forEach(([name,value])=>{facts.append(make('dt','',name),make('dd','',value))});
    const points=$('game-points');game.points.forEach((text,index)=>{const item=make('div','point');item.append(make('span','point-num',String(index+1).padStart(2,'0')),make('p','',text));points.append(item)});
    const related=games.filter(other=>other.id!==game.id&&other.platform===game.platform&&other.genre===game.genre).slice(0,3);
    if(related.length<3)related.push(...games.filter(other=>other.id!==game.id&&other.platform===game.platform&&!related.includes(other)).slice(0,3-related.length));
    related.forEach(other=>{const a=link(other,'related-link');a.append(make('strong','',other.name),make('small','',other.genre));$('related-games').append(a)});
    const key=`cheney-game-note:${game.id}`;const note=$('personal-note');try{note.value=localStorage.getItem(key)||''}catch{};
    $('save-note').addEventListener('click',()=>{try{localStorage.setItem(key,note.value);$('save-status').textContent='已保存在当前浏览器'}catch{$('save-status').textContent='浏览器未允许保存，请复制文字自行留存'}});
    note.addEventListener('input',()=>{$('save-status').textContent='尚未保存'});
  }
})();
