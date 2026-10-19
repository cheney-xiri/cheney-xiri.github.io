// Extract factual board coordinates from official Go Books EPUB samples.
// Requires the locally extracted EPUBs in tmp/. No source images or chapters are published.
const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');
const letters = 'ABCDEFGHJKLMNOPQRST';
const clean = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const books = {
  revolution: { dir: 'joseki-revolution-sample', title: 'Joseki Revolution', author: '芝野虎丸 九段', epub: 'sg0169_ki_k90', family: 'Q16' },
  strong1: { dir: 'sg0138_ki_k52', title: 'Get Strong at Joseki 1', author: 'Richard Bozulich', epub: 'sg0138_ki_k52', family: 'R16' },
  strong2: { dir: 'sg0139_ki_k53', title: 'Get Strong at Joseki 2', author: 'Richard Bozulich、Furuyama Kazunari', epub: 'sg0139_ki_k53', family: 'Q15' },
  strong3: { dir: 'sg0140_ki_k54', title: 'Get Strong at Joseki 3', author: 'Richard Bozulich、Furuyama Kazunari', epub: 'sg0140_ki_k54', family: 'Q16' },
  correct: { dir: 'sg0036_ss_deal', title: 'Correct Joseki', author: '江鸣久 七段、郭鹃 五段', epub: 'sg0036_ss_deal', family: 'Q16' }
};
const additional = require('./book-selections-oct15.cjs');
Object.assign(books, additional.books);
// Deliberate selections: exclude quiz overlays, failed lines, mere approach diagrams.
// Notes are brief Chinese summaries of the accompanying professional commentary.
const selections = [];
const add = (book, file, index, name, note, stage, family) => selections.push({ book, file: file + '.xhtml', index, name, note, stage, family });
[
 [1,'星位夹击后 · 托与安定','托的变化至白12，书中评为两分。'],
 [3,'星位夹击后 · 飞守角','飞守可行，白棋仍有取利的余地。'],
 [4,'三三守角后 · 跳出与窥','白跳后黑窥，转而取得右边实利。'],
 [5,'三三守角后 · 压与取地','对白棋的压，黑以2、4取得右边实地。']
].forEach(x=>add('revolution','ch1',...x,'进阶'));
const intro1 = [
 [3,'小目高挂 · 托退实接','白实接后，双方拆边。'],[4,'小目高挂 · 四线展开','黑白改向四线发展。'],
 [5,'小目高挂 · 虎口连接','白虎后可拆得更远。'],[6,'小目高挂 · 窥后发展','黑窥后向边上发展。'],
 [8,'雪崩 · 简明取角','黑取角，白取外势。'],[10,'雪崩 · 二段扳后续','白取右边，黑取上边。'],[12,'小雪崩 · 双方提花','双方各提一子，结果两分。'],
 [13,'小目高挂 · 外托基本型','黑棋以右边外势为目标。'],[14,'小目外托 · 回角取地','黑回角取地也是定式。'],[15,'小目外托 · 扳出取势','黑扳出以发展右边。'],
 [16,'小目外托 · 二段扳','黑取厚势，白弃子仍有余味。'],[17,'小目外托 · 白长黑断','黑取角，白以后须整形。'],[18,'小目外托 · 简明应贴','黑保持简明的取势方针。'],
 [20,'小目高挂 · 小飞后托','白托后双方定型。'],[21,'小目小飞 · 长出取地','黑向右边拆，取得实地。'],[22,'小目小飞 · 紧凑应法','黑紧应后拆边。'],
 [24,'小目高挂 · 夹后托角','夹后托角是常见续法。'],[25,'小目夹攻 · 白尖取势','白取势，黑取上边实利。'],[26,'小目夹攻 · 向边跳出','白向边跳也是定式。']
];
intro1.forEach(x=>add('strong1','intro',...x,/雪崩|二段扳/.test(x[1])?'复杂变化':undefined));
[[1,'小目夹攻 · 贴后安定','白贴后迫黑守，结果两分。'],[2,'小目托退 · 扳出整形','白向上扳，再整形。'],[3,'小目托退 · 打出连接','白打后长，连接取厚势。'],[4,'小目出头 · 愚形妙手','白1、3用于向中央出头。'],[5,'小目应压 · 挡住侵入','白顾左边，黑发展右边。'],[6,'小目断点 · 征子应对','须以征子对白有利为前提。']].forEach(x=>add('strong1','prob'+x[0],1,...x.slice(1),x[0]===6?'复杂变化':'进阶'));
const intro2 = [[3,'高目 · 内托基本型','白安定，黑拆边。'],[4,'高目内托 · 上边发展','白转向上边定型。'],[6,'高目 · 外托断出','黑退后切断。'],[7,'高目外托 · 退让取势','白取地，黑取外势。'],[10,'高目小飞 · 托角变化','此型须白方征子有利。'],[11,'高目小飞 · 左侧托','白托后有多种应法。'],[12,'高目小飞 · 重视右边','黑重视右边与中央。'],[15,'目外 · 压长基本型','白取三线实地，黑取势。'],[16,'目外压长 · 一间跳','黑跳后仍可向边展开。']];
intro2.forEach(x=>add('strong2','intro',...x,undefined,x[0]>=15?'R15':'Q15'));
[[1,'高目内托 · 眼形要点','白占眼形要点后可脱先。'],[2,'高目内托 · 下立制根','黑下立破根，白轻灵处理。'],[3,'高目内托 · 消除借用','黑3避免留下白棋的先手。'],[4,'高目外托 · 提子整形','白提后轻灵处理。'],[5,'高目小飞 · 先手交换','取先手会牺牲部分厚度。'],[6,'高目内托 · 战斗续法','黑先接，再作先手交换。']].forEach(x=>add('strong2','prob'+x[0],1,...x.slice(1),x[0]===6?'复杂变化':'进阶'));
const intro3 = [[5,'星位小飞应挂 · 托角定型','白托角后局部定型。'],[6,'星位小飞应挂 · 夹后入角','黑封锁，白取角。'],[8,'星位应挂 · 四线展开','白向四线发展。'],[11,'星位应挂 · 轻灵整形','白轻灵处理至7定型。'],[12,'星位应挂 · 加压续法','白11紧黑棋的气。'],[14,'星位托挂 · 右边安定','白安定，黑得上边厚势。'],[15,'星位托挂 · 挡住角地','黑挡以重视角地。'],[16,'星位托挂 · 外接变化','黑提子后跳出。'],[17,'星位托挂 · 弃子取势','黑弃二子，双方取势。'],[18,'星位托挂 · 征子分支','须白征有利，白角黑势。'],[20,'星位三间高夹 · 入角','黑封挡，向夹子取势。'],[21,'星位三间高夹 · 双飞','双飞后双方平稳定型。'],[22,'星位三间高夹 · 战斗分支','黑18保全角部。'],[23,'星位三间高夹 · 重视实地','黑防白轻易点三三。'],[24,'星位三间高夹 · 简明取势','黑用简明手段取厚势。'],[25,'星位三间高夹 · 飞攻续法','黑飞后白爬，黑长定型。'],[27,'星位高双飞 · 连片取厚','有夹子时黑推连取厚。'],[28,'星位高双飞 · 托后入角','白入角，双方定型。'],[29,'星位高双飞 · 提子与劫味','后续可能发生劫争。'],[30,'星位高双飞 · 弃角取势','白弃入角子取外势。'],[32,'星位二间高夹 · 点三三','黑12收束此型。'],[33,'星位二间高夹 · 双飞应托','黑托后至10定型。'],[34,'星位夹攻 · 配合远方星位','黑配合远方子成模样。'],[35,'星位夹攻 · 限制模样','白限制模样但位置偏低。']];
intro3.forEach(x=>add('strong3','intro',...x,/征子|战斗|劫味/.test(x[1])?'复杂变化':undefined));
[[1,'星位入角 · 接住减势','白接可减轻黑棋厚势。'],[2,'星位入角 · 先手做活','白先手活，黑仍有取厚手段。'],[3,'星位夹攻 · 对无理断的攻杀','黑先交换，再对杀。'],[4,'星位夹攻 · 轻弃二子','黑轻弃二子取右边。'],[5,'星位夹攻 · 顾中央模样','黑跳以保护中央。'],[6,'星位入角 · 先手封边','黑封边，白必须应。']].forEach(x=>add('strong3','prob'+x[0],1,...x.slice(1),x[0]===3?'复杂变化':'进阶'));
[[3,'小目 · 下立应法','白下立后的定式续法。'],[4,'小目 · 另一侧下立','白换方向下立，黑对应处理。'],[13,'小目 · 稳健收束','白7安全，是正常定式。']].forEach(x=>add('correct','ch1',...x,'进阶','R16'));
[[5,'星位夹攻 · 配合全局','黑子配合上边模样。'],[6,'星位夹攻 · 先手取势','黑配合上边并取先手。'],[10,'星位夹攻 · 扩大模样','黑5改善全局配合。'],[11,'星位宽夹 · 攻击方向','夹攻方向配合黑模样。'],[12,'星位宽夹 · 另一应法','双方可下，黑与模样配合。']].forEach(x=>add('correct','ch17',...x,'进阶'));

