'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createStore,profileFields}=require('../server/content-store.cjs');
const root=path.resolve(__dirname,'..');
test('every profile field has a stable public target; home shares published profile',()=>{
 const html=fs.readFileSync(path.join(root,'about/index.html'),'utf8');
 for(const key of Object.keys(profileFields))assert.ok(html.includes(`data-profile-${['zodiac','mbti'].includes(key)?'identity':'field'}="${key}"`),key);
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cheney-profile-')),store=createStore(root,temp);
 try{const item=store.list('profile')[0];store.save({id:item.id,collection:'profile',revision:item.revision,draft:{...item.draft,fields:{...item.draft.fields,dailyRhythm:'test rhythm'}},publish:true});assert.equal(store.publicState('index.html',false).profile[0].data.fields.dailyRhythm,'test rhythm');}finally{store.db.close();fs.rmSync(temp,{recursive:true,force:true});}
});
test('public entry points do not disclose the admin URL or package credentials',()=>{
 const readme=fs.readFileSync(path.join(root,'README.md'),'utf8'),home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(!readme.includes('cheney-xiri.github.io/admin/'));assert.ok(!home.includes('href="/admin/"'));
 const build=fs.readFileSync(path.join(root,'scripts/prepare-github-pages.cjs'),'utf8');assert.ok(!build.includes("'\.site-data'"));
 const ignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8');assert.ok(ignore.includes('*连接凭据*.txt'));assert.ok(ignore.includes('cheney-encrypted-login*.json'));
});
