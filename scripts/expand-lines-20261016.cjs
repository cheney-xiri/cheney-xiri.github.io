'use strict';
const fs=require('node:fs');
const crypto=require('node:crypto');
const groups=JSON.parse(fs.readFileSync('data/lines.json','utf8'));
const normalize=s=>s.normalize('NFKC').replace(/[\p{P}\p{S}\s]/gu,'');
const seen=new Set(groups.flatMap(g=>g.items.map(x=>normalize(x.text))));
const before=Object.fromEntries(groups.map(g=>[g.id,g.items.length]));
const candidates=JSON.parse(fs.readFileSync('tmp/lines-verification-results.json','utf8'));
const manual=new Map(JSON.parse(fs.readFileSync('tmp/lines-manual-verification.json','utf8')).map(x=>[x.text,x]));
const imageSelection=JSON.parse(fs.readFileSync('tmp/lines-image-selection-20261016.json','utf8'));
const added=[];
function append(group,item){if(seen.has(normalize(item.text)))return;const g=groups.find(g=>g.id===group);if(!g)throw Error('Unknown group '+group);g.items.push(item);seen.add(normalize(item.text));added.push({group,...item});}
for(const c of candidates){const m=manual.get(c.text);if(!c.verified&&!m)continue;append(c.group,{text:c.text,kind:'classic',author:c.author,work:c.work,url:m?.url||c.sourceUrl,verification:{method:m?'原文页面人工核对':'公开古籍文本繁简归一后逐句比对',checkedAt:'2026-10-16',sourceTitle:m?c.work:c.sourceTitle,...(m?{note:m.note}:{})}});}
append('courage',{text:'千锤万凿出深山，烈火焚烧若等闲。',kind:'classic',author:'于谦',work:'石灰吟',url:'https://www.gushiwen.cn/mingju/juv_75b8ab9a2969.aspx',verification:{method:'原文页面人工核对',checkedAt:'2026-10-16',note:'按用户要求保留把艰难看作平常的豁达与勇毅表达。'}});
for(const item of imageSelection.items)append(item.group,{text:item.text,kind:'image',image:5,imageItem:item.number,note:'用户提供图片的短句摘录；不将图片标题作为原始署名。'});
const flat=groups.flatMap(g=>g.items);
if(new Set(flat.map(x=>normalize(x.text))).size!==flat.length)throw Error('Duplicate quotes');
fs.writeFileSync('data/lines.json',JSON.stringify(groups,null,2)+'\n');
const deferred=candidates.filter(c=>!c.verified&&!manual.has(c.text)).map(c=>({text:c.text,work:c.work,reason:'本轮未取得可完整匹配的底本文字，暂不导入；不等同于认定句子有误。'}));
const audit={updated:'2026-10-16',scope:'扩充全部六个句笺主题。保留原条目，按主题增加古典诗文与用户提供图片的现代短句。',rules:['不在前台展示作者、书名、来源链接或核验标签。','经典按原文核对；繁简、异体与底本差异在内部记录。未经核对的候选暂缓导入。','图片短句与古典原文分别记录，不采信图片上的统一来源标题。','遵从用户最新偏好，保留将困境看作暂时、小挫折的豁达表达，不强制改为严肃说理。','全库按去标点与空格后的文字去重，原56则保持原文。'],before,after:Object.fromEntries(groups.map(g=>[g.id,g.items.length])),added:added.length,total:flat.length,classicAdded:added.filter(x=>x.kind==='classic').length,imageAdded:added.filter(x=>x.kind==='image').length,imageSelection,deferred,addedItems:added};
fs.writeFileSync('data/lines-expansion-20261016.json',JSON.stringify(audit,null,2)+'\n');
const selection=JSON.parse(fs.readFileSync('data/writing-selection.json','utf8'));selection.linesExpansion={updated:audit.updated,total:audit.total,added:audit.added,record:'data/lines-expansion-20261016.json',scope:audit.scope};fs.writeFileSync('data/writing-selection.json',JSON.stringify(selection,null,2)+'\n');
const source='scripts/build-writing.cjs';let generator=fs.readFileSync(source,'utf8');generator=generator.replace("const v='20261016-08';","const v='20261016-09';");fs.writeFileSync(source,generator);
const home=fs.readFileSync('index.html','utf8');
const preserved=home.replace(/<section class="juan" id="writing">[\s\S]*?<\/section>/,'WRITING_SECTION').replace(/assets\/writing\.css\?v=[^"]+/,'WRITING_STYLE');
const music=fs.readdirSync('assets').filter(f=>/^music/.test(f)).map(f=>({file:f,hash:crypto.createHash('sha256').update(fs.readFileSync('assets/'+f)).digest('hex')}));
fs.writeFileSync('tmp/lines-before-expansion-20261016/preserved-home-and-music.json',JSON.stringify({home:preserved,music},null,2));
console.log(JSON.stringify({added:audit.added,total:audit.total,classicAdded:audit.classicAdded,imageAdded:audit.imageAdded,groups:groups.map(g=>({name:g.name,before:before[g.id],after:g.items.length}))},null,2));
