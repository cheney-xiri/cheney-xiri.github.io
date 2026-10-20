(() => {
  'use strict';
  const $ = (q, root=document) => root.querySelector(q);
  const node = (tag, text, cls) => { const el=document.createElement(tag); if(text!==undefined)el.textContent=text; if(cls)el.className=cls; return el; };
  let csrf='', meta=null, view='articles', entries=[], current=null, dirty=false, setup=false;
  const status=(message, bad=false)=>{ const el=$('#app-status'); el.textContent=message;el.dataset.error=String(bad); };
  async function api(url, options={}) {
    if(window.CHENEY_GITHUB_CMS)return window.CHENEY_GITHUB_CMS.request(url,options);
    const headers=new Headers(options.headers||{});
    if(options.method && options.method!=='GET')headers.set('X-CSRF-Token',csrf);
    if(options.body && !(options.body instanceof Blob)){headers.set('Content-Type','application/json');options.body=JSON.stringify(options.body);}
    const response=await fetch(url,{...options,headers,credentials:'same-origin',cache:'no-store'});
    const data=await response.json().catch(()=>({error:'服务暂时没有响应，请稍后重试'}));
    if(!response.ok){if(response.status===401&&url!=='/api/admin/login')showLogin();throw new Error(data.error||'操作未完成');}return data;
  }
  function showLogin(){ $('#login-screen').hidden=false;$('#admin-app').hidden=true;$('#logout').hidden=true;csrf='';if(window.CHENEY_GITHUB_CMS)api('/api/admin/session').then(configureGithubLogin).catch(e=>$('#login-status').textContent=e.message); }
  function canLeave(){ return !dirty || confirm('当前修改还未保存，确认离开？'); }
  const notes={articles:'整理篇目、保存草稿，再发布到文存。',quotes:'按主题收好诗词与话语，保留准确的文字。',works:'补充封面、简介和创作近况，不放小说全文。',books:'整理书架与阅读入口。',music:'整理歌曲名称、歌手和播放页面，沿用现有歌单。',profile:'只填写想公开的个人信息，未确定的项目可以留空。',journey:'在原有三个阶段里补充文字、照片与时间节点。',anime:'按作品整理观影手记。',messages:'查看公开留言与私信，私信仅在后台显示。',security:'设置至少 12 个字符的站主密码。'};
  async function enter(){
    meta=await api('/api/admin/meta');$('#login-screen').hidden=true;$('#admin-app').hidden=false;$('#logout').hidden=false;
    const nav=$('#admin-nav');nav.replaceChildren();
    const extras={journey:'行旅',anime:'观影手记',messages:'留言与来信'};
    for(const[key,label]of Object.entries({...meta.collections,...Object.fromEntries(Object.entries(extras).filter(([key])=>!meta.extraViews||meta.extraViews.includes(key)))})){ const b=node('button',label);b.type='button';b.dataset.view=key;nav.append(b); }
    if(meta.storage==='edge-kv'){$('#cloud-note').hidden=false;$('#cloud-note').textContent='发布后通常一分钟内同步。请避免在两个设备上同时修改同一篇内容。';}
    if(meta.storage==='github'){$('#cloud-note').hidden=false;$('#cloud-note').replaceChildren(document.createTextNode('草稿只保存在当前设备，发布后的内容通过 GitHub 保存并自动更新网站。发布记录公开，请只发布想公开的文字和图片。'),document.createTextNode(' '));const a=node('a','查看发布进度 ↗');a.href='https://github.com/'+window.CHENEY_GITHUB_CMS.repo+'/actions';a.target='_blank';a.rel='noopener noreferrer';$('#cloud-note').append(a);$('button[data-view="security"]').textContent='密码与设备';}
    await navigate(view);
  }
  async function navigate(next){
    if(!canLeave())return;view=next;current=null;dirty=false;status('');
    document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('is-active',b.dataset.view===view);if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    $('#view-title').textContent=({...meta.collections,journey:'行旅',anime:'观影手记',messages:'留言与来信',security:'登录设置'})[view];$('#view-note').textContent=notes[view]||'';
    $('#new-entry').hidden=!meta.collections[view]||view==='profile';$('#workspace').replaceChildren();
    try {if(meta.collections[view])await loadCollection();else if(view==='journey')await journey();else if(view==='anime')await anime();else if(view==='messages')await messages();else security();}catch(e){status(e.message,true);}
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)navigate(b.dataset.view);});
  function field(form,label,key,value='',type='text',wide=false){
    const wrap=node('label',label,wide?'field-wide':'');const input=node(type==='textarea'?'textarea':'input');input.name=key;if(type!=='textarea')input.type=type;else input.rows=key==='body'?18:3;input.value=value??'';
    if(key==='body'){input.placeholder='正文直接写段落。小标题单独一行，以 ## 开头。';input.className='body-field';}wrap.append(input);form.append(wrap);return input;
  }
  function button(label,action,cls=''){const b=node('button',label,cls);b.type='button';b.addEventListener('click',action);return b;}
  async function busy(b,fn){b.disabled=true;try{await fn();}catch(e){status(e.message,true);}finally{b.disabled=false;}}
  async function loadCollection(selectId){
    entries=(await api('/api/admin/entries?collection='+view)).items;
    const workspace=$('#workspace');workspace.className='workspace';workspace.replaceChildren();
    const panel=node('section',undefined,'entry-panel'),search=node('input');search.type='search';search.placeholder='搜索标题或分类';search.setAttribute('aria-label','搜索内容');const list=node('div',undefined,'entry-list');panel.append(search,list);workspace.append(panel,node('section',undefined,'editor-panel'));
    const paint=()=>{list.replaceChildren();const q=search.value.trim().toLowerCase();for(const item of entries.filter(x=>(x.draft.title+' '+x.draft.category).toLowerCase().includes(q))){const b=button('',()=>{if(canLeave())edit(item);},'entry-item');b.dataset.id=item.id;b.append(node('strong',item.draft.title),node('span',(item.published?'已发布':'草稿')+' · '+(item.draft.category||meta.collections[view])));b.classList.toggle('is-active',current?.id===item.id);list.append(b);}if(!list.children.length)list.append(node('p','还没有内容，可以新增一篇。','empty'));};search.addEventListener('input',paint);paint();
    const selected=entries.find(x=>x.id===selectId)||entries[0];if(selected)edit(selected);else edit({collection:view,draft:{title:'',order:entries.length}});
  }
  function edit(item){
    current=item;dirty=false;const d=item.draft,panel=$('.editor-panel');panel.replaceChildren();document.querySelectorAll('.entry-item').forEach(b=>{b.classList.toggle('is-active',b.dataset.id===item.id);b.setAttribute('aria-current',String(b.dataset.id===item.id));});
    const heading=node('div',undefined,'editor-heading');heading.append(node('h2',item.id?'编辑内容':'新增内容'),node('span',item.published?'前台正在展示已发布版本':'保存后可预览，发布后公开'));panel.append(heading);
    const form=node('form',undefined,'editor-form'),grid=node('div',undefined,'field-grid');form.append(grid);panel.append(form);
    field(grid,view==='quotes'?'诗词或话语':'标题','title',d.title,view==='quotes'?'textarea':'text',true).required=true;
    if(view!=='profile')field(grid,'分类','category',d.category);
    if(['quotes','books','music'].includes(view))field(grid,view==='music'?'歌手':'署名','author',d.author);
    if(view!=='profile')field(grid,'排列顺序（小的在前）','order',d.order??entries.length,'number');
    if(view==='works')field(grid,'创作状态','status',d.status);
    if(['books','music'].includes(view))field(grid,'打开链接','url',d.url,'url',true);
    if(view!=='profile')field(grid,view==='quotes'?'篇名（可留空）':'简介','summary',d.summary,'textarea',true);
    if(!['quotes','music','books'].includes(view))field(grid,view==='profile'?'自述':'正文','body',d.body,'textarea',true);
    if(view==='profile')for(const[key,label]of Object.entries(meta.profileFields))field(grid,label,'profile:'+key,d.fields?.[key]);
    if(view!=='quotes'){
      const cover=field(grid,view==='profile'?'头像链接':'封面链接','cover',d.cover,'text',true),tools=node('div',undefined,'image-tools');const image=node('img');image.alt='封面预览';const refresh=()=>{image.hidden=!cover.value;image.src=safeImage(cover.value)||'';};refresh();cover.addEventListener('change',refresh);
      const file=node('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.setAttribute('aria-label','上传封面');file.addEventListener('change',async()=>{if(!file.files[0])return;file.disabled=true;try{cover.value=(await upload(file.files[0])).url;dirty=true;refresh();status('图片已上传，保存内容后应用。');}catch(e){status(e.message,true);}finally{file.disabled=false;}});tools.append(image,file);grid.append(tools);
    }
    const actions=node('div',undefined,'editor-actions');form.append(actions);const save=button('保存草稿',()=>busy(save,()=>persist(false))),publish=button('发布到网站',()=>busy(publish,()=>persist(true)),'primary');actions.append(save,publish);
    if(item.id){actions.append(button('预览',()=>{if(dirty){status('请先保存草稿，再预览。');return;}if(meta.storage==='github'){previewDraft(item);return;}window.open(previewUrl(item)+'preview=1','_blank','noopener');}),button('历史版本',()=>history(item)));if(item.published)actions.append(button('撤下',async()=>{if(!confirm('确认从公开页面撤下这份内容？后台仍会保留。'))return;try{const r=await api('/api/admin/unpublish',{method:'POST',body:{id:item.id,revision:item.revision}});dirty=false;await loadCollection(r.item.id);status(meta.storage==='github'?'撤下操作已提交，网站更新完成后生效。':'已撤下。');}catch(e){status(e.message,true);}},'danger'));}
    form.addEventListener('input',()=>{dirty=true;});form.addEventListener('submit',e=>{e.preventDefault();persist(false).catch(e=>status(e.message,true));});
    async function persist(publish){if(!form.reportValidity())return;const values=Object.fromEntries(new FormData(form)),draft={...d,...values};if(view==='profile'){draft.fields={};for(const key of Object.keys(meta.profileFields)){draft.fields[key]=values['profile:'+key];delete draft['profile:'+key];}}
      const r=await api('/api/admin/save',{method:'POST',body:{id:item.id,collection:view,revision:item.revision,draft,publish}});dirty=false;await loadCollection(r.item.id);status(meta.storage==='github'?(publish?'内容已保存到 GitHub，正在自动更新网站。可在上方查看发布进度。':'草稿已保存在当前设备，尚未上传或公开。'):(publish?'已发布。打开前台即可查看。':'草稿已保存，公开页面保持已发布版本。'));}
  }
  function previewDraft(item){const dialog=node('dialog',undefined,'draft-preview'),close=button('关闭预览',()=>dialog.close()),title=node('h1',item.draft.title);dialog.append(close,title);if(item.draft.cover){const image=node('img');image.src=safeImage(item.draft.cover);image.alt=item.draft.title;dialog.append(image);}for(const block of[item.draft.summary,item.draft.body].filter(Boolean).join('\n\n').split(/\n\s*\n/)){dialog.append(node(/^##\s/.test(block)?'h2':'p',block.replace(/^##\s+/,'')));}document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();}
  function safeImage(value){try{const u=new URL(value,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
  function previewUrl(item){const p=item.basePath?'/'+item.basePath:'/'+(item.collection==='articles'?'writing':'works')+'/entry.html?id='+encodeURIComponent(item.id);const fallback={quotes:'/writing/lines.html',books:'/books.html',music:'/pastimes/detail.html?topic=music',profile:'/about/index.html'};const url=fallback[item.collection]||p;return url+(url.includes('?')?'&':'?');}
  $('#new-entry').addEventListener('click',()=>{if(canLeave())edit({collection:view,draft:{title:'',order:entries.length}});});
  async function history(item){try{const items=(await api('/api/admin/history?id='+encodeURIComponent(item.id))).items,p=$('#history-items');p.replaceChildren();if(!items.length)p.append(node('p','尚无历史版本。'));for(const h of items){const row=node('div',undefined,'history-item');row.append(node('strong','第 '+h.revision+' 版 · '+new Date(h.updated_at||h.updatedAt).toLocaleString()),node('p',h.draft.title),button('恢复为草稿',async()=>{if(!canLeave())return;try{const r=await api('/api/admin/restore-version',{method:'POST',body:{id:item.id,version:h.id,revision:item.revision}});dirty=false;$('#history-dialog').close();await loadCollection(r.item.id);status('已恢复为草稿，确认后可发布。');}catch(e){status(e.message,true);}}));p.append(row);}$('#history-dialog').showModal();}catch(e){status(e.message,true);}}
  $('#history-close').onclick=()=>$('#history-dialog').close();
  async function upload(file,endpoint='/api/admin/upload'){
    if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw new Error('请选 JPG、PNG 或 WebP 图片');if(file.size>25*1024*1024)throw new Error('请选择 25 MB 以内的图片');
    const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();let blob;
    for(const quality of [.86,.72,.56,.38]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(blob&&blob.size<700*1024)break;}if(!blob||blob.size>=700*1024)throw new Error('图片仍然较大，请先缩小后再试');return api(endpoint,{method:'POST',headers:{'Content-Type':blob.type},body:blob});
  }
  async function journey(){
    const workspace=$('#workspace');workspace.className='workspace full';const panel=node('section',undefined,'full-panel'),select=node('select');select.setAttribute('aria-label','选择行旅阶段');for(const[k,v]of Object.entries({junior:'初中',senior:'高中',university:'大学'})){const o=node('option',v);o.value=k;select.append(o);}workspace.replaceChildren(panel);panel.append(select,node('div',undefined,'journey-editor'));let stage='junior';
    const load=async()=>{const value=(await api('/api/journey?stage='+stage)).content||{},box=$('.journey-editor');box.replaceChildren();const form=node('form',undefined,'editor-form'),grid=node('div',undefined,'field-grid');form.append(grid);box.append(form);for(const[k,v]of Object.entries({schoolIntro:'学校印象',story:'这一段经历',growth:'成长与收获',reflection:'回望'}))field(grid,v,k,value[k],'textarea',true);
      const moments=node('section',undefined,'field-wide'),photos=node('section',undefined,'field-wide');grid.append(moments,photos);moments.append(node('h3','时间节点'));photos.append(node('h3','阶段照片'));
      const addMoment=(m={})=>{if(moments.querySelectorAll('.journey-moment').length>=12)return;const row=node('div',undefined,'journey-moment');field(row,'日期','moment-date',m.date);field(row,'标题','moment-title',m.title);field(row,'内容','moment-text',m.text,'textarea');row.append(button('移除',()=>{row.remove();dirty=true;}));moments.append(row);};(value.moments||[]).forEach(addMoment);moments.append(button('＋ 添加节点',()=>{addMoment();dirty=true;}));
      const addPhoto=(photo)=>{if(photos.querySelectorAll('.journey-photo').length>=9)return;const row=node('div',undefined,'journey-photo'),image=node('img');image.src=photo.url||(meta.storage==='github'?'https://raw.githubusercontent.com/'+window.CHENEY_GITHUB_CMS.repo+'/main/assets/cms-uploads/'+photo.id:'/api/journey/media/'+photo.id);image.alt='阶段照片';row.dataset.id=photo.id;row.append(image);field(row,'说明','photo-caption',photo.caption);field(row,'日期','photo-date',photo.date);row.append(button('移除',()=>{row.remove();dirty=true;}));photos.append(row);};(value.photos||[]).forEach(addPhoto);const uploadInput=node('input');uploadInput.type='file';uploadInput.accept='image/png,image/jpeg,image/webp';uploadInput.setAttribute('aria-label','添加阶段照片');uploadInput.onchange=async()=>{try{if(photos.querySelectorAll('.journey-photo').length>=9)throw new Error('每个阶段最多 9 张照片');const r=await upload(uploadInput.files[0],'/api/journey/photo?stage='+stage);addPhoto(r.photo||r);dirty=true;}catch(e){status(e.message,true);}};photos.append(uploadInput);
      const save=button('发布行旅内容',()=>busy(save,async()=>{const d=Object.fromEntries(new FormData(form));const content={schoolIntro:d.schoolIntro,story:d.story,growth:d.growth,reflection:d.reflection,moments:[...moments.querySelectorAll('.journey-moment')].map(row=>({date:$('[name=moment-date]',row).value,title:$('[name=moment-title]',row).value,text:$('[name=moment-text]',row).value})),photos:[...photos.querySelectorAll('.journey-photo')].map(row=>({id:row.dataset.id,caption:$('[name=photo-caption]',row).value,date:$('[name=photo-date]',row).value}))};await api('/api/journey?stage='+stage,{method:'POST',body:content});dirty=false;status('行旅内容已发布。');}),'primary');form.append(save);form.addEventListener('input',()=>dirty=true);dirty=false;};select.onchange=async()=>{if(!canLeave()){select.value=stage;return;}stage=select.value;await load();};await load();
  }
  async function anime(){
    if(!window.CHENEY_ANIME_WORKS)await new Promise((resolve,reject)=>{const s=node('script');s.src='/assets/anime-catalog-data.js';s.onload=resolve;s.onerror=reject;document.head.append(s);});
    const works=window.CHENEY_ANIME_WORKS||[],workspace=$('#workspace');workspace.className='workspace full';const panel=node('section',undefined,'full-panel'),select=node('select');select.setAttribute('aria-label','选择观影作品');for(const w of works){const o=node('option',w.title);o.value=w.id;select.append(o);}const box=node('div');panel.append(select,box);workspace.replaceChildren(panel);let id=select.value;
    const load=async()=>{const data=(await api('/api/anime-note?id='+encodeURIComponent(id))).content||{};box.replaceChildren();const form=node('form',undefined,'editor-form');box.append(form);field(form,'短记','note',data.note,'textarea');field(form,'观影手记','diary',data.diary,'textarea');field(form,'日期','date',data.date);const save=button('发布手记',()=>busy(save,async()=>{await api('/api/anime-note?id='+encodeURIComponent(id),{method:'POST',body:Object.fromEntries(new FormData(form))});dirty=false;status('观影手记已发布。');}),'primary');form.append(save);form.addEventListener('input',()=>dirty=true);dirty=false;};select.onchange=async()=>{if(!canLeave()){select.value=id;return;}id=select.value;await load();};await load();
  }
  async function messages(){
    const data=(await api('/api/admin/messages')).messages,workspace=$('#workspace');workspace.className='workspace full';const panel=node('section',undefined,'full-panel'),filters=node('div',undefined,'filter-row'),list=node('div');panel.append(filters,list);workspace.replaceChildren(panel);
    const draw=kind=>{list.replaceChildren();for(const m of data.filter(x=>!x.deleted&&(kind==='all'||(kind==='private'?x.kind==='letter':x.kind!=='letter')))){const card=node('article',undefined,'message-card');card.append(node('small',(m.visibility==='private'?'私信':'公开留言')+' · '+new Date(m.createdAt).toLocaleString()),node('h3',m.name||'访客'),node('p',m.text));if(m.email)card.append(node('p',m.email));if(m.contact)card.append(node('p',m.contact));card.append(button('删除',async()=>{if(!confirm('确认删除这条留言及其回复？'))return;try{await api('/api/owner/delete',{method:'POST',body:{id:m.id}});m.deleted=true;draw(kind);status('已删除。');}catch(e){status(e.message,true);}},'danger'));list.append(card);}if(!list.children.length)list.append(node('p','暂无内容。','empty'));};for(const[k,v]of Object.entries({all:'全部',public:'公开留言',private:'私信'}))filters.append(button(v,()=>draw(k)));draw('all');
  }
  function downloadLoginBackup(){const record=window.CHENEY_ADMIN_VAULT.export(),url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download='cheney-encrypted-login.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('加密登录备份已下载。另一台设备导入后，仍需输入你的密码。');}
  function configureGithubLogin(s){
    setup=s.canSetup;$('#confirm-label').hidden=!setup;$('[name=confirm]').required=setup;
    const form=$('#login-form'),input=$('#password'),card=$('.login-card');
    form.querySelectorAll('.github-connection').forEach(el=>el.remove());card.querySelectorAll('.login-help').forEach(el=>el.remove());
    input.parentNode.firstChild.textContent=setup?'设置我的解锁密码':'我的解锁密码';input.minLength=setup?12:0;input.maxLength=128;input.autocomplete=setup?'new-password':'current-password';
    $('#login-note').textContent=setup?'这台设备尚未连接。首次连接后，日常只需输入你设置的密码。':'输入你自己设置的密码，解锁这台设备上的管理权限。';
    $('#login-submit').textContent=setup?'连接并设置密码':'解锁我的书斋';
    $('.login-foot').textContent='密码不会上传；管理凭据只在本机加密保存。请妥善保存加密登录备份，以便手机或新设备使用。';
    if(setup){const wrap=node('label','一次性连接凭据','github-connection'),connection=node('input');connection.type='password';connection.name='connectionToken';connection.autocomplete='off';connection.required=true;connection.maxLength=255;wrap.append(connection);form.insertBefore(wrap,input.parentNode);}
    if(s.reconnect){const flag=node('input',undefined,'github-connection');flag.type='hidden';flag.name='reconnect';flag.value='true';form.append(flag);}
    const help=node('details',undefined,'login-help');help.append(node('summary',setup?'首次连接 / 导入另一台设备':'在其他设备上使用'));
    if(setup){const ol=node('ol');for(const text of['在 GitHub 创建 Fine-grained personal access token。','Resource owner 选择 cheney-xiri，只授权 cheney-xiri.github.io，Contents 选择 Read and write。','将新凭据直接填入上方；再设置只属于你的解锁密码。它们都不要发送到聊天里。'])ol.append(node('li',text));const a=node('a','打开 GitHub 连接设置 ↗');a.href='https://github.com/settings/personal-access-tokens/new?name=Cheney+site+editor&target_name=cheney-xiri&expires_in=90&contents=write';a.target='_blank';a.rel='noopener noreferrer';help.append(ol,a);}
    help.append(node('p','已经在另一台设备连接？可以导入在那里下载的加密登录备份，之后输入原密码。'));
    if(!setup)help.append(button('凭据过期或忘记密码：重新连接',()=>configureGithubLogin({canSetup:true,configured:false,reconnect:true})));
    const label=node('label','导入加密登录备份'),file=node('input');file.type='file';file.accept='.json,application/json';label.append(file);help.append(label);card.append(help);
    file.onchange=async()=>{if(!file.files[0])return;try{if(file.files[0].size>8192)throw new Error('备份文件过大');if(s.configured&&!confirm('确认替换本机的加密登录记录？请先保留原备份。'))return;window.CHENEY_ADMIN_VAULT.import(await file.files[0].text());form.reset();configureGithubLogin(await api('/api/admin/session'));$('#login-status').textContent='已导入。请输入备份对应的解锁密码。';}catch(error){$('#login-status').textContent=error.message;}};
  }
  function security(){
    const workspace=$('#workspace');workspace.className='workspace full';const panel=node('section',undefined,'full-panel'),form=node('form',undefined,'editor-form');workspace.replaceChildren(panel);
    const github=meta.storage==='github';
    if(github){panel.append(node('h2','密码与设备'),node('p','密码只用于本机解密，不会上传或写进代码。更改本机密码后，其他设备和旧备份的密码不会自动改变。'),button('下载加密登录备份',()=>{try{downloadLoginBackup();}catch(error){status(error.message,true);}}),node('p','将加密备份转到你的手机，在后台登录页导入，再输入密码即可使用。清除浏览器数据会删除本机连接，请先保留备份。'));}
    panel.append(form);const old=field(form,github?'当前解锁密码':'当前密码','currentPassword','','password'),next=field(form,github?'新的本机解锁密码':'新密码','password','','password'),confirmField=field(form,'再次输入新密码','confirm','','password');old.autocomplete='current-password';next.autocomplete=confirmField.autocomplete='new-password';next.minLength=12;next.maxLength=128;for(const input of[old,next,confirmField])input.required=true;
    const save=button('更新密码',()=>busy(save,async()=>{if(!form.reportValidity())return;if(next.value!==confirmField.value)throw new Error('两次新密码不一致');const r=await api('/api/admin/password',{method:'POST',body:{currentPassword:old.value,password:next.value}});csrf=r.csrfToken;form.reset();dirty=false;status(github?'本机密码已修改。请重新下载加密登录备份。':'密码已修改，其他登录会话已退出。');}),'primary');form.append(save);
  }
  $('#backup').onclick=async()=>{if(meta.storage==='github'){try{const data=await api('/api/admin/backup'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download='cheney-public-content-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('已导出公开内容与当前设备的草稿备份。');}catch(e){status(e.message,true);}return;}const a=node('a');a.href='/api/admin/backup';a.download='cheney-backup.json';a.click();status('已请求下载备份；图片文件需一并保留，备份中包含私信，请妥善保管。');};
  $('#logout').onclick=async()=>{if(!canLeave())return;try{await api('/api/admin/logout',{method:'POST',body:{}});dirty=false;showLogin();$('#password').value='';}catch(e){status(e.message,true);}};
  $('#login-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,b=$('#login-submit'),p=$('#login-status');b.disabled=true;p.textContent='正在验证…';try{const data=Object.fromEntries(new FormData(form));if(setup&&data.password!==data.confirm)throw new Error('两次密码不一致');const r=await api('/api/admin/'+(setup?'setup':'login'),{method:'POST',body:window.CHENEY_GITHUB_CMS?data:{password:data.password}});csrf=r.csrfToken;form.reset();p.textContent='';await enter();}catch(err){p.textContent=err.message;}finally{b.disabled=false;}});
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  (async()=>{try{const s=await api('/api/admin/session');setup=s.canSetup;$('#confirm-label').hidden=!setup;$('[name=confirm]').required=setup;if(s.mode==='github')configureGithubLogin(s);else if(setup){$('#login-note').textContent='首次使用，请在本机设置至少 12 个字符的站主密码。';$('#password').minLength=12;$('#password').autocomplete='new-password';$('#login-submit').textContent='设置密码并进入';}else if(!s.configured){$('#login-note').textContent='后台密码还未配置，请先完成部署配置。';$('#login-submit').disabled=true;}if(s.authenticated){csrf=s.csrfToken;await enter();}}catch(e){$('#login-status').textContent=e.message;}})();
})();
