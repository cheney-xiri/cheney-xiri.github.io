(() => {
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 let dispose=()=>{};
 async function mount(box,ctx){
  dispose();
  box.className='workspace full';const panel=el('section',undefined,'full-panel'),service=window.CHENEY_INTERACTION_SERVICE;box.replaceChildren(panel);
  panel.append(el('h2','评论与尺素'),el('p','题壁、结盟、题跋公开展示；尺素只在私人信箱里阅读。'));
  if(!service||!await service.ready){panel.append(el('p','留言服务尚未连接，暂不能收取评论和来信。','field-help'));return;}
  if(ctx.isCurrent&&!ctx.isCurrent())return;
  const content=el('div');panel.append(content);
  const current=()=>!ctx.isCurrent||ctx.isCurrent();
  function loginForm(){
   if(!current())return;content.replaceChildren();
   const form=el('form',undefined,'editor-form'),label=el('label','私人信箱密码'),input=el('input'),submit=el('button','解锁信箱','primary'),note=el('p','此密码由你在服务端设置；信箱登录在本次打开期间有效。','field-help');
   input.type='password';input.required=true;input.autocomplete='current-password';input.name='inboxPassword';label.append(input);submit.type='submit';form.append(label,note,submit);content.append(form);
   form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;try{await service.login(input.value);input.value='';await load();}catch(e){ctx.status(e.message,true);}finally{submit.disabled=false;}};
  }
  async function load(){
   try{const {messages}=await service.request('/api/admin/messages',{admin:true});if(!current())return;
    content.replaceChildren();const tools=el('div',undefined,'site-tools'),filter=el('select'),search=el('input'),list=el('div',undefined,'inbox-messages');
    filter.setAttribute('aria-label','按互动栏目筛选');for(const [value,label]of [['all','全部'],['wall','题壁 · 公开'],['ally','结盟 · 公开'],['featured','题跋 · 公开'],['letter','尺素 · 仅我可见']]){const o=el('option',label);o.value=value;filter.append(o);}
    search.type='search';search.placeholder='搜索称呼或内容';search.setAttribute('aria-label','搜索评论与尺素');
    const refresh=el('button','刷新来信'),lock=el('button','锁定信箱');refresh.type=lock.type='button';refresh.onclick=()=>load();lock.onclick=()=>service.logout().then(()=>loginForm()).catch(e=>ctx.status(e.message,true));tools.append(filter,search,refresh,lock);content.append(tools,list);
    const draw=()=>{list.replaceChildren();const q=search.value.trim().toLowerCase();for(const m of messages.filter(m=>!m.deleted&&(filter.value==='all'||m.kind===filter.value)&&((m.name||'')+' '+m.text).toLowerCase().includes(q))){
     const card=el('article',undefined,'message-card'+(m.kind==='letter'?' inbox-private':''));card.append(el('small',({wall:'题壁 · 公开',ally:'结盟 · 公开',featured:'题跋 · 公开',letter:'尺素 · 仅我可见'})[m.kind]||'公开评论'),el('h3',m.name||'匿名访客'),el('time',new Date(m.createdAt).toLocaleString('zh-CN')),el('p',m.text));
     if(m.article)card.append(el('p','读后 · '+m.article));if(m.siteName)card.append(el('p','站名 · '+m.siteName));
     const remove=el('button','删除','danger');remove.type='button';remove.onclick=async()=>{if(!confirm('确认删除这条内容及其回复？'))return;remove.disabled=true;try{await service.request('/api/owner/delete',{method:'POST',body:{id:m.id},admin:true});messages.forEach(x=>{if(x.id===m.id||x.parentId===m.id)x.deleted=true;});draw();ctx.status('已删除。');}catch(e){ctx.status(e.message,true);remove.disabled=false;}};card.append(remove);list.append(card);
    }if(!list.children.length)list.append(el('p','这个栏目暂时没有内容。','empty'));};filter.onchange=search.oninput=draw;draw();
   }catch(e){ctx.status(e.message,true);if(e.status===401)loginForm();}
  }
  const locked=()=>{content.replaceChildren();if(current())loginForm();};
  window.addEventListener('cheney-inbox-locked',locked);
  dispose=()=>{window.removeEventListener('cheney-inbox-locked',locked);content.replaceChildren();};
  if(service.authenticated)await load();else loginForm();
 }
 window.CHENEY_ADMIN_INBOX={mount,dispose:()=>dispose()};
})();
