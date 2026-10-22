/* The owner edits the rendered page; all changes remain drafts until publication. */
(() => {
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
 const field=(host,label,value='',type='text')=>{const wrap=el('label',label),n=el(type==='textarea'?'textarea':'input');if(type!=='textarea')n.type=type;n.value=value??'';wrap.append(n);host.append(wrap);return n;};
 const select=(host,label,values,value)=>{const wrap=el('label',label),n=el('select');n.setAttribute('aria-label',label);for(const [k,t]of Object.entries(values)){const o=el('option',t);o.value=k;n.append(o);}n.value=value??Object.keys(values)[0];wrap.append(n);host.append(wrap);return n;};
 const pathOf=n=>{
  const parts=[];while(n&&n.tagName!=='HTML'){
   const marker=n.getAttribute('data-cms-copy')?'data-cms-copy':n.getAttribute('data-cms-block')?'data-cms-block':null;
   if(marker){parts.unshift('['+marker+'="'+CSS.escape(n.getAttribute(marker))+'"]');break;}
   if(n.id){parts.unshift('#'+CSS.escape(n.id));break;}
   const tag=n.tagName.toLowerCase(),siblings=[...n.parentElement.children].filter(x=>x.tagName===n.tagName);parts.unshift(tag+':nth-of-type('+(siblings.indexOf(n)+1)+')');n=n.parentElement;
  }return parts.join(' > ');
 };
 const safe=n=>n?.nodeType===1&&!n.closest('head,script,style,iframe,object,embed,input,textarea,select,[data-editor-ui]');
 const positions={afterend:'所选内容后面',beforebegin:'所选内容前面',beforeend:'所选区域内末尾',afterbegin:'所选区域内开头'};
 async function mount(box,ctx,helpers){
  const catalog=await ctx.api('/api/admin/site-catalog');if(ctx.isCurrent&&!ctx.isCurrent())return;
  box.className='workspace visual-workspace';
  const studio=el('section',undefined,'visual-studio'),bar=el('div',undefined,'visual-topbar'),pageSelect=select(bar,'当前页面',Object.fromEntries(catalog.pages.map(p=>[p.path,p.title])),ctx.scope?.path||'index.html'),mode=select(bar,'操作方式',{edit:'点选编辑',browse:'打开链接与交互'},'edit'),device=select(bar,'页面尺寸',{desktop:'适应窗口',mobile:'手机页面'},innerWidth<700?'mobile':'desktop');
  const directory=el('details',undefined,'visual-directory'),search=el('input'),list=el('div',undefined,'visual-page-list');directory.append(el('summary','查找全部页面'),search,list);search.type='search';search.placeholder='查找页面或小节';search.setAttribute('aria-label','查找页面或小节');
  const frameWrap=el('div',undefined,'site-frame-wrap visual-frame-wrap'),frame=el('iframe');frame.title='直接编辑网站页面';frame.className='site-frame';frameWrap.append(frame);
  const actions=el('div',undefined,'visual-actions'),selection=el('p','点击页面内容进行修改；双击文字可以直接输入。','visual-selection'),commands=el('div',undefined,'site-tools'),inspector=el('aside',undefined,'visual-inspector'),changes=el('details',undefined,'site-changes');inspector.hidden=true;
  const historyHost=el('div');changes.append(el('summary','本页修改记录'),historyHost);
  let key='',record={revision:0,patches:[]},baseline=[],selected=null,history=[],loading=0,clean=true,inline=null,queued=null;
  const save=button('保存草稿',()=>persist(false)),publish=button('发布此页',()=>persist(true),'primary'),undo=button('撤销',rollback),view=el('a','查看公开页面 ↗');view.target='_blank';view.rel='noopener';
  actions.append(save,publish,undo,view);studio.append(bar,directory,actions,selection,commands,frameWrap,inspector,changes);box.replaceChildren(studio);
  const root=()=>{const d=frame.contentDocument;if(!d)return null;return key.split('?')[0]==='index.html'&&ctx.scope?.section?d.getElementById(ctx.scope.section):d.querySelector('main')||d.body;};
  const pause=()=>frame.contentDocument?.querySelectorAll('video,audio').forEach(m=>{m.autoplay=false;m.pause();});
  const preview=()=>frame.contentWindow?.CHENEY_PAGE_CONTENT?.apply([...baseline,...record.patches]);
  const mark=()=>{clean=false;ctx.setDirty(true);paintHistory();};
  function closeInspector(){inspector.hidden=true;}
  function historySave(){history.push(structuredClone(record.patches));if(history.length>40)history.shift();}
  function put(p,options={}){
   if(record.patches.length>=500&&!record.patches.some(x=>x.id===p.id))throw Error('本页编辑项已达上限，请先整理修改记录。');
   historySave();const old=record.patches.find(x=>x.id===p.id||!['block','duplicate'].includes(p.type)&&x.type===p.type&&x.selector===p.selector&&(x.textIndex||0)===(p.textIndex||0)&&(x.device||'all')===(p.device||'all'));
   p.id=old?.id||p.id||crypto.randomUUID();if(old)p.original=old.original;
   record.patches=record.patches.filter(x=>x.id!==p.id);record.patches.push(p);mark();preview();if(!options.keepPanel)closeInspector();
   selected=frame.contentDocument?.querySelector(p.selector)||null;selectTarget(selected);ctx.status('已应用到本页草稿，确认后点击“发布此页”。');
  }
  function attempt(fn){try{fn();}catch(e){ctx.status(e.message,true);}}
  function url(value){const u=new URL(value,frame.contentWindow.location.href);if(!['https:','http:'].includes(u.protocol))throw Error('请输入有效的网页或媒体地址');return u.href;}
  function drawDirectory(){list.replaceChildren();for(const p of catalog.pages.filter(p=>(p.title+' '+p.path).toLowerCase().includes(search.value.trim().toLowerCase()))){list.append(button(p.title,()=>openPage(p.path)));}}
  search.oninput=drawDirectory;drawDirectory();
  function paintHistory(){
   undo.disabled=!history.length;historyHost.replaceChildren();changes.firstElementChild.textContent='本页修改记录 · '+record.patches.length+' 项';
   for(const p of record.patches){const row=el('div',undefined,'site-change'),tools=el('div'),label=({text:'文字',image:'图片',video:'音视频',link:'链接',background:'背景',block:'新增内容',duplicate:'复制模块',hide:'隐藏内容'})[p.type];row.append(el('span',label+' · '+(p.title||p.value||'所选区域').slice(0,55)));tools.append(button('定位',()=>{const target=frame.contentDocument?.querySelector(p.type==='block'?'[data-cms-block="'+CSS.escape(p.id)+'"]':p.type==='duplicate'?'[data-cms-copy="'+CSS.escape(p.id)+'"]':p.selector);target?.scrollIntoView({block:'center'});selectTarget(target);}),button('撤销此项',()=>{finishInline();historySave();record.patches=record.patches.filter(x=>x.id!==p.id);mark();preview();selectTarget(null);}));row.append(tools);historyHost.append(row);}
  }
  function rollback(){finishInline();if(!history.length)return;record.patches=history.pop();mark();preview();selectTarget(null);closeInspector();}
  async function persist(publishNow){
   finishInline();if(window.CHENEY_BATCH_UPLOAD?.busy){ctx.status('请等待当前素材上传完成。',true);return;}save.disabled=publish.disabled=true;
   try{const r=await ctx.api('/api/admin/page',{method:'POST',body:{path:key,revision:record.revision,patches:record.patches,publish:publishNow}});record=structuredClone(r.record);clean=true;ctx.setDirty(false);paintHistory();ctx.status(publishNow?'本页修改已提交发布，可在发布状态中查看生效进度。':'本页草稿已保存在当前设备。');}catch(e){ctx.status(e.message,true);}finally{save.disabled=publish.disabled=false;}
  }
  async function loadRecord(next){
   const stamp=++loading;const r=await ctx.api('/api/admin/page?path='+encodeURIComponent(next));if(stamp!==loading||ctx.isCurrent&&!ctx.isCurrent())return false;
   const base=next.includes('?')?(await ctx.api('/api/admin/page?path='+encodeURIComponent(next.split('?')[0]))).published?.patches||[]:[];
   if(stamp!==loading)return false;key=next;record=structuredClone(r.record);baseline=base;clean=true;ctx.setDirty(false);selected=null;history=[];pageSelect.value=key;view.href='/'+key;paintHistory();closeInspector();
   if(r.staleDraft)ctx.status('线上已有新版本，已载入线上内容；本机旧草稿可在草稿中心导出保留。');else if(r.localDraft)ctx.status('已载入本机页面草稿。');return true;
  }
  async function openPage(next,hash=''){
   finishInline();if(!ctx.canLeave()){pageSelect.value=key;return;}
   try{if(!await loadRecord(next))return;queued=hash;delete frame.dataset.editorReady;const u=new URL('/'+next,location.origin);u.searchParams.set('cms-edit','1');frame.src=u.href;directory.open=false;selectTarget(null);}catch(e){ctx.status(e.message,true);pageSelect.value=key;}
  }
  pageSelect.onchange=()=>openPage(pageSelect.value);
  function selectTarget(target){
   frame.contentDocument?.querySelectorAll('[data-cheney-edit-selected]').forEach(n=>n.removeAttribute('data-cheney-edit-selected'));
   selected=target&&target.isConnected?target:null;if(selected)selected.setAttribute('data-cheney-edit-selected','');
   selection.textContent=selected?'已选中：'+(selected.getAttribute('alt')||selected.textContent?.trim()||({IMG:'图片',VIDEO:'视频',AUDIO:'音频'})[selected.tagName]||'区域').slice(0,80):'点击页面内容进行修改；双击文字可以直接输入。';
   for(const b of commands.querySelectorAll('[data-needs-selection]'))b.disabled=!selected;
  }
  function panel(title){inspector.hidden=false;inspector.replaceChildren();const head=el('div',undefined,'visual-inspector-heading');head.append(el('h2',title),button('关闭编辑',closeInspector));inspector.append(head);return inspector;}
  function editText(target=selected){
   if(!target)return;const texts=[...target.childNodes].filter(n=>n.nodeType===3),nonempty=texts.map((t,i)=>[i,t.nodeValue.trim().slice(0,45)]).filter(x=>x[1]);
   const box=panel('修改文字');if(!nonempty.length){box.append(el('p','请点选具体的文字，也可以在这里添加新段落。'),button('添加文字',()=>add('text')));return;}
   const choice=select(box,'文字片段',Object.fromEntries(nonempty),String(nonempty[0][0])),value=field(box,'文字内容',texts[+choice.value].nodeValue,'textarea');choice.onchange=()=>value.value=texts[+choice.value].nodeValue;
   box.append(button('应用文字',()=>attempt(()=>put({type:'text',selector:pathOf(target),textIndex:+choice.value,original:texts[+choice.value].nodeValue,value:value.value})),'primary'));
  }
  function inlineText(target){
   finishInline();const texts=[...target.childNodes].filter(n=>n.nodeType===3),index=texts.findIndex(t=>t.nodeValue.trim());if(index<0){editText(target);return;}
   const text=texts[index],original=text.nodeValue,selector=pathOf(target),span=frame.contentDocument.createElement('span');span.dataset.editorUi='inline';span.contentEditable='plaintext-only';span.textContent=original;span.setAttribute('role','textbox');span.setAttribute('aria-label','直接修改文字');text.replaceWith(span);
   let done=false;inline={finish(cancel=false){if(done)return;done=true;const value=span.textContent;span.replaceWith(text);inline=null;if(!cancel&&value!==original)attempt(()=>put({type:'text',selector,textIndex:index,original,value}));}};
   span.addEventListener('blur',()=>inline?.finish(),{once:true});span.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();inline?.finish(true);}else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();inline?.finish();}});
   span.addEventListener('paste',e=>{e.preventDefault();const text=e.clipboardData.getData('text/plain'),selection=frame.contentWindow.getSelection();if(!selection?.rangeCount)return;const range=selection.getRangeAt(0);range.deleteContents();range.insertNode(frame.contentDocument.createTextNode(text));selection.collapseToEnd();});
   span.focus();const range=frame.contentDocument.createRange();range.selectNodeContents(span);const selection=frame.contentWindow.getSelection();selection.removeAllRanges();selection.addRange(range);
  }
  function finishInline(){inline?.finish();}
  function editMedia(target=selected,type){
   if(!target)return;type||=target.tagName==='IMG'?'image':['AUDIO','VIDEO'].includes(target.tagName)?'video':'background';const box=panel(type==='background'?'更换背景':type==='image'?'更换图片':'更换音视频'),original=type==='background'?target.style.backgroundImage:target.getAttribute('src')||target.querySelector('source')?.getAttribute('src')||'',address=field(box,'素材地址',type==='background'?'':original),caption=field(box,'图片说明',target.alt||''),poster=type==='video'?field(box,'视频封面地址',target.getAttribute('poster')||''):null,fit=type==='image'?select(box,'显示方式',{cover:'填满图片区域',contain:'完整显示图片'},target.style.objectFit==='contain'?'contain':'cover'):null;
   box.append(button('选择或上传素材',()=>helpers.pickMedia(ctx,(src,item)=>{if((type==='image'||type==='background')&&item.type!=='image'||type==='video'&&!['video','audio'].includes(item.type)){ctx.status('请选择与当前区域相符的素材。',true);return;}address.value=src;})),button('应用素材',()=>attempt(()=>put({type,selector:pathOf(target),original,value:url(address.value),alt:caption.value,poster:poster?.value?url(poster.value):'',fit:fit?.value||'cover'})),'primary'));
  }
  function editLink(){const target=selected?.closest('a');if(!target){ctx.status('请先点选带链接的文字或图片。',true);return;}const box=panel('修改跳转链接'),address=field(box,'跳转地址',target.getAttribute('href'));box.append(button('应用链接',()=>attempt(()=>put({type:'link',selector:pathOf(target),original:target.getAttribute('href'),value:url(address.value)})),'primary'));}
  function add(format='text'){
   finishInline();const target=selected||root();if(!target){ctx.status('页面尚未载入，请稍后重试。',true);return;}
   const anchorSelector=pathOf(target);const box=panel('在页面中添加内容'),kind=select(box,'内容类型',{text:'文字段落',image:'图片',video:'视频',audio:'音频',link:'链接'},format),title=field(box,'小标题（可选）'),value=field(box,'正文或素材地址','','textarea'),caption=field(box,'图片说明／链接名称'),position=select(box,'放置位置',positions,selected?'afterend':'beforeend'),poster=field(box,'视频封面地址（可选）');
   box.append(button('选择或上传素材',()=>helpers.pickMedia(ctx,(src,item)=>{kind.value=item.type;value.value=src;})),button('添加到页面',()=>attempt(()=>{if(!value.value.trim())throw Error('请先填写内容或选择素材');put({id:crypto.randomUUID(),type:'block',format:kind.value,selector:anchorSelector,position:position.value,title:title.value,value:kind.value==='text'?value.value:url(value.value),caption:caption.value,poster:poster.value?url(poster.value):''});}),'primary'));
   const uploads=el('div');box.append(uploads);window.CHENEY_BATCH_UPLOAD.mount(uploads,{label:'在此批量添加图片与视频',accept:'image/png,image/jpeg,image/webp,video/mp4,video/webm',remaining:()=>Math.max(0,500-record.patches.length),upload:async f=>{if(f.type.startsWith('image/'))return ctx.uploadImage(f,'/api/admin/media');if(f.size>20*1024*1024)throw Error('视频超过 20 MB，请压缩后重试');return ctx.api('/api/admin/media',{method:'POST',headers:{'Content-Type':f.type},body:f});},onItem:(r,f)=>{const anchor=frame.contentDocument.querySelector(anchorSelector);if(!anchor)throw Error('所选位置已经变化，请重新选择');put({id:crypto.randomUUID(),type:'block',format:f.type.startsWith('video/')?'video':'image',selector:pathOf(anchor),position:position.value,title:'',value:r.url,caption:''},{keepPanel:true});},onBusy:busy=>{save.disabled=publish.disabled=busy;},onComplete:()=>{inspector.hidden=false;ctx.status('素材已加入页面草稿，确认后请发布此页。');}});
  }
  function cardTarget(){let n=selected;while(n&&!['BODY','MAIN'].includes(n.tagName)){if(n.matches('[data-cms-copy],[data-cms-block],article,figure,li')||[...n.classList].some(c=>/(?:^|[-_])(card|tile)$/.test(c)))return n;n=n.parentElement;}return selected;}
  function duplicate(){finishInline();const target=cardTarget();if(!target||['HTML','BODY','MAIN','NAV','HEADER','FOOTER','FORM'].includes(target.tagName)){ctx.status('请先选中具体卡片、段落或图片。',true);return;}attempt(()=>{const id=crypto.randomUUID();const template=frame.contentWindow.CHENEY_PAGE_CONTENT.snapshot(target);if(!template)throw Error('这个区域不适合直接复制，请选择具体的图文卡片');put({id,type:'duplicate',selector:pathOf(target),position:'afterend',value:'',template});selectTarget(frame.contentDocument.querySelector('[data-cms-copy="'+CSS.escape(id)+'"]'));ctx.status('已复制这个模块，点选副本中的文字或图片即可修改。');});}
  function hide(){finishInline();if(!selected||['HTML','BODY'].includes(selected.tagName))return;if(!confirm('隐藏选中的这部分内容？可以通过撤销或修改记录恢复。'))return;attempt(()=>put({type:'hide',selector:pathOf(selected),value:'',original:''}));selectTarget(null);closeInspector();}
  function enterLink(){const a=selected?.closest('a');if(!a){ctx.status('请先选择需要打开的小节入口。',true);return;}const u=new URL(a.href);if(u.origin!==location.origin){ctx.status('这个链接指向站外，只能修改链接地址。');return;}const path=helpers.keyOf(u,null);if(!catalog.pages.some(p=>p.path.split('?')[0]===path.split('?')[0])){ctx.status('这个链接不属于可编辑站内页面。',true);return;}openPage(path,u.hash);}
  const command=(label,fn,needs=false)=>{const b=button(label,fn);if(needs)b.dataset.needsSelection='true';commands.append(b);return b;};
  command('选择上级区域',()=>{finishInline();if(selected?.parentElement&&!['BODY','HTML'].includes(selected.parentElement.tagName))selectTarget(selected.parentElement);},true);command('修改文字',()=>editText(),true);command('更换素材',()=>editMedia(),true);command('修改链接',editLink,true);command('进入所选小节',enterLink,true);command('＋ 文字',()=>add('text'));command('＋ 图片／视频',()=>add('image'));command('复制模块',duplicate,true);command('隐藏所选内容',hide,true);
  mode.onchange=()=>{finishInline();frame.dataset.mode=mode.value;if(frame.contentDocument)frame.contentDocument.documentElement.dataset.cheneyEditing=String(mode.value==='edit');closeInspector();};frame.dataset.mode='edit';
  const bound=new WeakSet();
  async function attach(){
   try{
    const w=frame.contentWindow,d=frame.contentDocument;if(!d||d.readyState==='loading'||w.location.href==='about:blank'||bound.has(d))return;
    const actual=helpers.keyOf(w.location,d);if(actual!==key){if(!catalog.pages.some(p=>p.path.split('?')[0]===actual.split('?')[0]))return;if(!clean){ctx.status('请先保存当前页修改，再打开其他页面。',true);return;}if(!await loadRecord(actual))return;}
    bound.add(d);await w.CHENEY_PAGE_CONTENT?.ready;if(ctx.isCurrent&&!ctx.isCurrent())return;preview();pause();
    d.documentElement.dataset.cheneyEditing=String(mode.value==='edit');const style=d.createElement('style');style.textContent='html[data-cheney-editing="true"] a::before,html[data-cheney-editing="true"] a::after,html[data-cheney-editing="true"] [class*="card"]::before,html[data-cheney-editing="true"] [class*="card"]::after{pointer-events:none!important}html[data-cheney-editing="true"] :is(h1,h2,h3,h4,h5,h6,p,span,a,strong,em,small,blockquote,figcaption,img,video,audio,li,dt,dd){pointer-events:auto!important}[data-cheney-edit-hover]{outline:2px dashed #a66642!important;outline-offset:3px!important;cursor:pointer!important}[data-cheney-edit-selected]{outline:2px solid #c59e53!important;outline-offset:4px!important}[data-editor-ui="inline"]{display:inline!important;outline:2px solid #bc754c!important;background:#fff8d6!important;color:#263b31!important;white-space:pre-wrap;min-width:1em}[data-cms-owner-hidden]{display:none!important}';d.head.append(style);
    let hover;
    d.addEventListener('pointerover',e=>{if(mode.value!=='edit'||inline)return;hover?.removeAttribute('data-cheney-edit-hover');if(safe(e.target)){hover=e.target;hover.setAttribute('data-cheney-edit-hover','');}},true);
    d.addEventListener('click',e=>{
     if(e.target.closest('[data-editor-ui]'))return;
     if(mode.value==='browse'){
      const a=e.target.closest('a');if(a){const u=new URL(a.href);if(u.origin!==location.origin){e.preventDefault();ctx.status('站外链接可在“查看公开页面”中打开。');return;}e.preventDefault();e.stopImmediatePropagation();if(u.hash&&u.pathname===w.location.pathname&&u.search===w.location.search)d.getElementById(decodeURIComponent(u.hash.slice(1)))?.scrollIntoView();else openPage(helpers.keyOf(u,null),u.hash);}return;
     }
     e.preventDefault();e.stopImmediatePropagation();finishInline();if(!safe(e.target))return;selectTarget(e.target);if(e.target.tagName==='IMG'||['VIDEO','AUDIO'].includes(e.target.tagName))editMedia(e.target);else editText(e.target);
    },true);
    d.addEventListener('dblclick',e=>{if(mode.value!=='edit'||!safe(e.target))return;e.preventDefault();e.stopImmediatePropagation();closeInspector();inlineText(e.target);},true);
    d.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
    frame.dataset.editorReady=key;if(queued){d.getElementById(decodeURIComponent(queued.replace(/^#/,'')))?.scrollIntoView();queued=null;}else if(ctx.scope?.section&&key==='index.html')d.getElementById(ctx.scope.section)?.scrollIntoView();
   }catch(e){ctx.status('页面编辑尚未就绪，请重新选择页面。'+e.message,true);}
  }
  frame.onload=attach;const timer=setInterval(()=>{if(!frame.isConnected){clearInterval(timer);resize.disconnect();return;}attach();},250);
  function size(){const available=Math.max(240,frameWrap.clientWidth-16),width=device.value==='mobile'?Math.min(390,available):available;frame.style.width=width+'px';frame.style.maxWidth='100%';frame.style.zoom='';frame.style.height=Math.max(640,innerHeight*.76)+'px';}
  const resize=new ResizeObserver(size);resize.observe(frameWrap);device.onchange=()=>{finishInline();size();};
  await openPage(ctx.scope?.path||'index.html');selectTarget(null);size();
 }
 window.CHENEY_VISUAL_EDITOR={mount};
})();
