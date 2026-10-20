/* Sequential uploads avoid conflicting repository writes. */
(() => {
 'use strict';let active=0;
 const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 function mount(host,options){
  const box=make('section');box.className='admin-batch';const label=make('label');label.className='batch-drop';const mark=make('span','＋');mark.className='batch-drop-mark';
  const title=make('strong',options.label||'批量上传'),hint=make('span','点击选择，或将多张照片与视频拖到这里'),input=make('input');input.type='file';input.multiple=true;input.accept=options.accept;input.setAttribute('aria-label',options.label||'批量上传');label.append(mark,title,hint,input);
  const message=make('p','可混合选择图片与视频。上传完成后，在下方整理说明与顺序，再发布到网站。'),progress=make('progress'),list=make('ol'),retry=make('button','重试失败文件');retry.type='button';retry.hidden=true;progress.hidden=true;message.setAttribute('role','status');message.setAttribute('aria-live','polite');progress.setAttribute('aria-label','批量上传完成进度');box.append(label,message,progress,list,retry);host.append(box);
  let jobs=[],running=false;
  const dispose=job=>{if(job.preview){URL.revokeObjectURL(job.preview);job.preview='';}};
  const observer=new MutationObserver(()=>{if(!box.isConnected){jobs.forEach(dispose);observer.disconnect();}});observer.observe(document.body,{childList:true,subtree:true});
  const paint=()=>{list.replaceChildren();for(const j of jobs){const li=make('li');li.dataset.state=j.state;if(j.preview){const img=make('img');img.src=j.preview;img.alt='';li.append(img);}else li.append(make('span',j.file.type.startsWith('video/')?'视频':'文件'));const copy=make('div');copy.append(make('strong',j.file.name),make('small',(j.file.size/1024/1024).toFixed(1)+' MB · '+({waiting:'等待上传',running:'正在上传',done:'已加入影像',failed:'失败：'+j.error})[j.state]));li.append(copy);list.append(li);}};
  async function run(batch){
   if(running||!batch.length)return;if(active){message.textContent='另一个上传正在进行，请等待完成后再选择文件。';input.value='';return;}const remaining=options.remaining?.()??Infinity;if(batch.length>remaining){message.textContent='本次选择 '+batch.length+' 个文件，但当前只剩 '+remaining+' 个位置。请减少选择或先移除旧素材。';return;}
   running=true;active++;input.disabled=true;label.setAttribute('aria-busy','true');retry.hidden=true;progress.hidden=false;progress.max=batch.length;progress.value=0;options.onBusy?.(true);let succeeded=0;
   try{for(let i=0;i<batch.length;i++){const job=batch[i];job.state='running';job.error='';message.textContent='正在上传 '+(i+1)+' / '+batch.length+'：'+job.file.name;paint();try{const result=await options.upload(job.file);await options.onItem(result,job.file);job.state='done';succeeded++;}catch(e){job.state='failed';job.error=e.message||'上传未完成';}progress.value=i+1;paint();}const failed=batch.length-succeeded;message.textContent='本次完成：'+succeeded+' 个成功'+(failed?'，'+failed+' 个失败，可单独重试。':'。'+(options.doneNote||'请保存并发布内容。'));options.onComplete?.({succeeded,failed});
   }finally{running=false;active--;input.disabled=false;input.value='';label.setAttribute('aria-busy','false');retry.hidden=!jobs.some(x=>x.state==='failed');options.onBusy?.(false);}
  }
  function acceptFiles(files){if(running)return;files=Array.from(files);if(!files.length)return;const remaining=options.remaining?.()??Infinity;if(files.length>remaining){message.textContent='当前最多还能添加 '+remaining+' 个文件，请重新选择。';input.value='';return;}jobs.filter(x=>x.state!=='failed').forEach(dispose);jobs=jobs.filter(x=>x.state==='failed').concat(files.map(file=>({file,state:'waiting',preview:file.type.startsWith('image/')?URL.createObjectURL(file):''})));paint();run(jobs.filter(x=>x.state==='waiting'));}
  input.onchange=()=>acceptFiles(input.files||[]);label.addEventListener('dragover',e=>{e.preventDefault();if(!running)label.classList.add('is-dragging');});label.addEventListener('dragleave',()=>label.classList.remove('is-dragging'));label.addEventListener('drop',e=>{e.preventDefault();label.classList.remove('is-dragging');acceptFiles(e.dataTransfer.files);});retry.onclick=()=>run(jobs.filter(x=>x.state==='failed'));
  return {input,get busy(){return running;}};
 }
 window.CHENEY_BATCH_UPLOAD={mount,async protect(job){if(active)throw new Error('请等待当前上传完成。');active++;try{return await job();}finally{active--;}},get busy(){return active>0;}};
})();