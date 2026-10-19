// Inspect the public 2025 KataGo joseki extraction before selecting any paths.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const letters = 'ABCDEFGHJKLMNOPQRST';
const boardContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/joseki-board.js'), 'utf8'), boardContext);
const board = boardContext.window.JosekiBoard;

function parseSgf(input) {
  let i = input.indexOf('(');
  function skip() { while (/\s/.test(input[i] || '')) i++; }
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
    if (input[i++] !== '(') throw Error('Expected SGF tree');
    const nodes = [], branches = [];
    while (i < input.length) {
      skip();
      if (input[i] === ';') {
        i++;
        const node = {};
        while (i < input.length) {
          skip();
          const key = /^[A-Z]+/.exec(input.slice(i));
          if (!key) break;
          i += key[0].length;
          const values = [];
          while (input[i] === '[') values.push(value());
          node[key[0]] = values;
        }
        nodes.push(node);
      } else if (input[i] === '(') branches.push(tree());
      else if (input[i] === ')') { i++; break; }
      else throw Error('Unexpected SGF at ' + i);
    }
    return { nodes, branches };
  }
  return tree();
}

function point(raw) {
  if (!/^[a-s]{2}$/.test(raw || '')) return null;
  const x = raw.charCodeAt(0) - 97, y = raw.charCodeAt(1) - 97;
  return letters[x] + (19 - y);
}
function countOf(node) {
  try { return JSON.parse((node.C || [])[0] || '{}').count || 0; } catch (_) { return 0; }
}
function inspect(filename, minCount = 80) {
  const input = fs.readFileSync(path.join(root, 'data/joseki/katago', filename), 'utf8');
  const tree = parseSgf(input);
  const candidates = [];
  const stats = { leaves: 0, passStops: 0, invalid: 0, short: 0, lowCount: 0, accepted: 0, lengths: {}, countBuckets: {} };
  function add(moves, count, stop) {
    if (moves.length < 8 || moves.length > 30) { stats.short++; return; }
    if (count < minCount) { stats.lowCount++; return; }
    if (moves.some(move => { const p = board.point(move); return !p || p.x < 8 || p.y > 10; })) { stats.invalid++; return; }
    try { board.replay(moves); } catch (_) { stats.invalid++; return; }
    const sequence = moves.join(',');
    candidates.push({ moves: sequence, count, stop });
    stats.accepted++;
    stats.lengths[moves.length] = (stats.lengths[moves.length] || 0) + 1;
    const bucket = count >= 1000 ? '1000+' : count >= 500 ? '500-999' : count >= 200 ? '200-499' : count >= 100 ? '100-199' : '80-99';
    stats.countBuckets[bucket] = (stats.countBuckets[bucket] || 0) + 1;
  }
  function walk(branch, prefix, count, valid) {
    let moves = prefix.slice(), seenCount = count, okay = valid;
    for (const node of branch.nodes) {
      if (node.AB || node.AW || node.AE) okay = false;
      const color = node.B ? 'B' : node.W ? 'W' : '';
      const raw = color ? node[color][0] : '';
      if (color && (raw === 'tt' || raw === '')) {
        stats.passStops++;
        if (okay) add(moves, seenCount, 'tenuki');
        return;
      }
      if (color) {
        const move = point(raw);
        if (!move || color !== (moves.length % 2 ? 'W' : 'B')) okay = false;
        moves.push(move || '?');
      }
      seenCount = countOf(node) || seenCount;
    }
    if (branch.branches.length) for (const child of branch.branches) walk(child, moves, seenCount, okay);
    else {
      stats.leaves++;
      if (okay) add(moves, seenCount, 'leaf');
    }
  }
  walk(tree, [], 0, true);
  return { candidates, stats };
}
module.exports = { inspect };
if (require.main === module) {
  for (const filename of ['katago_rating_joseki.sgf', 'katago_training_joseki.sgf']) {
    const result = inspect(filename);
    console.log(filename, JSON.stringify(result.stats));
    console.log('sample', result.candidates.slice(0, 3));
  }
}
