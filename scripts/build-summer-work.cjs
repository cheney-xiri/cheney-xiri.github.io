'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const version = '20261019-characters-01';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function buildSummerWork() {
  const summer = JSON.parse(fs.readFileSync(path.join(root, 'data/unsent-summer.json'), 'utf8'));
  const characters = summer.characters;
  if (characters.length !== 2 || characters[0].role !== '男主' || characters[1].role !== '女主') {
    throw new Error('Summer introduction must contain only the two leads.');
  }
  const home = `../../index.html?works=${version}#works`;
  const profiles = characters.map((person, index) => `
      <article class="summer-character" aria-labelledby="name-${esc(person.id)}">
        <header class="summer-character-heading">
          <p class="summer-character-role"><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>${esc(person.role)}</p>
          <h3 id="name-${esc(person.id)}">${esc(person.name)}</h3>
          <p class="summer-character-line">${esc(person.line)}</p>
        </header>
        <p class="summer-character-description">${esc(person.description)}</p>
        <dl class="summer-character-facts">${person.details.map(detail => `
          <div><dt>${esc(detail.label)}</dt><dd>${esc(detail.text)}</dd></div>`).join('')}
        </dl>
        <ul class="summer-character-traits" aria-label="${esc(person.name)}的特点">${person.traits.map(trait => `<li>${esc(trait)}</li>`).join('')}</ul>
      </article>`).join('');
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#cfd5b1">
  <meta name="description" content="《${esc(summer.title)}》作品简介与男女主人物小记，青春小说，创作中。">
  <title>${esc(summer.title)} · 作品 · Cheney</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=ZCOOL+XiaoWei&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../assets/style.css?v=20261016-01">
  <link rel="stylesheet" href="../../assets/works.css?v=20261016-14&fit=20261016-01">
  <link rel="stylesheet" href="../../assets/summer-work.css?v=${version}">
</head>
<body class="novel-page summer-page">
  <a class="skip" href="#novel-main">跳到作品介绍</a>
  <header class="novel-bar">
    <a class="novel-brand" href="${home}">Cheney <small>作品</small></a>
    <a class="novel-return" href="${home}">回到作品集 <span aria-hidden="true">↗</span></a>
  </header>
  <main id="novel-main">
    <article class="novel-hero summer-hero">
      <div class="novel-hero-art"><img src="../../${esc(summer.cover)}" alt="${esc(summer.coverAlt)}" width="1024" height="1536" fetchpriority="high"></div>
      <div class="novel-hero-copy">
        <div class="novel-work-meta"><p class="novel-eyebrow">原创小说 / ${esc(summer.genre)}</p><span class="novel-status">${esc(summer.status)}</span></div>
        <h1>${summer.titleLines.map(esc).join('<br>')}</h1>
        <p class="novel-hero-question">${esc(summer.tagline)}</p>
        <div class="novel-tags">${summer.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
        <div class="summer-intro"><h2>关于这个夏天</h2><p>${esc(summer.summary)}</p></div>
        <a class="novel-text-link" href="#characters">认识故事里的人 <span aria-hidden="true">↓</span></a>
      </div>
    </article>
    <section id="characters" class="summer-characters" aria-labelledby="characters-title">
      <header class="summer-characters-head">
        <div><p class="novel-eyebrow">人物小记</p><h2 id="characters-title">故事里的两个人</h2></div>
        <p>先认识高中时期的他们。</p>
      </header>
      <div class="summer-character-spread">${profiles}
      </div>
    </section>
  </main>
  <footer class="novel-footer"><span>© 2026 Cheney · 作品</span><a href="#novel-main">回到页首 ↑</a></footer>
</body>
</html>`;
  const output = path.join(root, 'works/unsent-summer/index.html');
  fs.mkdirSync(path.dirname(output), {recursive:true});
  fs.writeFileSync(output, html);
  require('./apply-ink-site.cjs').applyInkSite({backup:false, only:['works/unsent-summer/index.html']});
  console.log('Built summer introduction with only the two leads.');
}

module.exports = buildSummerWork;
if (require.main === module) buildSummerWork();
