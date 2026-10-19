const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={window:{},document:{getElementById:()=>null}};
for(const f of ['joseki-board.js','joseki-pachi.js','joseki-josekle.js','joseki-variations.js','joseki-books.js','joseki.js'])vm.runInNewContext(fs.readFileSync('assets/'+f,'utf8'),c);
const {JOSEKI_RECORDS:records,JosekiBoard:board}=c.window;let movesChecked=0,fullLines=0;
for(const r of records){const modes=[r];if(r.openingLine){fullLines++;modes.push({...r,...r.openingLine,setup:undefined,firstColor:'black',startNumber:1});}for(const v of modes){const moves=v.moves.split(','),frame=board.frame(moves,v);for(let i=0;i<=moves.length;i++){for(const s of board.replay(moves,i,v).values())assert(s.x>=frame.fromX&&s.x<frame.fromX+frame.size&&s.y>=frame.fromY&&s.y<frame.fromY+frame.size);movesChecked++;}const sgf=board.sgf(v);assert.equal((sgf.match(/;[BW]\[/g)||[]).length,moves.length);assert(sgf.includes('PL['+(v.firstColor==='white'?'W':'B')+']'));}}
assert.equal(new Set(records.map(r=>r.id)).size,records.length);
const report={total:records.length,books:records.filter(r=>r.bookRef).length,fullLines,positionsChecked:movesChecked,stages:Object.fromEntries(['入门','进阶','复杂变化'].map(s=>[s,records.filter(r=>r.studyStage===s).length]))};
fs.writeFileSync('tmp/joseki-book-validation.json',JSON.stringify(report,null,2));console.log(report);
