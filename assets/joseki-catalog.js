(function () {
  'use strict';
  const records = window.JOSEKI_RECORDS || [];
  const grid = document.getElementById('joseki-grid');
  const search = document.getElementById('joseki-search');
  const count = document.getElementById('catalog-count');
  const empty = document.getElementById('joseki-empty');
  const more = document.getElementById('joseki-more');
  const subfilters = document.getElementById('catalog-subfilters');
  const reset = document.getElementById('catalog-reset');
  if (!grid || !search || !count || !empty || !more) return;
  let filter = '';
  let subfilter = '';
  let stage = { basic: '入门', intermediate: '进阶', complex: '复杂变化' }[new URLSearchParams(location.search).get('stage')] || '入门';
  let complexFocus = '';
  let shown = 24;
  let booksOnly = new URLSearchParams(location.search).get('collection') === 'books';
  const booksToggle = document.getElementById('catalog-books');
  if (booksToggle) {
    booksToggle.setAttribute('aria-pressed', String(booksOnly));
    booksToggle.addEventListener('click', () => { booksOnly = !booksOnly; shown = 24; booksToggle.setAttribute('aria-pressed', String(booksOnly)); render(); });
  }
  const focusPanel = document.getElementById('complex-focus');
  if (focusPanel) focusPanel.hidden = stage !== '复杂变化';
  document.querySelectorAll('.catalog-stages button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stage === stage)));
  const snowOpening = 'R16,P16,P17,Q16,Q17,R15,O16';
  const focusMatches = {
    avalanche: record => record.moves.startsWith(snowOpening) || /雪崩/.test(record.name),
    fighting: record => record.name.includes('夹') || (record.outcome || []).includes('战斗型'),
    long: record => record.moves.split(',').length >= 20
  };
  Object.entries({ avalanche: 'complex-count-avalanche', fighting: 'complex-count-fighting', long: 'complex-count-long' }).forEach(([name, id]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = records.filter(record => record.studyStage === '复杂变化' && focusMatches[name](record)).length + ' 路真实谱线';
  });
  [['入门', 'stage-count-basic'], ['进阶', 'stage-count-mid'], ['复杂变化', 'stage-count-hard']].forEach(([name, id]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = records.filter(record => record.studyStage === name).length + ' 路';
  });
  const familyNames = { Q16: '星位', R16: '小目', R17: '三三', R15: '目外', Q15: '高目' };
  const branches = {
    Q16: [{ value: 'R17', label: '点三三' }, { value: 'R14', label: '小飞挂' }, { value: 'other', label: '其他应法' }],
    R16: [{ value: 'P17', label: '一间低挂' }, { value: 'P16', label: '一间高挂' }, { value: 'other', label: '其他应法' }]
  };

  function renderSubfilters() {
    subfilters.replaceChildren();
    const options = branches[filter] || [];
    subfilters.hidden = !options.length;
    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = option.label;
      button.setAttribute('aria-pressed', String(subfilter === option.value));
      button.addEventListener('click', () => {
        subfilter = subfilter === option.value ? '' : option.value;
        shown = 24;
        renderSubfilters();
        render();
      });
      subfilters.appendChild(button);
    });
    reset.hidden = !filter && !search.value;
  }

  function diagram(moves, name, record) {
    const size = 20;
    const frame = window.JosekiBoard.frame(moves, record);
    const { fromX, fromY } = frame;
    const extent = frame.size * size;
    const edge = extent - size / 2;
    const parts = ['<svg viewBox="0 0 ' + extent + ' ' + extent + '" role="img" aria-label="' + name + '，' + frame.label + '，续谱 ' + moves.length + ' 手" xmlns="http://www.w3.org/2000/svg">', '<rect width="' + extent + '" height="' + extent + '" fill="#ddb982"/>'];
    for (let i = 0; i < frame.size; i += 1) {
      const p = 10 + i * size;
      parts.push('<line x1="' + (fromX === 0 ? 10 : 0) + '" y1="' + p + '" x2="' + (fromX + frame.size === 19 ? edge : extent) + '" y2="' + p + '" stroke="#715634" stroke-width="1"/>');
      parts.push('<line x1="' + p + '" y1="' + (fromY === 0 ? 10 : 0) + '" x2="' + p + '" y2="' + (fromY + frame.size === 19 ? edge : extent) + '" stroke="#715634" stroke-width="1"/>');
    }
    for (const x of [3, 9, 15]) for (const y of [3, 9, 15]) {
      if (x >= fromX && x < fromX + frame.size && y >= fromY && y < fromY + frame.size) parts.push('<circle cx="' + (10 + (x - fromX) * size) + '" cy="' + (10 + (y - fromY) * size) + '" r="2.2" fill="#634827"/>');
    }
    window.JosekiBoard.replay(moves, moves.length, record).forEach(stone => {
      const { x, y } = stone;
      if (x < fromX || x >= fromX + frame.size || y < fromY || y >= fromY + frame.size) return;
      const cx = 10 + (x - fromX) * size;
      const cy = 10 + (y - fromY) * size;
      const black = stone.color === 'black';
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="9.3" fill="' + (black ? '#252525' : '#f8f7f0') + '" stroke="' + (black ? '#111' : '#8a806e') + '" stroke-width="1"/>');
      if (stone.number) parts.push('<text x="' + cx + '" y="' + (cy + 3.4) + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="' + (stone.number >= 10 ? 8 : 10) + '" font-weight="bold" fill="' + (black ? '#fff' : '#282828') + '">' + stone.number + '</text>');
    });
    parts.push('</svg>');
    return parts.join('');
  }

  function render() {
    [['入门', 'stage-count-basic'], ['进阶', 'stage-count-mid'], ['复杂变化', 'stage-count-hard']].forEach(([name, id]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = records.filter(record => record.studyStage === name && (!booksOnly || record.bookRef)).length + ' 路';
    });
    const query = search.value.trim().toLowerCase();
    const matchesType = record => {
      const moves = record.moves.split(',');
      if (filter && (record.familyCode || moves[0]) !== filter) return false;
      if (record.setup) return !subfilter;
      if (!subfilter) return true;
      if (subfilter === 'other') return !branches[filter].slice(0, 2).some(option => option.value === moves[1]);
      return moves[1] === subfilter;
    };
    const visible = records.filter(record => (!booksOnly || record.bookRef) && record.studyStage === stage && (!complexFocus || focusMatches[complexFocus](record)) && matchesType(record) && (!query || (record.name + ' ' + record.original + ' ' + record.moves + ' ' + record.source + ' ' + (record.book ? '第' + record.book.figure + '图' : '')).toLowerCase().includes(query)));
    const groups = new Map();
    const quality = record => record.quote || record.book ? 0 : record.sourceType === 'OGS 当前节点' ? 1 : /定式完成|完成谱/.test(record.kind || '') ? 2 : 3;
    visible.forEach(record => {
      const key = record.topicKey;
      const group = groups.get(key);
      if (!group) groups.set(key, { representative: record, records: [record] });
      else {
        group.records.push(record);
        if (quality(record) < quality(group.representative) || (quality(record) === quality(group.representative) && record.moves.split(',').length > group.representative.moves.split(',').length)) group.representative = record;
      }
    });
    const topics = [...groups.values()];
    grid.replaceChildren();
    topics.slice(0, shown).forEach(group => {
      const record = group.representative;
      const moves = record.moves.split(',');
      const card = document.createElement('a');
      card.className = 'joseki-card';
      card.href = 'joseki-detail.html?id=' + encodeURIComponent(record.id);
      card.innerHTML = '<div class="joseki-card-board">' + diagram(moves, record.topicTitle, record) + '</div><div class="joseki-card-copy"><div class="joseki-card-meta"><span>' + (familyNames[record.familyCode || moves[0]] || '角部') + '</span><span>' + group.records.length + ' 路续谱</span></div><h3>' + record.topicTitle + '</h3><small>' + (record.bookRef ? record.bookRef.title : record.topicKey.split(',').join(' → ')) + '</small><b>查看棋形与续法 <i aria-hidden="true">↗</i></b></div>';
      grid.appendChild(card);
    });
    count.textContent = stage + ' · ' + (filter || query || complexFocus ? '找到 ' : '') + topics.length + ' 组棋形';
    more.hidden = topics.length <= shown;
    empty.hidden = topics.length > 0;
  }

  search.addEventListener('input', () => { shown = 24; renderSubfilters(); render(); });
  document.querySelectorAll('.catalog-stages button').forEach(button => button.addEventListener('click', () => {
    stage = button.dataset.stage;
    complexFocus = '';
    shown = 24;
    if (focusPanel) focusPanel.hidden = stage !== '复杂变化';
    document.querySelectorAll('.complex-focus-grid button').forEach(item => item.setAttribute('aria-pressed', 'false'));
    document.querySelectorAll('.catalog-stages button').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.stage === stage)));
    render();
  }));
  document.querySelectorAll('.complex-focus-grid button').forEach(button => button.addEventListener('click', () => {
    complexFocus = complexFocus === button.dataset.complex ? '' : button.dataset.complex;
    shown = 24;
    document.querySelectorAll('.complex-focus-grid button').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.complex === complexFocus)));
    render();
  }));
  more.addEventListener('click', () => { shown += 24; render(); });
  document.querySelectorAll('.catalog-filters button').forEach(button => button.addEventListener('click', () => {
    filter = filter === button.dataset.filter ? '' : button.dataset.filter;
    subfilter = '';
    shown = 24;
    document.querySelectorAll('.catalog-filters button').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.filter === filter)));
    renderSubfilters();
    render();
  }));
  reset.addEventListener('click', () => {
    filter = '';
    subfilter = '';
    search.value = '';
    shown = 24;
    document.querySelectorAll('.catalog-filters button').forEach(item => item.setAttribute('aria-pressed', 'false'));
    renderSubfilters();
    render();
  });
  renderSubfilters();
  render();
}());
