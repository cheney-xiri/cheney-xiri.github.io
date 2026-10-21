(() => {
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const btn=(text,run)=>{const b=el('button',text);b.type='button';b.onclick=run;return b;};
 function mount(host,options){
  const tools=el('div',undefined,'album-tools'),count=el('strong'),selected=new Set(),list=el('div',undefined,'journey-media-list album-grid'),empty=el('p','还没有影像。可在上方一次选择多张照片和视频。','album-empty');let filter='*';
  const visible=item=>filter==='*'||(item.place||'')===filter;
  const selectAll=btn('全选',()=>{const all=items.filter(visible).every(x=>selected.has(x));selected.clear();if(!all)items.filter(visible).forEach(i=>selected.add(i));draw();}),remove=btn('移除所选',()=>{if(!selected.size)return;if(!confirm('从本次影像中移除选中的 '+selected.size+' 项？素材库中的原文件会保留。'))return;items=items.filter(x=>!selected.has(x));selected.clear();options.onChange?.();draw();});remove.className='danger';tools.append(count,selectAll,remove);host.append(tools,empty,list);let items=(options.items||[]).map(x=>({...x}));
  function changed(){options.onChange?.();}
  function input(row,label,key,value,type='text'){const wrap=el('label',label),field=el('input');field.type=type;field.value=value||'';field.name='media-'+key;field.oninput=()=>{row[key]=field.value;changed();};wrap.append(field);return wrap;}
  function draw(){
   list.querySelectorAll('video').forEach(v=>v.pause());list.replaceChildren();const showing=items.filter(visible);empty.hidden=!!showing.length;count.textContent=showing.filter(x=>x.type!=='video').length+' 张照片 · '+showing.filter(x=>x.type==='video').length+' 段视频'+(selected.size?' · 已选 '+selected.size+' 项':'');selectAll.disabled=!showing.length;remove.disabled=!selected.size;
   items.forEach((item,index)=>{if(!visible(item))return;const card=el('article',undefined,'journey-photo journey-media-item album-card');card.dataset.id=item.id||'';card.dataset.type=item.type;card.dataset.url=item.url||item.src||'';card.classList.toggle('is-selected',selected.has(item));
    const head=el('div',undefined,'album-card-head'),label=el('label'),check=el('input');check.type='checkbox';check.checked=selected.has(item);check.setAttribute('aria-label','选择第 '+(index+1)+' 项影像');check.onchange=()=>{if(check.checked)selected.add(item);else selected.delete(item);count.textContent=items.length+' 项影像 · 已选 '+selected.size+' 项';remove.disabled=!selected.size;card.classList.toggle('is-selected',check.checked);};label.append(check,document.createTextNode(String(index+1).padStart(2,'0')+' · '+(item.type==='video'?'视频':'照片')));head.append(label);card.append(head);
    const preview=el(item.type==='video'?'video':'img');preview.src=item.url||item.src||'';if(item.type==='video'){preview.controls=true;preview.preload='none';preview.playsInline=true;if(item.poster)preview.poster=item.poster;}else{preview.alt=item.caption||'影像预览';preview.loading='lazy';}card.append(preview,input(item,'影像说明','caption',item.caption));
    if(options.places){const label=el('label','所属地点'),select=el('select');select.setAttribute('aria-label','所属地点');for(const place of [...new Set(['',...options.places(),item.place||''])]){const o=el('option',place||'沿途风景 · 不限定地点');o.value=place;select.append(o);}select.value=item.place||'';select.onchange=()=>{item.place=select.value;changed();if(filter!=='*')draw();};label.append(select);card.append(label);}
    const details=el('details'),summary=el('summary','日期与更多设置');details.append(summary,input(item,'拍摄日期（选填）','date',item.date,'date'));
    if(item.type==='video'){
     const poster=input(item,'视频封面地址（选填）','poster',item.poster);poster.querySelector('input').addEventListener('input',e=>preview.poster=e.target.value);details.append(poster);
     if(options.uploadImage){const cover=el('label','上传视频封面'),file=el('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';cover.append(file);details.append(cover);file.onchange=async()=>{if(!file.files[0])return;file.disabled=true;options.onBusy?.(true);try{const r=await window.CHENEY_BATCH_UPLOAD.protect(()=>options.uploadImage(file.files[0]));item.poster=r.url;poster.querySelector('input').value=r.url;preview.poster=r.url;changed();}catch(e){options.status?.(e.message,true);}finally{file.disabled=false;options.onBusy?.(false);}};}
    }
    const previous=items.findLastIndex((x,i)=>i<index&&visible(x)),next=items.findIndex((x,i)=>i>index&&visible(x));
    card.append(details);const actions=el('div',undefined,'site-tools'),up=btn('上移',()=>{[items[previous],items[index]]=[items[index],items[previous]];changed();draw();}),down=btn('下移',()=>{[items[next],items[index]]=[items[index],items[next]];changed();draw();});up.disabled=previous<0;down.disabled=next<0;actions.append(up,down,btn('移除',()=>{items=items.filter(x=>x!==item);selected.delete(item);changed();draw();}));
    if(item.type!=='video'&&options.onCover)actions.append(btn('设为城市封面',()=>options.onCover(item)));card.append(actions);list.append(card);
   });
  }
  draw();return {add(item){items.push({...item});draw();},setFilter(value){filter=value;selected.clear();draw();},refresh:draw,renamePlace(from,to){items.forEach(x=>{if((x.place||'')===from)x.place=to;});if(filter===from)filter=to;draw();},get items(){return items.map((x,order)=>({...x,order}));}};
 }
 window.CHENEY_MEDIA_GALLERY={mount};
})();
