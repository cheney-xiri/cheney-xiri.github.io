/* Sequential uploads append to a cumulative list; earlier batches remain intact. */
(() => {
 'use strict';let active=0;
 const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 function mount(host,options){
  const box=make('section');box.className='admin-batch';const label=make('label');label.className='batch-drop';const mark=make('span','＋');mark.className='batch-drop-mark';
  const title=make('strong',options.label||'批量上传'),hint=make('span','可多次选择，每次继续追加，已有文件不会被替换'),input=make('input');input.type='file';input.multiple=true;input.accept=options.accept;input.setAttribute('aria-label',options.label||'批量上传');label.append(mark,title,hint,input);
  const total=make('p'),message=make('p','可连续分批上传图片与视频，全部保留在下方清单。'),progress=make('progress'),list=make('ol'),retry=make('button','重试失败文件');total.className='batch-total';total.setAttribute('role','status');retry.type='button';retry.hidden=true;progress.hidden=true;message.setAttribute('role','status');message.setAttribute('aria-live','polite');progress.setAttribute('aria-label','本批上传完成进度');box.append(label,total,message,progress,list,retry);host.append(box);
  let jobs=(options.existing||[]).map(item=>({id:crypto.randomUUID(),file:{name:item.name||item.url?.split('/').pop()||'已添加的影像',size:item.bytes||0,type:item.type==='video'?'video/mp4':'image/jpeg'},item,state:'done',preview:item.type==='image'?item.url:'',localPreview:false})),running=false;
  const dispose=job=>{if(job.localPreview&&job.preview)URL.revokeObjectURL(job.preview);job.preview='';};
  const observer=new MutationObserver(()=>{if(!box.isConnected){jobs.forEach(dispose);observer.disconnect();}});observer.observe(document.body,{childList:true,subtree:true});
  function paint(){
   list.replaceChildren();const done=jobs.filter(j=>j.state==='done'),images=done.filter(j=>j.file.type.startsWith('image/')).length,videos=done.filter(j=>j.file.type.startsWith('video/')).length,failed=jobs.filter(j=>j.state==='failed').length;
   total.textContent='累计保留 '+done.length+' 项 · '+images+' 张图片 · '+videos+' 段视频'+(failed?' · '+failed+' 项待重试':'');total.dataset.count=done.length;
   for(const j of jobs){
    const li=make('li');li.dataset.state=j.state;li.dataset.job=j.id;
    if(j.preview){const img=make('img');img.src=j.preview;img.alt='';img.loading='lazy';li.append(img);}else li.append(make('span',j.file.type.startsWith('video/')?'视频':'文件'));
    const copy=make('div');copy.append(make('strong',j.file.name),make('small',(j.file.size?(j.file.size/1024/1024).toFixed(1)+' MB · ':'')+({waiting:'等待上传',running:'正在上传',done:options.doneLabel||'已加入影像',failed:'失败：'+j.error})[j.state]));li.append(copy);
    if(j.state==='done'&&options.onRemove){const remove=make('button','移除');remove.type='button';remove.disabled=running||active>0;remove.setAttribute('aria-label','移除 '+j.file.name);remove.onclick=async()=>{
     if(running||active)return;if(!confirm('从当前页面移除“'+j.file.name+'”？素材库中的原文件会保留。'))return;remove.disabled=true;
     try{await options.onRemove(j.item||j.result);jobs=jobs.filter(x=>x!==j);dispose(j);paint();message.textContent='已从当前页移除这一项，其余文件仍然保留。请保存或发布修改。';}catch(e){message.textContent=e.message||'移除未完成';remove.disabled=false;}
    };li.append(remove);}list.append(li);
   }
   retry.hidden=!jobs.some(x=>x.state==='failed');retry.disabled=running;
  }
  async function run(batch){
   if(running||!batch.length)return;if(active){message.textContent='另一个上传正在进行，请等待完成后再选择文件。';input.value='';return;}
   const remaining=options.remaining?.()??Infinity;if(batch.length>remaining){message.textContent='本批 '+batch.length+' 个文件，但当前只剩 '+remaining+' 个位置。已有文件会保留，请减少本批数量。';return;}
   running=true;active++;input.disabled=true;label.setAttribute('aria-busy','true');progress.hidden=false;progress.max=batch.length;progress.value=0;options.onBusy?.(true);let succeeded=0;
   try{
    for(let i=0;i<batch.length;i++){
     const job=batch[i];job.state='running';job.error='';message.textContent='正在上传本批 '+(i+1)+' / '+batch.length+'：'+job.file.name;paint();
     try{job.result||=await options.upload(job.file);job.item=await options.onItem(job.result,job.file)||job.result;job.state='done';succeeded++;}catch(e){job.state='failed';job.error=e.message||'上传未完成';}
     progress.value=i+1;paint();
    }
    const failed=batch.length-succeeded;message.textContent='本批完成：'+succeeded+' 个成功'+(failed?'，'+failed+' 个失败，可单独重试。':'。'+(options.doneNote||'已有批次全部保留，请保存或发布内容。'));
    options.onComplete?.({succeeded,failed,total:jobs.filter(j=>j.state==='done').length});
   }finally{running=false;active--;input.disabled=false;input.value='';label.setAttribute('aria-busy','false');options.onBusy?.(false);paint();}
  }
  function acceptFiles(files){
   if(running)return;if(active){message.textContent='另一个上传正在进行，请等待完成。已有文件不会改变。';input.value='';return;}
   files=Array.from(files);if(!files.length)return;const remaining=options.remaining?.()??Infinity;
   if(files.length>remaining){message.textContent='当前最多还能添加 '+remaining+' 个文件。已有清单不变，请减少本批数量。';input.value='';return;}
   const batch=files.map(file=>({id:crypto.randomUUID(),file,state:'waiting',preview:file.type.startsWith('image/')?URL.createObjectURL(file):'',localPreview:file.type.startsWith('image/')}));jobs.push(...batch);paint();run(batch);
  }
  input.onchange=()=>acceptFiles(input.files||[]);label.addEventListener('dragover',e=>{e.preventDefault();if(!running)label.classList.add('is-dragging');});label.addEventListener('dragleave',()=>label.classList.remove('is-dragging'));label.addEventListener('drop',e=>{e.preventDefault();label.classList.remove('is-dragging');acceptFiles(e.dataTransfer.files);});retry.onclick=()=>run(jobs.filter(x=>x.state==='failed'));
  paint();return {input,get busy(){return running;},get count(){return jobs.filter(j=>j.state==='done').length;}};
 }
 window.CHENEY_BATCH_UPLOAD={mount,async protect(job){if(active)throw new Error('请等待当前上传完成。');active++;try{return await job();}finally{active--;}},get busy(){return active>0;}};
})();
