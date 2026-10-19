'use strict';
const fs=require('node:fs');
const excluded=new Set(fs.existsSync('tmp/space-visual-exclusions.json')?JSON.parse(fs.readFileSync('tmp/space-visual-exclusions.json')):[]);
const prepared=JSON.parse(fs.readFileSync('tmp/nasa-library-prepared.json')).filter(x=>!excluded.has(x.id));
const original=JSON.parse(fs.readFileSync('tmp/physics-before-expansion-20261017/physics.json'));
const groups=JSON.parse(fs.readFileSync('tmp/nasa-library-groups.json'));
const months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
const format=d=>d.replace(/-/g,'.');
const known={
 'earthrise':['1968-12-24','拍摄','NASA / Bill Anders'],
 'pale-blue-dot':['1990-02-14','拍摄','NASA/JPL-Caltech'],
 'blue-marble':['1972-12-07','拍摄','NASA'],
 'apollo-bootprint':['1969','拍摄','NASA'],
 'earth-smiled':['2013-07-19','拍摄','NASA/JPL-Caltech/Space Science Institute'],
 'hubble-deep-1995':['1995','观测','NASA, ESA, R. Williams (STScI), and the Hubble Deep Field Team'],
 'hubble-ultra-deep':['2004','影像发布','NASA, ESA, S. Beckwith (STScI) and the HUDF Team'],
 'pillars-hubble-1995':['1995','观测','NASA, ESA, STScI, J. Hester and P. Scowen (Arizona State University)'],
 'm87-eht':['2019-04-10','影像发布','Event Horizon Telescope Collaboration'],
 'sgra-eht':['2022-05-12','影像发布','EHT Collaboration'],
 'wmap-cmb':['2012','九年数据发布','NASA / WMAP Science Team'],
 'bullet-cluster':['2025','影像发布',null]
};
const names=[['Orion','猎户座'],['Horsehead','马头星云'],['Lagoon','礁湖星云'],['Trifid','三裂星云'],['Eagle','鹰状星云'],['Carina','船底座星云'],['Tarantula','蜘蛛星云'],['Helix','螺旋星云'],['Ring Nebula','环状星云'],['Cat.?s? Eye','猫眼星云'],['Butterfly','蝴蝶星云'],['Twin Jet','双喷流星云'],['Rosette','玫瑰星云'],['Pacman','吃豆人星云'],['Rho Ophiuchi','蛇夫座 ρ'],['Whirlpool','涡状星系'],['Andromeda','仙女座星系'],['Sombrero','草帽星系'],['Antennae','触须星系'],['Stephan','斯蒂芬五重星系'],['Centaurus.?A','半人马座 A'],['Triangulum','三角座星系'],['Omega.?Centauri|omega.cen','半人马座 ω 星团'],['Coronet','南冕座星团'],['Quintuplet','五胞胎星团'],['Pleiades','昂宿星团'],['Wild Duck','野鸭星团'],['Crab','蟹状星云'],['Cassiopeia','仙后座 A'],['Tycho.*Supernova|Tycho.?s Star','第谷超新星遗迹'],['Kepler.*Supernova','开普勒超新星遗迹'],['Sagittarius A','人马座 A 区域'],['Perseus','英仙座星系团'],['Fornax','天炉座星系团'],['Virgo','室女座星系团'],['Coma','后发座星系团'],['Mercury','水星'],['Venus','金星'],['Jupiter','木星'],['Saturn','土星'],['Uranus','天王星'],['Neptune','海王星'],['Pluto','冥王星'],['Europa','木卫二'],['Ganymede','木卫三'],['Callisto','木卫四'],['Enceladus','土卫二'],['Titan','土卫六'],['Rhea','土卫五'],['Mimas','土卫一'],['Iapetus','土卫八'],['Dione','土卫四'],['Tethys','土卫三'],['Triton','海卫一'],['Charon','冥卫一'],['Vesta','灶神星'],['Ceres','谷神星'],['Bennu','贝努'],['Eros','爱神星'],['Gaspra','伽斯普拉'],['Ida','艾达'],['Mathilde','马蒂尔德'],['Hartley','哈特雷 2 号彗星'],['Tempel','坦普尔 1 号彗星'],['Wild 2','怀尔德 2 号彗星'],['Hale.Bopp','海尔-波普彗星'],['Halley','哈雷彗星']];
const suffixes=[['bow shock','弓形激波'],['five observatories','五台天文台'],['south pole','南极'],['north pole','北极'],['great red spot','大红斑'],['hexagon','六边形风暴'],['cloud top','云顶'],['crescent','新月形视角'],['twilight','暮光'],['ring','光环'],['plume','喷流'],['aurora','极光'],['crater','陨石坑'],['ridge','脊状地形'],['landslide','滑坡'],['sunset','日落'],['sunrise','日出'],['color','彩色影像'],['haze','薄雾'],['limb','临边'],['surface','表面'],['detail','局部'],['panoram','全景'],['infrared','红外'],['x.ray','X 射线'],['hubble','哈勃'],['herschel','赫歇尔'],['spitzer','斯皮策'],['wise','WISE'],['dawn','黎明号'],['chandra','钱德拉']];
const special={
 'PIA04227':'猎户座星云与弓形激波','PIA13448':'猎户座火焰星云','PIA23556':'木星南极气旋','PIA01539':'海王星南极 · 飞掠之后','PIA14449':'海卫一 · 火山羽流','PIA19968':'冥卫一 · 增强色影像','PIA11708':'冥卫一 · 冥王星反照光','PIA01510':'木卫四 · 远距离视角','PIA09246':'木卫二 · 伽利略号视角','PIA19880':'冥王星 · 大气薄雾','PIA00333':'小行星艾达与卫星达克蒂尔'
};
function nameFor(x){
 if(x.existing||x.landmark)return x.title;if(special[x.nasaId])return special[x.nasaId];
 const t=x.officialTitle||'',d=x.officialDescription||'';
 const catalog=t.match(/\b(?:NGC|IC|Abell|MACS|SMACS|SN|RCW|MSH|W49B|3C)\s*[-J\d.+]+|\bM\s?\d{1,3}\b/i)||d.slice(0,900).match(/\b(?:NGC|IC|Abell|MACS|SMACS|SN|RCW|MSH|W49B|3C)\s*[-J\d.+]+|\bM\s?\d{1,3}\b/i);
 let label=x.title;
 const titleName=names.find(([pattern])=>new RegExp('\\b(?:'+pattern+')\\b','i').test(t));
 if(titleName)label=titleName[1];else if(catalog)label=catalog[0].replace(/(NGC|IC|Abell|SN|RCW|MSH|MACS|SMACS)\s*/i,'$1 ');
 if(x.scienceId&&!titleName&&!catalog){const fromText=names.find(([pattern])=>new RegExp('\\b(?:'+pattern+')\\b','i').test(d.slice(0,500)));if(fromText)label=fromText[1];else if(!/\.(jpg|png|tif|mp4)|^[A-Z0-9_-]+$/i.test(t))return t;}
 if(x.category==='太阳与空间天气'){
  if(/total solar eclipse/i.test(t))return '日全食'+(x.metadataDate?' · '+x.metadataDate.slice(0,4):'');
  if(/flare/i.test(t))label='太阳耀斑';else if(/coronal hole/i.test(t))label='日冕洞';else if(/prominence/i.test(t))label='日珥';else if(/sunspot/i.test(t))label='太阳黑子';else if(/filament/i.test(t))label='太阳丝状体';else if(/active region/i.test(t))label='太阳活动区';else label='太阳大气';
 }
 const suffix=suffixes.find(([pattern])=>new RegExp(pattern,'i').test(t));
 if(suffix&&!label.includes(suffix[1])&&!(suffix[1]==='光环'&&/星云/.test(label)))label+=' · '+suffix[1];
 return label;
}
function dateFor(x){
 if(known[x.id]){const [date,kind]=known[x.id];return {date,dateKind:kind,year:date.slice(0,4),dateLabel:kind+' · '+format(date)};}
 const t=x.officialDescription||'';
 const datePattern='(January|February|March|April|May|June|July|August|September|October|November|December|Jan\\.?|Feb\\.?|Mar\\.?|Apr\\.?|Jun\\.?|Jul\\.?|Aug\\.?|Sep\\.?|Sept\\.?|Oct\\.?|Nov\\.?|Dec\\.?)\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+((?:19|20)\\d{2})';
 const found=t.match(new RegExp('(?:was taken|were taken|was captured|were captured|was acquired|were acquired|image was obtained|imaged on|observed on|taken on|captured on|acquired on)[^.!?]{0,100}?'+datePattern,'i'));
 if(found){const m=months[found[1].toLowerCase().replace('.','')],date=found[3]+'-'+String(m).padStart(2,'0')+'-'+found[2].padStart(2,'0');if(m&&found[2]<=31)return {date,dateKind:'观测',year:found[3],dateLabel:'观测 · '+format(date)};}
 const fileYear=(x.officialTitle||'').match(/^(?:hs-)?((?:19|20)\d{2})[-_]/);
 if(fileYear)return {date:fileYear[1],dateKind:'官方文件标年',year:fileYear[1],dateLabel:'影像标年 · '+fileYear[1]};
 const date=(x.metadataDate||'').slice(0,10);
 if(date)return {date,dateKind:'NASA 条目日期',year:date.slice(0,4),dateLabel:'NASA 条目 · '+format(date)};
 if(x.year)return {date:x.year,dateKind:'影像年份',year:x.year,dateLabel:'影像年份 · '+x.year};
 const resourceYear=x.sourceImage?.match(/\/((?:19|20)\d{2})\/\d{2}\//)?.[1];
 if(resourceYear)return {date:resourceYear,dateKind:'官方资源标年',year:resourceYear,dateLabel:'资源标年 · '+resourceYear};
 return null;
}
function typeFor(x){
 if(x.type)return x.type;const text=(x.officialTitle||'')+' '+(x.officialDescription||'').slice(0,900);
 if(/radar/i.test(text))return '雷达观测 · 数据处理影像';
 if(/enhanced.color|false.color|false color/i.test(text))return '观测影像 · 增强色或波段映射';
 if(/composite|combines.*(?:image|data)|multiwavelength/i.test(text))return '观测数据合成影像';
 if(/x.ray/i.test(text))return '含 X 射线观测的处理影像';
 if(/infrared/i.test(text))return '含红外观测的处理影像';
 return '观测资料影像 · 色彩及处理方式见官方图源';
}
async function datesForExisting(){await Promise.all(prepared.filter(x=>x.existing&&!known[x.id]).map(async x=>{
 try{const file='tmp/nasa-original-'+x.id+'.html';let html;if(fs.existsSync(file))html=fs.readFileSync(file,'utf8');else{const r=await fetch(x.sourcePage,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(r.status);html=await r.text();fs.writeFileSync(file,html);}
 const published=html.match(/property="article:published_time"[^>]*content="([^"]+)"/)?.[1]||html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1];
 if(published){x.date=published.slice(0,10);x.year=x.date.slice(0,4);x.dateKind='影像发布';x.dateLabel='发布 · '+format(x.date);}
 }catch(e){console.log('Date lookup',x.id,e.message);}
}));}
(async()=>{await datesForExisting();
 const images=prepared.map(x=>{const title=nameFor(x);const time=x.dateLabel?{date:x.date,year:x.year,dateKind:x.dateKind,dateLabel:x.dateLabel}:dateFor(x);if(!time)throw Error('Missing date: '+x.id);
 const credit=known[x.id]?.[2]||x.credit||'完整署名见 NASA 官方图源';
 return {id:x.id,title,category:x.category,officialTitle:x.officialTitle||x.english||x.pageTitle||'',...time,type:typeFor(x),local:x.local,thumbnail:x.thumbnail,width:x.width,height:x.height,alt:title+'，NASA 官方资料页收录的宇宙影像。',description:x.existing?x.description||'':'',credit,sourcePage:x.sourcePage,sourceImage:x.sourceImage,...(x.landmark?{landmark:true,significance:x.significance,timelineYear:x.year||time.year}:{}),...(x.nasaId?{nasaId:x.nasaId}:{}),dateEvidence:x.dateLabel?'NASA 原页发布元数据':time.dateKind==='观测'?'NASA 原始说明中的观测日期':time.dateKind==='NASA 条目日期'?'NASA 官方图片资料库记录时间':time.dateKind==='官方文件标年'?x.officialTitle:'NASA 官方原页'};
 });
 for(const id of ['deepfield','pillars','cliffs']){const x=images.find(x=>x.id===id);x.landmark=true;x.timelineYear=x.year;x.significance=id==='deepfield'?'韦伯首批公开科学影像中的深场，借助星系团的引力透镜展示遥远宇宙。':id==='pillars'?'韦伯以近红外视角重访创生之柱，为恒星形成提供不同于可见光的观测。':'韦伯首批科学影像中的恒星形成区，呈现气体、尘埃与年轻恒星。';}
 original.images=images;original.categories=groups.map(g=>g.name);original.updated='2026-10-17';
 original.internal.datePolicy='优先标注可核实的观测或拍摄日期；其次为原页影像发布时间、官方文件标年；其余明确标注 NASA 条目日期，不视作观测日期。';
 fs.writeFileSync('data/physics.json',JSON.stringify(original,null,2));
 console.log(JSON.stringify({total:images.length,categories:groups.map(g=>({name:g.name,count:images.filter(x=>x.category===g.name).length})),dateTypes:images.reduce((a,x)=>(a[x.dateKind]=(a[x.dateKind]||0)+1,a),{})},null,2));
})();
