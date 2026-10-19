'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const version = '20261019-mobile-02';
const excluded = new Set(['pastimes/physics.html', 'craft/photography.html', 'about/ai.html']);
function mobileInkMarkup(page) {
  if (excluded.has(page)) return '';
  const prefix = '../'.repeat(page.split('/').length - 1);
  return `<!-- mobile-ink:start -->\n<link rel="stylesheet" href="${prefix}assets/ink-mobile.css?v=${version}" media="(max-width:800px)">\n<script src="${prefix}assets/ink-mobile.js?v=${version}" defer></script>\n<!-- mobile-ink:end -->`;
}
function applyMobileInk() {
const { pages } = require('./apply-ink-site.cjs');
const changed = [];
for (const page of pages()) {
  if (excluded.has(page)) continue;
  const file = path.join(root, page);
  const before = fs.readFileSync(file, 'utf8');
  const tag = mobileInkMarkup(page);
  const clean = before.replace(/\n?<!-- mobile-ink:start -->[\s\S]*?<!-- mobile-ink:end -->\n?/g, '\n');
  const after = clean.replace('</head>', tag + '\n</head>');
  if (before === after) continue;
  const backup = path.join(root, 'tmp', 'mobile-ink-20261019', 'pages-before', page);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, before);
  fs.writeFileSync(file, after);
  changed.push(page);
}
return { version, changed: changed.length, excluded: [...excluded] };
}
module.exports = { mobileInkMarkup, applyMobileInk };
if (require.main === module) console.log(JSON.stringify(applyMobileInk()));
