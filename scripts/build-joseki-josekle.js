// Import Josekle's cached OGS "Joseki: Done" puzzles as replayable records.
// Josekle's hard.js is built from OGS nodes tagged Joseki: Done, without passes.
// Current OGS metadata is included only where an API response was saved locally.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'data/joseki/josekle/hard.js');
const hardText = fs.readFileSync(source, 'utf8');
const puzzles = JSON.parse(hardText.slice(hardText.indexOf('['), hardText.lastIndexOf(']') + 1));
const alphabet = 'ABCDEFGHJKLMNOPQRST';
const boardContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/joseki-board.js'), 'utf8'), boardContext);
const board = boardContext.window.JosekiBoard;

const metadata = new Map();
for (const name of fs.readdirSync(path.join(root, 'tmp')).filter(n => /^ogs-meta-batch-\d+\.json$/.test(n))) {
  for (const item of JSON.parse(fs.readFileSync(path.join(root, 'tmp', name), 'utf8'))) {
    metadata.set(String(item.node_id), item);
  }
}

const existingContext = {
  window: { JOSEKI_PACHI: JSON.parse(fs.readFileSync(path.join(root, 'assets/joseki-pachi.json'), 'utf8')) },
  document: { getElementById: () => null }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/joseki.js'), 'utf8'), existingContext);
const existing = new Set(existingContext.window.JOSEKI_RECORDS.map(record => record.moves));

const tagZh = {
  'Basic': '基础定式', 'Current': '现代常见', 'Position is settled': '局部安定',
  'Fighting pattern': '战斗型', 'Black gets the corner': '黑得角地',
  'Black gets the right': '黑得右边', 'Black gets the top': '黑得上边',
  'Black gets the centre': '黑得中央', 'Black gets sente': '黑得先手',
  'White gets the corner': '白得角地', 'White gets the right': '白得右边',
  'White gets the top': '白得上边', 'White gets the centre': '白得中央',
  'White gets sente': '白得先手',
  'Black gets the corner and right': '黑得角地与右边',
  'Black gets the corner and top': '黑得角地与上边',
  'Black gets the top and right': '黑得上边与右边',
  'Black gets the corner, top and right': '黑得角地、上边与右边',
  'Black gets the centre and right': '黑得中央与右边',
  'Black gets the top and centre': '黑得上边与中央',
  'White gets the corner and right': '白得角地与右边',
  'White gets the corner and top': '白得角地与上边',
  'White gets the corner and center': '白得角地与中央',
  'White gets the centre and right': '白得中央与右边',
  'White gets the top and centre': '白得上边与中央'
};
function opening(moves) {
  const rootName = { Q16: '星位', R16: '小目', R17: '三三', R15: '目外', Q15: '高目' }[moves[0]] || '角部';
  if (moves[0] === 'Q16' && moves[1] === 'R17') return '星位 · 点三三';
  if (moves[0] === 'Q16' && moves[1] === 'R14') return '星位 · 小飞挂';
  if (moves[0] === 'R16' && moves[1] === 'P17') return '小目 · 一间低挂';
  if (moves[0] === 'R16' && moves[1] === 'P16') return '小目 · 一间高挂';
  return rootName + ' · ' + (moves[1] || '起手');
}
function clean(value) { return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim(); }

const output = [];
const rejected = { short: 0, outside: 0, illegal: 0, duplicate: 0, changed: 0 };
for (const puzzle of puzzles) {
  const moves = puzzle.solution.map(p => alphabet[p.x - 1] + (20 - p.y));
  if (moves.length < 6) { rejected.short++; continue; }
  if (moves.some(move => {
    const p = board.point(move);
    return !p || p.x < 8 || p.y > 10;
  })) { rejected.outside++; continue; }
  try { board.replay(moves); } catch (_) { rejected.illegal++; continue; }
  const sequence = moves.join(',');
  if (existing.has(sequence)) { rejected.duplicate++; continue; }
  const item = metadata.get(String(puzzle.node_id));
  const live = item && !item.error;
  const tags = live ? item.tags?.map(tag => tag.description) || [] : [];
  if (live && (item.category !== 'IDEAL' || !tags.includes('Joseki: Done'))) {
    rejected.changed++;
    continue;
  }
  existing.add(sequence);
  const outcomes = tags.filter(tag => tagZh[tag]).map(tag => tagZh[tag]);
  const results = outcomes.filter(value => !['基础定式', '现代常见', '局部安定', '战斗型'].includes(value));
  const name = opening(moves) + ' · ' + (results.length ? results.slice(0, 2).join('、') : '完成谱') + ' #' + puzzle.node_id;
  const sourceName = clean(item?.joseki_source?.description);
  const source = live ? 'OGS 定式词典' + (sourceName ? ' · 原站资料来源：' + sourceName : '')
    : 'Josekle 归档 · OGS 定式词典节点 #' + puzzle.node_id;
  const overview = live ? [
    'OGS 原站目前将节点 #' + puzzle.node_id + ' 标为“Joseki: Done”。本页逐手展示该节点的 ' + moves.length + ' 手原始棋谱。' + (tags.includes('Basic') ? '原站同时标为基础型。' : '') + (tags.includes('Current') ? '原站同时标为现代常见。' : ''),
    results.length ? '原站对此局部结果的标签为：' + results.join('、') + '。这些结果属于当前手顺，具体方向仍要结合邻近棋子判断。' : '原站没有为这一节点标明双方所得方向；本站不凭棋形自行补写胜负或得失。'
  ] : [
    '这条 ' + moves.length + ' 手棋谱来自 Josekle 保存的 OGS 定式节点 #' + puzzle.node_id + '。其归档生成程序只把当时标为“Joseki: Done”、且不含虚着的路径放入完成谱列表。',
    '原站当前标签与专业文字未能重新取得；本页保留原始手顺和可核对的节点链接，不自行编写该变化的局部得失结论。'
  ];
  output.push({ id: 'josekle-' + puzzle.node_id, level: live && tags.includes('Basic') ? '入门' : live && moves.length <= 11 ? '进阶' : live ? '复杂变化' : '参考变化',
    name, original: 'OGS 节点 #' + puzzle.node_id, source, sourceType: live ? 'OGS 当前节点' : 'Josekle 来源归档',
    url: 'https://online-go.com/joseki/' + puzzle.node_id,
    moves: sequence, kind: live ? '原站标记：定式完成' : '归档完成谱 · 当前待复核',
    outcome: live ? (outcomes.length ? outcomes : ['原站标记：定式完成']) : ['归档标记：定式完成', '当前状态待复核'],
    overview,
    note: live ? '手顺来自 Josekle 保存的 OGS 路径；完成状态、资料来源及结果标签已与 OGS 当前节点核对。原站此节点的文字若仅有标题，不另行扩写。'
      : '手顺与当时的完成标记可在 Josekle 的 hard.js 及其生成脚本核对；OGS 当前节点信息暂未复核。' });
}
output.sort((a, b) => a.moves.split(',').length - b.moves.split(',').length || a.name.localeCompare(b.name, 'zh-CN'));
output.forEach((record, index) => { record.level += ' ' + String(index + 1).padStart(3, '0'); });
const jsonPath = path.join(root, 'assets/joseki-josekle.json');
const jsPath = path.join(root, 'assets/joseki-josekle.js');
fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2) + '\n');
fs.writeFileSync(jsPath, '/* Josekle MIT source archive; OGS node metadata from live public endpoint where available. See ../data/joseki/josekle/LICENSE. */\nwindow.JOSEKI_JOSEKLE = ' + JSON.stringify(output) + ';\n');
console.log(JSON.stringify({ imported: output.length, live: output.filter(x => x.sourceType === 'OGS 当前节点').length, archived: output.filter(x => x.sourceType === 'Josekle 来源归档').length, rejected }, null, 2));
