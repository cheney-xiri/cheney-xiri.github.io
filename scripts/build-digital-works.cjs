'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<span aria-hidden="true">↗</span>';
const specs=items=>`<dl class="digital-specs">${items.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
const href=(p,v,prefix='')=>`${prefix}works/${p.id}/index.html?v=${v}`;
const artwork=(p,prefix='',hero=false)=>`<figure class="digital-artwork${hero?' digital-hero-art':''}"><img src="${prefix}${p.cover}" alt="${esc(p.coverAlt)}" width="1536" height="1024" ${hero?'fetchpriority="high"':'loading="lazy"'}><figcaption>封面意象 · ${esc(p.artTitle)}</figcaption></figure>`;
const download=(d,prefix='../../')=>`<a class="digital-download" href="${prefix}assets/works/workflows/${d.file}" download="${d.file}"><span><strong>${esc(d.label)}</strong><small>${esc(d.note)}</small></span><span aria-hidden="true">↓</span></a>`;
function workflows(p){
 const variants=p.variants||[{title:p.imageWorkflows[0].title,lead:'文生图 / 已保存的参数',settings:p.settings}];
 return `<div class="digital-workflow-list">${variants.map((v,i)=>`<article class="digital-workflow"><div class="digital-workflow-top"><span class="digital-no">${String(i+1).padStart(2,'0')}</span><div><p class="digital-kicker">${esc(v.lead)}</p><h3>${esc(v.title)}</h3></div><span class="digital-flow-kind">图片</span></div><p class="digital-workflow-desc">${esc(p.imageWorkflows[i].description)}</p><div class="digital-metrics"><span>${esc(v.settings.find(([k])=>k==='画面尺寸')[1])}</span><span>${p.variants?esc(v.settings.find(([k])=>k==='采样步数 / CFG')[1].split(' / ')[0]):esc(p.settings.find(([k])=>k==='采样步数')[1])} 步采样</span><span>${i===0&&p.variants?'GGUF':p.variants?'INT8':'Counterfeit V3.0'}</span></div><details class="digital-parameters"><summary>查看详细参数 <span aria-hidden="true">＋</span></summary>${specs(v.settings)}</details></article>`).join('')}${p.models?`<details class="digital-models"><summary>模型目录 <span>${p.models.length} 款已配置模型</span></summary><ul>${p.models.map(m=>`<li>${esc(m)}</li>`).join('')}</ul></details>`:''}</div>`;
}
module.exports=function buildDigitalWorks(version){
 const items=JSON.parse(fs.readFileSync(path.join(root,'data/digital-works.json'),'utf8'));
 const homeMarkup=`<div class="works-group-head works-digital-head"><div><span class="digital-kicker">想象的另一种形状</span><h3>光影工坊</h3></div><p>从一句描述，到一幅画面。</p></div><div class="digital-shelf">${items.map((p,i)=>`<article class="digital-home digital-${p.id}"><a class="digital-art-link" href="${href(p,version)}" aria-label="查看${p.displayTitle} · ${p.title}">${artwork(p)}</a><div class="digital-home-copy"><div class="digital-home-heading"><div><p class="digital-kicker">${p.title} / 图片工作流</p><h4><a href="${href(p,version)}">${p.displayTitle}</a></h4></div><a class="digital-open" href="${href(p,version)}" aria-label="打开${p.displayTitle}">${arrow}</a></div><p class="digital-home-description">${esc(p.shortSummary)}</p><div class="digital-home-footer"><span>${p.tags.map(esc).join(' · ')}</span><a href="${href(p,version)}">走进工坊 <span aria-hidden="true">→</span></a></div></div></article>`).join('')}</div>`;
 for(const p of items){
  const peer=items.find(x=>x.id!==p.id);
  const video=p.videoWorkflows.length?`<section class="digital-section digital-library" id="video-workflows"><header class="digital-section-heading"><p class="digital-kicker">视频生成</p><h2>视频工作流</h2></header><div class="digital-workflow-list">${p.videoWorkflows.map(w=>`<article class="digital-workflow"><h3>${esc(w.title)}</h3><p>${esc(w.description)}</p></article>`).join('')}</div></section>`:'';
  const html=`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f0e6"><meta name="description" content="${esc(p.summary)}"><title>${p.displayTitle} · ${p.title} · 光影工坊 · Cheney</title><link rel="stylesheet" href="../../assets/style.css?v=20261016-01"><link rel="stylesheet" href="../../assets/works.css?v=${version}&fit=20261016-01"><link rel="stylesheet" href="../../assets/digital-works.css?v=${version}&fit=20261016-01"></head>
