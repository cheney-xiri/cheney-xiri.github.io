(() => {
 'use strict';
 const chapters=[
  {key:'opening',title:'开篇',section:'top',group:'home',art:'scroll-mountains-v1',note:'名号、诗词与首页开篇',tools:[['pages','开篇图文']]},
  {key:'about',title:'关于我',section:'about',group:'about',art:'scroll-bamboo-v1',note:'自述、个性小档与 AI 探索',tools:[['profile','个性小档'],['pages','本章图文']]},
  {key:'journey',title:'行旅',section:'journey',group:'journey',art:'scroll-journey-v1',note:'求学经历、阶段照片与视频',tools:[['journey','求学经历'],['pages','本章图文']]},
  {key:'craft',title:'技艺',section:'craft',group:'craft',art:'chapter-craft-v1',note:'写作、围棋、摄影与清音',sources:['joseki-'],tools:[['pages','本章图文'],['sources','围棋资料']]},
  {key:'pastimes',title:'志趣',section:'pastimes',group:'pastimes',art:'chapter-pastimes-v1',note:'听歌、物理与宇宙、剪视频等',sources:['pastimes.json','music-selection.json'],tools:[['pages','本章图文'],['music','歌单'],['anime','观影手记'],['sources','志趣资料']]},
  {key:'works',title:'作品',section:'works',group:'works',art:'chapter-works-v1',note:'作品介绍、人物与创作近况',tools:[['works','作品目录'],['pages','本章图文']]},
  {key:'travels',title:'足迹',section:'travels',group:'travels',art:'scroll-river-v1',note:'城市、到访记录与沿途影像',sources:['travels.json'],tools:[['travels','城市与影像'],['sources','城市资料'],['pages','本章图文']]},
  {key:'admire',title:'仰止',section:'admire',group:'figures',art:'scroll-admire-v1',note:'仰慕的人、诗篇与追星',tools:[['pages','人物与诗篇']]},
  {key:'writing',title:'文存',section:'writing',group:'writing',art:'chapter-writing-v1',note:'摘要与整理、诗词与话语',tools:[['articles','摘要与整理'],['quotes','句笺'],['pages','本章图文']]},
  {key:'reading',title:'读书',section:'reading',group:'books',art:'subsections/reading-v1',note:'书架、阅读记录与摘记',tools:[['books','书架'],['pages','本章图文']]},
  {key:'interaction',title:'互动',section:'links',group:'interaction',art:'chapter-interaction-v1',note:'题壁、尺素、同道与精选页面',tools:[['pages','互动页面']]},
  {key:'contact',title:'联络',section:'contact',group:'home',art:'chapter-contact-v1',note:'联络文字、公开入口与二维码',tools:[['pages','联络图文']]}
 ];
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 async function overview(box,ctx){
  const catalog=await ctx.api('/api/admin/site-catalog');if(ctx.isCurrent&&!ctx.isCurrent())return;box.className='workspace full';const panel=el('section',undefined,'full-panel admin-overview'),intro=el('div',undefined,'admin-overview-intro');intro.append(el('span','CHENEY / 我的主页'),el('h2','从这一卷，续写下一页。'),el('p','按个人主页的章节整理内容。文字、图片和视频，在各自的章节里集中管理。'));panel.append(intro);
  const tools=el('div',undefined,'site-tools'),search=el('input');search.type='search';search.placeholder='查找章节、页面或功能';search.setAttribute('aria-label','查找后台内容');tools.append(search);for(const [label,view]of [['素材库','media'],['全站页面','pages'],['内容备份','backup']]){const b=el('button',label);b.type='button';b.onclick=()=>view==='backup'?document.querySelector('#backup').click():ctx.navigate(view);tools.append(b);}panel.append(tools);
  const grid=el('div',undefined,'admin-chapter-grid'),results=el('div',undefined,'admin-search-results');panel.append(grid,results);box.replaceChildren(panel);
  const draw=()=>{grid.replaceChildren();results.replaceChildren();const q=search.value.trim().toLowerCase();for(const [i,c]of chapters.entries()){
   if(q&&![c.title,c.note,...c.tools.map(x=>x[1])].join(' ').toLowerCase().includes(q))continue;
   const card=el('button',undefined,'admin-chapter-card');card.type='button';card.dataset.chapter=c.key;const img=el('img');img.src='/assets/ink/'+c.art+'.webp';img.alt='';img.loading='lazy';img.onerror=()=>img.remove();const copy=el('span',undefined,'admin-chapter-copy');copy.append(el('small',String(i).padStart(2,'0')+' / '+(c.group==='home'?'首页章节':catalog.pages.filter(x=>x.group===c.group).length+' 个页面')),el('strong',c.title),el('span',c.note),el('em','进入管理 ↗'));card.append(img,copy);card.onclick=()=>ctx.navigate('chapter:'+c.key);grid.append(card);
  }if(q){const matches=catalog.pages.filter(x=>(x.title+' '+x.path).toLowerCase().includes(q)).slice(0,20);if(matches.length){results.append(el('h3','相关页面'));for(const page of matches){const b=el('button',page.title);b.type='button';b.onclick=()=>ctx.navigate('pages',{scope:{path:page.path,group:page.group}});results.append(b);}}if(!grid.children.length&&!matches.length)results.append(el('p','没有找到匹配内容，可以换个关键词。'));}};search.oninput=draw;draw();
 }
 window.CHENEY_ADMIN_CHAPTERS={chapters,overview};
})();
