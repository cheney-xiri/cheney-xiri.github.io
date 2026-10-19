'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const book=JSON.parse(fs.readFileSync(path.join(root,'data/future-letter.json'),'utf8'));
const version='20261016-14';
require('./build-digital-works.cjs')(version);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<span aria-hidden="true">↗</span>';
const sections=[['story','内容简介'],['characters','主要人物'],['threads','故事线索'],['motifs','作品意象']];
const summer=JSON.parse(fs.readFileSync(path.join(root,'data/unsent-summer.json'),'utf8'));
const homeFile=path.join(root,'index.html');
let home=fs.readFileSync(homeFile,'utf8');
const homeBooks=[
 {id:'unsent-summer',...summer,meta:'故事仍在书写'},
 {id:'future-letter',title:book.title,titleLines:['最后一封','来自未来的信'],genre:book.genre,cover:book.cover,coverAlt:'《最后一封来自未来的信》封面：蓝帘窗光、夜空与一封信',summary:'2098 年，数字生命林晚带着记忆苏醒，却开始追问自己的来处。一场关于爱、自由与身份的故事，由此展开。',tags:['数字生命','记忆与身份'],meta:book.chapterCount+' 章 · 长篇故事'}
];
const digitalProjects=JSON.parse(fs.readFileSync(path.join(root,'data/digital-works.json'),'utf8'));
const homeWorks=[
 ...homeBooks.map(p=>({...p,kind:'book',label:p.genre,shortSummary:p.id==='future-letter'?'关于数字生命、记忆与身份的长篇科幻故事。':'写给青春与暗恋的故事，仍在书写中。'})),
 ...digitalProjects.map(p=>({...p,kind:'digital',titleLines:[p.displayTitle],label:p.title}))
];
const homeSection=`<section class="juan" id="works" data-layout="compact" aria-labelledby="works-title"><div class="wrap"><div class="juan-head reveal"><h2 class="juan-title" id="works-title">作品</h2><p class="juan-poem">让故事有文字，让想象有画面</p></div><div class="works-grid">${homeWorks.map(p=>`<article class="works-entry works-entry-${p.kind}"><a class="works-thumb" href="works/${p.id}/index.html?v=${version}" aria-label="查看${esc(p.title)}"><img src="${p.cover}" alt="${esc(p.coverAlt)}" width="${p.kind==='book'?1024:1536}" height="${p.kind==='book'?1536:1024}" loading="lazy"></a><div class="works-entry-meta"><span>${esc(p.label)}</span>${p.status?`<span class="novel-status">${p.status}</span>`:''}</div><h3><a href="works/${p.id}/index.html?v=${version}">${p.titleLines.map(esc).join('<br>')}</a></h3><p class="works-entry-summary">${esc(p.shortSummary)}</p><a class="works-entry-link" href="works/${p.id}/index.html?v=${version}">查看详情 ${arrow}</a></article>`).join('')}</div></div></section>`;
if(!/<section class="juan" id="works"/.test(home))throw Error('Works section missing');
home=home.replace(/<section class="juan" id="works"[\s\S]*?<\/section>/,homeSection);
if(home.includes('href="assets/works.css'))home=home.replace(/assets\/works\.css\?v=[^"]+/,`assets/works.css?v=${version}&fit=20261016-01`);
else home=home.replace('</head>',`<link rel="stylesheet" href="assets/works.css?v=${version}&fit=20261016-01">\n</head>`);
if(home.includes('href="assets/digital-works.css')) home=home.replace(/assets\/digital-works\.css\?v=[^"]+/,`assets/digital-works.css?v=${version}&fit=20261016-01`);
else home=home.replace('</head>',`<link rel="stylesheet" href="assets/digital-works.css?v=${version}&fit=20261016-01">\n</head>`);
fs.writeFileSync(homeFile,home);
const nav=sections.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('');
const html=`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f0e6"><meta name="description" content="${esc(book.title)}，关于数字生命、记忆与身份的长篇科幻小说。作品简介、主要人物与故事线索。"><title>${esc(book.title)} · 作品 · Cheney</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=ZCOOL+XiaoWei&display=swap" rel="stylesheet"><link rel="stylesheet" href="../../assets/style.css?v=20261016-01"><link rel="stylesheet" href="../../assets/works.css?v=${version}&fit=20261016-01"><script src="../../assets/works.js?v=${version}" defer></script></head>
<body class="novel-page"><a class="skip" href="#novel-main">跳到正文</a><header class="novel-bar"><a class="novel-brand" href="../../index.html?works=${version}#works">Cheney <small>作品</small></a><a class="novel-return" href="../../index.html?works=${version}#works">回到作品集 ${arrow}</a></header>
<main id="novel-main"><section class="novel-hero"><div class="novel-hero-art"><img src="../../${book.cover}" alt="《${esc(book.title)}》封面：蓝帘窗光、星光与一封来自远方的信" width="1024" height="1536" fetchpriority="high"></div><div class="novel-hero-copy"><p class="novel-eyebrow">原创小说 / ${book.genre}</p><h1>最后一封<br>来自未来的信</h1><p class="novel-hero-question">当记忆可以重建，<br>一个人该如何成为自己？</p><div class="novel-tags"><span>数字生命</span><span>记忆与身份</span><span>科幻与情感</span></div><p class="novel-hero-context">故事从 2098 年的深海市开始，<br>在一场重逢里，听见一个新生命的疑问。</p><a class="novel-text-link" href="#story">从故事起点读起 <span aria-hidden="true">↓</span></a></div></section>
<nav class="novel-section-nav" aria-label="作品介绍导航">${nav}</nav>
<section id="story" class="novel-section novel-story"><header class="novel-section-head"><p class="novel-eyebrow">01 / 内容简介</p><h2>她带着记忆醒来，<br>也带着自己的疑问。</h2></header><div class="novel-story-prose">${book.summary.map(p=>`<p>${esc(p)}</p>`).join('')}<blockquote>“${esc(book.quote)}”</blockquote><p class="novel-quote-label">故事开端 · 林晚</p></div></section>
<section id="characters" class="novel-section novel-characters"><header class="novel-section-head"><p class="novel-eyebrow">02 / 主要人物</p><h2>相遇的人，<br>各自面对的答案。</h2><p>沿着不同人物的目光，走近这场关于记忆与生命的追问。</p></header><div class="novel-character-layout" data-character-browser><div class="novel-character-tabs" role="tablist" aria-label="选择人物" aria-orientation="vertical">${book.characters.map((p,i)=>`<button type="button" role="tab" id="tab-${p.id}" aria-controls="panel-${p.id}" aria-selected="${!i}" tabindex="${i?-1:0}" data-character="${p.id}"><span>${String(i+1).padStart(2,'0')}</span><strong>${p.name}</strong><small>${p.role.split(' · ')[0]}</small></button>`).join('')}</div><div class="novel-character-panels">${book.characters.map((p,i)=>`<article class="novel-character-panel" role="tabpanel" id="panel-${p.id}" aria-labelledby="tab-${p.id}" tabindex="0"${i?' hidden':''}><div class="novel-character-profile"><figure class="novel-character-art"><img src="../../${p.image}" alt="${esc(p.imageAlt)}" width="1024" height="1536" loading="lazy"><figcaption>人物插画 · ${p.name}</figcaption></figure><div class="novel-character-description"><div class="novel-character-heading"><div><p class="novel-eyebrow">${p.role}</p><h3>${p.name}</h3><p class="novel-character-line">${p.line}</p></div></div>${p.paragraphs.map(t=>`<p>${t}</p>`).join('')}<p class="novel-relationship">${p.relationship}</p><div class="novel-tags">${p.keywords.map(t=>`<span>${t}</span>`).join('')}</div></div></div></article>`).join('')}</div></div><noscript><style>.novel-character-panel[hidden]{display:block}.novel-character-tabs{display:none}</style></noscript></section>
<section id="threads" class="novel-section novel-threads"><header class="novel-section-head"><p class="novel-eyebrow">03 / 故事线索</p><h2>从一场重逢，<br>走向尚未命名的远方。</h2><p>循着故事的起点与悬念，认识人物之间的牵引。</p></header><ol class="novel-thread-list">${book.threads.map((t,i)=>`<li><span class="novel-thread-no">${String(i+1).padStart(2,'0')}</span><div><p class="novel-eyebrow">${t.subtitle}</p><h3>${t.title}</h3><p>${t.text}</p></div></li>`).join('')}</ol></section>
<section id="motifs" class="novel-section novel-motifs"><header class="novel-section-head"><p class="novel-eyebrow">04 / 作品意象</p><h2>让记忆有温度，<br>让远方有归处。</h2></header><div class="novel-motif-list">${book.motifs.map((m,i)=>`<article><span aria-hidden="true">${['窗','海','信'][i]}</span><h3>${m.name}</h3><p>${m.text}</p></article>`).join('')}</div></section>
<div class="novel-end"><p>当记忆可以重建，<br>一个人该如何成为自己？</p><a class="novel-button" href="../../index.html?works=${version}#works">回到作品集 ${arrow}</a></div></main><footer class="novel-footer"><span>© 2026 Cheney · 作品</span><a href="#novel-main">回到页首 ↑</a></footer></body></html>`;
const dir=path.join(root,'works/future-letter');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);
console.log('Built work introduction and homepage feature. No chapters or full text imported.');

require('./build-summer-work.cjs')();

// Keep the shared ink design when regenerating this page.
require('./apply-ink-site.cjs').applyInkSite({backup:false});
