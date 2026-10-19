'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pages}=require('./apply-ink-site.cjs');
const root=path.resolve(__dirname,'..'),backup=path.join(root,'tmp/before-ink-site-20261017-01');
const manifest=JSON.parse(fs.readFileSync(path.join(backup,'manifest.json'),'utf8'));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function content(s){return s.split(/<body\b[^>]*>/i)[1]?.split(/<\/body>/i)[0].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<div class="ink-landscape"[\s\S]*?<\/span><\/div>/,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
const report={date:'2026-10-18',pages:[],data:[],protected:[]};
for(const p of pages()){const now=fs.readFileSync(path.join(root,p),'utf8'),old=fs.readFileSync(path.join(backup,p),'utf8');const imgs=s=>[...s.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]);report.pages.push({path:p,contentUnchanged:content(now)===content(old),imagesUnchanged:JSON.stringify(imgs(now))===JSON.stringify(imgs(old)),themeLinks:(now.match(/ink-site\.css/g)||[]).length});}
for(const[p,hash]of Object.entries(manifest.data))report.data.push({path:p,unchanged:sha(path.join(root,p))===hash});
for(const[p,hash]of Object.entries(manifest.protected))report.protected.push({path:p,unchanged:sha(path.join(root,p))===hash});
report.failures=[...report.pages.filter(r=>!r.contentUnchanged||!r.imagesUnchanged||r.themeLinks!==1),...report.data.filter(r=>!r.unchanged),...report.protected.filter(r=>!r.unchanged)];
fs.writeFileSync(path.join(root,'tmp/ink-site-integrity-20261018.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pages:report.pages.length,dataFiles:report.data.length,protectedFiles:report.protected.length,failures:report.failures},null,2));
if(report.failures.length)process.exitCode=1;
