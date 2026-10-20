/* Read-only adapter for the free GitHub Pages preview. */
(() => {
  'use strict';
  window.CHENEY_STATIC_PREVIEW = true;
  const originalFetch = window.fetch.bind(window);
  let notes;
  const rawRoot='https://raw.githubusercontent.com/cheney-xiri/cheney-xiri.github.io/main/';
  const latestFile=path=>originalFetch(rawRoot+path+'?fresh='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(3500)}).then(r=>{if(!r.ok)throw new Error('not available');return r.json();}).catch(()=>null);
  const snapshot=latestFile('data/online-content.json').then(d=>d?.version===1&&Array.isArray(d.entries)?d:null);
  window.CHENEY_LATEST_SNAPSHOT=snapshot;
  window.CHENEY_PUBLIC_BASELINE=()=>originalFetch('/assets/content-baseline.json',{cache:'no-cache'}).then(r=>r.ok?r.json():[]).catch(()=>[]);
  window.fetch = (input, options = {}) => {
    const address = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    if(address.origin===location.origin&&address.pathname==='/assets/travels.json')return latestFile('assets/travels.json').then(data=>data?new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}}):originalFetch(input,options));
    if (address.origin !== location.origin || !address.pathname.startsWith('/api/')) return originalFetch(input, options);
    const method = String(options.method || input?.method || 'GET').toUpperCase();
    const json = (data, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }));
    if (method !== 'GET') return json({ error: '预览站暂未开放提交功能，你的输入没有发送或保存。' }, 503);
    if (address.pathname === '/api/content-state') return json({ state: {} });
    if (address.pathname === '/api/site-edits') return snapshot.then(data=>data?json({pages:data.pages||{}}):originalFetch('/assets/site-edits.json',{cache:'no-store'}));
    if (address.pathname === '/api/messages') return json({ messages: [], preview: true });
    if (address.pathname === '/api/journey' || address.pathname === '/api/anime-note') {
      notes ||= snapshot.then(data=>data||originalFetch('/assets/online-notes.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).catch(() => ({})));
      return notes.then(data => json({ content: address.pathname === '/api/journey' ? data.journey?.[address.searchParams.get('stage')] || null : data.animeNotes?.[address.searchParams.get('id')] || null }));
    }
    if (address.pathname === '/api/admin/session') return json({ authenticated: false, configured: false, canSetup: false });
    return json({ error: '此功能暂未在预览站开放。' }, 503);
  };
  document.addEventListener('DOMContentLoaded', () => {
    for (const form of document.querySelectorAll('#interaction-form, #anime-comment-form, #comment-form')) {
      const note = document.createElement('p');
      note.textContent = '当前为预览站，留言提交暂未开放。';
      note.style.cssText = 'font:inherit;line-height:1.8;margin:1em 0;opacity:.85';
      form.prepend(note);
      for (const button of form.querySelectorAll('[type="submit"]')) { button.disabled = true; button.textContent = '暂未开放'; }
      form.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
    }
  });
})();
