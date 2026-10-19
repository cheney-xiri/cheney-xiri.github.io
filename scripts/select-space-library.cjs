'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const categories=JSON.parse(fs.readFileSync('tmp/nasa-library-groups.json'));
const jobs=JSON.parse(fs.readFileSync('tmp/nasa-library-candidates.json'));
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&#8217;|&#039;/g,"'").replace(/&amp;/g,'&').replace(/&#[0-9]+;/g,' ').replace(/\s+/g,' ').trim();
for(const [file,group] of [['globular-cluster','星团与恒星诞生'],['star-cluster','星团与恒星诞生'],['galaxy-cluster','星系团与宇宙学'],['Chandra','黑洞与高能宇宙']]){
 const files=fs.readdirSync('tmp').filter(f=>new RegExp('^wp-'+file+'(?:-[0-9]+)?\\.json$').test(f));
 const wp=files.flatMap(f=>JSON.parse(fs.readFileSync('tmp/'+f)));const rows=[];const wpTitles=new Set();
 for(const x of wp){const title=clean(x.title.rendered),desc=clean(x.caption.rendered),intro=title+' '+desc.slice(0,200);if(!x.source_url||!/\.nasa\.gov\//.test(x.source_url))continue;
 if(!x.mime_type?.startsWith('image/')||/thm|searchweb|_print|insets|circles|compass|annotat|search\.jpg|thumb|poster|zoom|dome|\.mp4/i.test(title))continue;
 const canonical=desc.toLowerCase().slice(0,180)||title.toLowerCase();if(wpTitles.has(canonical))continue;wpTitles.add(canonical);
 if(group==='星团与恒星诞生'&&(!/globular|star cluster|stellar cluster|stellar nursery|star.forming|star formation/i.test(intro)||/galaxy|galaxies|dark matter|\bM87\b|elliptical/i.test(title)))continue;
 if(group==='星系团与宇宙学'&&(!/galaxy cluster|cluster of galaxies|galactic cluster|abell|MACS|deep field|gravitational lens|galaxies in the cluster/i.test(intro)||/star cluster|globular/i.test(title)))continue;
 if(group==='黑洞与高能宇宙'&&!/supernova|pulsar|black hole|neutron star|cassiopeia|x-ray|SN 1987A|SN 1006|crab nebula/i.test(intro))continue;
 const image=x.media_details?.sizes?.large?.source_url||x.source_url;
 rows.push({id:'science-'+x.id,title:group==='星团与恒星诞生'?'星团与恒星诞生':group==='星系团与宇宙学'?'星系团与深场':'高能宇宙观测',officialTitle:title,officialDescription:desc,officialAlt:clean(x.alt_text),category:group,query:file,metadataDate:x.date,sourcePage:x.link,sourceImage:image,credit:clean(x.credits||x.nasa_hds_core_meta_image_credit)||'完整署名见 NASA 官方图源',scienceId:x.id,migrationSource:x.migration_source_url||'',originalDate:x.original_date});
 }jobs.unshift({group,q:'NASA Science '+file,items:rows});
}
const initial=JSON.parse(fs.readFileSync('tmp/physics-before-expansion-20261017/physics.json'));
const research=JSON.parse(fs.readFileSync('tmp/nasa-expansion-research.json')).filter(x=>x.landmark&&!x.error);
const aliases={'黑洞与时空':'黑洞与高能宇宙','太阳系':'太阳系行星','宇宙学与观测':'星系团与宇宙学'};
const raw=initial.images.map(x=>({...x,category:['crab','cassiopeia'].includes(x.id)?'黑洞与高能宇宙':x.id==='deepfield'?'星系团与宇宙学':x.id==='ngc604'?'星团与恒星诞生':aliases[x.category]||x.category,existing:true}));
for(const x of research){let category=aliases[x.category]||x.category;
 if(['earthrise','blue-marble','apollo-bootprint','pale-blue-dot'].includes(x.id))category='地球与月球';
 if(x.id==='hubble-deep-1995'||x.id==='hubble-ultra-deep')category='星系团与宇宙学';
 raw.push({...x,category});}
const seen=new Set(raw.map(x=>x.sourceImage));
const selected=[...raw];
// Reject search hits that mention the target only incidentally, tourist/equipment portraits,
// and educational title cards. Preserve useful observed composites and actual data maps.
const bad=/\b(?:assembled|illustrated|illustration|artist|concept|animation|simulat|visualiz|comparison|diagram|infographic|spectrum|spectra|curve|chart|graph|map|zoom|fly.?through|3d|3-d|movie|video|test|facility|mockup|mock-up|technician|engineer|laboratory|press|briefing|conference|assembly|payload|launch|rocket|astronaut|crew|selfie|suit|patch|medallion|insignia|logo|stamp|signing|visitor|press kit|fact sheet|eclipse glasses|lenses|students|classroom|equipment|polar projection|rotation|topographic|perspective|profile|annotated|stereo|stereoscopic|mosaic location|hertzsprung|ultrasonic|sound)\b|photograph of.*(?:camera|telescope)|landing site.*(?:map|diagram)/i;
const usedIds=new Set();
 const manualReject=new Set(['PIA17409','GSFC_20171208_Archive_e000383','GSFC_20171208_Archive_e000382','GSFC_20171208_Archive_e000409','hubbles-blue-bubble_24908262259_o','PIA23867','PIA06339','PIA06340','PIA11827','PIA09965','GSFC_20171208_Archive_e002093','GSFC_20171208_Archive_e001014','GSFC_20171208_Archive_e000794','potw1640a','hubble-peers-at-a-distinctly-disorganized-dwarf-galaxy_25568403123_o','GSFC_20171208_Archive_e000389','PIA22350','GSFC_20171208_Archive_e001097','PIA18909','GSFC_20171208_Archive_e002070','PIA15419']);
function usable(x){if(manualReject.has(x.nasaId)||usedIds.has(x.nasaId)||seen.has(x.sourceImage)||bad.test(x.officialTitle))return false;
 const t=x.officialTitle.toLowerCase(),d=x.officialDescription.toLowerCase();
 if(/celebration|event|award|receives|inside orion|atlas|gravity field|orbit of|sizes up|journey|graphic|NICER|explorer|spacecraft|vial|sample|photographic equipment/i.test(t))return false;
 if(x.nasaId?.startsWith('NHQ')&&!/total solar eclipse/i.test(t))return false;
 if(x.category==='彗星与小行星'&&/crater|microscopic|landscape|dunes|rover|spirit/i.test(t))return false;
 if(x.category==='太阳与空间天气'&&/mercury|jupiter|saturn/i.test(t))return false;
 if(x.query==='Sagittarius A'&&!/sagittarius a|black hole|milky way|galactic cent|galaxy.?s cent/i.test(t+' '+d.slice(0,220)))return false;
 if(x.category==='地球与月球'&&/full of moons|from mars|north pole region|\bvenus\b|\bjupiter\b|\bsaturn\b/i.test(t))return false;
 if(/nebula|恒星|星团|高能|宇宙学/.test(x.title+' '+x.category)&&/crater|moon of|surface of (?:mars|venus|mercury)|from mars/i.test(t))return false;
 if(/animation|artist|simulation|visualization|computer-generated|drawing|illustration|3-d|3d |schematic/i.test(d.slice(0,220)))return false;
 if(/artist.s (?:concept|impression|rendering)|artist concept|computer.generated (?:image|illustration)|this illustration|this animation/.test(d.slice(0,450)))return false;
 if(x.category==='太阳系行星'&&/(?:^|\b)(?:mercury (?:atlas|redstone)|project mercury|astronaut|cosmonaut|titan rocket|mars simulation|earth|apollo|space shuttle)(?:\b|$)/i.test(t))return false;
 if(x.category==='星系团与宇宙学'&&x.query.includes('Deep Field')&&!/deep|distant|field/i.test(x.officialTitle))return false;
 if(x.category==='星团与恒星诞生'&&/galaxy|galaxies|supernova remnant|black hole|neutron star/i.test(t))return false;
 if(x.category==='地球与月球'&&/ground view|eclipse.*crowd|watching|observing|viewing|festival|event|briefing/i.test(t))return false;
 if(x.category==='太阳与空间天气'&&/instrument|mission|observatory|spacecraft|telescope|rocket|parker|solar orbiter/i.test(t)&&!/sun|flare|corona|prominence|spot|eclipse|active region|filament/i.test(t))return false;
 return true;}
for(const group of categories){const sources=jobs.filter(j=>j.group===group.name).map(j=>j.items);let count=selected.filter(x=>x.category===group.name).length;
 // Round robin gives breadth: different objects first, additional observations second.
 for(let round=0;round<100&&count<85;round++)for(const rows of sources){const x=rows[round];if(!x||!usable(x)||count>=85)continue;usedIds.add(x.nasaId||x.id);seen.add(x.sourceImage);selected.push(x);count++;}
}
fs.writeFileSync('tmp/nasa-library-selected.json',JSON.stringify(selected,null,2));
fs.writeFileSync('tmp/nasa-library-selection-review.txt',categories.map(g=>g.name+'\n'+selected.filter(x=>x.category===g.name).map(x=>(x.nasaId||x.id)+' | '+x.title+' | '+(x.officialTitle||'CLASSIC / EXISTING')).join('\n')).join('\n\n'));
console.log(JSON.stringify(categories.map(g=>({category:g.name,candidates:selected.filter(x=>x.category===g.name).length})),null,2));
