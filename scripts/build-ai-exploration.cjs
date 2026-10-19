'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const version='20261019-ai-01';
const data=JSON.parse(fs.readFileSync(path.join(root,'data/ai-exploration.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const access={web:'网页体验',api:'API 开发',weights:'开放权重'};
const categories=new Map(data.categories.map(c=>[c.id,c]));
const ids=new Set();
for(const m of data.models){
 if(ids.has(m.id)||!categories.has(m.category)||m.topics.some(t=>!categories.has(t))||m.access.some(a=>!access[a]))throw Error('Invalid model: '+m.id);
 ids.add(m.id);
 for(const key of ['url','source'])if(new URL(m[key]).protocol!=='https:')throw Error('HTTPS required: '+m.id);
}
const external='target="_blank" rel="noopener noreferrer"';
const arrow='<span aria-hidden="true">↗</span>';
const cards=data.models.map((m,i)=>{
 const cat=categories.get(m.category);
 return `<article class="ai-model" data-id="${m.id}" style="--model-color:${cat.color}">
 <button class="ai-model-open" type="button" data-open-model="${m.id}" aria-haspopup="dialog" aria-controls="model-dialog" aria-label="了解${esc(m.name)}">
  <span class="ai-model-top"><span class="ai-model-mark" aria-hidden="true">${esc(m.mark)}</span><span class="ai-model-category">${cat.code}</span><span class="ai-model-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span></span>
  <span class="ai-model-name">${esc(m.name)}</span><span class="ai-model-provider">${esc(m.provider)}</span>
  <span class="ai-model-summary">${esc(m.summary)}</span>
  <span class="ai-model-bottom"><span class="ai-access">${m.access.map(a=>`<span>${access[a]}</span>`).join('')}</span><span class="ai-model-read">了解 <span aria-hidden="true">↗</span></span></span>
 </button>
 <a class="ai-model-official" href="${esc(m.url)}" ${external} aria-label="打开${esc(m.name)}官方入口，新标签页">官方入口 ${arrow}</a>
 </article>`;
}).join('\n');
const filters=[{id:'all',name:'全部',count:data.models.length},...data.categories.map(c=>({...c,count:data.models.filter(m=>m.topics.includes(c.id)).length}))];
const html=`<!doctype html>
<html lang="zh-CN" data-ink-preserve="ai">
<head>
 <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <meta name="theme-color" content="#071217">
 <meta name="description" content="Cheney 的 AI 探索图谱：通用推理、编程、图像、视频、语音与音乐模型，按用途查找并直达官方入口。">
 <title>AI 探索 · Cheney</title>
 <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23071217'/%3E%3Cpath d='m7 23 9-15 9 15M11 18h10' fill='none' stroke='%238ee7db' stroke-width='2'/%3E%3C/svg%3E">
 <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
 <link rel="stylesheet" href="../assets/ai-exploration.css?v=${version}">
 <script src="../assets/ai-exploration.js?v=${version}" defer></script>
</head>
<body class="ai-page">
 <a class="ai-skip" href="#model-atlas">跳到模型图谱</a>
 <header class="ai-bar"><a class="ai-brand" href="../index.html#about">Cheney<span> / AI EXPLORATION</span></a><a class="ai-home" href="../index.html#about">返回主页 <span aria-hidden="true">↗</span></a></header>
 <main id="ai-main">
  <section class="ai-hero" aria-labelledby="ai-title">
   <div class="ai-hero-copy"><p class="ai-eyebrow"><span class="ai-live-dot" aria-hidden="true"></span>INTELLIGENCE / ATLAS</p>
    <h1 id="ai-title"><span>AI</span> 探索<span class="ai-title-period" aria-hidden="true">.</span></h1>
    <p class="ai-hero-lead">从语言到影像，从思考到创造。</p><p class="ai-hero-description">走近主流模型，找到适合此刻想法的工具。<br>按用途浏览，或从一个熟悉的名字开始。</p>
    <a class="ai-primary" href="#model-atlas">浏览模型图谱 <span aria-hidden="true">↓</span></a>
    <dl class="ai-hero-stats"><div><dt>模型系列</dt><dd>${String(data.models.length).padStart(2,'0')}<span> / MODELS</span></dd></div><div><dt>探索方向</dt><dd>05<span> / FIELDS</span></dd></div><div><dt>整理时间</dt><dd>2026<span> / 10.19</span></dd></div></dl>
   </div>
   <figure class="ai-network" aria-labelledby="network-caption"><div class="ai-network-frame" aria-hidden="true"><span>NEURAL FIELD / 01</span><span>INTERACTIVE VIEW</span></div><canvas id="ai-network-canvas" aria-hidden="true"></canvas><div class="ai-network-core" aria-hidden="true"><span>AI</span><small>CONNECT THE POSSIBILITIES</small></div><figcaption id="network-caption"><span>拖动旋转 · 探索智能的连接</span><button id="network-motion" type="button" aria-pressed="true">暂停旋转</button></figcaption></figure>
  </section>
  <nav class="ai-fields" aria-label="选择探索方向">${data.categories.map((c,i)=>`<button type="button" data-jump-category="${c.id}" style="--field-color:${c.color}"><span>0${i+1}</span><strong>${c.short}</strong><small>${c.code}</small><span class="ai-field-arrow" aria-hidden="true">↘</span></button>`).join('')}</nav>
  <section class="ai-atlas" id="model-atlas" aria-labelledby="atlas-title">
   <header class="ai-section-head"><div><p class="ai-eyebrow">01 / DISCOVER</p><h2 id="atlas-title">模型图谱<span aria-hidden="true"> /</span></h2></div><p>了解能力，也找到入口。</p></header>
   <div class="ai-tools"><div class="ai-search-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><label class="ai-sr-only" for="model-search">搜索模型、团队或用途</label><input id="model-search" type="search" placeholder="搜索模型、团队或用途…" autocomplete="off" spellcheck="false"><button type="button" id="clear-search" aria-label="清空搜索" hidden>×</button></div><div class="ai-access-filter"><label for="access-filter">体验方式</label><select id="access-filter"><option value="all">全部方式</option><option value="web">网页体验</option><option value="api">API 开发</option><option value="weights">开放权重</option></select></div></div>
   <div class="ai-filters" role="group" aria-label="按用途筛选">${filters.map(c=>`<button type="button" data-category="${c.id}" aria-pressed="${c.id==='all'}">${c.name}<span>${c.count}</span></button>`).join('')}</div>
   <div class="ai-results-line"><p id="model-results" role="status" aria-live="polite">共 ${data.models.length} 个模型系列</p><span id="category-description">文字、代码、影像与声音，在这里相遇。</span></div>
   <div class="ai-model-grid" id="model-grid">${cards}</div>
   <div class="ai-empty" id="model-empty" hidden><p>暂时没有找到匹配的模型</p><span>试试模型名、团队名，或切换体验方式。</span><button type="button" id="reset-filters">清空筛选</button></div>
   <div class="ai-more"><button class="ai-secondary" id="load-more" type="button" hidden>继续浏览 <span aria-hidden="true">↓</span></button><span id="model-progress"></span></div>
   <p class="ai-directory-note">按模型系列整理；部分系列的开放权重与网页功能对应不同版本。官方入口可能为搭载模型的产品、开发平台或模型资料库。</p>
  </section>
  <section class="ai-practice" aria-labelledby="practice-title"><header class="ai-section-head"><div><p class="ai-eyebrow">02 / CREATE</p><h2 id="practice-title">让想法，继续发生<span aria-hidden="true"> /</span></h2></div><p>模型之外，也回到自己的创作。</p></header><div class="ai-practice-grid">
   <a href="../index.html#works"><small>01 / WORDS</small><h3>写下一个故事</h3><p>从一句话，到一个属于自己的世界。</p><span>走进作品 ${arrow}</span></a>
   <a href="../works/sd-webui/index.html"><small>02 / IMAGE</small><h3>让文字有画面</h3><p>沿着提示词与参数，探索图像的可能。</p><span>文字成像 ${arrow}</span></a>
   <a href="../works/z-image/index.html"><small>03 / WORKFLOW</small><h3>连接创作的节点</h3><p>把生成、调整和输出串成自己的流程。</p><span>节点绘图 ${arrow}</span></a>
  </div></section>
 </main>
 <footer class="ai-footer"><span>© 2026 Cheney<span class="ai-footer-divider"> / </span>AI 探索</span><span>整理于 <time datetime="${data.updated}">${data.updated.replaceAll('-','.')}</time></span><a href="#ai-main">回到顶部 ↑</a></footer>
 <dialog class="ai-dialog" id="model-dialog" aria-labelledby="dialog-model-name" aria-describedby="dialog-model-summary"><div class="ai-dialog-scroll"><button class="ai-dialog-close" type="button" aria-label="关闭模型介绍" autofocus>×</button><p class="ai-eyebrow" id="dialog-model-category"></p><div class="ai-dialog-heading"><span id="dialog-model-mark" aria-hidden="true"></span><div><h2 id="dialog-model-name"></h2><p id="dialog-model-provider"></p></div></div><p id="dialog-model-summary"></p><p class="ai-dialog-series" id="dialog-model-series"></p><section><h3>可以从这些事情开始</h3><ul id="dialog-model-uses"></ul></section><section><h3>从哪里体验</h3><p id="dialog-model-start"></p><div class="ai-access" id="dialog-model-access"></div></section><div class="ai-dialog-links"><a class="ai-primary" id="dialog-model-url" href="https://chatgpt.com/" ${external}>打开官方入口 ${arrow}</a><a id="dialog-model-source" href="https://developers.openai.com/api/docs/models" ${external}>官方资料 ${arrow}</a></div><p class="ai-dialog-footnote">账号、可用地区与订阅功能，以所选官方产品为准。</p></div></dialog>
 <script type="application/json" id="ai-model-data">${JSON.stringify(data).replace(/</g,'\\u003c')}</script>
 <noscript><style>.ai-tools,.ai-filters,.ai-fields,.ai-model-read,#network-motion,.ai-more{display:none}.ai-model-open{pointer-events:none}.ai-network-core{opacity:1}</style><p class="ai-noscript">每项下方的“官方入口”可以直接打开；启用 JavaScript 后可搜索、筛选并阅读模型介绍。</p></noscript>
</body></html>`;
fs.writeFileSync(path.join(root,'about/ai.html'),html);
console.log(`Built AI exploration: ${data.models.length} model families, ${data.categories.length} fields.`);
