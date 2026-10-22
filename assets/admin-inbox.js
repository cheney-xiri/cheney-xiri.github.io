(() => {
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const channels=[{kind:'wall',name:'题壁',note:'公开评论',path:'wall.html'},{kind:'ally',name:'结盟',note:'公开评论',path:'ally.html'},{kind:'featured',name:'题跋',note:'公开评论',path:'featured.html'},{kind:'letter',name:'尺素',note:'仅我可见'}];
 let dispose=()=>{};
 async function mount(box,ctx){
  dispose();box.className='workspace full';const panel=el('section',undefined,'full-panel'),service=window.CHENEY_INTERACTION_SERVICE;box.replaceChildren(panel);
  panel.append(el('h2','评论与尺素'),el('p','三个公开的评论区，一处私人的信箱。点击栏目分别查看和管理。'));
  const tabs=el('nav',undefined,'inbox-channels');tabs.setAttribute('aria-label','互动四个栏目');const stage=el('section',undefined,'inbox-channel-content');panel.append(tabs,stage);
  let selected='wall',publicRecords={},privateRecords=[],counts={},serial=0,closed=false,loading=false,failures={};
  const current=()=>!closed&&(!ctx.isCurrent||ctx.isCurrent());
  const channel=()=>channels.find(x=>x.kind===selected);
  const buttons=new Map();
  for(const c of channels){const b=el('button');b.type='button';b.disabled=true;b.dataset.kind=c.kind;b.append(el('strong',c.name),el('small',c.note),el('span','', 'inbox-channel-count'));b.onclick=()=>{serial++;selected=c.kind;if(c.kind!=='letter'){privateRecords=[];delete counts.letter;}draw();if(c.kind!=='letter'||service.authenticated)refresh();};tabs.append(b);buttons.set(c.kind,b);}
  function updateTabs(){for(const c of channels){const b=buttons.get(c.kind);b.setAttribute('aria-pressed',String(c.kind===selected));b.querySelector('.inbox-channel-count').textContent=counts[c.kind]===undefined?'':counts[c.kind]+' 条';}}
  function header(){const c=channel(),head=el('div',undefined,'inbox-channel-heading'),copy=el('div');copy.append(el('h3',c.name),el('p',c.kind==='letter'?'来信只在这里显示，不会公开。':'这里的评论向所有访客公开。','field-help'));head.append(copy);if(c.path){const a=el('a','打开公开页面 ↗');a.href='/interaction/'+c.path;a.target='_blank';a.rel='noopener';head.append(a);}stage.append(head);}
  function loginForm(){
   const form=el('form',undefined,'editor-form'),label=el('label','私人信箱密码'),input=el('input'),submit=el('button','解锁信箱','primary');input.type='password';input.required=true;input.autocomplete='current-password';input.name='inboxPassword';label.append(input);submit.type='submit';form.append(label,el('p','使用你在服务端设置的信箱密码；三个公开栏目无需这一步即可查看。','field-help'),submit);stage.append(form);
   form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;try{await service.login(input.value);input.value='';await refresh();}catch(e){ctx.status(e.message,true);}finally{submit.disabled=false;}};
  }
  function draw(){
   if(!current())return;updateTabs();stage.replaceChildren();header();
   if(selected==='letter'&&!service.authenticated){loginForm();return;}
   if(failures[selected])stage.append(el('p','这个栏目暂时未能更新：'+failures[selected]+'。请点击刷新重试。','inbox-load-warning'));
   const records=selected==='letter'?privateRecords:(publicRecords[selected]||[]),tools=el('div',undefined,'site-tools'),search=el('input'),list=el('div',undefined,'inbox-messages');search.type='search';search.placeholder='搜索称呼或内容';search.setAttribute('aria-label','搜索评论与尺素');
   const refreshButton=el('button',loading?'正在更新…':'刷新内容');refreshButton.type='button';refreshButton.disabled=loading;refreshButton.onclick=()=>refresh();tools.append(search,refreshButton);
   if(service.authenticated){const lock=el('button','锁定管理');lock.type='button';lock.onclick=()=>service.logout().catch(e=>ctx.status(e.message,true));tools.append(lock);}else{const unlock=el('button','解锁管理');unlock.type='button';unlock.onclick=()=>{selected='letter';draw();};tools.append(unlock);}
   stage.append(tools,list);
   const render=()=>{list.replaceChildren();const q=search.value.trim().toLowerCase();for(const m of records.filter(m=>!m.deleted&&((m.name||'')+' '+m.text).toLowerCase().includes(q))){
    const card=el('article',undefined,'message-card'+(m.kind==='letter'?' inbox-private':''));card.append(el('small',channel().name+' · '+channel().note),el('h4',m.name||'匿名访客'),el('time',new Date(m.createdAt).toLocaleString('zh-CN')),el('p',m.text));
    if(m.article)card.append(el('p','读后 · '+m.article));if(m.siteName)card.append(el('p','站名 · '+m.siteName));
    if(selected==='letter'){if(m.email)card.append(el('p','回信邮箱 · '+m.email));if(m.contact)card.append(el('p','联系方式 · '+m.contact));}
    if(service.authenticated){const remove=el('button','删除','danger');remove.type='button';remove.onclick=async()=>{if(!confirm('确认删除这条内容及其回复？'))return;remove.disabled=true;try{await service.request('/api/owner/delete',{method:'POST',body:{id:m.id},admin:true});await refresh();ctx.status('已删除。');}catch(e){ctx.status(e.message,true);remove.disabled=false;}};card.append(remove);}list.append(card);
   }if(!list.children.length)list.append(el('p',loading?'正在读取内容…':failures[selected]?'读取未完成，暂不能确认是否有新内容。':q?'没有匹配内容。':selected==='letter'?'还没有私人来信。':'还没有公开评论。访客留言后，会同时显示在公开页面和这个栏目中。','empty'));};search.oninput=render;render();
  }
  async function refresh(){
   const version=++serial;loading=true;draw();
   try{const publicChannels=channels.filter(c=>c.path),results=await Promise.allSettled(publicChannels.map(async c=>(await service.request('/api/messages?kind='+c.kind)).messages));if(!current()||version!==serial)return;
    results.forEach((result,i)=>{const kind=publicChannels[i].kind;if(result.status==='fulfilled'){publicRecords[kind]=result.value;counts[kind]=result.value.length;delete failures[kind];}else failures[kind]=result.reason?.message||'连接失败';});
    if(service.authenticated&&selected==='letter'){const {messages}=await service.request('/api/admin/messages',{admin:true});if(!current()||version!==serial)return;privateRecords=messages.filter(m=>m.kind==='letter');counts.letter=privateRecords.length;delete failures.letter;}
    else{privateRecords=[];delete counts.letter;}draw();
   }catch(e){if(current()&&version===serial){failures[selected]=e.message;ctx.status(e.message,true);if(e.status===401){privateRecords=[];delete counts.letter;}}}
   finally{if(current()&&version===serial){loading=false;draw();}}
  }
  const locked=()=>{serial++;loading=false;privateRecords=[];delete counts.letter;if(current())draw();};window.addEventListener('cheney-inbox-locked',locked);
  dispose=()=>{closed=true;serial++;privateRecords=[];window.removeEventListener('cheney-inbox-locked',locked);panel.replaceChildren();};
  if(!service||!await service.ready){if(current())stage.append(el('p','留言服务暂时无法连接，请稍后重新进入。','field-help'));return;}
  if(current()){for(const b of buttons.values())b.disabled=false;draw();await refresh();}
 }
 window.CHENEY_ADMIN_INBOX={mount,dispose:()=>dispose()};
})();
