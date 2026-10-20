/* Files are sent in order so repository writes never race each other. */
(() => {
 'use strict';
 let active=0;
 const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 function mount(host,options){
  const box=make('section');box.className='admin-batch';const label=make('label',options.label||'批量上传'),input=make('input');input.type='file';input.multiple=true;input.accept=options.accept;input.setAttribute('aria-label',options.label||'批量上传');label.append(input);
  const message=make('p','可一次选择多个文件，按顺序上传。'),progress=make('progress'),list=make('ol'),retry=make('button','重试失败文件');retry.type='button';retry.hidden=true;progress.hidden=true;message.setAttribute('role','status');message.setAttribute('aria-live','polite');progress.setAttribute('aria-label','批量上传完成进度');box.append(label,message,progress,list,retry);host.append(box);
  let jobs=[],running=false;
  const paint=()=>{list.replaceChildren();for(const j of jobs){const li=make('li',j.file.name+' · '+({waiting:'等待上传',running:'正在上传',done:'已上传',failed:'失败：'+j.error})[j.state]);li.dataset.state=j.state;list.append(li);}};
  async function run(batch){
   if(running||!batch.length)return;
   const remaining=options.remaining?.()??Infinity;if(batch.length>remaining){message.textContent='本次选择 '+batch.length+' 个文件，但当前只剩 '+remaining+' 个位置。请减少选择或先移除旧素材。';return;}
   running=true;active++;input.disabled=true;retry.hidden=true;progress.hidden=false;progress.max=batch.length;progress.value=0;options.onBusy?.(true);let succeeded=0;
   try{for(let i=0;i<batch.length;i++){const job=batch[i];job.state='running';job.error='';message.textContent='正在上传 '+(i+1)+' / '+batch.length+'：'+job.file.name;paint();try{const result=await options.upload(job.file);await options.onItem(result,job.file);job.state='done';succeeded++;}catch(e){job.state='failed';job.error=e.message||'上传未完成';}progress.value=i+1;paint();}
   const failed=batch.length-succeeded;message.textContent='本次完成：'+succeeded+' 个成功'+(failed?'，'+failed+' 个失败，可单独重试。':'。'+(options.doneNote||'请保存并发布内容。'));options.onComplete?.({succeeded,failed});
   }finally{running=false;active--;input.disabled=false;input.value='';retry.hidden=!jobs.some(x=>x.state==='failed');options.onBusy?.(false);}
  }
  input.onchange=()=>{const files=Array.from(input.files||[]);if(!files.length)return;const remaining=options.remaining?.()??Infinity;if(files.length>remaining){message.textContent='当前最多还能添加 '+remaining+' 个文件，请重新选择。';input.value='';return;}jobs=jobs.filter(x=>x.state==='failed').concat(files.map(file=>({file,state:'waiting'})));paint();run(jobs.filter(x=>x.state==='waiting'));};
  retry.onclick=()=>run(jobs.filter(x=>x.state==='failed'));
  return {input,get busy(){return running;}};
 }
 window.CHENEY_BATCH_UPLOAD={mount,get busy(){return active>0;}};
})();
