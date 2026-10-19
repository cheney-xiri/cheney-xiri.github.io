'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/profile.json'),'utf8').replace(/^\uFEFF/,''));
const v='20261017-07';
const file=path.join(root,'index.html');
let home=fs.readFileSync(file,'utf8');
const favicon=(home.match(/<link rel="icon"[^>]*>/)||[''])[0];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<span aria-hidden="true">↗</span>';
const card=(id,title,label,value,note)=>`<section class="personality-card${value?'':' is-unfilled'}" aria-labelledby="${id}"><header><span class="personality-index">${label}</span><h2 id="${id}">${title}</h2></header><p class="personality-value">${value?esc(value):'尚未填写'}</p>${note?`<p class="personality-note">${esc(note)}</p>`:''}</section>`;
const keywords=data.personalityKeywords.filter(s=>typeof s==='string'&&s.trim());
const blank='<span class="personality-blank" aria-label="待填写">—</span>';
const details=[
  {title:'性格轮廓',items:[['家乡',data.hometown],['生日',data.birthday],['性格关键词',keywords.join(' · ')],['相处方式',data.gettingAlong],['社交状态',data.socialStyle],['表达方式',data.expressionStyle],['做事习惯',data.workStyle],['独处时刻',data.aloneTime],['一句座右铭',data.motto]]},
  {title:'生活偏好',items:[['生活节奏',data.dailyRhythm],['偏爱的季节',data.favoriteSeason],['喜欢的颜色',data.favoriteColor],['喜欢的天气',data.favoriteWeather],['偏爱的时段',data.favoriteTime],['偏爱的口味',data.favoriteFlavor],['喜欢的气味',data.favoriteScent],['喜欢的场景',data.favoritePlace],['放松方式',data.relaxation],['在意的小事',data.smallJoys],['近期目标',data.currentGoal],['想学的技能',data.wantToLearn]]}
];
const extra=`<section class="personality-details" id="daily" aria-labelledby="personality-details-title"><header><p class="profile-kicker">02 / 日常里的我</p><h2 id="personality-details-title">性格与偏好</h2></header><div class="personality-field-groups">${details.map(group=>`<section class="personality-field-group"><h3>${group.title}</h3><dl class="personality-preferences">${group.items.map(([label,value])=>`<div><dt>${label}</dt><dd>${value?esc(value):blank}</dd></div>`).join('')}</dl></section>`).join('')}</div></section>`;
const thumbByHref={
 'pastimes/detail.html?topic=music':'assets/pastime-images/music.webp',
 'books.html':'assets/pastime-images/reading.webp',
 'pastimes/games.html':'assets/pastime-images/games.webp',
 'pastimes/anime.html':'assets/pastime-images/anime.webp',
 'travels/index.html':'assets/pastime-images/travel.webp',
 'pastimes/detail.html?topic=editing':'assets/pastime-images/editing.webp',
 'craft/go.html':'assets/craft-go.webp',
 'craft/photography.html':'assets/craft-photography.webp',
 'writing/lines.html':'assets/craft-poetry.webp',
 'craft/dizi.html':'assets/craft-dizi.webp',
 'craft/writing.html':'assets/craft-writing.webp',
 'works/unsent-summer/index.html':'assets/works/unsent-summer-cover-v2.webp',
 'works/future-letter/index.html':'assets/works/future-letter-cover.webp',
 'works/sd-webui/index.html':'assets/works/sd-webui-art-v2.webp',
 'works/z-image/index.html':'assets/works/z-image-art-v2.webp',
 'figures/mao.html':'assets/figure-mao.jpg',
 'figures/qu.html':'assets/figure-qu.jpg',
 'figures/li.html':'assets/figure-li.jpg',
 'figures/ke.html':'assets/figure-ke-portrait.jpg',
 'figures/jay.html':'assets/figure-jay.jpg',
 'figures/tfboys.html':'assets/figure-tfboys.jpg'
};
const science=data.scienceInterest?`<figure class="profile-science"><a href="../${esc(data.scienceInterest.href)}"><img src="../${esc(data.scienceInterest.image)}" alt="NASA 官方发布的宇宙悬崖近红外影像" width="1280" height="741" loading="lazy"><span class="profile-science-copy"><small>求知与探索 / 物理</small><strong>${esc(data.scienceInterest.title)}</strong><span>${esc(data.scienceInterest.text)}</span><em>走进宇宙图景 ${arrow}</em></span></a><a class="profile-science-source" href="https://science.nasa.gov/missions/webb/nasas-webb-reveals-cosmic-cliffs-glittering-landscape-of-star-birth/" target="_blank" rel="noopener noreferrer" aria-label="宇宙悬崖的 NASA 官方图源" title="${esc(data.scienceInterest.credit)}">NASA ${arrow}</a></figure>`:'';
const linked=`<section class="profile-connections" id="interests" aria-labelledby="connections-title"><header class="profile-section-heading"><div><p class="profile-kicker">03 / 喜欢与投入</p><h2 id="connections-title">兴趣与所爱</h2></div><p>从这里，走进我的日常。</p></header>${science}${data.linkedGroups.map((group,g)=>`<section class="profile-link-group"><h3><span aria-hidden="true">0${g+1}</span>${esc(group.title)}</h3><ul class="profile-link-grid">${group.items.map(item=>{const thumb=thumbByHref[item.href];const imageClass=item.href.includes('works/')&&item.href.includes('summer')||item.href.includes('future-letter')?' is-book':'';return `<li><a class="profile-destination${thumb?' has-image':''}" href="../${esc(item.href)}">${thumb?`<span class="profile-destination-image${imageClass}"><img src="../${esc(thumb)}" alt="" loading="lazy" width="80" height="80"></span>`:`<span class="profile-destination-letter" aria-hidden="true">${esc(item.title[0])}</span>`}<span class="profile-destination-copy"><strong>${esc(item.title)}</strong><small>${esc(item.note)}</small></span>${arrow}</a>${item.secondary?`<a class="profile-secondary-link" href="../${esc(item.secondary.href)}">也看看${esc(item.secondary.title)} ${arrow}</a>`:''}</li>`;}).join('')}</ul></section>`).join('')}</section>`;
const narrative=`<section class="personality-details" id="narrative" aria-labelledby="narrative-title"><header><p class="profile-kicker">04 / 写给自己</p><h2 id="narrative-title">自述</h2></header><div class="personality-narrative">${data.selfNarrative.length?data.selfNarrative.map(p=>`<p>${esc(p)}</p>`).join(''):'<p class="narrative-empty">这一页，留给自己的话。</p><p class="narrative-hint">性格、近况、想法，或是想成为的样子。</p>'}</div></section>`;
const html=`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f0e6"><meta name="description" content="${esc(data.name)} 的个性小档，星座、MBTI与性格。"><title>自我介绍 · ${esc(data.name)}</title>${favicon}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600&family=ZCOOL+XiaoWei&display=swap" rel="stylesheet"><link rel="stylesheet" href="../assets/style.css?v=20261016-01"><link rel="stylesheet" href="../assets/profile.css?v=${v}"><link rel="stylesheet" href="../assets/physics.css?v=20261017-13"></head>
<body class="profile-page"><a class="skip" href="#profile-main">跳到个性小档</a><header class="profile-bar"><a class="profile-brand" href="../index.html#about">${esc(data.name)} <small>自我介绍</small></a><a href="../index.html#about">回到主页 ${arrow}</a></header><main id="profile-main" class="profile-main">
<section class="profile-hero"><div><p class="profile-kicker">自我介绍 / 个性小档</p><h1>${esc(data.name)}</h1><p class="profile-tagline">关于我的另一面</p><p class="profile-hero-note">星座 · MBTI · 性格</p></div><figure class="profile-portrait"><img src="../${esc(data.portrait)}" alt="${esc(data.portraitAlt)}" width="900" height="900" fetchpriority="high"></figure></section>
<nav class="profile-nav" aria-label="个人档案目录"><a href="#identity">个性小档</a><a href="#daily">性格与偏好</a><a href="#interests">兴趣与所爱</a><a href="#narrative">自述</a></nav>
<div class="personality-grid" id="identity">${card('zodiac-title','星座','01 / ZODIAC',data.zodiac.name,data.zodiac.note)}${card('mbti-title','MBTI','01 / PERSONALITY',data.mbti.type,data.mbti.note)}</div>
${extra}${linked}${narrative}
</main><footer class="profile-footer"><span>© 2026 ${esc(data.name)} · 个性小档</span><a href="../index.html#about">返回关于我 ${arrow}</a></footer></body></html>`;
fs.mkdirSync(path.join(root,'about'),{recursive:true});
fs.writeFileSync(path.join(root,'about/index.html'),html);
const entry=`<a class="about-intro-entry" href="about/index.html?v=${v}" target="_blank" rel="noopener noreferrer" aria-label="在新标签打开自我介绍"><span><strong>自我介绍</strong></span><span class="about-intro-open">进一步认识我 ${arrow}</span></a>`;
if(home.includes('class="about-intro-entry"'))home=home.replace(/<a class="about-intro-entry"[\s\S]*?<\/a>/,entry);
else {const section=home.match(/<section class="juan" id="about">[\s\S]*?<\/section>/);if(!section)throw Error('About section missing');home=home.replace(section[0],section[0].replace('</dl>','</dl>\n        '+entry));}
if(home.includes('href="assets/profile.css'))home=home.replace(/assets\/profile\.css\?v=[^"]+/,`assets/profile.css?v=${v}`);else home=home.replace('</head>',`<link rel="stylesheet" href="assets/profile.css?v=${v}">\n</head>`);
fs.writeFileSync(file,home);
console.log('Built personality profile and homepage entry.');

// Keep the shared ink design when regenerating this page.
require('./apply-ink-site.cjs').applyInkSite({backup:false});
