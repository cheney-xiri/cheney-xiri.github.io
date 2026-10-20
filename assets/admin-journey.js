(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s);
 async function mount(ctx){
  const {api,status,field,node,button,upload,setDirty,canLeave}=ctx,workspace=$('#workspace');workspace.className='workspace full';
  const panel=node('section',undefined,'full-panel'),select=node('select');select.setAttribute('aria-label','选择行旅阶段');for(const[k,v]of Object.entries({junior:'初中',senior:'高中',university:'大学'})){const o=node('option',v);o.value=k;select.append(o);}const editor=node('div',undefined,'journey-editor');panel.append(select,editor);workspace.replaceChildren(panel);let stage='junior';
  async function load(){
   const value=(await api('/api/journey?stage='+stage)).content||{};editor.replaceChildren();const form=node('form',undefined,'editor-form'),grid=node('div',undefined,'field-grid');form.append(grid);editor.append(form);
   for(const[k,label]of Object.entries({schoolIntro:'学校印象',story:'这一段经历',growth:'成长与收获',reflection:'回望'}))field(grid,label,k,value[k],'textarea',true);
   const moments=node('section',undefined,'field-wide'),media=node('section',undefined,'field-wide'),list=node('div',undefined,'journey-media-list'),uploadBox=node('div');grid.append(moments,media);moments.append(node('h3','时间节点'));media.append(node('h3','阶段照片与视频'),node('p','图片可批量选择，视频支持 MP4 / WebM（每个不超过 20 MB）。每个阶段可保留共 60 项影像，上传后请发布。','field-help'),list,uploadBox);
   function addMoment(m={}){if(moments.querySelectorAll('.journey-moment').length>=12){status('每个阶段最多 12 个时间节点。',true);return;}const row=node('div',undefined,'journey-moment');field(row,'日期','moment-date',m.date);field(row,'标题','moment-title',m.title);field(row,'内容','moment-text',m.text,'textarea');row.append(button('移除节点',()=>{row.remove();setDirty(true);}));moments.append(row);}
   (value.moments||[]).forEach(addMoment);moments.append(button('＋ 添加节点',()=>{addMoment();setDirty(true);}));
   function addMedia(item,type){
    const row=node('div',undefined,'journey-photo journey-media-item'),preview=node(type==='video'?'video':'img');row.dataset.id=item.id;row.dataset.type=type;row.dataset.url=item.url||'';
    preview.src=item.url||(ctx.meta.storage==='github'?'https://raw.githubusercontent.com/'+window.CHENEY_GITHUB_CMS.repo+'/main/assets/cms-uploads/'+item.id:'/api/journey/media/'+item.id);
    if(type==='video'){preview.controls=true;preview.preload='metadata';preview.playsInline=true;if(item.poster)preview.poster=item.poster;}else{preview.alt=item.caption||'阶段照片';preview.loading='lazy';}
    row.append(preview,node('small',type==='video'?'视频':'照片'));field(row,'说明','media-caption',item.caption);field(row,'日期','media-date',item.date);if(type==='video')field(row,'视频封面地址（可留空）','media-poster',item.poster);
    const actions=node('div',undefined,'site-tools');actions.append(button('上移',()=>{const prev=row.previousElementSibling;if(prev){prev.before(row);setDirty(true);}}),button('下移',()=>{const next=row.nextElementSibling;if(next){next.after(row);setDirty(true);}}),button('移除'+(type==='video'?'视频':'照片'),()=>{preview.pause?.();row.remove();setDirty(true);}));row.append(actions);list.append(row);
   }
   const saved=[...(value.photos||[]).map((x,i)=>({...x,type:'image',order:x.order??i})),...(value.videos||[]).map((x,i)=>({...x,type:'video',order:x.order??(value.photos||[]).length+i}))].sort((a,b)=>a.order-b.order);saved.forEach(x=>addMedia(x,x.type));
   const save=button('发布行旅内容',async()=>{save.disabled=true;try{
    const d=Object.fromEntries(new FormData(form)),items=[...list.querySelectorAll('.journey-media-item')].map((row,order)=>({id:row.dataset.id,url:row.dataset.url,caption:$('[name=media-caption]',row).value,date:$('[name=media-date]',row).value,order,...(row.dataset.type==='video'?{poster:$('[name=media-poster]',row).value}:{})}));
    const content={schoolIntro:d.schoolIntro,story:d.story,growth:d.growth,reflection:d.reflection,moments:[...moments.querySelectorAll('.journey-moment')].map(row=>({date:$('[name=moment-date]',row).value,title:$('[name=moment-title]',row).value,text:$('[name=moment-text]',row).value})),photos:items.filter(x=>/\.(png|jpg|webp)$/i.test(x.id)),videos:items.filter(x=>/\.(mp4|webm)$/i.test(x.id))};
    await api('/api/journey?stage='+stage,{method:'POST',body:content});setDirty(false);status(ctx.meta.storage==='github'?'行旅图文与视频已提交发布，部署完成后电脑和手机均可查看。':'行旅图文与视频已发布。');
   }catch(e){status(e.message,true);}finally{save.disabled=false;}},'primary');form.append(save);
   window.CHENEY_BATCH_UPLOAD.mount(uploadBox,{label:'批量添加照片与视频',accept:'image/png,image/jpeg,image/webp,video/mp4,video/webm',remaining:()=>60-list.children.length,
    upload:async file=>{if(/^image\/(png|jpeg|webp)$/.test(file.type))return upload(file,'/api/journey/photo?stage='+stage);if(!['video/mp4','video/webm'].includes(file.type))throw new Error('请选择 JPG / PNG / WebP 图片或 MP4 / WebM 视频');if(file.size>20*1024*1024)throw new Error('视频超过 20 MB，请压缩后重试');return api('/api/admin/media',{method:'POST',headers:{'Content-Type':file.type},body:file});},
    onItem:(result,file)=>{addMedia(result.photo||result,file.type.startsWith('video/')?'video':'image');setDirty(true);},onBusy:busy=>{select.disabled=save.disabled=busy;if(busy)setDirty(true);},onComplete:({failed,succeeded})=>status('本次 '+succeeded+' 个文件上传成功'+(failed?'，'+failed+' 个失败，可重试。':'，请点击“发布行旅内容”。'),!!failed)});
   form.addEventListener('input',()=>setDirty(true));form.onsubmit=e=>e.preventDefault();setDirty(false);
  }
  select.onchange=async()=>{if(!canLeave()){select.value=stage;return;}stage=select.value;try{await load();}catch(e){status(e.message,true);}};await load();
 }
 window.CHENEY_JOURNEY_ADMIN={mount};
})();
