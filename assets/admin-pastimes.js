/* Owner catalogue forms: published through the existing repository connection. */
(() => {
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
 const field=(box,label,value,kind='text')=>{const l=el('label',label),n=el(kind==='textarea'?'textarea':'input');if(kind!=='textarea')n.type=kind;n.value=value??'';l.append(n);box.append(l);return n;};
 const select=(box,label,choices,value)=>{const l=el('label',label),n=el('select');for(const [key,text]of Object.entries(choices)){const o=el('option',text);o.value=key;n.append(o);}n.value=value;l.append(n);box.append(l);return n;};
 const validURL=value=>{if(!value)return '';try{const u=new URL(value,location.origin);if(!['https:','http:'].includes(u.protocol))throw 0;return value;}catch{throw Error('请填写有效的图片或网页地址。');}};
 async function mount(box,ctx){
  const path='assets/pastime-library.json',draftKey='cheney-pastime-library-draft-v1';let data,sha,tab='anime',selectedId='',timer,publishing=false;
  box.className='workspace full';const panel=el('section',undefined,'full-panel pastime-owner'),intro=el('div',undefined,'pastime-owner-head'),tabs=el('nav',undefined,'site-tools'),actions=el('div',undefined,'site-tools'),area=el('div',undefined,'pastime-owner-body'),directory=el('aside'),editor=el('div',undefined,'pastime-owner-editor');
  intro.append(el('h2','片目与游玩收藏'),el('p','在这里新增动漫、游戏，或整理已收录的名称、封面与简介。歌曲通过“歌单”补充。','field-help'));panel.append(intro,tabs,actions,area);area.append(directory,editor);box.replaceChildren(panel);
  const search=field(directory,'查找名称','','search'),list=el('div',undefined,'pastime-owner-list');directory.append(list);
  for(const [key,label]of [['anime','动漫与动画'],['games','游戏'],['music','歌单']]){const b=button(label,()=>{if(key==='music'){saveLocal();ctx.navigate('chapter:pastimes',{tool:'music'});return;}saveLocal();tab=key;search.value='';selectedId='';draw();});b.dataset.catalogTab=key;tabs.append(b);}
  const saved=el('span',undefined,'field-help');
  const add=button('新增动漫',()=>{let id;do{id=tab==='anime'?String(900000000+crypto.getRandomValues(new Uint32Array(1))[0]%100000000):'game-'+crypto.randomUUID().slice(0,8);}while(data[tab].some(x=>x.id===id));const item=tab==='anime'?{id,title:'',group:'cn-anime',summary:'',cover:''}:{id,name:'',platform:'pc',genre:'',summary:'',intro:'',points:[],cover:'',coverKind:'poster'};data[tab].unshift(item);selectedId=id;search.value='';changed();draw();editor.querySelector('input')?.focus();},'primary');
  const publish=button('发布片单与游戏',async()=>{if(publishing||!data)return;try{
   const form=editor.querySelector('form');if(form&&!form.reportValidity())return;
   for(const [key,items]of [['anime',data.anime],['games',data.games]])for(const item of items){if(!(key==='anime'?item.title:item.name)?.trim())throw Error('有尚未填写名称的条目，请补齐或删除。');validURL(item.cover);validURL(item.sourceUrl);}
   publishing=true;publish.disabled=true;panel.inert=true;saveLocal();const result=await ctx.api('/api/admin/source',{method:'POST',body:{path,sha,data}});sha=result.sha;localStorage.removeItem(draftKey);ctx.setDirty(false);saved.textContent='已提交发布';ctx.status('片单与游戏已提交发布，网站更新后即可查看。');
  }catch(e){ctx.status(e.message,true);}finally{publishing=false;publish.disabled=false;panel.inert=false;}},'primary');
  actions.append(add,button('保存草稿',()=>saveLocal(true)),publish,button('重新读取',()=>{if(!confirm('重新读取线上片单？本设备未发布的片单草稿会被替换。'))return;localStorage.removeItem(draftKey);load();}),saved);
  function changed(){ctx.setDirty(true);saved.textContent='正在保存本机草稿…';clearTimeout(timer);timer=setTimeout(()=>saveLocal(),250);}
  function saveLocal(notify=false){if(!data)return;clearTimeout(timer);try{localStorage.setItem(draftKey,JSON.stringify({sha,data,savedAt:new Date().toISOString()}));ctx.setDirty(false);saved.textContent='草稿已保存在本设备';if(notify)ctx.status('片单草稿已保存，确认后点击发布。');}catch{ctx.setDirty(true);ctx.status('本设备暂时无法保存草稿，请保持页面打开并发布。',true);}}
  function drawList(){list.replaceChildren();const q=search.value.trim().toLowerCase();for(const item of data[tab].filter(x=>(x.title||x.name||'未命名').toLowerCase().includes(q))){const b=button('',()=>{selectedId=item.id;draw();},'pastime-owner-item');b.setAttribute('aria-current',String(selectedId===item.id));if(item.cover){const image=el('img');image.src=item.cover;image.alt='';image.loading='lazy';b.append(image);}const copy=el('span');copy.append(el('strong',item.title||item.name||'未命名'),el('small',tab==='anime'?data.animeGroups[item.group]?.label||'动漫':(item.platform==='mobile'?'手游':'端游')+' · '+(item.genre||'待补类型')));b.append(copy);list.append(b);}if(!list.children.length)list.append(el('p','没有匹配的条目，可以新增。','field-help'));}
  function draw(){
   if(!data)return;tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.catalogTab===tab)));add.textContent=tab==='anime'?'新增动漫':'新增游戏';if(!data[tab].some(x=>x.id===selectedId))selectedId=data[tab][0]?.id||'';drawList();editor.replaceChildren();
   const item=data[tab].find(x=>x.id===selectedId);if(!item){editor.append(el('p','从新增第一项开始。'));return;}const anime=tab==='anime',form=el('form'),grid=el('div',undefined,'field-grid');form.onsubmit=e=>e.preventDefault();form.append(grid);editor.append(form);
   const bind=(label,key,kind='text')=>{const input=field(grid,label,item[key],kind);input.oninput=()=>{item[key]=input.value;changed();if(key==='title'||key==='name')drawList();};return input;};
   bind(anime?'动漫名称':'游戏名称',anime?'title':'name').required=true;
   if(anime){const group=select(grid,'作品分类',Object.fromEntries(Object.entries(data.animeGroups).map(([k,v])=>[k,v.label])),item.group);group.onchange=()=>{item.group=group.value;changed();drawList();};}
   else{const platform=select(grid,'游戏平台',{mobile:'手游',pc:'端游'},item.platform);platform.onchange=()=>{item.platform=platform.value;changed();drawList();};bind('游戏类型','genre');}
   bind('简介','summary','textarea');if(!anime){bind('详细介绍','intro','textarea');const points=field(grid,'内容要点（每行一条）',(item.points||[]).join('\n'),'textarea');points.oninput=()=>{item.points=points.value.split('\n').map(s=>s.trim()).filter(Boolean);changed();};const fit=select(grid,'封面类型',{poster:'海报或画面',icon:'游戏图标',logo:'游戏标识'},item.coverKind||'poster');fit.onchange=()=>{item.coverKind=fit.value;changed();};}
   const cover=bind('封面地址','cover'),image=el('img',undefined,'pastime-owner-cover'),tools=el('div',undefined,'site-tools');image.alt='封面预览';const updateCover=()=>{image.hidden=!item.cover;image.src=item.cover||'';};updateCover();form.append(image,tools);
   const applyCover=url=>{cover.value=item.cover=url;updateCover();changed();drawList();};cover.addEventListener('change',updateCover);
   tools.append(button('从素材库选择封面',()=>window.CHENEY_SITE_ADMIN.pickMedia(ctx,(url,media)=>{if(media.type!=='image'){ctx.status('请选择图片作为封面。',true);return;}applyCover(url);})));const upload=el('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';upload.setAttribute('aria-label','上传封面');upload.onchange=async()=>{if(!upload.files[0])return;upload.disabled=true;try{applyCover((await ctx.uploadImage(upload.files[0])).url);}catch(e){ctx.status(e.message,true);}finally{upload.disabled=false;upload.value='';}};tools.append(upload);
   if(anime)bind('资料链接（可选）','sourceUrl');
   const remove=button('删除这项收藏',()=>{if(!confirm('从片单中删除“'+(item.title||item.name||'未命名')+'”？发布后目录也会更新。'))return;data[tab]=data[tab].filter(x=>x.id!==item.id);selectedId='';changed();draw();},'danger'),preview=el('a','查看公开页面 ↗');preview.href=anime?'/pastimes/anime-work.html?id='+encodeURIComponent(item.id):'/pastimes/game.html?game='+encodeURIComponent(item.id);preview.target='_blank';preview.rel='noopener';tools.append(preview,remove);
  }
  async function load(){editor.replaceChildren(el('p','正在读取片单…'));try{const r=await ctx.api('/api/admin/source?path='+encodeURIComponent(path));if(ctx.isCurrent&&!ctx.isCurrent())return;data=structuredClone(r.data);sha=r.sha;let draft;try{draft=JSON.parse(localStorage.getItem(draftKey));}catch{}if(draft?.sha===sha&&draft.data){data=draft.data;saved.textContent='已恢复本机片单草稿';}else if(draft){saved.textContent='线上已有更新，本机旧草稿仍保留';}ctx.setDirty(false);draw();}catch(e){editor.replaceChildren(el('p',e.message));ctx.status(e.message,true);}}
  search.oninput=drawList;await load();
 }
 window.CHENEY_PASTIME_EDITOR={mount};
})();
