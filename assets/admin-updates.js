(() => {
 'use strict';
 const current=document.querySelector('meta[name="cheney-admin-version"]')?.content;
 const nav=document.querySelector('.admin-bar nav');if(!nav)return;
 const badge=document.createElement('span');badge.className='admin-version-badge';badge.textContent=current?'后台 · 当前版本':'本机后台';nav.prepend(badge);
 const panel=document.createElement('section');panel.className='admin-update-notice';panel.hidden=true;panel.setAttribute('aria-live','polite');
 const message=document.createElement('span'),action=document.createElement('button'),check=document.createElement('button');action.type=check.type='button';check.textContent='检查后台新版';check.hidden=!current;check.className='admin-update-check';nav.append(check);panel.append(message,action);document.querySelector('.admin-bar').after(panel);
 let latest=null,checking=false,lastCheck=0;
 async function inspect(manual=false){if(checking||!current)return;checking=true;check.disabled=true;lastCheck=Date.now();try{
  const r=await fetch('/assets/admin-version.json?check='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error();const data=await r.json();if(!/^[a-f0-9]{16}$/.test(data.version||''))throw new Error();latest=data;
  const old=data.version!==current;badge.textContent=old?'后台 · 有新版':'后台 · 已是新版';badge.dataset.state=old?'update':'ready';panel.hidden=!old;
  if(old){message.textContent='后台已有新版。保存当前修改后，载入新版即可看到最新入口和功能。';action.textContent='载入新版';}
  else if(manual){panel.hidden=false;message.textContent='当前后台已是线上最新版本。';action.textContent='关闭提示';}
 }catch{if(manual){panel.hidden=false;message.textContent='暂时无法检查版本，当前编辑可以继续。';action.textContent='关闭提示';}}finally{checking=false;check.disabled=false;}}
 action.onclick=()=>{if(!latest||latest.version===current){panel.hidden=true;return;}if(window.CHENEY_ADMIN_STATE&&!window.CHENEY_ADMIN_STATE.canLeave())return;const url=new URL(location.href);url.searchParams.set('v',latest.version);location.assign(url.href);};
 check.onclick=()=>inspect(true);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastCheck>60000)inspect();});setInterval(()=>{if(!document.hidden)inspect();},300000);inspect();
})();
