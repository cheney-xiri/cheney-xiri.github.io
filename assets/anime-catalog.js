(function(){
  'use strict';
  const works=window.CHENEY_ANIME_WORKS||[];
  const groups=window.CHENEY_ANIME_GROUPS||{};
  const $=id=>document.getElementById(id);
  const node=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n};
  const isAnimation=group=>group.startsWith('animation-');
  const detailHref=work=>`anime-work.html?id=${encodeURIComponent(work.id)}`;
  function art(work,className,eager=false){
    const box=node('span',className);
    const fallback=node('span','ac-art-fallback',work.title);
    box.append(fallback);
    if(work.cover){
      const img=document.createElement('img');
      img.src=work.cover;img.alt='';img.loading=eager?'eager':'lazy';img.decoding='async';img.referrerPolicy='no-referrer';
      img.addEventListener('load',()=>box.classList.add('has-art'));
      img.addEventListener('error',()=>box.classList.add('art-failed'));
      box.append(img);
    }
    return box;
  }
  function card(work){
    const a=node('a','ac-card');a.href=detailHref(work);a.target='_blank';a.rel='noopener noreferrer';
    const image=art(work,'ac-card-art');
    const copy=node('span','ac-card-copy');
    const top=node('span','ac-card-top');
    top.append(node('span','',groups[work.group].label));
    copy.append(top,node('strong','',work.title),node('span','ac-card-summary',work.summary),node('span','ac-card-link','打开作品小档  ›'));
    a.append(image,copy);
    return a;
  }
  function initCatalog(){
    const section=document.body.dataset.section;
    const sectionWorks=works.filter(w=>section==='animation'?isAnimation(w.group):!isAnimation(w.group));
    const groupKeys=section==='animation'?['animation-cn','animation-world']:['cn-film','cn-anime','jp-film','jp-series','other-film'];
    const heroNames=section==='animation'?['熊出没','喜羊羊与灰太狼','海绵宝宝','葫芦娃']:['长安三万里','剑来','起风了','寻梦环游记'];
    for(const name of heroNames){const work=works.find(w=>w.title===name);if(!work)continue;const a=node('a','ac-hero-poster');a.href=detailHref(work);a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',`打开${work.title}作品小档`);a.append(art(work,'ac-hero-poster-art',true),node('span','',work.title));$('hero-posters').append(a)}
    $('total-count').textContent=`共 ${sectionWorks.length} 部 · 持续增补`;
    let activeGroup=groupKeys[0];
    const tabs=$('group-tabs'),search=$('work-search'),grid=$('work-grid');
    for(const key of groupKeys){const button=node('button','ac-tab');button.type='button';button.dataset.group=key;button.textContent=`${groups[key].label} ${sectionWorks.filter(w=>w.group===key).length}`;button.addEventListener('click',()=>{activeGroup=key;search.value='';render()});tabs.append(button)}
    search.addEventListener('input',render);
    function render(){
      const term=search.value.trim().toLocaleLowerCase();
      tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(!term&&b.dataset.group===activeGroup)));
      const result=sectionWorks.filter(w=>term?(`${w.title} ${w.summary} ${groups[w.group].label}`).toLocaleLowerCase().includes(term):w.group===activeGroup);
      $('result-title').textContent=term?'搜索结果':groups[activeGroup].label;
      $('result-count').textContent=`当前 ${result.length} 部`;
      grid.replaceChildren(...result.map(card));
      $('empty').hidden=result.length>0;
    }
    render();
  }
  function initWork(){
    const id=new URLSearchParams(location.search).get('id');
    const work=works.find(w=>w.id===id);
    if(!work){$('work-title').textContent='这一部尚未收录';$('work-summary').textContent='请返回片单选择已有的作品。';document.querySelector('.aw-layout').hidden=true;$('work-source').hidden=true;return}
    const animation=isAnimation(work.group),back=animation?'animation.html':'anime.html',backText=animation?'动画专区':'动漫图鉴';
    document.body.dataset.section=animation?'animation':'anime';
    document.title=`${work.title} · ${backText} · Cheney`;
    for(const id of ['top-back','crumb-back','foot-back']){$(id).href=back;$(id).textContent=id==='crumb-back'?backText:'返回'+backText}
    $('crumb-title').textContent=work.title;
    $('work-kicker').textContent=groups[work.group].short;
    $('work-title').textContent=work.title;
    $('work-summary').textContent=work.summary;
    $('work-cover').append(art(work,'aw-cover-art',true));
    $('work-meta').append(node('span','',groups[work.group].label),node('span','',groups[work.group].kind));
    $('work-source').href=`https://bangumi.tv/subject/${work.bgm}`;
    $('work-reading').textContent=work.summary;
    const dl=$('work-facts');
    const region=work.group.startsWith('cn-')||work.group==='animation-cn'?'中国':work.group.startsWith('jp-')?'日本':'其他地区';
    for(const [label,value] of [['归属',groups[work.group].label],['形式',groups[work.group].kind],['地区',region]]){dl.append(node('dt','',label),node('dd','',value))}
    const related=works.filter(w=>w.group===work.group&&w.id!==work.id).slice(0,4);
    for(const item of related){const a=node('a','aw-related');a.href=detailHref(item);a.target='_blank';a.rel='noopener noreferrer';a.append(art(item,'aw-related-art'),node('span','',item.title));$('related-works').append(a)}
  }
  if(document.body.dataset.page==='catalog')initCatalog();
  if(document.body.dataset.page==='work')initWork();
})();
