'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createStore } = require('../server/content-store.cjs');
const { applyPublishedContent } = require('../server/published-content.cjs');
const { catalog: siteCatalog } = require('../server/site-editor.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const folders = ['about', 'admin', 'craft', 'figures', 'writing', 'works', 'interaction', 'journey', 'travels', 'pastimes', 'assets'];
const rootFiles = ['index.html', 'books.html', 'henan.html', 'poems.json', 'admire-dark.png', 'hero-night.png', 'interaction-desktop.png', 'mobile-hero-final.png'];
const files = [];
const serviceConfig=JSON.parse(fs.readFileSync(path.join(root,'assets/interaction-service.json'),'utf8'));
let serviceOrigin='';if(serviceConfig.url){const u=new URL(serviceConfig.url);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('Invalid interaction service origin');serviceOrigin=' '+u.origin;}
function scan(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) { if (file !== 'assets/design') scan(file); }
    else if (/\.(html|css|js|json|png|webp|jpe?g|gif|svg|woff2?|ttf|mp[34]|webm|ogg|wav)$/i.test(file) && !/(prompts-|manifest-|review-|preview-)/i.test(file)) files.push(file);
  }
}
folders.forEach(scan);
files.push(...rootFiles.filter(file => fs.existsSync(path.join(root, file))));
const adminFiles=files.filter(file=>file==='admin/index.html'||file==='assets/interaction-service.json'||/^assets\/(?:admin[^/]*|github-admin|interaction-service)\.(?:js|css)$/.test(file)).sort();
const adminHash=createHash('sha256');for(const file of adminFiles)adminHash.update(file).update(fs.readFileSync(path.join(root,file)));const adminVersion=adminHash.digest('hex').slice(0,16);
const text = files.filter(file => /\.(html|css|js|json)$/.test(file)).map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
fs.mkdirSync(output, { recursive: true });
const temp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'cheney-public-seed-'));
const store = createStore(root, temp);
const catalog = { collections: store.labels, profileFields: store.profileFields, entries: Object.keys(store.labels).flatMap(c => store.list(c)), journey: {}, animeNotes: {} };
const notes = applyPublishedContent(store, root);
const written = [];
try {
  for (const file of files) {
    if (file.endsWith('.png') && fs.existsSync(path.join(root, file.slice(0, -4) + '.webp')) && !text.includes(path.posix.basename(file))) continue;
    let bytes = fs.readFileSync(path.join(root, file));
    if (/\.(html|css|js|json)$/.test(file)) {
      let content = bytes.toString('utf8').replace(/https?:\/\/(?:localhost|127\.0\.0\.1):(?:3000|3001)\b/g, '');
      if (file === 'admin/index.html') {
        content=content.replace(/(<head[^>]*>)/i,'$1<meta name="cheney-admin-version" content="'+adminVersion+'">');
        content = content.replace(/href="\/cheney\/"/g, 'href="/"');
        content = content.replace(/(<head[^>]*>)/i, '$1<script src="/assets/admin-vault.js?v=20261021-01" defer></script><script src="/assets/github-admin.js?v=20261022-02" defer></script>');
        content = content.replace('content="noindex,nofollow"', 'content="noindex,nofollow"><meta name="referrer" content="no-referrer"');
        content = content.replace(/(<head[^>]*>)/i, '$1<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; connect-src \'self\' https://api.github.com https://raw.githubusercontent.com'+serviceOrigin+'; img-src \'self\' https: data: blob:; media-src \'self\' https: blob:; frame-src \'self\'; style-src \'self\'; object-src \'none\'; base-uri \'self\'; form-action \'self\'">');
      } else if (file.endsWith('.html')) {
        content = content.replace(/(<head[^>]*>)/i, '$1<meta name="cheney-page-path" content="'+file+'">');
        if (file === 'index.html') content = content.replace('href="/cheney/admin/"', 'href="/admin/"');
        const state = store.publicState(file, false);
        const hydrate = '<script id="cheney-content-state" type="application/json">' + JSON.stringify({ state }).replace(/</g, '\\u003c') + '</script>';
        content = content.replace(/(<head[^>]*>)/i, '$1<script src="/assets/github-preview.js?v=20261021-02"></script>' + hydrate);
        if (!content.includes('src="/assets/content-live.js')) content = content.replace(/(<head[^>]*>)/i, '$1<script src="/assets/content-live.js?v=20261021-08" defer></script>');
        content = content.replace(/(<head[^>]*>)/i, '$1<link rel="stylesheet" href="/assets/site-content.css?v=20261022-02"><script src="/assets/site-content.js?v=20261022-02" defer></script>');
      }
      if(file === 'admin/index.html')content=content.replace(/((?:src|href)="\/assets\/(?:admin[^/\"]*|github-admin)\.(?:js|css)\?v=)[^"]+/g,(_match,prefix)=>prefix+'20261022-04');
      content=content.replace(/(src="(?:\/|\.\.\/|\.\/)?assets\/(?:content-live|ink-subsections)\.js\?v=)[^"]+/g,(_match,prefix)=>prefix+'20261021-08');
      content=content.replace('var h=document.documentElement,p=location.pathname,q=', 'var h=document.documentElement,p=document.querySelector(\'meta[name="cheney-page-path"]\')?.content?\'/\'+document.querySelector(\'meta[name="cheney-page-path"]\').content:location.pathname,q=');
      bytes = Buffer.from(content);
    }
    const destination = path.join(output, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes);
    written.push({ path: file, bytes: bytes.length });
  }
} finally { store.db.close(); }
fs.mkdirSync(path.join(output, 'admin'), { recursive: true });
const site = siteCatalog(root,written.map(x=>x.path));
fs.writeFileSync(path.join(output, 'admin', 'catalog.json'), JSON.stringify({...catalog, site}));
fs.writeFileSync(path.join(output,'assets/admin-version.json'),JSON.stringify({version:adminVersion,builtAt:new Date().toISOString()}));
const hashJSON = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshotPath = path.join(root,'data/online-content.json');
fs.writeFileSync(path.join(output,'assets/publication.json'),JSON.stringify({builtAt:new Date().toISOString(),snapshotHash:hashJSON(fs.existsSync(snapshotPath)?JSON.parse(fs.readFileSync(snapshotPath,'utf8')):{}),sourceHashes:Object.fromEntries(site.sources.map(source=>[source.path,hashJSON(JSON.parse(fs.readFileSync(path.join(root,source.path),'utf8')))]))}));
fs.writeFileSync(path.join(output,'assets/content-baseline.json'),JSON.stringify(catalog.entries.filter(x=>x.published).map(x=>({id:x.id,collection:x.collection,basePath:x.basePath,data:x.published,touched:false}))));
fs.writeFileSync(path.join(output, 'assets', 'online-notes.json'), JSON.stringify(notes));
fs.writeFileSync(path.join(output, 'assets', 'site-edits.json'), JSON.stringify({pages:notes.pages}));
// Named entry points share the same site and the same device-local login record.
for (const [source, destination] of [['index.html', 'cheney/index.html'], ['admin/index.html', 'cheney/admin/index.html']]) {
  const target = path.join(output, destination);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const html = fs.readFileSync(path.join(output, source), 'utf8').replace(/(<head[^>]*>)/i, '$1<base href="/">');
  fs.writeFileSync(target, html);
}
const notice = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>站点预览 · Cheney</title><style>body{margin:0;background:#e7e3d5;color:#243e37;font:18px/1.9 Georgia,"Noto Serif SC",serif}main{max-width:38rem;margin:18vh auto;padding:2rem}a{color:inherit}h1{font-size:2rem}</style><main><h1>站点预览</h1><p>当前预览站用于浏览页面，在线管理暂未开放。</p><a href="/">返回个人主页 ↗</a></main></html>';
fs.writeFileSync(path.join(output, '.nojekyll'), '');
fs.writeFileSync(path.join(output, '404.html'), notice.replace('站点预览</h1>', '这一页尚未找到</h1>').replace('当前预览站用于浏览页面，在线管理暂未开放。', '可以返回主页，继续浏览。'));
const report = { files: written.length + 9, bytes: written.reduce((n, x) => n + x.bytes, 0), largest: Math.max(...written.map(x => x.bytes)), mode: 'static website with device-encrypted GitHub content management', serverIncluded: false };
fs.writeFileSync(path.join(output, 'preview-build.json'), JSON.stringify(report));
console.log(JSON.stringify(report));