selections.push(...additional.selections);
function extract(svg) {
  const [,,width,height] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const edge = [...svg.matchAll(/<path[^>]*stroke-width="2.0"[^>]*>/g)].map(m=>m[0]).join('');
  const left = /M12,(?:0|11)V/.test(edge);
  const top = /M(?:0|11),12H/.test(edge);
  const right = new RegExp('M'+(width-12)+',(?:0|11)V').test(edge);
  const bottom = new RegExp('M(?:0|11),'+(height-12)+'H').test(edge);
  if ((!left && !right)||(!top && !bottom)) throw Error('Ambiguous board edges');
  const toPoint = (x,y) => {
    const gx = (x-12)/24 + (left?0:19-width/24);
    const gy = (y-12)/24 + (top?0:19-height/24);
    if(!Number.isInteger(gx)||!Number.isInteger(gy)||gx<0||gx>18||gy<0||gy>18) throw Error('Invalid grid point');
    return letters[gx]+(19-gy);
  };
  const setup={black:[],white:[]}, numbered=new Map(), labels=new Map(), stack=[], sourceStones=[];
  for(const t of svg.matchAll(/<g\b[^>]*>|<\/g>|<use\b[^>]*>|<text\b[^>]*>[\s\S]*?<\/text>/g)) {
    const tag=t[0];
    if(tag.startsWith('<g')) { stack.push(tag.match(/gb:v="([^"]+)"/)?.[1]); continue; }
    if(tag==='</g>') {stack.pop();continue;}
    if(tag.startsWith('<text')) {
      const label=tag.match(/>(\d+)<\/text>/)?.[1];
      const range=stack.filter(Boolean).at(-1);
      if(label&&range) {
        const n=Number(range.split(' ')[0]);
        const move=toPoint(Number(tag.match(/\bx="([^"]+)"/)[1]),Number(tag.match(/\by="([^"]+)"/)[1]));
        if(n>0)labels.set(n,{number:Number(label),move});
      }
      continue;
    }
    const stone=tag.match(/xlink:href="#([bw])"/); if(!stone) continue;
    const color=stone[1]==='b'?'black':'white';
    const move=toPoint(Number(tag.match(/\bx="([^"]+)"/)[1]),Number(tag.match(/\by="([^"]+)"/)[1]));
    const range=stack.filter(Boolean).at(-1);
    const n=range?Number(range.split(' ')[0]):0;
    sourceStones.push({move,color,range});
    if(!n) setup[color].push(move);
    else {if(numbered.has(n))throw Error('Duplicate move '+n);numbered.set(n,{move,color});}
  }
  // Replay steps and printed move numbers differ on continuation diagrams.
  // Lettered hypothetical moves can also be animated: never import them as main-line moves.
  const lastStep=Math.max(...labels.keys());
  const numbers=[...numbered.keys()].filter(n=>n<=lastStep).sort((a,b)=>a-b);
  if(!numbers.length)throw Error('No numbered continuation');
  const firstStep=numbers[0];
  const startNumber=labels.get(firstStep)?.number;
  if(!startNumber)throw Error('Missing printed first move');
  const firstColor=numbered.get(firstStep).color;
  const moves=numbers.map((n,i)=>{
    if(n!==i+firstStep)throw Error('Missing move '+(i+firstStep));
    if(labels.get(n)?.number!==i+startNumber||labels.get(n)?.move!==numbered.get(n).move)throw Error('Printed label mismatch at '+n);
    if(numbered.get(n).color!==((i%2)?(firstColor==='black'?'white':'black'):firstColor))throw Error('Color mismatch');
    return numbered.get(n).move;
  });
  const expected=sourceStones.filter(s=>!s.range||s.range.split(' ').filter(n=>Number(n)<=lastStep).length%2===1).map(s=>s.color+':'+s.move).sort();
  return {setup,firstColor,startNumber,moves:moves.join(','),expected};
}
const context={window:{},document:{getElementById:()=>null}};vm.runInNewContext(fs.readFileSync('assets/joseki-board.js','utf8'),context);
for (const file of ['joseki-pachi.js','joseki-josekle.js','joseki-variations.js','joseki.js']) vm.runInNewContext(fs.readFileSync('assets/'+file,'utf8'),context);
function boardKey(stones) {
  const variants=[];
  for(let flip=0;flip<2;flip++)for(let turn=0;turn<4;turn++)variants.push([...stones.values()].map(s=>{
    let x=flip?18-s.x:s.x,y=s.y;
    for(let t=0;t<turn;t++)[x,y]=[18-y,x];
    return s.color[0]+':'+x+','+y;
  }).sort().join('|'));
  return variants.sort()[0];
}
const existingPositions=new Map();
for(const record of context.window.JOSEKI_RECORDS) {
  const board=context.window.JosekiBoard.replay(record.moves.split(','));
  existingPositions.set(boardKey(board),record.id);
}
const records=[],audit=[],seen=new Set();
for(const s of selections){
  const b=books[s.book],path='tmp/'+b.dir+'/OPS/'+s.file,html=fs.readFileSync(path,'utf8');
  const figures=[...html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g)];
  const figure=figures[s.index][1],svg=figure.match(/<svg\b[\s\S]*?<\/svg>/)[0];
  try {
    const position=extract(svg);
    const finalBoard=context.window.JosekiBoard.replay(position.moves.split(','),undefined,position);
    const actual=[...finalBoard.values()].map(s=>s.color+':'+letters[s.x]+(19-s.y)).sort();
    if(JSON.stringify(actual)!==JSON.stringify(position.expected))throw Error('Final position differs from source diagram');
    delete position.expected;
    const finalKey=boardKey(finalBoard);
    const existingId=existingPositions.get(finalKey);
    if(existingId?.startsWith('book-')){audit.push({...s,status:'duplicate-position',existingId});continue;}
    const signature=JSON.stringify([position.setup.black.slice().sort(),position.setup.white.slice().sort(),position.firstColor,position.moves]);
    if(seen.has(signature)){audit.push({...s,status:'duplicate'});continue;}seen.add(signature);
    const id=existingId||'book-'+s.book+'-'+s.file.replace('.xhtml','')+'-'+s.index;
    const chapter=clean([...html.slice(0,figures[s.index].index).matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/g)].at(-1)?.[1]||'');
    const caption=clean(figure.split('</svg>')[1]);
    const familyCode=s.family||b.family;
    const groupKey='book:'+s.book+':'+crypto.createHash('sha256').update(JSON.stringify(position.setup)).digest('hex').slice(0,12);
    const stage=s.stage||(position.moves.split(',').length>=16?'复杂变化':position.moves.split(',').length<=8?'入门':'进阶');
    records.push({id,name:s.name,original:b.title+' / '+chapter+' / '+caption,source:b.author+'《'+b.title+'》 · '+chapter+' · '+caption,sourceType:'书籍选读',url:'https://gobooks.com/books/epubs/'+b.epub+'_sample.epub',bookRef:{title:b.title,author:b.author,chapter,figure:caption},...position,familyCode,topicKeyOverride:groupKey,topicTitleOverride:s.name,stageOverride:stage,kind:'定式续谱',outcome:['书籍选读',stage],overview:[s.note,'无数字棋子为书中给定的前置棋形；数字保留本图手顺，可从初始棋形逐手播放。'],note:'据官方电子试读图录入落点；文字为对应专业讲解的简要归纳，并非全章转录。传统定式的评价保留书中语境，不作当前 AI 最优结论。'});
    const output=records.at(-1);
    if(existingId) {
      const original=context.window.JOSEKI_RECORDS.find(r=>r.id===existingId);
      output.openingLine={moves:original.moves,source:original.source};
      output.overview[1]='完整起手谱保留此前收录的全部着法；书图续谱保留书中编号与前置棋形。两者终局棋形相同，摆放方向可能不同。书中手数请在「书图续谱」中对照。';
    }
    if(b.license) {
      output.bookRef.license=b.license;
      output.bookRef.creditUrl=b.creditUrl;
      output.note='基于 Go Game Guru 2016 年开放许可版作中文归纳并转换为电子棋谱。仅所涉书籍衍生内容按 CC BY-NC-SA 4.0 提供；保留原作者署名，非商业使用，相同方式共享。';
    }
    existingPositions.set(finalKey,id);
    audit.push({...s,id,status:existingId?'updated':'imported',moves:position.moves.split(',').length,sha256:crypto.createHash('sha256').update(svg).digest('hex')});
  } catch(error){audit.push({...s,status:'excluded',reason:error.message});}
}
fs.mkdirSync('data/joseki/books',{recursive:true});
fs.writeFileSync('assets/joseki-books.json',JSON.stringify(records,null,2)+'\n');
fs.writeFileSync('assets/joseki-books.js','window.JOSEKI_BOOKS = '+JSON.stringify(records)+';\n');
fs.writeFileSync('data/joseki/books/import-audit.json',JSON.stringify({date:'2026-10-15',books,results:audit},null,2)+'\n');
console.log(JSON.stringify({added:audit.filter(a=>a.status==='imported').length,updated:audit.filter(a=>a.status==='updated').length,byBook:Object.fromEntries(Object.keys(books).map(k=>[k,audit.filter(a=>a.book===k&&['imported','updated'].includes(a.status)).length])),excluded:audit.filter(a=>!['imported','updated'].includes(a.status))},null,2));
