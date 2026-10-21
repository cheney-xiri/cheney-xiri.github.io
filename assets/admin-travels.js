(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s);
 async function mount(ctx){
  const {api,status,field,node,button,uploadImage,setDirty,canLeave}=ctx,workspace=$('#workspace');
  workspace.className='workspace full';
  const result=await api('/api/admin/source?path=assets%2Ftravels.json');
  if(ctx.isCurrent&&!ctx.isCurrent())return;
  let data=result.data,sha=result.sha,cityIndex=0,visitIndex=0,collectCurrent=()=>true,publishCurrent=()=>{},busyNow=false;
  if(!Array.isArray(data.cities))throw new Error('城市资料格式不正确，请重新读取。');
  const fallback='/assets/ink/scroll-river-v1.webp';
  const mediaUrl=value=>{if(!value)return '';try{const u=new URL(value,location.origin+'/');return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  const cityImage=c=>mediaUrl(c.image)||'/assets/travel-covers/'+encodeURIComponent(c.id)+'.jpg';
  const visitMedia=v=>[...(v.photos||[]).map((x,i)=>({...x,type:'image',order:x.order??i})),...(v.videos||[]).map((x,i)=>({...x,type:'video',order:x.order??(v.photos||[]).length+i})),...(v.places||[]).flatMap(p=>[...(p.photos||[]).map(x=>({...x,type:'image',place:p.name})),...(p.videos||[]).map(x=>({...x,type:'video',place:p.name}))])].sort((a,b)=>(a.order||0)-(b.order||0)).map(x=>({...x,url:mediaUrl(x.src||x.url)}));
  const panel=node('section',undefined,'full-panel travel-admin'),head=node('div',undefined,'travel-admin-head'),title=node('div'),cityTotal=node('p',undefined,'field-help');
  title.append(node('small','与主页中的足迹对应'),node('h2','走过的城，留下的风景'),cityTotal);
  const addCity=button('＋ 新增足迹城市',()=>cityDialog(),'primary');
  head.append(title,addCity);
  const overview=node('details',undefined,'travel-city-overview');overview.open=true;
  const summary=node('summary','我的足迹城市'),search=node('input');search.type='search';search.placeholder='搜索城市或省份';search.setAttribute('aria-label','搜索足迹城市');
  const cards=node('div',undefined,'travel-admin-cities');overview.append(summary,search,cards);
  const toolbar=node('div',undefined,'site-tools travel-editor-tools'),citySelect=node('select'),visitSelect=node('select'),editor=node('div');
  citySelect.setAttribute('aria-label','选择足迹城市');visitSelect.setAttribute('aria-label','选择到访记录');
  const addVisit=button('＋ 添加一次到访',()=>visitDialog()),topSave=button('保存并更新网站',()=>publishCurrent(),'primary'),preview=node('a','预览此城 ↗');
  preview.target='_blank';preview.rel='noopener noreferrer';toolbar.append(citySelect,visitSelect,addVisit,topSave,preview);
  panel.append(head,overview,toolbar,editor);workspace.replaceChildren(panel);
  function renderCities(){
   citySelect.replaceChildren();cards.replaceChildren();
   cityTotal.textContent=data.cities.length+' 座城市 · '+data.cities.reduce((n,c)=>n+(c.visits||[]).length,0)+' 次到访。封面、所到之处、沿途风景和手记在这里一起整理。';
   data.cities.forEach((city,i)=>{
    const option=node('option',city.name);option.value=i;citySelect.append(option);
    if(search.value&&!((city.name||'')+(city.province||'')).includes(search.value.trim()))return;
    const card=button('',()=>selectCity(i),'travel-admin-city');card.setAttribute('aria-pressed',String(i===cityIndex));
    const image=node('img');image.src=cityImage(city);image.alt='';image.loading='lazy';image.onerror=()=>{image.onerror=null;image.src=fallback;};
    const copy=node('span',undefined,'travel-admin-city-copy'),count=(city.visits||[]).reduce((n,v)=>n+visitMedia(v).length,0);
    copy.append(node('small',city.province||'足迹'),node('strong',city.name),node('span',(city.visits||[]).length+' 次到访 · '+count+' 项影像'));
    card.append(image,copy);cards.append(card);
   });
   citySelect.value=cityIndex;
   if(!cards.children.length)cards.append(node('p',data.cities.length?'没有找到这个城市。':'从“新增足迹城市”开始记录第一段旅程。','album-empty'));
  }
  function dialog(titleText,build){
   const dialog=node('dialog',undefined,'travel-edit-dialog'),form=node('form',undefined,'editor-form'),heading=node('div',undefined,'dialog-head');
   const close=button('关闭',()=>dialog.close());heading.append(node('h2',titleText),close);dialog.append(heading,form);document.body.append(dialog);
   dialog.addEventListener('close',()=>dialog.remove());build(form,dialog);dialog.showModal();
  }
  function cityDialog(){
   if(busyNow||!collectCurrent())return;
   dialog('新增足迹城市',(form,dialog)=>{
    const name=field(form,'城市名称','new-city-name',''),province=field(form,'省份 / 地区','new-city-province',''),month=field(form,'首次到访月份','new-city-month','','month');
    name.required=month.required=true;name.maxLength=province.maxLength=40;
    const caption=field(form,'城市印象 / 地标（选填）','new-city-cover',''),error=node('p',undefined,'field-help');
    const submit=node('button','创建城市并补充内容','primary');submit.type='submit';form.append(error,submit);
    form.onsubmit=e=>{e.preventDefault();const cityName=name.value.trim();if(!cityName){error.textContent='请填写城市名称。';return;}if(data.cities.some(c=>c.name===cityName&&(c.province||'')===province.value.trim())){error.textContent='这座城市已经在足迹中，可以直接选择它添加新的到访。';return;}
     data.cities.push({id:'city-'+crypto.randomUUID().slice(0,8),name:cityName,province:province.value.trim(),cover:caption.value.trim(),image:fallback,visits:[{month:month.value,places:[],photos:[],videos:[],flavors:[],note:''}]});
     cityIndex=data.cities.length-1;visitIndex=0;setDirty(true);dialog.close();renderCities();draw();overview.open=false;status('城市已加入当前编辑，补充后点击“保存并更新网站”。');
    };
   });
  }
  function visitDialog(){
   if(busyNow||!data.cities[cityIndex]||!collectCurrent())return;
   dialog('添加一次到访',(form,dialog)=>{
    const month=field(form,'到访月份','new-visit-month','','month');month.required=true;
    const submit=node('button','添加到访','primary');submit.type='submit';form.append(submit);
    form.onsubmit=e=>{e.preventDefault();const city=data.cities[cityIndex];city.visits??=[];city.visits.push({month:month.value,places:[],photos:[],videos:[],flavors:[],note:''});visitIndex=city.visits.length-1;setDirty(true);dialog.close();renderCities();draw();};
   });
  }
  function selectCity(i){if(busyNow||!collectCurrent()){citySelect.value=cityIndex;return;}cityIndex=i;visitIndex=0;renderCities();draw();overview.open=false;}
  function draw(){
   const city=data.cities[cityIndex];editor.replaceChildren();visitSelect.replaceChildren();collectCurrent=()=>true;publishCurrent=()=>{};
   toolbar.hidden=!city;if(!city)return;
   city.visits??=[];city.visits.forEach((v,i)=>{const o=node('option',(v.month||'待填日期')+' · 第 '+(i+1)+' 次到访');o.value=i;visitSelect.append(o);});visitSelect.value=visitIndex;
   preview.href='/travels/city.html?city='+encodeURIComponent(city.id)+'&v='+Date.now();
   const visit=city.visits[visitIndex];
   if(!visit){editor.append(node('p','这座城市还没有到访记录，点击“添加一次到访”继续。','album-empty'));topSave.disabled=true;return;}
   topSave.disabled=false;
   let places=(visit.places||[]).map(x=>typeof x==='string'?{name:x,note:''}:{...x}),activePlace='*';
   const form=node('form',undefined,'editor-form'),intro=node('div',undefined,'album-intro');
   intro.append(node('small','足迹 · '+(city.province||'')+' · '+city.name),node('h2',city.name+' · '+visit.month),node('p','本页与前台的到访时间、所到之处、沿途风景、行中手记、风物滋味逐一对应。切换城市或到访时，未发布的编辑会在本页保留。'));form.append(intro);editor.append(form);
   const cityBlock=node('details',undefined,'album-city-settings'),cityGrid=node('div',undefined,'field-grid');cityBlock.append(node('summary','城市封面与基本资料'),cityGrid);form.append(cityBlock);
   const name=field(cityGrid,'城市名称','city-name',city.name);name.required=true;
   field(cityGrid,'省份 / 地区','city-province',city.province);field(cityGrid,'城市印象 / 封面说明','city-cover',city.cover);
   const cover=field(cityGrid,'城市封面地址','city-image',city.image||cityImage(city)),coverImg=node('img',undefined,'album-city-cover');coverImg.src=mediaUrl(cover.value);coverImg.alt=city.name+' 城市封面';coverImg.onerror=()=>{coverImg.onerror=null;coverImg.src=fallback;};cityGrid.append(coverImg);cover.oninput=()=>coverImg.src=mediaUrl(cover.value);
   const coverLabel=node('label','上传城市封面'),coverFile=node('input');coverFile.type='file';coverFile.accept='image/png,image/jpeg,image/webp';coverLabel.append(coverFile);cityGrid.append(coverLabel);
   const dateRow=node('div',undefined,'field-grid'),month=field(dateRow,'到访月份','month',visit.month,'month');month.required=true;form.append(dateRow);
   const placeSection=node('section',undefined,'travel-place-editor'),placeHead=node('div',undefined,'site-tools'),placeCards=node('div',undefined,'travel-place-cards'),placeFilters=node('div',undefined,'travel-place-filters');
   const addPlace=button('＋ 添加所到之处',()=>placeDialog());placeHead.append(node('h3','所到之处 · 沿途风景'),addPlace);
   placeSection.append(placeHead,node('p','每个地点可以分别收纳照片与视频。没有具体地点的片段，归入“沿途风景”。','field-help'),placeCards,placeFilters);form.append(placeSection);
   const targetRow=node('div',undefined,'site-tools'),targetLabel=node('label','这批影像归属'),uploadTarget=node('select');uploadTarget.setAttribute('aria-label','这批影像归属');targetLabel.append(uploadTarget);targetRow.append(targetLabel);
   const uploadBox=node('div'),galleryBox=node('div');form.append(targetRow,uploadBox,galleryBox);
   const writing=node('details',undefined,'album-city-settings'),fields=node('div',undefined,'field-grid');writing.append(node('summary','行中手记与风物滋味'),fields);field(fields,'风物滋味（每行一项）','flavors',(visit.flavors||[]).join('\n'),'textarea');field(fields,'行中手记','note',visit.note,'textarea',true);form.append(writing);
   const busy=value=>{busyNow=value;for(const control of [citySelect,visitSelect,save,addVisit,addCity,topSave,coverFile,addPlace,uploadTarget])control.disabled=value;placeCards.querySelectorAll('button').forEach(b=>b.disabled=value);placeFilters.querySelectorAll('button').forEach(b=>b.disabled=value);};
   const gallery=window.CHENEY_MEDIA_GALLERY.mount(galleryBox,{items:visitMedia(visit),places:()=>places.map(p=>p.name),onChange:()=>{setDirty(true);renderPlaces(false);},uploadImage:file=>uploadImage(file,'/api/admin/media'),status,onBusy:busy,onCover:item=>{cover.value=item.url||item.src;coverImg.src=cover.value;cityBlock.open=true;setDirty(true);status('已选为城市封面，保存更新后应用。');}});
   function renderPlaces(refresh=true){
    const target=uploadTarget.value;uploadTarget.replaceChildren();for(const p of ['',...places.map(p=>p.name)]){const o=node('option',p||'沿途风景 · 不限定地点');o.value=p;uploadTarget.append(o);}uploadTarget.value=places.some(p=>p.name===target)?target:'';
    placeCards.replaceChildren();placeFilters.replaceChildren();
    const all=gallery.items;for(const p of places){const card=node('article',undefined,'travel-place-card'),copy=node('div');copy.append(node('strong',p.name),node('small',all.filter(x=>x.place===p.name).length+' 项影像'),node('p',p.note||'可以补充地点印象与沿途风景。'));const actions=node('div',undefined,'site-tools');actions.append(button('查看影像',()=>choosePlace(p.name)),button('编辑地点',()=>placeDialog(p)));card.append(copy,actions);placeCards.append(card);}
    if(!places.length)placeCards.append(node('p','先添加街巷、公园、景点等具体地点，也可以直接上传沿途风景。','album-empty'));
    for(const [value,label]of [['*','全部影像'],['','沿途风景'],...places.map(p=>[p.name,p.name])]){const b=button(label+' · '+all.filter(x=>value==='*'||(x.place||'')===value).length,()=>choosePlace(value));b.setAttribute('aria-pressed',String(activePlace===value));placeFilters.append(b);}
    if(refresh)gallery.refresh();
   }
   function choosePlace(value){activePlace=value;uploadTarget.value=value==='*'?'':value;gallery.setFilter(value);renderPlaces(false);}
   uploadTarget.onchange=()=>choosePlace(uploadTarget.value);
   function placeDialog(existing){
    dialog(existing?'编辑所到之处':'添加所到之处',(placeForm,dialog)=>{
     const placeName=field(placeForm,'地点名称','place-name',existing?.name||''),note=field(placeForm,'地点印象（选填）','place-note',existing?.note||'','textarea');placeName.required=true;placeName.maxLength=80;const error=node('p',undefined,'field-help'),submit=node('button',existing?'保存地点':'添加地点','primary');submit.type='submit';placeForm.append(error,submit);
     if(existing)placeForm.append(button('移除这个地点',()=>{if(!confirm('移除地点后，它的图片与视频会归入沿途风景，是否继续？'))return;gallery.renamePlace(existing.name,'');places=places.filter(p=>p!==existing);activePlace='';setDirty(true);dialog.close();choosePlace('');}));
     placeForm.onsubmit=e=>{e.preventDefault();const name=placeName.value.trim();if(!name){error.textContent='请填写地点名称。';return;}if(places.some(p=>p!==existing&&p.name===name)){error.textContent='这个地点已经存在，可以直接选择它添加影像。';return;}
      if(existing){gallery.renamePlace(existing.name,name);existing.name=name;existing.note=note.value.trim();}else places.push({name,note:note.value.trim()});
      setDirty(true);dialog.close();activePlace=name;renderPlaces();choosePlace(name);
     };
    });
   }
   collectCurrent=(validate=true)=>{
    if(validate&&!name.value.trim())cityBlock.open=true;
    if(validate&&!form.reportValidity())return false;
    const values=Object.fromEntries(new FormData(form));city.name=values['city-name'].trim();city.province=values['city-province'];city.cover=values['city-cover'];city.image=values['city-image'];visit.month=values.month;visit.note=values.note;visit.flavors=values.flavors.split('\n').map(x=>x.trim()).filter(Boolean);
    visit.places=places.map(({photos,videos,...p})=>p);
    const saved=gallery.items;visit.photos=saved.filter(x=>x.type==='image').map(({type,url,...x})=>({...x,src:url}));visit.videos=saved.filter(x=>x.type==='video').map(({type,url,...x})=>({...x,src:url}));
    return true;
   };
   const save=button('发布足迹内容',async()=>{
    if(busyNow||!collectCurrent())return;busy(true);try{
     const updated=await api('/api/admin/source',{method:'POST',body:{path:'assets/travels.json',data,sha}});sha=updated.sha;setDirty(false);renderCities();status('足迹内容已提交发布，可在上方查看同步结果。');
    }catch(e){status(e.message,true);}finally{busy(false);}
   },'primary');save.classList.add('album-publish');form.append(save);publishCurrent=()=>save.click();
   coverFile.onchange=async()=>{if(!coverFile.files[0])return;busy(true);try{const r=await window.CHENEY_BATCH_UPLOAD.protect(()=>uploadImage(coverFile.files[0],'/api/admin/media'));cover.value=r.url;coverImg.src=r.url;setDirty(true);}catch(e){status(e.message,true);}finally{busy(false);}};
   window.CHENEY_BATCH_UPLOAD.mount(uploadBox,{label:'批量添加旅途照片与视频',accept:'image/png,image/jpeg,image/webp,video/mp4,video/webm',remaining:()=>60-gallery.items.length,
    upload:async file=>{if(/^image\/(png|jpeg|webp)$/.test(file.type))return uploadImage(file,'/api/admin/media');if(!['video/mp4','video/webm'].includes(file.type))throw new Error('请选择 JPG / PNG / WebP 图片或 MP4 / WebM 视频');if(file.size>20*1024*1024)throw new Error('视频超过 20 MB，请压缩后重试');return api('/api/admin/media',{method:'POST',headers:{'Content-Type':file.type},body:file});},
    onItem:(r,file)=>{gallery.add({...r,url:r.url,type:file.type.startsWith('video/')?'video':'image',caption:file.name.replace(/\.[^.]+$/,''),place:uploadTarget.value});setDirty(true);renderPlaces(false);},onBusy:busy,onComplete:()=>{collectCurrent(false);renderCities();}});
   renderPlaces();form.oninput=()=>setDirty(true);form.onsubmit=e=>e.preventDefault();
  }
  citySelect.onchange=()=>selectCity(Number(citySelect.value));visitSelect.onchange=()=>{if(busyNow||!collectCurrent()){visitSelect.value=visitIndex;return;}visitIndex=Number(visitSelect.value);renderCities();draw();};
  search.oninput=renderCities;renderCities();draw();setDirty(false);
  const reload=button('重新读取已发布内容',()=>{if(canLeave())mount(ctx).catch(e=>status(e.message,true));});panel.append(reload);
 }
 window.CHENEY_TRAVELS_ADMIN={mount};
})();
