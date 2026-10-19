(function () {
  'use strict';
  if (document.body.dataset.craftSkill !== 'go') return;

  const portfolio = document.querySelector('.craft-detail-portfolio');
  const siblings = document.querySelector('.craft-detail-siblings');
  if (!portfolio || !siblings) return;

  const study = document.createElement('section');
  study.className = 'go-study-preview';
  study.id = 'go-study';
  study.innerHTML = `
    <div class="go-study-preview-copy">
      <span class="go-study-eyebrow">定式 · 电子棋谱</span>
      <h2>循谱入局</h2>
      <p>从基础变化开始，读名称、看手顺，再循出处阅读专业文字。每一手都能回看，也能下载棋谱复盘。</p>
      <a href="joseki.html" class="go-primary-link">进入定式棋谱 <span aria-hidden="true">↗</span></a>
    </div>
    <div class="go-study-preview-sheet" aria-label="定式阅读顺序">
      <span class="go-study-sheet-head">棋谱选读 <i>01 — 03</i></span>
      <div><b>一</b><span>直接点三三</span><small>基础 · 点入角部</small></div>
      <div><b>二</b><span>一间低夹</span><small>进阶 · 夹击变化</small></div>
      <div><b>三</b><span>夹攻后的战斗型</span><small>复杂 · 多手变化</small></div>
      <span class="go-study-sheet-foot">原始棋谱与出处可在内页查看 ↗</span>
    </div>`;
  const primaryGrid = document.createElement('div');
  primaryGrid.className = 'go-primary-grid';
  const hero = document.querySelector('.craft-detail-hero');
  hero.after(primaryGrid);
  primaryGrid.appendChild(study);
  const heroJump = document.querySelector('.craft-detail-jump');
  if (heroJump) {
    heroJump.href = '#go-study';
    heroJump.innerHTML = '浏览定式 <span aria-hidden="true">↘</span>';
  }

  const room = document.createElement('section');
  room.className = 'go-match-room is-collapsed';
  room.setAttribute('aria-labelledby', 'go-match-title');
  room.innerHTML = `
    <div class="go-match-heading"><div><span class="go-study-eyebrow">十九路 · 对局室</span><h2 id="go-match-title">落子成局</h2><p>展开棋盘，与身边的人下一局。轮流落子，收官后停手数子，再把棋谱留存。</p></div><div class="go-match-rules"><b>19 × 19</b><span>中国规则 · 黑棋贴还 3 又 3/4 子</span></div></div>
    <button type="button" id="go-board-expand" class="go-board-preview" aria-expanded="false" aria-controls="go-match-layout"><span class="go-board-preview-art" aria-hidden="true"></span><span class="go-board-preview-copy"><small>十九路对局</small><strong>点击棋盘，展开对局</strong><em>展开后可正常落子，也可保存棋谱</em></span><span class="go-board-preview-arrow" aria-hidden="true">↗</span></button>
    <div id="go-match-layout" class="go-match-layout">
      <div class="go-board-scroll" tabindex="0" aria-label="十九路棋盘，可左右滚动"><div id="go-match-board" class="go-match-board" role="grid" aria-label="十九路围棋棋盘"></div></div>
      <aside class="go-match-side">
        <div class="go-turn-card"><small>当前局面</small><strong id="go-match-status" role="status" aria-live="polite" tabindex="-1">黑棋先行</strong><span id="go-match-count">第 0 手</span></div>
        <div class="go-match-actions"><button type="button" id="go-pass">停一手</button><button type="button" id="go-undo">悔一手</button><button type="button" id="go-export">下载棋谱</button><button type="button" id="go-board-zoom" aria-pressed="false">放大棋盘</button><button type="button" id="go-new">重新开局</button><button type="button" id="go-collapse">收起棋盘</button></div>
        <details class="go-match-help"><summary>对局说明与数子</summary><p>黑棋先行，双方轮流把棋子落在交叉点。不能落在已有棋子上，也不能自杀或立即提回形成劫争。双方连续停一手后，点击棋盘上的死棋标记，再看参考数子。若需继续对局，可悔棋撤回停手。</p><p>采用中国规则数子法：计算双方盘上的活棋及其所围交叉点，黑棋贴还 3 又 3/4 子。棋盘默认展示全局，可按需放大并移动；棋谱可下载为 SGF 文件继续复盘。</p><p><a href="https://www.shweiqi.org/App/Web/NewsDetail.aspx?masterIds=20250225112720840575053318356677" target="_blank" rel="noopener noreferrer">上海市围棋协会竞赛规程 ↗</a></p></details>
      </aside>
    </div>
    <p class="go-match-footnote">双人本地对局 · 依据中国规则作参考数子，黑棋贴还 3 又 3/4 子；最终胜负以双方确认的死活与正式规则为准。</p>`;
  primaryGrid.appendChild(room);
  const reflection = document.querySelector('.depth-go');
  const notes = document.querySelector('.more-go');
  if (reflection && notes) {
    reflection.classList.add('go-reflection');
    const heading = document.createElement('div');
    heading.className = 'go-reflection-subhead';
    heading.innerHTML = '<span>棋理札记</span><h3>复盘时再看三个关系</h3>';
    reflection.append(heading, notes.querySelector('.more-go-grid'));
    notes.remove();
  }
  const previewArt = room.querySelector('.go-board-preview-art');
  const gridLines = [];
  for (let i = 0; i < 19; i += 1) {
    const p = 15 + i * 10;
    gridLines.push('<path d="M' + p + ' 15V195 M15 ' + p + 'H195" stroke="#775b39" stroke-width=".85"/>');
  }
  for (const x of [3, 9, 15]) for (const y of [3, 9, 15]) {
    gridLines.push('<circle cx="' + (15 + x * 10) + '" cy="' + (15 + y * 10) + '" r="2.3" fill="#6a5135"/>');
  }
  previewArt.innerHTML = '<svg viewBox="0 0 210 210" aria-hidden="true" focusable="false"><rect width="210" height="210" fill="#d9b77e"/>' + gridLines.join('') + '</svg>';
  const expand = document.getElementById('go-board-expand');
  expand.addEventListener('click', function () {
    room.classList.remove('is-collapsed');
    primaryGrid.classList.add('has-open-board');
    expand.setAttribute('aria-expanded', 'true');
    if (window.tenuki && window.tenuki.Game) requestAnimationFrame(fitBoard);
    document.getElementById('go-match-status').focus({ preventScroll: true });
  });
  document.getElementById('go-collapse').addEventListener('click', function () {
    room.classList.add('is-collapsed');
    primaryGrid.classList.remove('has-open-board');
    expand.setAttribute('aria-expanded', 'false');
    expand.focus();
  });

  if (!window.tenuki || !window.tenuki.Game) {
    document.getElementById('go-match-status').textContent = '棋盘暂时无法加载，请刷新页面';
    return;
  }
  const board = document.getElementById('go-match-board');
  const boardScroll = room.querySelector('.go-board-scroll');
  const zoomButton = document.getElementById('go-board-zoom');
  let enlarged = false;
  function fitBoard() {
    const width = boardScroll.clientWidth;
    if (!width) return;
    const point = enlarged ? 36 : Math.min(36, Math.floor((width - 1) / 20.3 * 100) / 100);
    board.style.setProperty('--point', point + 'px');
    boardScroll.setAttribute('aria-label', enlarged ? '十九路棋盘，已放大，可左右移动' : '十九路棋盘，全局视图');
  }
  zoomButton.addEventListener('click', function () {
    enlarged = !enlarged;
    zoomButton.setAttribute('aria-pressed', String(enlarged));
    zoomButton.textContent = enlarged ? '查看全局' : '放大棋盘';
    fitBoard();
    if (!enlarged) boardScroll.scrollTo({left:0, top:0});
  });
  if ('ResizeObserver' in window) new ResizeObserver(fitBoard).observe(boardScroll);
  else window.addEventListener('resize', fitBoard);
  const status = document.getElementById('go-match-status');
  const count = document.getElementById('go-match-count');
  const letters = 'ABCDEFGHJKLMNOPQRST';
  const sgfLetters = 'abcdefghijklmnopqrs';
  let game = createGame();
  let history = [];
  let lastPoint = null;
  const cells = [];

  function createGame() {
    return new window.tenuki.Game({ boardSize: 19, scoring: 'area', komi: 7.5, koRule: 'positional-superko' });
  }
  function colorName(value) {
    return value === 'black' ? '黑棋' : value === 'white' ? '白棋' : '空位';
  }
  for (let y = 0; y < 19; y += 1) {
    for (let x = 0; x < 19; x += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'go-match-point';
      if ([3, 9, 15].includes(x) && [3, 9, 15].includes(y)) cell.classList.add('is-star');
      if (x === 0) cell.classList.add('edge-left');
      if (x === 18) cell.classList.add('edge-right');
      if (y === 0) cell.classList.add('edge-top');
      if (y === 18) cell.classList.add('edge-bottom');
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      cell.setAttribute('role', 'gridcell');
      cell.addEventListener('click', function () {
        if (game.isOver()) {
          if (game.intersectionAt(y, x).value !== 'empty') {
            game.toggleDeadAt(y, x);
            render();
          }
          return;
        }
        const color = game.currentPlayer();
        if (!game.playAt(y, x)) {
          status.textContent = '此处不能落子，请选择其他交叉点';
          return;
        }
        history.push({ color: color, x: x, y: y });
        lastPoint = { x: x, y: y };
        render();
      });
      board.appendChild(cell);
      cells.push(cell);
    }
  }

  function render() {
    const dead = new Set((game.deadStones() || []).map(point => point.y + ',' + point.x));
    for (const cell of cells) {
      const x = Number(cell.dataset.x);
      const y = Number(cell.dataset.y);
      const value = game.intersectionAt(y, x).value;
      cell.dataset.stone = value;
      cell.classList.toggle('is-last', !!lastPoint && lastPoint.x === x && lastPoint.y === y);
      cell.classList.toggle('is-dead', dead.has(y + ',' + x));
      cell.setAttribute('aria-label', letters[x] + (19 - y) + '，' + colorName(value) + (dead.has(y + ',' + x) ? '，已标记死棋' : ''));
      cell.setAttribute('aria-disabled', value !== 'empty' && !game.isOver() ? 'true' : 'false');
    }
    count.textContent = '第 ' + history.length + ' 手';
    if (game.isOver()) {
      const score = game.score();
      const winner = score.black > score.white ? '黑棋胜' : '白棋胜';
      status.textContent = '终局参考：黑 ' + score.black + ' · 白 ' + score.white + '，' + winner;
    } else {
      status.textContent = (game.currentPlayer() === 'black' ? '黑棋' : '白棋') + '落子';
    }
  }
  document.getElementById('go-pass').addEventListener('click', function () {
    if (game.isOver()) return;
    const color = game.currentPlayer();
    game.pass();
    history.push({ color: color, pass: true });
    lastPoint = null;
    render();
  });
  document.getElementById('go-undo').addEventListener('click', function () {
    if (!history.length) return;
    game.undo();
    history.pop();
    const previous = [...history].reverse().find(move => !move.pass);
    lastPoint = previous ? { x: previous.x, y: previous.y } : null;
    render();
  });
  document.getElementById('go-new').addEventListener('click', function () {
    game = createGame();
    history = [];
    lastPoint = null;
    render();
  });
  document.getElementById('go-export').addEventListener('click', function () {
    const moves = history.map(move => ';' + (move.color === 'black' ? 'B' : 'W') + '[' + (move.pass ? '' : sgfLetters[move.x] + sgfLetters[move.y]) + ']').join('');
    const sgf = '(;GM[1]FF[4]CA[UTF-8]SZ[19]KM[7.5]RU[Chinese]AP[Cheney-Go-Board:1]' + moves + ')';
    const url = URL.createObjectURL(new Blob([sgf], { type: 'application/x-go-sgf;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '围棋对局-' + new Date().toISOString().slice(0, 10) + '.sgf';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  render();
}());
