/* A chapter's editable copy and media, collected into one form. */
(() => {
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
 const field=(box,label,value,kind='text')=>{const l=el('label',label),i=el(kind==='textarea'?'textarea':'input');if(kind!=='textarea')i.type=kind;i.value=value||'';i.setAttribute('aria-label',label);l.append(i);box.append(l);return i;};
 const pathOf=n=>{if(n.id)return '#'+CSS.escape(n.id);const parts=[];while(n&&n.tagName!=='HTML'){if(n.id){parts.unshift('#'+CSS.escape(n.id));break;}const siblings=[...n.parentElement.children].filter(x=>x.tagName===n.tagName);parts.unshift(n.tagName.toLowerCase()+':nth-of-type('+(siblings.indexOf(n)+1)+')');n=n.parentElement;}return parts.join(' > ');};
 function mount(host,ctx){
  const intro=el('p','正在读取本章内容…','field-help'),tools=el('div',undefined,'site-tools'),search=field(tools,'查找本页内容','','search'),type=el('select');type.setAttribute('aria-label','编辑内容类型');for(const[k,label]of Object.entries({all:'文字、图片与音视频',text:'文字',image:'图片',video:'视频与音频',link:'链接'})){const o=el('option',label);o.value=k;type.append(o);}tools.append(type,button('重新读取本页',()=>refresh()));
  const list=el('div',undefined,'chapter-field-list'),paging=el('div',undefined,'site-tools'),uploads=el('section',undefined,'chapter-upload-section');uploads.append(el('h3','给本页添加图片与视频'),el('p','可一次选择多个文件；上传完成后还需发布此页。图片会压缩处理，视频单个不超过 20 MB。','field-help'));host.append(intro,tools,list,paging,uploads);let items=[],page=0;
  const safe=n=>n&&!n.closest('script,style,head,textarea,input,select,iframe,[data-cms-block]');
  function refresh(){
   const root=ctx.root();if(!root){intro.textContent='本页内容尚未就绪，请稍后重新读取。';return;}items=[];
   const nodes=[root,...root.querySelectorAll('h1,h2,h3,h4,h5,p,blockquote,figcaption,dt,dd,li,span,a,strong,em,small,img,video,audio')];
   for(const n of nodes){if(!safe(n))continue;const selector=pathOf(n),tag=n.tagName;
    if(tag==='IMG'){items.push({type:'image',selector,original:n.getAttribute('src')||'',value:n.getAttribute('src')||'',alt:n.alt||'',fit:n.style.objectFit||'cover',node:n,label:n.alt||'图片'});continue;}
    if(['VIDEO','AUDIO'].includes(tag)){items.push({type:'video',selector,original:n.getAttribute('src')||n.querySelector('source')?.getAttribute('src')||'',value:n.getAttribute('src')||n.querySelector('source')?.getAttribute('src')||'',poster:n.poster||'',node:n,label:tag==='VIDEO'?'视频':'音频'});continue;}
    const texts=[...n.childNodes].filter(x=>x.nodeType===3);texts.forEach((text,textIndex)=>{if(!text.nodeValue.trim()||text.nodeValue.trim().length<2)return;items.push({type:'text',selector,textIndex,original:text.nodeValue,value:text.nodeValue,node:n,label:({H1:'主标题',H2:'章节标题',H3:'小标题',H4:'条目标题',P:'段落',FIGCAPTION:'影像说明'})[tag]||'文字'});});
    if(tag==='A'&&/^(https?:|\/|[a-zA-Z0-9_.-]+\/)/.test(n.getAttribute('href')||''))items.push({type:'link',selector,original:n.getAttribute('href'),value:n.getAttribute('href'),node:n,label:n.textContent.trim().slice(0,60)||'链接'});
   }
   intro.textContent='本页共 '+items.length+' 项可编辑内容。直接在下方修改，不必逐个点击前台元素。';page=0;draw();
  }
  const apply=(item,values)=>{try{if(item.type!=='text'){const u=new URL(values.value,ctx.frame().location.href);if(!['http:','https:'].includes(u.protocol))throw new Error('请输入有效的媒体或网页地址');values.value=u.href;if(values.poster){const poster=new URL(values.poster,ctx.frame().location.href);if(!['http:','https:'].includes(poster.protocol))throw new Error('视频封面地址不正确');values.poster=poster.href;}}Object.assign(item,values);const {node,label,...patch}=item;ctx.put(patch);}catch(e){ctx.status(e.message,true);}};
  function draw(){
   const q=search.value.toLowerCase(),filtered=items.filter(x=>(type.value==='all'||x.type===type.value)&&(x.label+' '+x.value+' '+x.alt).toLowerCase().includes(q));page=Math.min(page,Math.max(0,Math.ceil(filtered.length/20)-1));list.replaceChildren();paging.replaceChildren();
   filtered.slice(page*20,(page+1)*20).forEach((item,offset)=>{const card=el('section',undefined,'chapter-field-card');card.append(el('small',String(page*20+offset+1).padStart(2,'0')+' / '+item.label));
    if(item.type==='text'){const value=field(card,'文字内容',item.value,'textarea');value.onchange=()=>apply(item,{value:value.value});value.oninput=()=>ctx.setDirty(true);}
    else{if(item.type==='image'){const img=el('img');img.src=new URL(item.value,ctx.frame().location.href).href;img.alt=item.alt;img.loading='lazy';card.append(img);}const value=field(card,item.type==='link'?'跳转地址':'媒体地址',item.value);const alt=item.type==='image'?field(card,'图片说明',item.alt):null,poster=item.type==='video'?field(card,'视频封面地址',item.poster):null;const update=()=>apply(item,{value:value.value,...(alt?{alt:alt.value}:{}),...(poster?{poster:poster.value}:{})});value.onchange=update;if(alt)alt.onchange=update;if(poster)poster.onchange=update;
     if(item.type!=='link')card.append(button('从素材库选择或批量上传',()=>ctx.pick((url,media)=>{if(item.type==='image'&&media.type!=='image'||item.type==='video'&&media.type==='image'){ctx.status('请选用与当前区域相符的素材。',true);return;}value.value=url;update();})));}
    list.append(card);
   });if(!filtered.length)list.append(el('p','没有匹配内容。可以切换页面或清空筛选。','field-help'));const prev=button('上一组',()=>{page--;draw();}),next=button('下一组',()=>{page++;draw();});prev.disabled=page===0;next.disabled=(page+1)*20>=filtered.length;paging.append(prev,el('span',filtered.length+' 项 · 第 '+(page+1)+' / '+Math.max(1,Math.ceil(filtered.length/20))+' 组'),next);
  }
  search.oninput=type.onchange=()=>{page=0;draw();};
  window.CHENEY_BATCH_UPLOAD.mount(uploads,{label:'批量添加本页图片与视频',accept:'image/png,image/jpeg,image/webp,video/mp4,video/webm',remaining:()=>Math.max(0,Math.min(60,500-ctx.record().patches.length)),upload:async file=>{if(file.type.startsWith('image/'))return ctx.uploadImage(file);if(!['video/mp4','video/webm'].includes(file.type))throw new Error('请选择常见图片或 MP4 / WebM 视频');if(file.size>20*1024*1024)throw new Error('视频超过 20 MB');return ctx.api('/api/admin/media',{method:'POST',headers:{'Content-Type':file.type},body:file});},onItem:(result,file)=>{const root=ctx.root();if(!root)throw new Error('页面尚未就绪，请重新读取');const anchor=ctx.anchor(root);ctx.put({id:crypto.randomUUID(),type:'block',selector:pathOf(anchor),format:file.type.startsWith('video/')?'video':'image',title:'',caption:'',alt:file.name,value:result.url,position:'beforeend'},{deferPreview:true});},onBusy:busy=>ctx.onBusy?.(busy),onComplete:({succeeded,failed})=>{ctx.preview();ctx.status(succeeded+' 项影像已加入预览'+(failed?'，'+failed+' 项失败，可重试。':'，请发布此页。'),!!failed);}});
  return {refresh,reset(){items=[];list.replaceChildren();intro.textContent='正在读取本页内容…';}};
 }
 window.CHENEY_PAGE_FIELDS={mount};
})();
