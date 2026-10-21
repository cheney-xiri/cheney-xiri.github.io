(() => {
 'use strict';if(!window.CHENEY_GITHUB_CMS)return;
 const app=document.querySelector('#admin-app'),anchor=document.querySelector('#app-status');if(!app||!anchor)return;
 const box=document.createElement('section');box.className='publication-status';box.hidden=true;box.setAttribute('aria-live','polite');
 const text=document.createElement('span'),check=document.createElement('button'),front=document.createElement('a');check.type='button';check.textContent='检查同步';front.textContent='查看前台 ↗';front.target='_blank';front.rel='noopener';box.append(text,check,front);anchor.after(box);
 let target,epoch=0,timer,attempts=0,checking=false;
 async function poll(){if(!target||app.hidden||checking)return;checking=true;const version=epoch;clearTimeout(timer);check.disabled=true;try{
  const fastPath=target.kind==='source'?target.path:'data/online-content.json';
  const fast=(target.kind!=='source'||target.path==='assets/travels.json')&&await fetch('https://raw.githubusercontent.com/cheney-xiri/cheney-xiri.github.io/main/'+fastPath+'?fresh='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).catch(()=>null);
  const hash=fast&&Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(fast))))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(version!==epoch)return;
  if(hash===target.hash){box.dataset.state='ready';text.textContent='网站内容已同步，前台刷新即可查看。';front.href='/?v='+Date.now();return;}
  const response=await fetch('/assets/publication.json?check='+Date.now(),{cache:'no-store'});if(!response.ok)throw new Error();const marker=await response.json();if(version!==epoch)return;
  const actual=target.kind==='source'?marker.sourceHashes?.[target.path]:marker.snapshotHash;
  const ready=actual===target.hash;box.dataset.state=ready?'ready':'waiting';text.textContent=ready?'网站内容已同步，前台刷新即可查看。':'内容已保存，网站正在更新。部署完成前，前台仍可能显示上一版。';front.href='/?v='+Date.now();attempts++;
  if(!ready&&attempts<40)timer=setTimeout(poll,10000);
 }catch{if(version===epoch){text.textContent='内容已保存，暂时无法确认网站更新进度，可稍后再次检查。';if(++attempts<40)timer=setTimeout(poll,15000);}}finally{checking=false;check.disabled=false;if(version!==epoch&&!app.hidden)poll();}}
 function track(next){target=next;epoch++;attempts=0;clearTimeout(timer);box.hidden=app.hidden;box.dataset.state='waiting';text.textContent='正在核对网站更新进度…';poll();}
 check.onclick=()=>{attempts=0;poll();};window.addEventListener('cheney-publication',e=>track(e.detail));
 new MutationObserver(async()=>{if(app.hidden){epoch++;target=null;clearTimeout(timer);box.hidden=true;}else try{const r=await window.CHENEY_GITHUB_CMS.request('/api/admin/publication');if(!app.hidden)track(r.target);}catch{}}).observe(app,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!app.hidden)poll();});
})();