<body class="novel-page digital-page digital-${p.id}"><a class="skip" href="#digital-main">跳到项目介绍</a><header class="novel-bar"><a class="novel-brand" href="../../index.html?works=${version}#works">Cheney <small>作品</small></a><a class="novel-return" href="../../index.html?works=${version}#works">回到作品集 ${arrow}</a></header>
<main id="digital-main" class="digital-main"><section class="digital-hero"><div class="digital-hero-copy"><p class="digital-kicker">光影工坊 / ${p.title}</p><h1>${p.displayTitle}</h1><p class="digital-subtitle">${p.subtitle}</p><p class="digital-intro">${p.shortSummary}</p><a class="digital-entry" href="#settings">探索图片工作流 <span aria-hidden="true">↓</span></a></div>${artwork(p,'../../',true)}</section>
<nav class="digital-nav" aria-label="项目介绍导航"><a href="#process">创作方式</a><a href="#settings">图片工作流</a>${p.videoWorkflows.length?'<a href="#video-workflows">视频工作流</a>':''}<a href="#files">文件与使用</a></nav>
<section class="digital-section digital-about" id="process"><header class="digital-section-heading"><p class="digital-kicker">01 / 创作方式</p><h2>${p.id==='sd-webui'?'从文字里，\n慢慢看见画面。':'让每一个环节，\n都有迹可循。'}</h2></header><div><p class="digital-about-copy">${p.intro}</p><ol class="digital-process">${p.flow.map((f,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><h3>${f.title}</h3><p>${f.text}</p></li>`).join('')}</ol></div></section>
<section class="digital-section digital-library" id="settings"><header class="digital-section-heading"><p class="digital-kicker">02 / 图片生成</p><h2>图片工作流</h2><p>${p.variants?'两种配置，各自展开。\n选择一条流程，查看其中的细节。':'保留一次生成的设置，\n让下一次调整有据可依。'}</p></header>${workflows(p)}</section>${video}
<section class="digital-section digital-files" id="files"><header class="digital-section-heading"><p class="digital-kicker">${p.videoWorkflows.length?'04':'03'} / 文件与使用</p><h2>留下流程，<br>继续创作。</h2></header><div><p class="digital-file-intro">${p.variants?'工作流文件保留了节点与参数。模型权重需另行准备；GGUF 流程需要 ComfyUI-GGUF 节点，INT8 流程还需 ComfyUI-INT8-Fast。':'保存这组参数，作为后续调整的参考。下载内容为参数记录，不能作为预设包直接导入。'}</p>${p.downloads.map(d=>download(d)).join('')}</div></section>
<p class="digital-credit">${p.credit}</p><div class="digital-next"><div><span class="digital-kicker">工坊的另一面</span><a href="../${peer.id}/index.html?v=${version}">${peer.displayTitle} <small>${peer.title}</small> ${arrow}</a></div><a class="digital-back" href="../../index.html?works=${version}#works">全部作品 →</a></div></main><footer class="novel-footer"><span>© 2026 Cheney · 光影工坊</span><a href="#digital-main">回到页首 ↑</a></footer></body></html>`;
  const dir=path.join(root,'works',p.id);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);
 }
 return homeMarkup;
};

// Keep the shared ink design when regenerating this page.
require('./apply-ink-site.cjs').applyInkSite({backup:false});
