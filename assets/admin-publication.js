(() => {
 'use strict';if(!window.CHENEY_GITHUB_CMS)return;
 const app=document.querySelector('#admin-app'),anchor=document.querySelector('#app-status');if(!app||!anchor)return;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const box=el('section');box.className='publication-status';box.hidden=true;box.setAttribute('aria-live','polite');
 const copy=el('div'),heading=el('strong','发布与同步'),text=el('p'),hint=el('small'),actions=el('div'),check=el('button','检查当前网站'),front=el('a','查看当前网站 ↗'),deploy=el('a','查看发布记录 ↗');actions.className='site-tools';check.type='button';front.target=deploy.target='_blank';front.rel=deploy.rel='noopener noreferrer';front.href='/';deploy.href='https://github.com/'+window.CHENEY_GITHUB_CMS.repo+'/actions';copy.append(heading,text,hint);actions.append(check,front,deploy);box.append(copy,actions);anchor.after(box);
 let target,epoch=0,timer,attempts=0,checking=false;
 const now=()=>new Date().toLocaleTimeString('zh-CN');
 async function poll(){
  if(!target||app.hidden||checking)return;checking=true;const version=epoch;clearTimeout(timer);check.disabled=true;
  try{
   // Source availability is not proof that the current host has deployed it.
   const response=await fetch('/assets/publication.json?check='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw new Error();const marker=await response.json();if(version!==epoch)return;
   const actual=target.kind==='source'?marker.sourceHashes?.[target.path]:marker.snapshotHash;
   const ready=actual===target.hash;box.dataset.state=ready?'ready':'waiting';
   text.textContent=ready?'当前网址已部署这次修改，可以打开前台查看。':'内容已保存，当前网址尚未确认部署完成。';
   hint.textContent='核对于 '+now()+' · '+location.hostname+'。其他入口各自部署，可能稍晚更新。';
   front.href='/?v='+Date.now();attempts++;
   if(!ready&&attempts<40)timer=setTimeout(poll,10000);
   else if(!ready)hint.textContent+=' 自动检查已暂停，可点“检查当前网站”重试。';
  }catch{
   if(version===epoch){box.dataset.state='unknown';text.textContent='暂时无法核对部署进度，不能确认前台是否已更新。';hint.textContent='请稍后重试；已保存的内容不会因此撤回。';if(++attempts<40)timer=setTimeout(poll,15000);}
  }finally{checking=false;check.disabled=false;if(version!==epoch&&!app.hidden)poll();}
 }
 function track(next){if(!next?.hash)return;target=next;epoch++;attempts=0;clearTimeout(timer);box.hidden=app.hidden;box.dataset.state='waiting';text.textContent='正在核对当前网址的部署结果…';poll();}
 check.onclick=()=>{attempts=0;poll();};window.addEventListener('cheney-publication',e=>track(e.detail));
 new MutationObserver(async()=>{if(app.hidden){epoch++;target=null;clearTimeout(timer);box.hidden=true;}else try{const r=await window.CHENEY_GITHUB_CMS.request('/api/admin/publication');if(!app.hidden)track(r.target);}catch{}}).observe(app,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!app.hidden)poll();});
})();
