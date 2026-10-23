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
  const studio=el('section',undefined,'visual-studio'),bar=el('div',undefined,'visual-topbar'),pageSelect=select(bar,'当前页面',Object.fromEntries(catalog.pages.map(p=>[p.path,p.title])),ctx.scope?.path||'index.html'),mode=select(bar,'操作方式',{browse:'浏览与编辑',edit:'精细选取'},'browse'),device=select(bar,'页面尺寸',{desktop:'适应窗口',mobile:'手机页面'},innerWidth<700?'mobile':'desktop');
  const directory=el('details',undefined,'visual-directory'),search=el('input'),list=el('div',undefined,'visual-page-list');directory.append(el('summary','查找全部页面'),search,list);search.type='search';search.placeholder='查找页面或小节';search.setAttribute('aria-label','查找页面或小节');
  const frameWrap=el('div',undefined,'site-frame-wrap visual-frame-wrap'),frame=el('iframe');frame.title='直接编辑网站页面';frame.className='site-frame';frameWrap.append(frame);
  const sectionLinks=el('nav',undefined,'visual-section-links');sectionLinks.setAttribute('aria-label','本章小节直达');const actions=el('div',undefined,'visual-actions'),selection=el('p','点击卡片直接进入小节；鼠标移到内容上点击“编辑”，右侧可直接补充。','visual-selection'),commands=el('div',undefined,'site-tools'),inspector=el('aside',undefined,'visual-inspector'),changes=el('details',undefined,'site-changes');inspector.hidden=true;
  const historyHost=el('div');changes.append(el('summary','本页修改记录'),historyHost);
  let key='',record={revision:0,patches:[]},baseline=[],selected=null,history=[],loading=0,clean=true,inline=null,queued=null,currentSection=ctx.scope?.section||'',pending=false;
  const save=button('保存草稿',()=>persist(false)),publish=button('发布此页',()=>persist(true),'primary'),undo=button('撤销',rollback),view=el('a','查看公开页面 ↗');view.target='_blank';view.rel='noopener';
  const canvas=el('div',undefined,'visual-canvas'),body=el('div',undefined,'visual-editor-body');canvas.append(frameWrap);body.append(canvas,inspector);actions.append(save,publish,undo,view);studio.append(bar,sectionLinks,directory,actions,selection,commands,body,changes);box.replaceChildren(studio);
  const root=()=>{const d=frame.contentDocument;if(!d)return null;return key.split('?')[0]==='index.html'&&currentSection?d.getElementById(currentSection):d.querySelector('main')||d.body;};
  const pause=()=>frame.contentDocument?.querySelectorAll('video,audio').forEach(m=>{m.autoplay=false;m.pause();});
  const preview=()=>{const w=frame.contentWindow,x=w?.scrollX||0,y=w?.scrollY||0;w?.CHENEY_PAGE_CONTENT?.apply([...baseline,...record.patches]);for(const n of frame.contentDocument?.querySelectorAll('[data-cms-block]')||[])if(record.patches.some(p=>p.id===n.dataset.cmsBlock&&isMedia(p))){n.draggable=true;n.querySelectorAll('img').forEach(img=>img.draggable=false);n.title='拖动调整图片或视频的位置';}w?.scrollTo({left:x,top:y,behavior:'instant'});};
  const mark=()=>{clean=false;ctx.setDirty(true);paintHistory();};
  function closeInspector(){if(pending&&!confirm('输入内容尚未加入页面，确认收起并放弃这次输入？'))return false;pending=false;ctx.setDirty(!clean);inspector.hidden=true;return true;}
  function canReplacePanel(){if(pending&&!confirm('输入内容尚未加入页面，确认切换编辑对象并放弃这次输入？'))return false;pending=false;ctx.setDirty(!clean);return true;}
  function historySave(){history.push(structuredClone(record.patches));if(history.length>40)history.shift();}
  function put(p,options={}){
   if(isMedia(p)&&p.previewCount===undefined){const at=placement(p);p.previewCount=record.patches.find(x=>isMedia(x)&&x.layout!=='inline'&&groupOf(x)===JSON.stringify([at.selector,at.position||'afterend']))?.previewCount||6;}
   if(record.patches.length>=500&&!record.patches.some(x=>x.id===p.id))throw Error('本页编辑项已达上限，请先整理修改记录。');
   historySave();const old=record.patches.find(x=>x.id===p.id||!['block','duplicate'].includes(p.type)&&x.type===p.type&&x.selector===p.selector&&(x.textIndex||0)===(p.textIndex||0)&&(x.device||'all')===(p.device||'all'));
   pending=false;p.id=old?.id||p.id||crypto.randomUUID();if(old)p.original=old.original;
   record.patches=record.patches.filter(x=>x.id!==p.id);record.patches.push(p);mark();preview();if(!options.keepPanel)closeInspector();
   selected=frame.contentDocument?.querySelector(p.selector)||null;selectTarget(selected);ctx.status('已应用到本页草稿，确认后点击“发布此页”。');
  }
  function attempt(fn){try{fn();}catch(e){ctx.status(e.message,true);}}
  function url(value){const u=new URL(value,frame.contentWindow.location.href);if(!['https:','http:'].includes(u.protocol))throw Error('请输入有效的网页或媒体地址');return u.href;}
  function drawDirectory(){list.replaceChildren();for(const p of catalog.pages.filter(p=>(p.title+' '+p.path).toLowerCase().includes(search.value.trim().toLowerCase()))){list.append(button(p.title,()=>openPage(p.path)));}}
  function drawSectionLinks(){
   sectionLinks.replaceChildren();const chapters=window.CHENEY_ADMIN_CHAPTERS.chapters,c=chapters.find(c=>c.key===ctx.scope?.chapter)||chapters.find(c=>c.group===catalog.pages.find(p=>p.path===key)?.group);
   if(!c){sectionLinks.append(button('主页',()=>openPage('index.html')));return;}
   sectionLinks.append(button(c.title+' · 主页',()=>openPage('index.html','#'+c.section)));
   for(const p of window.CHENEY_ADMIN_NAVIGATION.pages(catalog,c)){const b=button(window.CHENEY_ADMIN_NAVIGATION.name(p),()=>openPage(p.path));b.dataset.path=p.path;b.setAttribute('aria-current',String(p.path===key));sectionLinks.append(b);}
  }
  search.oninput=drawDirectory;drawDirectory();
  function paintHistory(){
   undo.disabled=!history.length;historyHost.replaceChildren();changes.firstElementChild.textContent='本页修改记录 · '+record.patches.length+' 项';
   for(const p of record.patches){const row=el('div',undefined,'site-change'),tools=el('div'),label=({text:'文字',image:'图片',video:'音视频',link:'链接',background:'背景',block:'新增内容',duplicate:'复制模块',hide:'隐藏内容'})[p.type];row.append(el('span',label+' · '+(p.title||p.value||'所选区域').slice(0,55)));tools.append(button('定位',()=>{const target=frame.contentDocument?.querySelector(p.type==='block'?'[data-cms-block="'+CSS.escape(p.id)+'"]':p.type==='duplicate'?'[data-cms-copy="'+CSS.escape(p.id)+'"]':p.selector);target?.scrollIntoView({block:'center'});selectTarget(target);}),button('撤销此项',()=>{finishInline();historySave();record.patches=record.patches.filter(x=>x.id!==p.id);mark();preview();selectTarget(null);}));row.append(tools);historyHost.append(row);}
  }
  function rollback(){finishInline();if(!history.length)return;record.patches=history.pop();mark();preview();selectTarget(null);closeInspector();}
  async function persist(publishNow){
   finishInline();if(pending){ctx.status('请先点击右侧的“添加到本小节”或“应用文字”，再保存发布。',true);return false;}if(window.CHENEY_BATCH_UPLOAD?.busy){ctx.status('请等待当前素材上传完成。',true);return;}save.disabled=publish.disabled=true;
   try{const r=await ctx.api('/api/admin/page',{method:'POST',body:{path:key,revision:record.revision,patches:record.patches,publish:publishNow}});record=structuredClone(r.record);clean=true;ctx.setDirty(false);paintHistory();ctx.status(publishNow?'本页修改已提交发布，可在发布状态中查看生效进度。':'本页草稿已保存在当前设备。');return true;}catch(e){ctx.status(e.message,true);return false;}finally{save.disabled=publish.disabled=false;}
  }
  async function loadRecord(next){
   movingId=draggingId='';
   const stamp=++loading;const r=await ctx.api('/api/admin/page?path='+encodeURIComponent(next));if(stamp!==loading||ctx.isCurrent&&!ctx.isCurrent())return false;
   const base=next.includes('?')?(await ctx.api('/api/admin/page?path='+encodeURIComponent(next.split('?')[0]))).published?.patches||[]:[];
   if(stamp!==loading)return false;key=next;pending=false;record=structuredClone(r.record);baseline=base;clean=true;ctx.setDirty(false);selected=null;history=[];pageSelect.value=key;view.href='/'+key;window.dispatchEvent(new CustomEvent('cheney-admin-page-changed',{detail:{key,chapter:key==='index.html'?ctx.scope?.chapter:undefined}}));drawSectionLinks();paintHistory();closeInspector();
   if(r.staleDraft)ctx.status('线上已有新版本，已载入线上内容；本机旧草稿可在草稿中心导出保留。');else if(r.localDraft)ctx.status('已载入本机页面草稿。');return true;
  }
  async function openPage(next,hash=''){
   finishInline();if(!pending&&!clean&&!await persist(false))return;if(!ctx.canLeave()){pageSelect.value=key;return;}
   try{if(!await loadRecord(next))return;queued=hash;if(next==='index.html'&&hash)currentSection=decodeURIComponent(hash.replace(/^#/,''));delete frame.dataset.editorReady;const u=new URL('/'+next,location.origin);u.searchParams.set('cms-edit','1');frame.src=u.href;directory.open=false;selectTarget(null);}catch(e){ctx.status(e.message,true);pageSelect.value=key;}
  }
  pageSelect.onchange=()=>openPage(pageSelect.value);
  function selectTarget(target){
   frame.contentDocument?.querySelectorAll('[data-cheney-edit-selected]').forEach(n=>n.removeAttribute('data-cheney-edit-selected'));
   selected=target&&target.isConnected?target:null;if(selected)selected.setAttribute('data-cheney-edit-selected','');
   selection.textContent=selected?'已选中：'+(selected.getAttribute('alt')||selected.textContent?.trim()||({IMG:'图片',VIDEO:'视频',AUDIO:'音频'})[selected.tagName]||'区域').slice(0,80):'点击卡片直接进入小节；鼠标移到内容上点击“编辑”，右侧可直接补充。';
   for(const b of commands.querySelectorAll('[data-needs-selection]')){b.disabled=!selected;b.hidden=!selected;}
  }
  function panel(title){pending=false;inspector.hidden=false;inspector.replaceChildren();const head=el('div',undefined,'visual-inspector-heading');head.append(el('h2',title),button('关闭编辑',closeInspector));inspector.append(head);return inspector;}
  inspector.addEventListener('input',()=>{pending=true;ctx.setDirty(true);});
  function editText(target=selected){
   if(!target||!canReplacePanel())return;const texts=[...target.childNodes].filter(n=>n.nodeType===3),nonempty=texts.map((t,i)=>[i,t.nodeValue.trim().slice(0,45)]).filter(x=>x[1]);
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
  const isMedia=p=>p.type==='block'&&['image','video'].includes(p.format);
  let movingId='',draggingId='';
  const mediaNode=id=>frame.contentDocument?.querySelector('[data-cms-block="'+CSS.escape(id)+'"]');
  const placement=p=>frame.contentWindow?.CHENEY_PAGE_CONTENT?.mediaPlacement(p)||p;
  const groupOf=p=>JSON.stringify([placement(p).selector,placement(p).position||'afterend']);
  function removeMedia(id,ask=true,keepUploads=false){
   if(window.CHENEY_BATCH_UPLOAD?.busy)throw Error('请等待上传结束，再删除影像。');
   if(pending)throw Error('请先应用或关闭尚未完成的编辑，再删除影像。');
   const item=record.patches.find(p=>p.id===id&&isMedia(p));if(!item)return;
   if(ask&&!confirm('从本页删除这项影像？发布后前台将不再显示，可用“撤销”恢复。素材库原文件会保留。'))return;
   finishInline();historySave();const at=placement(item),dependent=p=>p.selector?.includes('[data-cms-block="'+id+'"]');
   record.patches=record.patches.filter(p=>p.id!==id&&!(dependent(p)&&!['block','duplicate'].includes(p.type)));
   for(const p of record.patches)if(dependent(p)){p.selector=at.selector;p.position=at.position;}
   movingId=draggingId='';mark();preview();selectTarget(null);if(!keepUploads)manageMedia(true);ctx.status('已从本页删除，可撤销；确认后发布此页。');
  }
  function moveMedia(id,target,after=false){
   if(pending){ctx.status('请先应用右侧尚未加入页面的内容，再移动图片。',true);return;}
   if(window.CHENEY_BATCH_UPLOAD?.busy){ctx.status('请等待本批上传结束，再调整位置。',true);return;}
   const item=record.patches.find(p=>p.id===id&&isMedia(p));if(!item||!target)return;
   const source=mediaNode(id),otherNode=target.closest('[data-cms-block]'),other=record.patches.find(p=>p.id===otherNode?.dataset.cmsBlock&&isMedia(p));
   if(source?.contains(target))return;
   let next;
   if(other){const at=placement(other);if(at.selector.includes(id))return;next={...item,selector:at.selector,position:at.position,layout:other.layout||'gallery',previewCount:other.previewCount||6};}
   else {if(target.closest('[data-cms-gallery],[data-editor-ui],nav,footer,button,summary,dialog'))return;const anchor=target.closest('p,h1,h2,h3,h4,figure,article,section,div');if(!anchor||source?.contains(anchor))return;next={...item,selector:pathOf(anchor),position:after?'afterend':'beforebegin',layout:'inline'};}
   finishInline();historySave();record.patches=record.patches.filter(p=>p.id!==id);
   const index=other?record.patches.findIndex(p=>p.id===other.id)+(after?1:0):record.patches.length;
   record.patches.splice(index,0,next);movingId=draggingId='';pending=false;mark();preview();selectTarget(mediaNode(id));manageMedia(true);ctx.status('位置已调整，可继续拖动；确认后发布此页。');
  }
  function manageMedia(force=false){
   if(!force&&!canReplacePanel())return;const panelScroll=force?inspector.scrollTop:0,outerX=scrollX,outerY=scrollY,box=panel('图片与视频布局'),items=record.patches.filter(isMedia);
   box.append(el('p','拖动清单调整先后；也可把页面中的图片拖到另一张图片或段落前后。手机可用“上移／下移”和“选择位置”。','media-layout-help'));
   if(!items.length){box.append(el('p','本页还没有补充影像。'),button('添加图片／视频',()=>add('image')));return;}
   const limit=select(box,'图集默认展示数量',{'3':'3 项','6':'6 项','9':'9 项','12':'12 项'},String(items.find(p=>p.layout!=='inline')?.previewCount||6));
   limit.onchange=()=>{historySave();for(const p of record.patches)if(isMedia(p)&&p.layout!=='inline')p.previewCount=Number(limit.value);pending=false;mark();preview();ctx.status('已更新折叠数量，确认后发布此页。');};
   const list=el('ol',undefined,'media-layout-list');box.append(list);
   for(const [index,p]of items.entries()){
    const row=el('li');row.dataset.mediaId=p.id;row.draggable=true;const handle=el('span','⠿','media-layout-handle');handle.draggable=true;handle.title='按住拖动排序';handle.setAttribute('aria-label','拖动排序');const thumb=el(p.format==='image'?'img':'span');thumb.draggable=false;if(p.format==='image'){thumb.src=p.value;thumb.alt='';thumb.loading='lazy';}else thumb.textContent='▶';
    const info=el('div'),label=p.title||p.caption||p.alt||((p.format==='video'?'视频':'图片')+' '+(index+1));info.append(el('strong',(index+1)+' · '+label),el('small',p.layout==='inline'?'单独放置在正文中':'图集 · 超出部分可展开'));
    const tools=el('div',undefined,'media-layout-tools');
    const up=button('上移',()=>moveMedia(p.id,mediaNode(items[index-1]?.id||''),false)),down=button('下移',()=>moveMedia(p.id,mediaNode(items[index+1]?.id||''),true));up.disabled=!index;down.disabled=index===items.length-1;
    tools.append(up,down,button('定位',()=>{const n=mediaNode(p.id);const g=n?.closest('[data-cms-gallery]');if(n?.hidden&&g)g.querySelector('.cheney-gallery-toggle')?.click();n?.scrollIntoView({block:'center'});selectTarget(n);}),button('选择位置',()=>{movingId=p.id;ctx.status('在页面中点击目标段落：点击上半部放在前面，下半部放在后面。按 Esc 取消。');selection.textContent='正在移动 '+label+'：请点击页面中的目标位置。';if(innerWidth<1000)frameWrap.scrollIntoView({block:'start'});}));
    const remove=button('删除',()=>attempt(()=>removeMedia(p.id)));remove.setAttribute('aria-label','删除 '+label);remove.className='media-delete';tools.append(remove);
    if(p.layout==='inline')tools.append(button('放回影像区',()=>{const d=frame.contentDocument,slot=d.querySelector('#photos .stage-section-content,#travel-photo-list')||root();historySave();Object.assign(p,{selector:slot.matches('#photos .stage-section-content')?'#photos .stage-section-content':pathOf(slot),position:'beforeend',layout:'gallery',previewCount:Number(limit.value)});mark();preview();manageMedia(true);}));
    info.append(tools);row.append(handle,thumb,info);list.append(row);
    row.ondragstart=e=>{draggingId=p.id;e.dataTransfer.setData('text/cheney-media',p.id);e.dataTransfer.effectAllowed='move';};
    row.ondragover=e=>{if(draggingId){e.preventDefault();row.dataset.drop='true';}};row.ondragleave=()=>delete row.dataset.drop;
    row.ondrop=e=>{e.preventDefault();delete row.dataset.drop;const id=draggingId||e.dataTransfer.getData('text/cheney-media');moveMedia(id,mediaNode(p.id),e.clientY>row.getBoundingClientRect().top+row.clientHeight/2);};
    row.ondragend=()=>{draggingId='';list.querySelectorAll('[data-drop]').forEach(n=>delete n.dataset.drop);};
   }
   inspector.scrollTop=panelScroll;if(force)scrollTo({left:outerX,top:outerY,behavior:'instant'});
  }
  function editMedia(target=selected,type){
   if(!target||!canReplacePanel())return;type||=target.tagName==='IMG'?'image':['AUDIO','VIDEO'].includes(target.tagName)?'video':'background';const box=panel(type==='background'?'更换背景':type==='image'?'更换图片':'更换音视频'),original=type==='background'?target.style.backgroundImage:target.getAttribute('src')||target.querySelector('source')?.getAttribute('src')||'',address=field(box,'素材地址',type==='background'?'':original),caption=field(box,'图片说明',target.alt||''),poster=type==='video'?field(box,'视频封面地址',target.getAttribute('poster')||''):null,fit=type==='image'?select(box,'显示方式',{cover:'填满图片区域',contain:'完整显示图片'},target.style.objectFit==='contain'?'contain':'cover'):null;
   box.append(button('选择或上传素材',()=>helpers.pickMedia(ctx,(src,item)=>{if((type==='image'||type==='background')&&item.type!=='image'||type==='video'&&!['video','audio'].includes(item.type)){ctx.status('请选择与当前区域相符的素材。',true);return;}address.value=src;})),button('应用素材',()=>attempt(()=>put({type,selector:pathOf(target),original,value:url(address.value),alt:caption.value,poster:poster?.value?url(poster.value):'',fit:fit?.value||'cover'})),'primary'));
   const owner=target.closest('[data-cms-block]'),media=record.patches.find(p=>p.id===owner?.dataset.cmsBlock&&isMedia(p));if(media)box.append(button('删除这项影像',()=>{if(pending&&!canReplacePanel())return;attempt(()=>removeMedia(media.id));},'media-delete'));
  }
  function editLink(){if(!canReplacePanel())return;const target=selected?.closest('a');if(!target){ctx.status('请先点选带链接的文字或图片。',true);return;}const box=panel('修改跳转链接'),address=field(box,'跳转地址',target.getAttribute('href'));box.append(button('应用链接',()=>attempt(()=>put({type:'link',selector:pathOf(target),original:target.getAttribute('href'),value:url(address.value)})),'primary'));}
  function add(format='text',atSelection=false){
   if(!canReplacePanel())return;finishInline();const target=atSelection&&selected||root();if(!target){ctx.status('页面尚未载入，请稍后重试。',true);return;}
   const anchorSelector=pathOf(target);const box=panel('补充本小节'),kind=select(box,'内容类型',{text:'文字段落',image:'图片',video:'视频',audio:'音频',link:'链接'},format),title=field(box,'小标题（可选）'),value=field(box,'正文或素材地址','','textarea'),caption=field(box,'图片说明／链接名称'),position=select(box,'添加位置',atSelection?positions:{beforeend:'当前小节末尾',afterbegin:'当前小节开头'},atSelection&&selected?'afterend':'beforeend'),poster=field(box,'视频封面地址（可选）');
   box.append(button('选择或上传素材',()=>helpers.pickMedia(ctx,(src,item)=>{kind.value=item.type;value.value=src;})),button('添加到本小节',()=>attempt(()=>{if(!value.value.trim())throw Error('请先填写内容或选择素材');put({id:crypto.randomUUID(),type:'block',format:kind.value,selector:anchorSelector,position:position.value,title:title.value,value:kind.value==='text'?value.value:url(value.value),caption:caption.value,poster:poster.value?url(poster.value):''});}),'primary'));
   const extra=el('details',undefined,'visual-add-extra');extra.append(el('summary','位置、说明与封面（选填）'),position.parentElement,caption.parentElement,poster.parentElement);box.append(extra);const updateKind=()=>{value.parentElement.firstChild.textContent=kind.value==='text'?'补充正文':'素材地址（也可直接上传）';poster.parentElement.hidden=kind.value!=='video';};kind.onchange=updateKind;updateKind();const uploads=el('div');box.append(uploads);window.CHENEY_BATCH_UPLOAD.mount(uploads,{label:'继续追加图片与视频',doneLabel:'已加入本页',existing:record.patches.filter(p=>p.type==='block'&&['image','video'].includes(p.format)).map(p=>({id:p.id,url:p.value,name:p.alt||p.caption||p.value.split('/').pop(),type:p.format})),onRemove:item=>removeMedia(item.id,false,true),accept:'image/png,image/jpeg,image/webp,video/mp4,video/webm',remaining:()=>Math.max(0,500-record.patches.length),upload:async f=>{if(f.type.startsWith('image/'))return ctx.uploadImage(f,'/api/admin/media');if(f.size>20*1024*1024)throw Error('视频超过 20 MB，请压缩后重试');return ctx.api('/api/admin/media',{method:'POST',headers:{'Content-Type':f.type},body:f});},onItem:(r,f)=>{const anchor=frame.contentDocument.querySelector(anchorSelector);if(!anchor)throw Error('所选位置已经变化，请重新选择');const id=crypto.randomUUID();put({id,type:'block',format:f.type.startsWith('video/')?'video':'image',selector:pathOf(anchor),position:position.value,title:'',value:r.url,caption:'',alt:f.name},{keepPanel:true});return {id,url:r.url,name:f.name,type:f.type.startsWith('video/')?'video':'image'};},onBusy:busy=>{save.disabled=publish.disabled=busy;},onComplete:()=>{inspector.hidden=false;ctx.status('本批素材已追加，之前的图片与视频全部保留。确认累计清单后请保存或发布此页。');}});
  }
  function cardTarget(){let n=selected;while(n&&!['BODY','MAIN'].includes(n.tagName)){if(n.matches('[data-cms-copy],[data-cms-block],article,figure,li')||[...n.classList].some(c=>/(?:^|[-_])(card|tile)$/.test(c)))return n;n=n.parentElement;}return selected;}
  function duplicate(){finishInline();const target=cardTarget();if(!target||['HTML','BODY','MAIN','NAV','HEADER','FOOTER','FORM'].includes(target.tagName)){ctx.status('请先选中具体卡片、段落或图片。',true);return;}attempt(()=>{const id=crypto.randomUUID();const template=frame.contentWindow.CHENEY_PAGE_CONTENT.snapshot(target);if(!template)throw Error('这个区域不适合直接复制，请选择具体的图文卡片');put({id,type:'duplicate',selector:pathOf(target),position:'afterend',value:'',template});selectTarget(frame.contentDocument.querySelector('[data-cms-copy="'+CSS.escape(id)+'"]'));ctx.status('已复制这个模块，点选副本中的文字或图片即可修改。');});}
  function hide(){finishInline();if(!selected||['HTML','BODY'].includes(selected.tagName))return;if(!confirm('隐藏选中的这部分内容？可以通过撤销或修改记录恢复。'))return;attempt(()=>put({type:'hide',selector:pathOf(selected),value:'',original:''}));selectTarget(null);closeInspector();}
  function enterLink(){const a=selected?.closest('a');if(!a){ctx.status('请先选择需要打开的小节入口。',true);return;}const u=new URL(a.href);if(u.origin!==location.origin){ctx.status('这个链接指向站外，只能修改链接地址。');return;}const path=helpers.keyOf(u,null);if(!catalog.pages.some(p=>p.path.split('?')[0]===path.split('?')[0])){ctx.status('这个链接不属于可编辑站内页面。',true);return;}openPage(path,u.hash);}
  const command=(label,fn,needs=false)=>{const b=button(label,()=>{fn();if(innerWidth<1000&&!inspector.hidden)inspector.scrollIntoView({block:'start',behavior:'smooth'});});if(needs)b.dataset.needsSelection='true';commands.append(b);return b;};
  command('选择上级区域',()=>{finishInline();if(selected?.parentElement&&!['BODY','HTML'].includes(selected.parentElement.tagName))selectTarget(selected.parentElement);},true);command('修改文字',()=>editText(),true);command('更换素材',()=>editMedia(),true);command('修改链接',editLink,true);command('补充文字',()=>{selectTarget(null);add('text');});command('添加图片／视频',()=>{selectTarget(null);add('image');});command('图片排序与位置',()=>manageMedia());command('复制模块',duplicate,true);command('隐藏所选内容',hide,true);
  mode.onchange=()=>{finishInline();frame.dataset.mode=mode.value;if(frame.contentDocument)frame.contentDocument.documentElement.dataset.cheneyEditing=String(mode.value==='edit');closeInspector();};frame.dataset.mode='browse';
  const bound=new WeakSet();
  async function attach(){
   try{
    const w=frame.contentWindow,d=frame.contentDocument;if(!d||d.readyState==='loading'||w.location.href==='about:blank'||bound.has(d))return;
    const actual=helpers.keyOf(w.location,d);if(actual!==key){if(!catalog.pages.some(p=>p.path.split('?')[0]===actual.split('?')[0]))return;if(!clean){ctx.status('请先保存当前页修改，再打开其他页面。',true);return;}if(!await loadRecord(actual))return;}
    bound.add(d);await w.CHENEY_PAGE_CONTENT?.ready;if(ctx.isCurrent&&!ctx.isCurrent())return;preview();pause();
    d.documentElement.dataset.cheneyEditing=String(mode.value==='edit');const style=d.createElement('style');style.textContent='html[data-cheney-editing="true"] a::before,html[data-cheney-editing="true"] a::after,html[data-cheney-editing="true"] [class*="card"]::before,html[data-cheney-editing="true"] [class*="card"]::after{pointer-events:none!important}html[data-cheney-editing="true"] :is(h1,h2,h3,h4,h5,h6,p,span,a,strong,em,small,blockquote,figcaption,img,video,audio,li,dt,dd){pointer-events:auto!important}[data-cheney-edit-hover]{outline:2px dashed #a66642!important;outline-offset:3px!important;cursor:pointer!important}[data-cheney-edit-selected]{outline:2px solid #c59e53!important;outline-offset:4px!important}[data-editor-ui="inline"]{display:inline!important;outline:2px solid #bc754c!important;background:#fff8d6!important;color:#263b31!important;white-space:pre-wrap;min-width:1em}[data-cms-owner-hidden]{display:none!important}';d.head.append(style);
    let hover;const overlay=d.createElement('div');overlay.dataset.editorUi='overlay';overlay.hidden=true;overlay.className='cheney-editor-overlay';
    const edit=d.createElement('button'),insert=d.createElement('button');edit.type=insert.type='button';edit.textContent='编辑';insert.textContent='＋补充';overlay.append(edit,insert);d.body.append(overlay);
    edit.onclick=e=>{e.preventDefault();e.stopPropagation();if(!hover?.isConnected)return;selectTarget(hover);if(hover.tagName==='IMG'||['VIDEO','AUDIO'].includes(hover.tagName))editMedia(hover);else editText(hover);if(innerWidth<1000)inspector.scrollIntoView({block:'start',behavior:'smooth'});};
    insert.onclick=e=>{e.preventDefault();e.stopPropagation();selectTarget(hover);add('text',true);};
    const overlayStyle=d.createElement('style');overlayStyle.textContent='.cheney-editor-overlay{position:fixed!important;z-index:2147483640!important;display:flex;gap:4px;padding:4px;background:#f6f5e9!important;border:1px solid #7c947f!important;border-radius:6px!important;box-shadow:0 4px 18px #163c3340!important}.cheney-editor-overlay[hidden]{display:none!important}.cheney-editor-overlay button{font:13px/1.5 system-ui!important;color:#254738!important;background:#fffef6!important;border:1px solid #b8c9b8!important;border-radius:3px!important;padding:6px 9px!important;cursor:pointer!important}';d.head.append(overlayStyle);
    d.addEventListener('pointerover',e=>{if(inline||draggingId||e.target.closest('[data-editor-ui]'))return;hover?.removeAttribute('data-cheney-edit-hover');if(safe(e.target)){hover=e.target;hover.setAttribute('data-cheney-edit-hover','');const r=hover.getBoundingClientRect();overlay.hidden=false;overlay.style.left=Math.max(4,Math.min(w.innerWidth-145,r.right-140))+'px';overlay.style.top=Math.max(4,Math.min(w.innerHeight-44,r.top-35))+'px';}},true);
    w.addEventListener('scroll',()=>overlay.hidden=true,true);
    d.addEventListener('dragstart',e=>{const n=e.target.closest('[data-cms-block]');if(!n||!record.patches.some(p=>p.id===n.dataset.cmsBlock&&isMedia(p)))return;draggingId=n.dataset.cmsBlock;e.dataTransfer.setData('text/cheney-media',draggingId);e.dataTransfer.effectAllowed='move';overlay.hidden=true;},true);
    let dropTarget;
    const clearDrop=()=>{dropTarget?.removeAttribute('data-media-drop');dropTarget=null;};
    let pointerDrag=null,suppressMediaClickUntil=0;
    const markDrop=(target,y)=>{clearDrop();dropTarget=target?.closest('[data-cms-block],p,h2,h3,figure,article,section');if(dropTarget)dropTarget.setAttribute('data-media-drop',y>dropTarget.getBoundingClientRect().top+dropTarget.clientHeight/2?'after':'before');};
    d.addEventListener('pointerdown',e=>{suppressMediaClickUntil=0;const n=e.target.closest('[data-cms-block]');if(movingId||e.button!==0||e.pointerType==='touch'||!n||e.target.closest('button,video,audio')||!record.patches.some(p=>p.id===n.dataset.cmsBlock&&isMedia(p)))return;pointerDrag={id:n.dataset.cmsBlock,x:e.clientX,y:e.clientY,pointer:e.pointerId,active:false};overlay.hidden=true;e.preventDefault();d.documentElement.setPointerCapture(e.pointerId);},true);
    d.addEventListener('pointermove',e=>{if(!pointerDrag)return;if(!pointerDrag.active&&Math.hypot(e.clientX-pointerDrag.x,e.clientY-pointerDrag.y)<6)return;pointerDrag.active=true;draggingId=pointerDrag.id;overlay.hidden=true;markDrop(d.elementFromPoint(e.clientX,e.clientY),e.clientY);if(e.clientY<60)w.scrollBy(0,-16);else if(e.clientY>w.innerHeight-60)w.scrollBy(0,16);e.preventDefault();},true);
    d.addEventListener('pointerup',e=>{if(!pointerDrag)return;const drag=pointerDrag;pointerDrag=null;if(d.documentElement.hasPointerCapture(drag.pointer))d.documentElement.releasePointerCapture(drag.pointer);if(!drag.active){suppressMediaClickUntil=performance.now()+500;e.preventDefault();const img=mediaNode(drag.id)?.querySelector('img');if(img){selectTarget(img);editMedia(img);}return;}const target=d.elementFromPoint(e.clientX,e.clientY),r=target?.closest('[data-cms-block],p,h2,h3,figure,article,section')?.getBoundingClientRect();clearDrop();suppressMediaClickUntil=performance.now()+500;draggingId='';e.preventDefault();e.stopImmediatePropagation();moveMedia(drag.id,target,!!r&&e.clientY>r.top+r.height/2);},true);
    d.addEventListener('pointercancel',()=>{pointerDrag=null;draggingId='';clearDrop();},true);
    d.addEventListener('dragover',e=>{if(!draggingId)return;e.preventDefault();e.dataTransfer.dropEffect='move';clearDrop();dropTarget=e.target.closest('[data-cms-block],p,h2,h3,figure,article,section');if(dropTarget)dropTarget.setAttribute('data-media-drop',e.clientY>dropTarget.getBoundingClientRect().top+dropTarget.clientHeight/2?'after':'before');if(e.clientY<70)w.scrollBy(0,-18);else if(e.clientY>w.innerHeight-70)w.scrollBy(0,18);},true);
    d.addEventListener('drop',e=>{if(!draggingId)return;e.preventDefault();e.stopImmediatePropagation();const target=dropTarget||e.target,after=target.getAttribute('data-media-drop')==='after';clearDrop();moveMedia(draggingId,target,after);},true);
    d.addEventListener('dragend',()=>{draggingId='';clearDrop();},true);
    d.addEventListener('keydown',e=>{if(e.key==='Escape'){if(pointerDrag&&d.documentElement.hasPointerCapture(pointerDrag.pointer))d.documentElement.releasePointerCapture(pointerDrag.pointer);pointerDrag=null;movingId=draggingId='';clearDrop();selectTarget(null);ctx.status('已取消移动。');}},true);
    const dragStyle=d.createElement('style');dragStyle.textContent='[data-media-drop="before"]{box-shadow:0 -4px 0 #ba783d!important}[data-media-drop="after"]{box-shadow:0 4px 0 #ba783d!important}[data-cms-block][draggable="true"]{cursor:grab}';d.head.append(dragStyle);
    d.addEventListener('click',e=>{
     if(performance.now()<suppressMediaClickUntil){e.preventDefault();e.stopImmediatePropagation();return;}
     if(e.target.closest('[data-editor-ui]'))return;
     if(movingId){e.preventDefault();e.stopImmediatePropagation();const r=e.target.getBoundingClientRect();moveMedia(movingId,e.target,e.clientY>r.top+r.height/2);return;}
     if(e.target.closest('.cheney-gallery-toggle'))return;
     if(mode.value==='browse'){
      const a=e.target.closest('a');if(a){const u=new URL(a.href);if(u.origin!==location.origin){e.preventDefault();ctx.status('站外链接可在“查看公开页面”中打开。');return;}e.preventDefault();e.stopImmediatePropagation();if(u.hash&&u.pathname===w.location.pathname&&u.search===w.location.search)d.getElementById(decodeURIComponent(u.hash.slice(1)))?.scrollIntoView();else openPage(helpers.keyOf(u,null),u.hash);}else if(safe(e.target)&&!e.target.closest('button,summary,details,video,audio')){e.preventDefault();e.stopImmediatePropagation();selectTarget(e.target);if(e.target.tagName==='IMG')editMedia(e.target);else editText(e.target);}return;
     }
     e.preventDefault();e.stopImmediatePropagation();finishInline();if(!safe(e.target))return;selectTarget(e.target);if(e.target.tagName==='IMG'||['VIDEO','AUDIO'].includes(e.target.tagName))editMedia(e.target);else editText(e.target);
    },true);
    d.addEventListener('dblclick',e=>{if(!safe(e.target)||e.target.closest('a'))return;e.preventDefault();e.stopImmediatePropagation();if(closeInspector()!==false)inlineText(e.target);},true);
    d.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
    frame.dataset.editorReady=key;if(!selected&&inspector.hidden)add('text');if(queued){d.getElementById(decodeURIComponent(queued.replace(/^#/,'')))?.scrollIntoView();queued=null;}else if(currentSection&&key==='index.html')d.getElementById(currentSection)?.scrollIntoView();
   }catch(e){ctx.status('页面编辑尚未就绪，请重新选择页面。'+e.message,true);}
  }
  frame.onload=attach;const timer=setInterval(()=>{if(!frame.isConnected){clearInterval(timer);resize.disconnect();return;}attach();},250);
  function size(){const available=Math.max(240,frameWrap.clientWidth-16),width=device.value==='mobile'?Math.min(390,available):available;frame.style.width=width+'px';frame.style.maxWidth='100%';frame.style.zoom='';frame.style.height=Math.max(640,innerHeight*.76)+'px';}
  const resize=new ResizeObserver(size);resize.observe(frameWrap);device.onchange=()=>{finishInline();size();};
  window.CHENEY_VISUAL_EDITOR.beforeLeave=async()=>{if(!frame.isConnected)return true;finishInline();if(window.CHENEY_BATCH_UPLOAD?.busy){ctx.status('请等待当前上传完成。',true);return false;}if(pending||clean)return true;return await persist(false);};
  await openPage(ctx.scope?.path||'index.html');selectTarget(null);size();
 }
 window.CHENEY_VISUAL_EDITOR={mount};
})();
