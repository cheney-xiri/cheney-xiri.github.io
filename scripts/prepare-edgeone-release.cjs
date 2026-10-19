'use strict';
// Build an isolated, reviewable upload folder; never upload this working directory.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=path.join(root,'deploy','edgeone-release');
const {createStore}=require('../server/content-store.cjs');
fs.mkdirSync(output,{recursive:true});
const folders=['about','admin','craft','figures','writing','works','interaction','journey','travels','pastimes','assets'];
const rootFiles=['index.html','books.html','henan.html','poems.json','admire-dark.png','hero-night.png','interaction-desktop.png','mobile-hero-final.png'];
const files=[];function scan(dir){for(const d of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=path.posix.join(dir,d.name);if(d.isDirectory()){if(p!=='assets/design')scan(p);}else if(/\.(html|css|js|json|png|webp|jpe?g|svg|woff2?|ttf|mp[34])$/i.test(p)&&!/(prompts-|manifest-|review-|preview-)/i.test(p))files.push(p);}}
folders.forEach(scan);files.push(...rootFiles.filter(p=>fs.existsSync(path.join(root,p))));
const sourceText=files.filter(p=>/\.(html|css|js|json)$/.test(p)).map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n');
const manifest=[];
for(const p of files){if(p.endsWith('.png')&&fs.existsSync(path.join(root,p.slice(0,-4)+'.webp'))&&!sourceText.includes(path.posix.basename(p)))continue;const src=path.join(root,p),dest=path.join(output,p);fs.mkdirSync(path.dirname(dest),{recursive:true});let bytes=fs.readFileSync(src);if(p.endsWith('.html')&&!p.startsWith('admin/')){let html=bytes.toString('utf8');if(!html.includes('src="/assets/content-live.js'))html=html.replace(/(<head[^>]*>)/i,'$1<script src="/assets/content-live.js?v=20261019-admin-01" defer></script>');bytes=Buffer.from(html);}fs.writeFileSync(dest,bytes);manifest.push({path:p,size:bytes.length});}
const seedDir=fs.mkdtempSync(path.join(root,'tmp','release-seed-')),store=createStore(root,seedDir);
const seed={entries:Object.keys(store.labels).flatMap(k=>store.list(k)),journey:{},animeNotes:{}};store.db.close();
let schema=fs.readFileSync(path.join(root,'server/content-store.cjs'),'utf8');schema=schema.slice(schema.indexOf('const labels ='),schema.indexOf('function createStore('));
let runtime=fs.readFileSync(path.join(root,'server/edge-runtime.mjs'),'utf8').replace('export function createEdgeHandler','function createEdgeHandler');
const functionSource=schema+'\nconst SEED='+JSON.stringify(seed).replace(/</g,'\\u003c')+';\n'+runtime+`\nexport default async function onRequest(context){const kv=typeof CHENEY_CONTENT!=='undefined'?CHENEY_CONTENT:context.env?.CHENEY_CONTENT;const password=context.env?.CHENEY_ADMIN_PASSWORD||'';return createEdgeHandler(kv,SEED,{labels,profileFields,sanitize},password)(context);}\n`;
const functionPath=path.join(output,'edge-functions','api','[[default]].js');fs.mkdirSync(path.dirname(functionPath),{recursive:true});fs.writeFileSync(functionPath,functionSource);
fs.writeFileSync(path.join(output,'edgeone.json'),JSON.stringify({redirects:[{source:'/admin',destination:'/admin/index.html',statusCode:302},{source:'/admin/',destination:'/admin/index.html',statusCode:302}],headers:[{source:'/*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'SAMEORIGIN'}]},{source:'/api/*',headers:[{key:'Cache-Control',value:'no-store'}]},{source:'/admin/*',headers:[{key:'Cache-Control',value:'no-store'},{key:'X-Robots-Tag',value:'noindex,nofollow'}]}]},null,2));
const report={builtAt:new Date().toISOString(),output,staticFiles:manifest.length,staticBytes:manifest.reduce((n,x)=>n+x.size,0),functionBytes:Buffer.byteLength(functionSource),seedCounts:Object.fromEntries(Object.keys(store.labels).map(k=>[k,seed.entries.filter(x=>x.collection===k).length])),excluded:['local runtime database','owner password','sessions','private messages','novel full text','project history','source PNG variants','skills and local settings','internal data folder'],deploymentStatus:'Not deployed. China mainland nodes require a registered domain and ICP filing.'};
if(manifest.length>20000||manifest.some(x=>x.size>25*1024*1024)||report.functionBytes>5*1024*1024)throw new Error('Deployment package exceeds current EdgeOne limits');
fs.writeFileSync(path.join(root,'deploy','edgeone-release-manifest.json'),JSON.stringify({...report,files:manifest},null,2));console.log(JSON.stringify(report,null,2));
