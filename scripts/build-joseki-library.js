// Build a curated, replayable subset of Pachi's GPL-2.0 joseki trees.
// Source: https://github.com/pasky/pachi/tree/master/joseki
// The original SGF contains mistakes, tenuki continuations and situational setups.
// Those branches are deliberately excluded here; a retained leaf is a source-tree
// variation, not a claim that it is a universally correct completed joseki.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'data', 'joseki', 'pachi');
const names = { joseki_33: '三三', joseki_34: '小目', joseki_44: '星位', joseki_54: '高目' };
const letters = 'ABCDEFGHJKLMNOPQRST';

function parseSgf(input) {
  let i = input.indexOf('(');
  function space() { while (/\s/.test(input[i] || '')) i++; }
  function value() {
    i++;
    let result = '';
    while (i < input.length && input[i] !== ']') {
      if (input[i] === '\\') i++;
      result += input[i++] || '';
    }
    i++;
    return result;
  }
  function tree() {
    if (input[i++] !== '(') throw Error('Expected tree');
    const nodes = [];
    const branches = [];
    while (i < input.length) {
      space();
      if (input[i] === ';') {
        i++;
        const node = {};
        while (i < input.length) {
          space();
          const match = /^[A-Z]+/.exec(input.slice(i));
          if (!match) break;
          i += match[0].length;
          const values = [];
          while (input[i] === '[') values.push(value());
          node[match[0]] = values;
        }
        nodes.push(node);
      } else if (input[i] === '(') branches.push(tree());
      else if (input[i] === ')') { i++; break; }
      else throw Error('Unexpected SGF char at ' + i + ': ' + input.slice(i, i + 20));
    }
    return { nodes, branches };
  }
  return tree();
}

function toCoordinate(sgf) {
  if (!/^[a-s]{2}$/.test(sgf)) return null;
  const x = sgf.charCodeAt(0) - 97;
  const y = sgf.charCodeAt(1) - 97;
  if (x < 8 || y > 10) return null; // The site's digital preview shows this corner.
  return letters[x] + (19 - y);
}

function legal(moves) {
  const stones = new Map();
  const neighbors = (x, y) => [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b]) => a >= 0 && a < 19 && b >= 0 && b < 19);
  const key = (x,y) => x + ',' + y;
  function group(x,y) {
    const color = stones.get(key(x,y));
    const seen = new Set([key(x,y)]), libs = new Set(), queue = [[x,y]];
    while (queue.length) {
      const [cx,cy] = queue.pop();
      for (const [nx,ny] of neighbors(cx,cy)) {
        const k = key(nx,ny), other = stones.get(k);
        if (!other) libs.add(k);
        else if (other === color && !seen.has(k)) { seen.add(k); queue.push([nx,ny]); }
      }
    }
    return { seen, libs };
  }
  for (let n = 0; n < moves.length; n++) {
    const move = moves[n];
    const x = letters.indexOf(move[0]), y = 19 - Number(move.slice(1)), color = n % 2 ? 'W' : 'B';
    const at = key(x,y);
    if (stones.has(at)) return false;
    stones.set(at,color);
    for (const [nx,ny] of neighbors(x,y)) {
      const k = key(nx,ny);
      if (stones.get(k) === (color === 'B' ? 'W' : 'B')) {
        const g = group(nx,ny);
        if (!g.libs.size) for (const gone of g.seen) stones.delete(gone);
      }
    }
    if (!group(x,y).libs.size) return false;
  }
  return true;
}

const output = [];
const seen = new Set();
const rejected = {};
for (const [filename, label] of Object.entries(names)) {
  const tree = parseSgf(fs.readFileSync(path.join(sourceDir, filename + '.sgf'), 'utf8'));
  let serial = 0;
  function visit(branch, prefix, bad) {
    let moves = prefix.slice(), rejectedHere = bad;
    for (const node of branch.nodes) {
      const comment = (node.C || []).join(' ');
      if (/<(?:don't|bad|avoid|tenuki|later)>|not joseki|mistake/i.test(comment)) rejectedHere = true;
      if (node.AB || node.AW || node.AE) rejectedHere = true;
      const moveColor = node.B ? 'B' : node.W ? 'W' : null;
      if (moveColor) {
        const move = toCoordinate((node[moveColor] || [])[0]);
        if (!move || moveColor !== (moves.length % 2 ? 'W' : 'B')) rejectedHere = true;
        if (move) moves.push(move);
      }
    }
    if (branch.branches.length) {
      for (const child of branch.branches) visit(child, moves, rejectedHere);
    } else {
      serial++;
      let reason = null;
      if (rejectedHere) reason = 'marked-or-setup';
      else if (moves.length < 6) reason = 'short';
      else if (!legal(moves)) reason = 'illegal';
      else if (seen.has(moves.join(','))) reason = 'duplicate';
      if (reason) { rejected[reason] = (rejected[reason] || 0) + 1; return; }
      seen.add(moves.join(','));
      output.push({ id: 'pachi-' + filename.slice(-2) + '-' + String(serial).padStart(3,'0'), family: label,
        name: label + ' · 变化谱 ' + String(serial).padStart(3,'0'),
        moves: moves.join(','), source: 'Pachi joseki SGF · ' + filename + '.sgf',
        url: 'https://github.com/pasky/pachi/blob/master/joseki/' + filename + '.sgf',
        kind: '来源棋谱 · 变化分支', sourceType: 'Pachi',
        note: '取自 Pachi 的围棋定式变化树；已排除原文件中标记为坏棋、应对失误、脱先及背景摆子的分支。原文件不含这一路的完整文字注解，不据此断言它在所有全盘配置下均适用。' });
    }
  }
  visit(tree, [], false);
}
fs.writeFileSync(path.join(root, 'assets', 'joseki-pachi.json'), JSON.stringify(output, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'assets', 'joseki-pachi.js'),
  '/* Pachi joseki tree data, derived under GPL-2.0-only. See ../data/joseki/pachi/COPYING. */\n' +
  'window.JOSEKI_PACHI = ' + JSON.stringify(output) + ';\n');
console.log(JSON.stringify({ imported: output.length, rejected, families: Object.fromEntries(Object.values(names).map(n => [n,output.filter(x=>x.family===n).length])) },null,2));
