// Build source-traceable study variations from Josekle's archived OGS tree.
// A leaf is a recorded variation, not necessarily a completed joseki.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { leaves } = require('./analyze-josekle');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const boardContext = { window: {} };
vm.runInNewContext(read('assets/joseki-board.js'), boardContext);
const board = boardContext.window.JosekiBoard;
const context = {
  window: {
    JOSEKI_PACHI: JSON.parse(read('assets/joseki-pachi.json')),
    JOSEKI_JOSEKLE: JSON.parse(read('assets/joseki-josekle.json'))
  },
  document: { getElementById: () => null }
};
vm.runInNewContext(read('assets/joseki.js'), context);
const existing = new Set(context.window.JOSEKI_RECORDS.map(record => record.moves));
const letters = 'ABCDEFGHJKLMNOPQRST';
const easy = JSON.parse(read('data/joseki/josekle/easy.js').match(/\[[\s\S]*\]/)[0]);
const candidate = [
  ...easy.map(item => ({
    id: item.node_id,
    moves: item.solution.map(point => letters[point.x - 1] + (20 - point.y)).join(','),
    sourceList: 'easy.js'
  })),
  ...leaves.filter(item => item.moves.split(',').length < 25).map(item => ({
    ...item, sourceList: 'dictionary.sgf'
  }))
];
const family = { Q16: '星位', R16: '小目', R17: '三三', R15: '目外', Q15: '高目' };
const stats = { existing: existing.size, selected: 0, duplicates: 0, invalid: 0, cutAtDepthLimit: leaves.filter(item => item.moves.split(',').length === 25).length, byList: {} };
const output = [];
for (const item of candidate) {
  const moves = item.moves.split(',');
  if (existing.has(item.moves)) { stats.duplicates++; continue; }
  if (moves.some(move => {
    const point = board.point(move);
    return !point || point.x < 8 || point.y > 10;
  })) { stats.invalid++; continue; }
  try { board.replay(moves); } catch (_) { stats.invalid++; continue; }
  const opening = family[moves[0]];
  if (!opening || !/^\d{3,6}$/.test(String(item.id))) { stats.invalid++; continue; }
  const type = item.sourceList === 'easy.js' ? '基础与短谱' : '角部变化';
  const name = opening + ' · ' + type + ' · ' + moves.slice(0, Math.min(3, moves.length)).join(' → ');
  const description = item.sourceList === 'easy.js'
    ? '这一路来自 Josekle 的 easy.js。该列表收录归档时较短的完成谱或标记为 Basic 的基础节点，不能仅凭入选列表判断当前节点已经定型。'
    : '这一路来自 Josekle 保存的 OGS 角部变化树。归档程序只沿 GOOD / IDEAL 分支继续采集；树的末端不一定是定式完成点。';
  output.push({
    id: 'josekle-variation-' + item.id,
    level: '',
    basic: item.sourceList === 'easy.js' && moves.length >= 10,
    name,
    original: 'OGS 定式词典节点 #' + item.id,
    source: 'Josekle 归档 · ' + item.sourceList + ' · OGS 节点 #' + item.id,
    sourceType: 'OGS 归档变化树',
    url: 'https://online-go.com/joseki/' + item.id,
    moves: item.moves,
    kind: item.sourceList === 'easy.js' ? '归档基础或短谱 · 当前状态待复核' : '归档变化谱 · 非完成状态核定',
    outcome: [opening + '角部变化', moves.length + ' 手真实落点'],
    overview: [
      '本谱以' + opening + '起手，共 ' + moves.length + ' 手；前四手依次为 ' + moves.slice(0, 4).join('、') + '。棋盘展示归档中的完整落点，按手数可逐步观察双方如何进入这一分支。',
      description
    ],
    note: '原始落点可在 Josekle 归档文件中核对，节点编号对应 OGS 定式词典。归档文件没有附带专业文字讲解；本站不把此分支写成已定型的完整定式，也不自行推断双方得失。'
  });
  existing.add(item.moves);
  stats.byList[item.sourceList] = (stats.byList[item.sourceList] || 0) + 1;
}
stats.selected = output.length;
fs.writeFileSync(path.join(root, 'assets/joseki-variations.json'), JSON.stringify(output, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'assets/joseki-variations.js'), '/* Josekle source archive. Each record is a study variation; completion is not asserted. */\nwindow.JOSEKI_VARIATIONS = ' + JSON.stringify(output) + ';\n');
console.log(JSON.stringify(stats, null, 2));
