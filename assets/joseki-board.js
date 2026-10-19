(function () {
  'use strict';
  const letters = 'ABCDEFGHJKLMNOPQRST';
  function point(move) {
    const match = /^([A-HJ-T])([1-9]|1[0-9])$/.exec(move);
    if (!match) return null;
    return { x: letters.indexOf(match[1]), y: 19 - Number(match[2]) };
  }
  function replay(moves, count = moves.length, options = {}) {
    const stones = new Map();
    const key = (x, y) => y + ',' + x;
    for (const color of ['black', 'white']) for (const move of options.setup?.[color] || []) {
      const p = point(move);
      if (!p || stones.has(key(p.x, p.y))) throw new Error('Invalid setup point: ' + move);
      stones.set(key(p.x, p.y), { ...p, color, number: 0 });
    }
    const neighbors = (x, y) => [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([nx, ny]) => nx >= 0 && nx < 19 && ny >= 0 && ny < 19);
    function group(x, y) {
      const color = stones.get(key(x, y)).color;
      const seen = new Set([key(x, y)]);
      const liberties = new Set();
      const pending = [[x, y]];
      while (pending.length) {
        const [cx, cy] = pending.pop();
        neighbors(cx, cy).forEach(([nx, ny]) => {
          const nextKey = key(nx, ny);
          const next = stones.get(nextKey);
          if (!next) liberties.add(nextKey);
          else if (next.color === color && !seen.has(nextKey)) {
            seen.add(nextKey);
            pending.push([nx, ny]);
          }
        });
      }
      return { members: seen, liberties };
    }
    moves.slice(0, count).forEach((move, index) => {
      if (move === 'pass') return;
      const p = point(move);
      if (!p) throw new Error('Invalid joseki move: ' + move);
      const at = key(p.x, p.y);
      if (stones.has(at)) throw new Error('Occupied joseki point: ' + move);
      const color = colorAt(index, options);
      stones.set(at, { x: p.x, y: p.y, color, number: index + (options.startNumber || 1) });
      neighbors(p.x, p.y).forEach(([nx, ny]) => {
        const neighbor = stones.get(key(nx, ny));
        if (!neighbor || neighbor.color === color) return;
        const nextGroup = group(nx, ny);
        if (!nextGroup.liberties.size) nextGroup.members.forEach(member => stones.delete(member));
      });
      if (!group(p.x, p.y).liberties.size) throw new Error('Suicide joseki move: ' + move);
    });
    return stones;
  }
  function frame(moves, options = {}) {
    const points = [...moves, ...(options.setup?.black || []), ...(options.setup?.white || [])].map(point).filter(Boolean);
    const candidates = [{ right: true, bottom: false }, { right: false, bottom: false }, { right: true, bottom: true }, { right: false, bottom: true }].map(c => {
      const reach = Math.max(7, ...points.map(p => Math.max(c.right ? 19 - p.x : p.x + 1, c.bottom ? 19 - p.y : p.y + 1) + 1));
      return { ...c, size: [7, 9, 11, 13, 15, 19].find(n => n >= reach) || 19 };
    }).sort((a, b) => a.size - b.size);
    const { size, right, bottom } = candidates[0];
    return { size, fromX: right ? 19 - size : 0, fromY: bottom ? 19 - size : 0, label: size === 19 ? '十九路完整棋盘' : (right ? '右' : '左') + (bottom ? '下' : '上') + '角 ' + size + '×' + size + ' 局部棋盘' };
  }
  function colorAt(index, options = {}) {
    return (index % 2 === 0) === (options.firstColor !== 'white') ? 'black' : 'white';
  }
  function sgf(record) {
    const xy = move => { const p = point(move); return p ? 'abcdefghijklmnopqrs'[p.x] + 'abcdefghijklmnopqrs'[p.y] : ''; };
    const escape = s => String(s || '').replace(/\\/g, '\\\\').replace(/\]/g, '\\]');
    const setup = ['black', 'white'].map(c => (record.setup?.[c]?.length ? (c === 'black' ? 'AB' : 'AW') + record.setup[c].map(m => '[' + xy(m) + ']').join('') : '')).join('');
    const credit = record.bookRef?.license ? '; Adapted from Go Game Guru (2016); ' + record.bookRef.creditUrl + '; CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/' : '';
    return '(;GM[1]FF[4]CA[UTF-8]SZ[19]GN[' + escape(record.name) + ']C[' + escape(record.source + credit) + ']' + setup + 'PL[' + (record.firstColor === 'white' ? 'W' : 'B') + ']' + record.moves.split(',').map((m, i) => ';' + (colorAt(i, record) === 'black' ? 'B' : 'W') + '[' + xy(m) + ']' + (i === 0 && record.startNumber > 1 ? 'MN[' + record.startNumber + ']' : '')).join('') + ')';
  }
  window.JosekiBoard = { point, replay, frame, colorAt, sgf };
}());
