// Inspect Josekle's cached OGS tree without treating every branch as a joseki.
const fs = require('fs');
const path = require('path');
const input = fs.readFileSync(path.join(__dirname, '../data/joseki/josekle/dictionary.sgf'), 'utf8');
const letters = 'ABCDEFGHJKLMNOPQRST';
let offset = 0;

function sgfValue() {
  offset++;
  let value = '';
  while (offset < input.length && input[offset] !== ']') {
    if (input[offset] === '\\') offset++;
    value += input[offset++] || '';
  }
  offset++;
  return value;
}
function parseTree() {
  if (input[offset++] !== '(') throw Error('Bad SGF tree at ' + offset);
  const nodes = [], children = [];
  while (offset < input.length) {
    while (/\s/.test(input[offset] || '')) offset++;
    if (input[offset] === ';') {
      offset++;
      const node = {};
      while (true) {
        const match = /^[A-Z]+/.exec(input.slice(offset));
        if (!match) break;
        offset += match[0].length;
        const values = [];
        while (input[offset] === '[') values.push(sgfValue());
        node[match[0]] = values;
      }
      nodes.push(node);
    } else if (input[offset] === '(') children.push(parseTree());
    else if (input[offset] === ')') { offset++; break; }
    else throw Error('Bad SGF character at ' + offset);
  }
  return { nodes, children };
}
function coordinate(raw) {
  if (!/^[a-s]{2}$/.test(raw || '')) return null;
  const x = raw.charCodeAt(0) - 97, y = raw.charCodeAt(1) - 97;
  return { x, y, name: letters[x] + (19 - y) };
}

const root = parseTree();
const leaves = [];
const stats = { nodes: 0, leaves: 0, inCorner: 0, sixMoves: 0, invalidOrder: 0, families: {}, lengthBuckets: {} };
function walk(tree, prefix, valid) {
  let moves = prefix.slice(), clean = valid, id = '';
  for (const node of tree.nodes) {
    stats.nodes++;
    if (node.AB || node.AW || node.AE) clean = false;
    const color = node.B ? 'B' : node.W ? 'W' : '';
    if (!color) continue;
    const point = coordinate(node[color][0]);
    if (!point || point.x < 8 || point.y > 10 || color !== (moves.length % 2 ? 'W' : 'B')) clean = false;
    moves.push(point?.name || '?');
    id = (node.C || [])[0] || '';
  }
  if (tree.children.length) {
    for (const child of tree.children) walk(child, moves, clean);
  } else {
    stats.leaves++;
    if (!clean) { stats.invalidOrder++; return; }
    stats.inCorner++;
    if (moves.length < 6) return;
    stats.sixMoves++;
    stats.lengthBuckets[moves.length] = (stats.lengthBuckets[moves.length] || 0) + 1;
    stats.families[moves[0]] = (stats.families[moves[0]] || 0) + 1;
    leaves.push({ id, moves: moves.join(',') });
  }
}
walk(root, [], true);
module.exports = { leaves, stats, root, coordinate };
if (require.main === module) {
  fs.writeFileSync(path.join(__dirname, '../tmp/josekle-leaves.json'), JSON.stringify(leaves));
  console.log(JSON.stringify(stats, null, 2));
}
