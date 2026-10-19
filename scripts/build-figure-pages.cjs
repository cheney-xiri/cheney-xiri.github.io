'use strict';
// Generates complete static pages; browser JavaScript only enhances the readers.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const people = JSON.parse(fs.readFileSync(path.join(root, 'data/figures.json'), 'utf8'));
const music = JSON.parse(fs.readFileSync(path.join(root, 'assets/music-selection.json'), 'utf8'));
const targetSlug = (process.argv.find(arg=>arg.startsWith('--person=')) || '').slice('--person='.length);
if (targetSlug && !people.some(p=>p.slug===targetSlug)) throw new Error('Unknown figure: '+targetSlug);
const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const number = n => String(n + 1).padStart(2, '0');
function poemHTML(text) {
  return text.split('\n').map(line=>'<span class="fp-poem-line">'+(line.match(/[^，。！？；]+[，。！？；]?/g)||[line]).map(clause=>'<span class="fp-poem-clause">'+esc(clause)+'</span>').join('')+'</span>').join('');
}
function poemBlock(item, id) {
  const text = item.fullText || item.excerpt;
  if (!text) return '';
  const poem = '<blockquote id="'+id+'" class="fp-poem'+(item.fullText?' fp-poem--complete':'')+'">'+poemHTML(text)+'</blockquote>';
  if (!item.fullText || text.split('\n').length <= 24) return poem;
  return '<div class="fp-poem-fold" data-poem-fold data-poem-title="'+esc(item.title)+'">'+poem+'<button class="fp-poem-toggle" type="button" data-poem-toggle aria-expanded="true" aria-controls="'+id+'" hidden>收起长篇 ↑</button></div>';
}
function section(id, title, body, intro) {
  return {id, title, html:'<section class="fp-section" id="'+id+'" aria-labelledby="'+id+'-title"><div class="fp-section-head"><h2 id="'+id+'-title">'+esc(title)+'</h2>'+(intro?'<p>'+esc(intro)+'</p>':'')+'</div>'+body+'</section>'};
}
function reader(person, readerId) {
  const r = person.reader;
  const id = readerId || 'reading';
  const library = r.items.length > 5;
  const tabs = r.items.map((item,i)=>'<button type="button" id="'+id+'-tab-'+i+'" role="tab" aria-selected="'+(!i)+'" aria-controls="'+id+'-panel-'+i+'" data-reader-tab="'+i+'" data-search="'+esc(item.title+' '+item.kicker)+'"><span>'+number(i)+'</span><span>'+esc(item.title)+'</span></button>').join('');
  const panels = r.items.map((item,i)=>'<article class="fp-reader-panel" id="'+id+'-panel-'+i+'" role="tabpanel" aria-labelledby="'+id+'-tab-'+i+'" tabindex="0" data-reader-panel="'+i+'"><p class="fp-kicker">'+esc(item.kicker)+'</p><h3>'+esc(item.title)+'</h3>'+poemBlock(item,id+'-poem-'+i)+(item.text?'<p class="fp-reader-text">'+esc(item.text)+'</p>':'')+(item.details?'<dl class="fp-reading-details">'+item.details.map(d=>'<div><dt>'+esc(d[0])+'</dt><dd>'+esc(d[1])+'</dd></div>').join('')+'</dl>':'')+(item.reference?'<p class="fp-work-reference">'+esc(item.reference)+'</p>':'')+(item.source?'<p class="fp-work-reference">依据：<a href="'+esc(item.source[1])+'" target="_blank" rel="noopener noreferrer">'+esc(item.source[0])+' ↗</a></p>':'')+'</article>').join('');
  const search = library?'<label class="fp-work-search" for="'+id+'-search"><span>查找篇名 <small>'+r.items.length+' 篇</small></span><input id="'+id+'-search" type="search" placeholder="输入篇名或题材" data-reader-search></label>':'';
  return section(id,r.title,'<div class="fp-reader'+(library?' fp-reader--library':'')+'" data-reader'+(r.items.some(item=>item.fullText)?' data-complete-poems':'')+'>'+search+'<div class="fp-reader-tabs" role="tablist"'+(library?' aria-orientation="vertical"':'')+' aria-label="'+esc(r.title)+'">'+tabs+'</div><div class="fp-reader-panels">'+panels+'<p class="fp-reader-empty" data-reader-empty hidden>没有找到对应篇目，清空搜索可继续浏览。</p></div></div>',r.intro);
}
function extra(p) {
  const e=p.extra;
  if(!e)return null;
  if(e.type==='matches') return section('matches',e.title,'<ol class="fp-matches">'+e.items.map(i=>'<li><time>'+esc(i[0])+'</time><strong>'+esc(i[1])+'</strong><p>'+esc(i[2])+'</p></li>').join('')+'</ol>',e.intro);
  return section('notes',e.title,'<div class="fp-notes">'+e.items.map(i=>'<article><h3>'+esc(i[0])+'</h3><p>'+esc(i[1])+'</p></article>').join('')+'</div>');
}
function albums(p) {
  if(!p.musicKey)return null;
  const list=music.playlists[p.musicKey].albums;
  const tabs=list.map((a,i)=>'<button type="button" id="album-tab-'+i+'" role="tab" aria-controls="album-panel-'+i+'" aria-selected="'+(!i)+'" data-reader-tab="'+i+'"><time>'+a.year+'</time><span>'+esc(a.name)+'</span></button>').join('');
  const panels=list.map((a,i)=>'<article class="fp-album-panel fp-reader-panel" id="album-panel-'+i+'" role="tabpanel" aria-labelledby="album-tab-'+i+'" tabindex="0" data-reader-panel="'+i+'"><p class="fp-kicker">'+a.year+' / '+a.tracks.length+' 首曲目</p><h3>'+esc(a.name)+'</h3>'+(p.albumNotes[a.name]?'<p>'+esc(p.albumNotes[a.name])+'</p>':'')+'<ol class="fp-tracks">'+a.tracks.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol><a class="fp-text-link" href="../pastimes/detail.html?topic=music#'+p.musicKey+'">进入'+esc(p.name)+'歌单 '+arrow+'</a></article>').join('');
  return section('albums','专辑与 EP','<div class="fp-albums fp-reader" data-reader><div class="fp-album-tabs fp-reader-tabs" role="tablist" aria-orientation="vertical" aria-label="选择专辑">'+tabs+'</div><div class="fp-reader-panels">'+panels+'</div></div>','选择专辑名，在本页展开对应的发行年份与完整曲目。');
}
function artwork(p) {
  if(p.image) return '<figure class="fp-portrait"><img src="../assets/'+p.image+'" alt="'+esc(p.name)+'"><figcaption>'+esc(p.label)+'</figcaption></figure>';
  if(p.slug==='jay') return '<div class="fp-type-art fp-type-art--jay" aria-hidden="true"><span>音乐档案 / 2000 —</span><strong>JAY<span>周杰伦</span></strong><p>旋律 · 节奏 · 想象</p></div>';
  return '<div class="fp-type-art fp-type-art--tfboys" aria-hidden="true"><span>组合档案 / 2013 —</span><strong>TF<br>BOYS</strong><p>王俊凯 / 王源 / 易烊千玺</p></div>';
}
function getSections(p) {
  const titles={mao:'从文字看思想与气象',qu:'走进楚辞的精神世界',li:'跟着诗句，进入山河',ke:'先看一盘棋',jay:'让专辑成为阅读顺序',tfboys:'从组合的作品听起'};
  const overview=section('overview',titles[p.slug],p.intro.map(text=>'<p class="fp-prose">'+esc(text)+'</p>').join(''));
  const read=reader(p), more=extra(p), album=albums(p);
  let sections;
  if(p.slug==='mao')sections=[overview,reader({reader:p.spirit},'spirit'),read,reader({reader:p.articles},'articles'),more];
  else if(p.slug==='qu')sections=[overview,read,more];
  else if(p.slug==='li')sections=[overview,read,more];
  else if(p.slug==='ke')sections=[overview,more,read];
  else if(p.slug==='jay')sections=[overview,album,read,more];
  else sections=[overview,read,album,more];
  if(p.links)sections.push(section('continue','再往里读','<div class="fp-related">'+p.links.map(l=>'<a href="'+l[1]+'"><strong>'+esc(l[0])+'</strong><p>'+esc(l[2])+'</p>'+arrow+'</a>').join('')+'</div>'));
  return sections.filter(Boolean);
}
function page(p) {
  const sections=getSections(p);
  const personNav=people.map(x=>'<a href="'+x.slug+'.html?v=20261016-06"'+(x.slug===p.slug?' aria-current="page"':'')+'>'+x.name+'</a>').join('');
  const sources=p.sources.length?'<details class="fp-sources"><summary>阅读资料</summary><ul>'+p.sources.map(s=>'<li><a href="'+esc(s[1])+'" target="_blank" rel="noopener noreferrer">'+esc(s[0])+' ↗</a></li>').join('')+'</ul></details>':'<p class="fp-credit">古诗原文采用通行本；作品系年中的不同说法，应结合具体版本阅读。赏读文字为本站整理。</p>';
  return '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="theme-color" content="#203b35">\n<title>'+p.name+' · '+p.group+' · Cheney</title>\n<meta name="description" content="'+esc(p.deck)+'">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;500;600;700&family=ZCOOL+XiaoWei&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="../assets/style.css?v=20261016-06">\n<link rel="stylesheet" href="../assets/admire.css?v=20261019-poems-02&fit=20261016-01">\n<script src="../assets/figure-pages.js?v=20261019-poems-02" defer></script>\n</head>\n<body class="figure-page figure-page--'+p.slug+'">\n<a class="skip" href="#figure-main">跳到人物正文</a>\n<header class="fp-bar"><a class="fp-brand" href="../index.html?admire=20261016-06#admire">Cheney <span>仰止</span></a><a href="../index.html?admire=20261016-06#admire">返回人物目录 '+arrow+'</a></header>\n<main id="figure-main" class="fp-main">\n<nav class="fp-crumb" aria-label="面包屑"><a href="../index.html?admire=20261016-06#admire">仰止</a><span>/</span><span>'+p.group+'</span><span>/</span><span aria-current="page">'+p.name+'</span></nav>\n<header class="fp-hero"><div class="fp-hero-copy"><p class="fp-kicker">'+p.group+' / '+p.label+'</p><h1>'+p.name+'</h1><p class="fp-period">'+p.period+'</p><p class="fp-tagline">'+p.tagline+'</p><p class="fp-deck">'+p.deck+'</p><div class="fp-tags">'+p.traits.map(t=>'<span>'+esc(t)+'</span>').join('')+'</div></div>'+artwork(p)+'</header>\n<div class="fp-layout"><aside class="fp-sidebar"><nav aria-label="本页目录"><p>此页目录</p>'+sections.map((s,i)=>'<a href="#'+s.id+'"><span>'+number(i)+'</span>'+s.title+'</a>').join('')+'</nav><nav class="fp-person-nav" aria-label="切换人物"><p>人物索引</p>'+personNav+'</nav></aside><div class="fp-content">'+sections.map(s=>s.html).join('\n')+sources+(p.credit?'<p class="fp-credit">'+esc(p.credit)+'</p>':'')+'</div></div>\n<nav class="fp-bottom-nav" aria-label="继续浏览人物">'+people.filter(x=>x.slug!==p.slug).map(x=>'<a href="'+x.slug+'.html?v=20261016-06"><span>'+x.group+'</span>'+x.name+arrow+'</a>').join('')+'</nav>\n</main><footer class="fp-footer"><a href="../index.html?admire=20261016-06#admire">回到仰止</a><span>© 2026 Cheney · 人物与所爱</span><a href="#figure-main">回到页首 ↑</a></footer>\n</body></html>\n';
}
for(const p of people.filter(p=>!targetSlug||p.slug===targetSlug)) fs.writeFileSync(path.join(root,'figures',p.slug+'.html'),page(p),'utf8');
if (!targetSlug) {
const history=people.slice(0,3).map((p,i)=>'<li><a class="admire-book admire-book--'+p.slug+'" href="figures/'+p.slug+'.html?v=20261016-06"><span class="admire-book-top"><span>人物 '+number(i)+'</span><span>'+p.period+'</span></span><div class="admire-book-body"><div><h3>'+p.name+'</h3><p>'+p.label+'</p></div><img src="assets/'+p.image+'" alt="" loading="lazy"></div><p class="admire-book-note">'+p.tagline+'</p><span class="admire-book-bottom"><span>展开 · '+(p.slug==='mao'?'诗词与文章':p.slug==='qu'?'楚辞选读':'行旅与诗歌')+'</span>'+arrow+'</span></a></li>').join('\n');
const fans=people.slice(3).map((p,i)=>'<li><a class="admire-fan-entry" href="figures/'+p.slug+'.html?v=20261016-06"><img src="assets/'+p.image+'" alt="" loading="lazy"><div><h4>'+p.name+'</h4><p>'+(p.slug==='ke'?'真实对局 · 观棋与复盘':p.slug==='jay'?'音乐创作 · 专辑目录':'三位成员 · 组合音乐')+'</p></div>'+arrow+'</a></li>').join('\n');
const sectionHTML='<section class="juan admire-chapter" id="admire" aria-labelledby="admire-title">\n<div class="wrap">\n<header class="admire-masthead"><div><p class="admire-overline">人物与所爱</p><h2 class="juan-title" id="admire-title">仰止</h2></div><div class="admire-masthead-copy"><p>高山仰止，景行行止</p><span>读他们的故事，也读留下来的作品。</span></div></header>\n<ol class="admire-books" aria-label="人物三章">'+history+'</ol>\n<div class="admire-follow-index"><div class="admire-follow-intro"><h3>追星</h3><p>棋盘之上，旋律之间。</p></div><ol aria-label="追星人物">'+fans+'</ol></div>\n<p class="admire-colophon"><span>一人一页 · 慢慢翻阅</span><span>文字 / 棋局 / 旋律</span></p>\n</div>\n</section>';
const indexPath=path.join(root,'index.html');
let home=fs.readFileSync(indexPath,'utf8');
const start=home.indexOf('<section class="juan" id="admire">')>=0?home.indexOf('<section class="juan" id="admire">'):home.indexOf('<section class="juan admire-chapter" id="admire"');
if(start<0)throw new Error('仰止章节未找到，停止生成首页');
const end=home.indexOf('</section>',start)+10;
home=home.slice(0,start)+sectionHTML+home.slice(end);
if(!home.includes('href="assets/admire.css'))home=home.replace('</head>','<link rel="stylesheet" href="assets/admire.css?v=20261016-06&fit=20261016-01">\n</head>');
else home=home.replace(/assets\/admire\.css\?v=[^"]+/,'assets/admire.css?v=20261016-06&fit=20261016-01');
fs.writeFileSync(indexPath,home,'utf8');
}
console.log(targetSlug?'Built figure page: '+targetSlug:'Built 6 figure pages and the homepage chapter.');


// Keep the shared ink design when regenerating this page.
require('./apply-ink-site.cjs').applyInkSite({backup:false,only:targetSlug?['figures/'+targetSlug+'.html']:undefined});
