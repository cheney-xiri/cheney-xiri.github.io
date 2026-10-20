(() => {
 'use strict';const $=(s,r=document)=>r.querySelector(s);
 async function mount(ctx){
  const {api,status,field,node,button,uploadImage,setDirty,canLeave}=ctx,workspace=$('#workspace');workspace.className='workspace full';
  const result=await api('/api/admin/source?path=assets%2Ftravels.json');if(ctx.isCurrent&&!ctx.isCurrent())return;let data=result.data,sha=result.sha,committed=structuredClone(result.data),cityIndex=0,visitIndex=0;
  if(!Array.isArray(data.cities)||!data.cities.length)throw new Error('暂无城市资料，请先在专题资料中添加城市。');
  const panel=node('section',undefined,'full-panel travel-admin'),toolbar=node('div',undefined,'site-tools'),citySelect=node('select'),visitSelect=node('select'),editor=node('div');citySelect.setAttribute('aria-label','选择足迹城市');visitSelect.setAttribute('aria-label','选择到访记录');
  data.cities.forEach((c,i)=>{const o=node('option',c.name);o.value=i;citySelect.append(o);});toolbar.append(citySelect,visitSelect);panel.append(toolbar,editor);workspace.replaceChildren(panel);
  const mediaUrl=value=>{if(!value)return '';if(value.startsWith('assets/'))return '/'+value;return value;};
  function draw(){
   toolbar.querySelector('.album-save-top')?.remove();const city=data.cities[cityIndex];city.visits??=[];visitSelect.replaceChildren();city.visits.forEach((v,i)=>{const o=node('option',v.month+' · 第 '+(i+1)+' 次到访');o.value=i;visitSelect.append(o);});visitSelect.value=visitIndex;editor.replaceChildren();const visit=city.visits[visitIndex];
   const form=node('form',undefined,'editor-form'),cityBlock=node('details',undefined,'album-city-settings'),cityGrid=node('div',undefined,'field-grid'),summary=node('summary','城市封面与基本资料');cityBlock.append(summary,cityGrid);form.append(cityBlock);editor.append(form);
   field(cityGrid,'城市名称','city-name',city.name);field(cityGrid,'省份 / 地区','city-province',city.province);field(cityGrid,'封面说明','city-cover',city.cover);
   const cover=field(cityGrid,'城市封面地址','city-image',city.image||'/assets/travel-covers/'+city.id+'.jpg'),coverImg=node('img',undefined,'album-city-cover');coverImg.src=mediaUrl(cover.value);coverImg.alt=city.name+' 城市封面';cityGrid.append(coverImg);cover.oninput=()=>coverImg.src=mediaUrl(cover.value);
   const coverLabel=node('label','上传城市封面'),coverFile=node('input');coverFile.type='file';coverFile.accept='image/png,image/jpeg,image/webp';coverLabel.append(coverFile);cityGrid.append(coverLabel);
   const addVisit=button('＋ 添加一次到访',()=>{if(!canLeave())return;data=structuredClone(committed);const selectedCity=data.cities[cityIndex];selectedCity.visits.push({month:'',places:[],photos:[],videos:[],flavors:[],note:''});visitIndex=selectedCity.visits.length-1;draw();setDirty(true);});toolbar.querySelector('.add-visit')?.remove();addVisit.className='add-visit';toolbar.append(addVisit);
   if(!visit){form.append(node('p','选择或添加一次到访，再整理这次旅程的图片与视频。','album-empty'));return;}
   const intro=node('div',undefined,'album-intro');intro.append(node('small','足迹 · '+city.name),node('h2',visit.month?visit.month+' 的旅途影像':'新到访记录'),node('p','按一次到访整理照片与视频。上传、填写说明、调整顺序，最后统一发布。'));form.append(intro);
   const fields=node('div',undefined,'field-grid'),monthRow=node('div',undefined,'field-grid');form.append(monthRow);const month=field(monthRow,'到访月份','month',visit.month,'month');month.required=true;
   field(fields,'所到之处（每行一处，可用「｜」补充说明）','places',(visit.places||[]).map(x=>x.name+(x.note?'｜'+x.note:'')).join('\n'),'textarea');field(fields,'风物滋味（每行一项）','flavors',(visit.flavors||[]).join('\n'),'textarea');field(fields,'行中手记','note',visit.note,'textarea',true);
   const uploadBox=node('div'),galleryBox=node('div'),writing=node('details',undefined,'album-city-settings');writing.append(node('summary','所到之处、风物与手记'),fields);form.append(uploadBox,galleryBox,writing);
   const items=[...(visit.photos||[]).map((x,i)=>({...x,type:'image',order:x.order??i})),...(visit.videos||[]).map((x,i)=>({...x,type:'video',order:x.order??(visit.photos||[]).length+i}))].sort((a,b)=>a.order-b.order).map(x=>({...x,url:mediaUrl(x.src||x.url)}));
   const busy=value=>{citySelect.disabled=visitSelect.disabled=save.disabled=addVisit.disabled=coverFile.disabled=value;toolbar.querySelector('.album-save-top')?.toggleAttribute('disabled',value);};
   const gallery=window.CHENEY_MEDIA_GALLERY.mount(galleryBox,{items,onChange:()=>setDirty(true),uploadImage:file=>uploadImage(file,'/api/admin/media'),status,onBusy:busy,onCover:item=>{cover.value=item.url||item.src;coverImg.src=cover.value;cityBlock.open=true;setDirty(true);status('已选为城市封面，发布后应用。');}});
   const save=button('发布本城内容',async()=>{if(!form.reportValidity())return;busy(true);try{
    const values=Object.fromEntries(new FormData(form));city.name=values['city-name'];city.province=values['city-province'];city.cover=values['city-cover'];city.image=values['city-image'];visit.month=values.month;visit.note=values.note;visit.flavors=values.flavors.split('\n').map(x=>x.trim()).filter(Boolean);
    visit.places=values.places.split('\n').map(x=>x.trim()).filter(Boolean).map(line=>{const [name,...note]=line.split('｜');const old=(visit.places||[]).find(x=>x.name===name.trim());return {...old,name:name.trim(),note:note.join('｜').trim()};});
    const saved=gallery.items.map(({type,url,...x})=>({...x,src:url}));visit.photos=saved.filter((x,i)=>gallery.items[i].type==='image');visit.videos=saved.filter((x,i)=>gallery.items[i].type==='video');
    const updated=await api('/api/admin/source',{method:'POST',body:{path:'assets/travels.json',data,sha}});sha=updated.sha;committed=structuredClone(data);setDirty(false);status('本城文字、封面与影像已提交发布，可在上方查看同步结果。');citySelect.options[cityIndex].textContent=city.name;visitSelect.options[visitIndex].textContent=visit.month+' · 第 '+(visitIndex+1)+' 次到访';
   }catch(e){status(e.message,true);}finally{busy(false);}},'primary');save.classList.add('album-publish');form.append(save);const topSave=button('保存并更新网站',()=>save.click(),'primary');toolbar.querySelector('.album-save-top')?.remove();topSave.classList.add('album-save-top');toolbar.append(topSave);
   coverFile.onchange=async()=>{if(!coverFile.files[0])return;busy(true);try{const r=await window.CHENEY_BATCH_UPLOAD.protect(()=>uploadImage(coverFile.files[0],'/api/admin/media'));cover.value=r.url;coverImg.src=r.url;setDirty(true);}catch(e){status(e.message,true);}finally{busy(false);}};
   window.CHENEY_BATCH_UPLOAD.mount(uploadBox,{label:'批量添加旅途照片与视频',accept:'image/png,image/jpeg,image/webp,video/mp4,video/webm',remaining:()=>60-gallery.items.length,
    upload:async file=>{if(/^image\/(png|jpeg|webp)$/.test(file.type))return uploadImage(file,'/api/admin/media');if(!['video/mp4','video/webm'].includes(file.type))throw new Error('请选择 JPG / PNG / WebP 图片或 MP4 / WebM 视频');if(file.size>20*1024*1024)throw new Error('视频超过 20 MB，请压缩后重试');return api('/api/admin/media',{method:'POST',headers:{'Content-Type':file.type},body:file});},
    onItem:(r,file)=>{gallery.add({...r,url:r.url,type:file.type.startsWith('video/')?'video':'image',caption:file.name.replace(/\.[^.]+$/,'')});setDirty(true);},onBusy:busy});
   form.oninput=()=>setDirty(true);form.onsubmit=e=>e.preventDefault();
  }
  citySelect.onchange=()=>{if(!canLeave()){citySelect.value=cityIndex;return;}data=structuredClone(committed);cityIndex=Number(citySelect.value);visitIndex=0;draw();setDirty(false);};visitSelect.onchange=()=>{if(!canLeave()){visitSelect.value=visitIndex;return;}data=structuredClone(committed);visitIndex=Number(visitSelect.value);draw();setDirty(false);};draw();setDirty(false);
 }
 window.CHENEY_TRAVELS_ADMIN={mount};
})();
