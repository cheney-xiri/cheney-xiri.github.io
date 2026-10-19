(function () {
  'use strict';
  const records = [
    {
      id: 'direct-33', level: '入门 01', name: '直接点三三', original: 'Direct 3-3 Invasion',
      source: 'Ishigure Ikuro / Jim Davies, In the Beginning', url: 'https://online-go.com/joseki/20810',
      quote: 'White can invade the corner directly, and easily make a living shape.',
      translation: '白棋可以直接侵入角部，较容易形成活形。', outcome: ['定式入口', '后续有多种分支'],
      moves: 'Q16,R17', kind: '定式入口', note: '原站此条为两手入口，后续分支尚未在本站收录。'
    },
    {
      id: 'direct-33-simple', level: '入门 02', name: '直接点三三 · 简明续谱', original: 'Joseki（原站条目名）',
      source: 'Michael Redmond’s Go TV', url: 'https://online-go.com/joseki/22297',
      quote: 'Playing away is also common, because Black has a relatively settled shape',
      translation: '黑棋局部棋形相对安定，脱先也是常见选择。', outcome: ['黑得中央', '白得角部', '黑得先手'],
      moves: 'Q16,R17,R16,Q17,P16,O18', kind: '原站标记：定式完成', note: '中文名称用于标识本站学习路径；原站条目名为 Joseki。'
    },
    {
      id: 'low-pincer', level: '进阶 01', name: '一间低夹', original: 'One-Space Low Pincer',
      source: 'Cho Hunhyun, Lectures on Go Techniques', url: 'https://online-go.com/joseki/17982',
      quote: 'This narrow pincer prevents White from extending along the edge.',
      translation: '这手紧夹阻止白棋沿边线展开。', outcome: ['定式入口', '夹击变化'],
      moves: 'Q16,R14,R12', kind: '定式入口', note: '原站此条为夹击入口，含后续分支。'
    },
    {
      id: 'low-pincer-basic', level: '进阶 02', name: '一间低夹 · 基础续谱', original: 'Joseki（原站条目名）',
      source: 'Cho Hunhyun, Lectures on Go Techniques', url: 'https://online-go.com/joseki/17781',
      quote: 'This extension is a vital point (a three-space extension from a two-stone wall)',
      translation: '此处的拆边是要点：从两子墙作三间拆。', outcome: ['基础变化', '白得右边', '黑得先手'],
      moves: 'Q16,R14,R15,Q14,O16,R10', kind: '原站标记：基础 · 定式完成', note: '中文名称用于标识本站学习路径；原站条目名为 Joseki。'
    },
    {
      id: 'fighting-pattern', level: '复杂变化 01', name: '一间夹攻后的战斗型', original: 'Joseki（原站条目名）',
      source: 'Toshiro Kageyama, Lessons in the Fundamentals of Go', url: 'https://online-go.com/joseki/24837',
      quote: 'This is an even-game opening pattern . . . against Black’s one-space pincer.',
      translation: '这是黑棋一间夹之后的均势开局型。', outcome: ['战斗型', '黑得右边', '白得上边', '黑得先手'],
      moves: 'R16,P17,N17,P15,Q14,P14,Q13,P13,Q12,K17', kind: '原站标记：战斗型 · 定式完成', note: '中文名称是本站的路径说明；原站条目名为 Joseki。'
    },
    {
      id: 'small-avalanche', level: '复杂变化 02', name: '小雪崩定式', original: 'Small Avalanche Joseki',
      source: 'Michael Redmond’s Go TV（OGS 文字条目）', url: 'https://online-go.com/joseki/27029',
      quote: 'If White occupies D4, then the variation favors White.',
      translation: '若白棋占据 D4，此变化对白棋有利。', outcome: ['征子相关', '需看全盘配置'],
      moves: 'R16,P16,P17,Q16,Q17,R15,O16', kind: '复杂变化入口', note: '原站此条仍有后续分支；这里展示已经核验的当前手顺。'
    },
    {
      id: 'direct-33-cover', level: '入门 03', name: '点三三 · 向右封挡', original: 'OGS 原站未单独命名；本站按棋形归类',
      source: 'OGS 定式词典 · 资料来源：Michael Redmond’s Go TV', url: 'https://online-go.com/joseki/20811',
      quote: 'Black usually covers on the side that Black wants to build.',
      translation: '黑棋通常朝自己希望发展的那一边封挡。', outcome: ['封挡方向', '右边模样'],
      moves: 'Q16,R17,R16', kind: '变化入口', note: '原站在这一步仍列有后续分支；右边模样是原站文字说明中的具体方向。'
    },
    {
      id: 'pincer-corner-invasion', level: '进阶 03', name: '一间低夹 · 点三三入角', original: '3-3 Point Invasion',
      source: 'OGS 定式词典 · 资料来源：Yilun Yang, Fundamental Principles of Go', url: 'https://online-go.com/joseki/18600',
      quote: 'White slips out of the severe attack by entering the corner.',
      translation: '白棋通过进入角部，避开夹击造成的严厉攻势。', outcome: ['白入角', '后续封挡方向待选择'],
      moves: 'Q16,R14,R12,R17', kind: '变化入口', note: '原站指出 R16 是现代职业棋谱更常见的下一步，Q17 则在特定上边配置下仍可考虑。'
    },
    {
      id: 'pincer-jump', level: '进阶 04', name: '一间低夹 · 一间跳出', original: 'One-Space Jump',
      source: 'OGS 定式词典 · 资料来源：Cho Hunhyun, Lectures on Go Techniques', url: 'https://online-go.com/joseki/18174',
      quote: 'This jump simply escapes.',
      translation: '白棋一间跳以脱离夹击。', outcome: ['白棋出头', '黑棋需顾角'],
      moves: 'Q16,R14,R12,P14', kind: '变化入口', note: '原站列有后续分支；守角与限制白棋往上边发展是原站讲解的重点。'
    },
    {
      id: 'pincer-double-approach', level: '进阶 05', name: '一间低夹 · 上边双飞', original: 'Double Approach',
      source: 'OGS 定式词典 · 资料来源：Traditional', url: 'https://online-go.com/joseki/18059',
      quote: 'A light influence-oriented move, but less severe against the corner.',
      translation: '这手棋较轻，偏向外势，但对角部的压力较弱。', outcome: ['重外势', '对角压力较轻'],
      moves: 'Q16,R14,R12,N16', kind: '变化入口', note: '原站列出黑棋 O17、O16、Q14 等应法；本站只展示已核对的当前手顺。'
    },
    {
      id: 'pincer-double-approach-modern', level: '进阶 06', name: '一间低夹 · 上边双飞另一点', original: 'Double Approach',
      source: 'OGS 定式词典 · 资料来源：Choi Cheolhan, AI Masterclass', url: 'https://online-go.com/joseki/18415',
      quote: 'There are typically two possibilities: O16 and Q14.',
      translation: '此后通常有 O16 和 Q14 两种选择。', outcome: ['黑棋应法：O16', '黑棋应法：Q14'],
      moves: 'Q16,R14,R12,O17', kind: '变化入口', note: '原站文字称 O16 略受 AI 偏好，Q14 在职业棋谱中更常见；两者是不同的后续分支。'
    },
    {
      id: 'pincer-counter', level: '进阶 07', name: '一间低夹 · 反夹', original: 'Counter Pincer',
      source: 'OGS 定式词典 · 资料来源：Traditional', url: 'https://online-go.com/joseki/18060',
      quote: 'Counter pincer can be good when White is established in the lower right corner',
      translation: '白棋已经在右下角立足时，反夹可能是较好的选择。', outcome: ['取决于右下配置', '反夹方向'],
      moves: 'Q16,R14,R12,R10', kind: '变化入口', note: '原站还指出：若右边对白棋有发展潜力，也可考虑这一步；此处不把它说成普遍最优。'
    },
    {
      id: 'pincer-moyo-prevention', level: '进阶 08', name: '一间低夹 · 防黑棋模样', original: 'OGS 原站未单独命名；本站按棋形归类',
      source: 'OGS 定式词典 · 资料来源：Richard Bozulich, Get Strong at Joseki 3', url: 'https://online-go.com/joseki/18109',
      quote: 'One use of this move is to prevent a Black moyo',
      translation: '这手棋的一种用途，是防止黑棋形成模样。', outcome: ['防黑棋模样', '与全盘配置相关'],
      moves: 'Q16,R14,R12,Q12', kind: '变化入口', note: '原站以黑棋 K16 为可能的全盘背景；本站不将该背景棋子编入局部手顺。'
    },
    {
      id: 'corner-approach-crosscut', level: '进阶 09', name: '星位低挂 · 托角后续', original: 'OGS 原站未单独命名；本站按棋形归类',
      source: 'OGS 定式词典 · 资料来源：Yeonwoo Cho', url: 'https://online-go.com/joseki/16050',
      quote: 'R15 is most common and takes the outside.',
      translation: '后续 R15 最常见，取向是外侧。', outcome: ['托角变化', '继续取外势或实地'],
      moves: 'Q16,R14,O17,R16,R17,S17', kind: '变化入口', note: '原站同时列出 Q18、S18、R18、Q17 等选择；这一步之后尚未定型。'
    },
    {
      id: 'corner-approach-thickness', level: '进阶 10', name: '星位低挂 · 外势取向', original: 'OGS 原站未单独命名；本站按棋形归类',
      source: 'OGS 定式词典 · 资料来源：Yeonwoo Cho', url: 'https://online-go.com/joseki/16116',
      quote: 'Q15 makes thickness outside. S15 is simple.',
      translation: '此后 Q15 可以形成外势；S15 则较为简明。', outcome: ['下一手 Q15：外势', '下一手 S15：简明'],
      moves: 'Q16,R14,O17,R16,R17,S17,R18', kind: '变化入口', note: '本谱停在白棋需要从外势与简明下法中作选择的位置。'
    },
    {
      id: 'corner-approach-territory', level: '进阶 11', name: '星位低挂 · 守角取实地', original: 'OGS 原站未单独命名；本站按棋形归类',
      source: 'OGS 定式词典 · 资料来源：Yeonwoo Cho', url: 'https://online-go.com/joseki/16072',
      quote: 'This move is territorial. It says, “Don’t steal my corner.”',
      translation: '这手棋偏向实地，意图守住自己的角部。', outcome: ['守角', '实地取向'],
      moves: 'Q16,R14,O17,R16,R17,S17,S18', kind: '变化入口', note: '原站将这一步解释为守角选择，并列有后续分支。'
    },
    {
      id: 'corner-approach-simple', level: '进阶 12', name: '星位低挂 · 简明守角', original: 'OGS 原站未单独命名；本站按棋形归类',
      source: 'OGS 定式词典 · 资料来源：Yeonwoo Cho', url: 'https://online-go.com/joseki/16309',
      quote: 'This is the simplest move.',
      translation: '这是较简明的下法。', outcome: ['走法简明', '需考虑外围厚势'],
      moves: 'Q16,R14,O17,R16,R17,S17,Q17', kind: '变化入口', note: '原站提醒：当上边与右边都尚未占据时，职业棋手通常不这样下，因为白棋会变厚。'
    },
    {
      id: 'wide-extension', level: '进阶 13', name: '星位低挂 · 双方拆边', original: 'Joseki（原站条目名）',
      source: 'OGS 定式词典 · 资料来源：Richard Bozulich, Get Strong at Joseki 3', url: 'https://online-go.com/joseki/19081',
      quote: 'If White makes a wide extension so too can Black.',
      translation: '白棋作较宽的拆边时，黑棋也可以相应地宽拆。', outcome: ['黑得角部与上边', '白得右边'],
      moves: 'Q16,R14,Q14,Q13,P14,R15,R16,R10,K17', kind: '原站标记：定式完成', note: '原站文字还指出，此时 Q15 的冲断暂不构成问题；中文名称是本站的棋形说明。'
    },
    {
      id: 'direct-33-extended', level: '复杂变化 03', name: '点三三 · 角部延长变化', original: 'Joseki（原站条目名）',
      source: 'OGS 定式词典 · 资料来源：Yeonwoo Cho', url: 'https://online-go.com/joseki/22017',
      quote: 'White can play elsewhere or at Q12, which prevents a sente move against the white group.',
      translation: '白棋可脱先，也可下在 Q12，以防黑棋对这块白棋取得先手。', outcome: ['黑得上边', '白得角部', '白得先手'],
      moves: 'Q16,R17,R16,Q17,O17,P17,P16,O18,S17,S18,P18,S16,R18,T17,Q18,S17,N18,O16,N17,R14,O14', kind: '原站标记：定式完成', note: '第 16 手重占 S17 是提子后的合法落点；棋图与下载棋谱均按实际提子重放。'
    },
    {
      id: 'komoku-low-approach', level: '入门 04', name: '小目一间低挂', original: 'One-Space Low Approach',
      source: 'OGS 定式词典 · 资料来源：Kogo’s Joseki Dictionary', url: 'https://online-go.com/joseki/24146',
      quote: 'This is the basic approach move to the 3-4 point and divides the corner between Black and White.',
      translation: '这是对小目最基础的挂角之一，围绕角部利益展开争夺。', outcome: ['小目低挂', '后续可夹击或应角'],
      moves: 'R16,P17', kind: '定式入口', note: '原站此条为低挂入口，后续分支众多；这里先用于认识最基础的出发棋形。'
    },
    {
      id: 'komoku-high-approach', level: '入门 05', name: '小目一间高挂', original: 'One-Space High Approach',
      source: 'OGS 定式词典 · 资料来源：Yilun Yang, Fundamental Principles of Go', url: 'https://online-go.com/joseki/26969',
      quote: 'When White approaches high, it feels like it is pressing down on Black.',
      translation: '白棋高挂时，有向下压迫黑棋的意味。', outcome: ['高位取势', '黑棋需留意中央'],
      moves: 'R16,P16', kind: '定式入口', note: '原站文字指出此着会形成向中央发展的外势；此处尚未进入具体应法。'
    },
    {
      id: 'shusaku-kosumi', level: '入门 06', name: '秀策小尖 · 基础定型', original: 'Shusaku’s Diagonal',
      source: 'OGS 定式词典 · 资料来源：Traditional', url: 'https://online-go.com/joseki/24723', textUrl: 'https://online-go.com/joseki/24332',
      quote: 'a steady response to White’s approach',
      translation: '这是对白棋挂角较稳健的应法。', outcome: ['秀策小尖', '原站标记：局部安定'],
      moves: 'R16,P17,Q15,M17', kind: '原站标记：定式完成', note: '讲解短摘来自前序节点 24332；完成标记与四手手顺来自节点 24723。原站也称脱先相当常见。'
    },
    {
      id: 'komoku-kick', level: '入门 07', name: '小目低挂 · 踢后拆边', original: 'Kick（前序节点标题）',
      source: 'OGS 定式词典 · 资料来源：Post AlphaGo Pro Games / Hyeyeon Cho', url: 'https://online-go.com/joseki/24796', textUrl: 'https://online-go.com/joseki/24752',
      quote: 'AlphaGo reintroduced this move to get the corner in sente.',
      translation: '原站称 AlphaGo 重新带热了这手“踢”，意在先手取得角部。', outcome: ['黑得角部与右边', '白得上边', '黑得先手'],
      moves: 'R16,P17,Q17,P16,R14,L16', kind: '原站标记：基础 · 定式完成', note: '讲解短摘来自前序节点 24752；完整手顺与局面结果来自节点 24796。'
    },
    {
      id: 'komoku-attach-draw-back', level: '入门 08', name: '小目高挂 · 托退定式', original: 'Attach and Draw Back Joseki',
      source: 'OGS 定式词典 · 资料来源：Cho Hunhyun, Lectures on Go Techniques / Yeonwoo Cho', url: 'https://online-go.com/joseki/27694', textUrl: 'https://online-go.com/joseki/27281',
      quote: 'This move is a vital point to secure the corner territory',
      translation: '黑棋退回的这一手是守住角部实地的要点。', outcome: ['黑得角部与右边', '白得上边和中央', '黑得先手'],
      moves: 'R16,P16,P17,O17,Q17,O16,R14,K16', kind: '原站标记：基础 · 定式完成', note: '讲解短摘来自前序节点 27281；完成标记与八手手顺来自节点 27694。'
    },
    {
      id: 'sansan-shoulder', level: '入门 09', name: '三三占角 · 肩冲应法', original: 'Shoulder Hit（前序节点标题）',
      source: 'OGS 定式词典 · 资料来源：Kogo’s Joseki Dictionary / Traditional', url: 'https://online-go.com/joseki/31293', textUrl: 'https://online-go.com/joseki/31231',
      quote: 'The direction of Black’s next move depends on the positions on the sides.',
      translation: '黑棋随后选择哪一边，取决于两侧已有棋子的配置。', outcome: ['黑得角部与上边', '白得右边', '黑得先手'],
      moves: 'R17,Q16,R16,Q15,P18,R15,O16,R11', kind: '原站标记：基础 · 定式完成', note: '讲解短摘来自前序节点 31231；完整手顺和完成标记来自节点 31293。'
    },
    {
      id: 'komoku-high-pincer', level: '进阶 14', name: '小目低挂 · 一间高夹', original: 'One-Space High Pincer',
      source: 'OGS 定式词典 · 资料来源：Traditional / Michael Redmond’s Go TV', url: 'https://online-go.com/joseki/25425', textUrl: 'https://online-go.com/joseki/25237',
      quote: 'This pincer is severe and aims to build thickness on the outside.',
      translation: '这手夹击较严厉，目标是在外侧建立厚势。', outcome: ['一间高夹', '原站标记：定式完成'],
      moves: 'R16,P17,N16,P15,Q14', kind: '原站标记：定式完成', note: '讲解短摘来自前序节点 25237；节点 25425 指出此时常可脱先，但仍有局部后续。'
    },
    {
      id: 'komoku-three-space-pincer', level: '进阶 15', name: '小目低挂 · 三间低夹', original: 'Three-Space Low Pincer',
      source: 'OGS 定式词典 · 资料来源：Hideo Otake, Opening Theory Made Easy / Traditional', url: 'https://online-go.com/joseki/26353', textUrl: 'https://online-go.com/joseki/26237',
      quote: 'This pincer is even more leisurely than the two-space pincer.',
      translation: '三间低夹比两间夹更舒缓，是距离更远的夹击。', outcome: ['黑得右边', '白得角部', '黑得先手'],
      moves: 'R16,P17,L17,Q15,R15,Q14,R13,R17,Q13,Q16', kind: '原站标记：定式完成', note: '讲解短摘来自前序节点 26237；十手棋谱和结果来自节点 26353。'
    },
    {
      id: 'komoku-low-pincer-fight', level: '复杂变化 04', name: '小目低挂 · 一间低夹战斗', original: 'One-Space Low Pincer',
      source: 'OGS 定式词典 · 资料来源：Hideo Otake, Opening Theory Made Easy / Post AlphaGo Pro Games', url: 'https://online-go.com/joseki/25055', textUrl: 'https://online-go.com/joseki/24800',
      quote: 'This close-up pincer will often lead to immediate fighting.',
      translation: '这种紧贴的夹击常会立刻引发战斗。', outcome: ['黑得右边', '白得上边', '黑得先手'],
      moves: 'R16,P17,N17,Q15,Q16,P16,P15,O15,P14,N16,Q13,L16', kind: '原站标记：定式完成', note: '讲解短摘来自前序节点 24800；十二手手顺来自原站标记为当前定式的节点 25055。'
    },
    {
      id: 'komoku-two-space-high-pincer', level: '复杂变化 05', name: '小目低挂 · 两间高夹', original: 'Two-Space High Pincer',
      source: 'OGS 定式词典 · 资料来源：Kogo’s Joseki Dictionary', url: 'https://online-go.com/joseki/25483',
      quote: 'This pincer maintains balance between territory and influence',
      translation: '这手夹击兼顾实地与外势。', outcome: ['兼顾实地和外势', '后续变化较多'],
      moves: 'R16,P17,M16', kind: '复杂变化入口', note: '原站明确说此后选择很多；目前只收录已经核对的入口三手。'
    },
    {
      id: 'komoku-two-space-low-pincer', level: '复杂变化 06', name: '小目低挂 · 两间低夹', original: 'Two-Space Low Pincer',
      source: 'OGS 定式词典 · 资料来源：Michael Redmond’s Go TV', url: 'https://online-go.com/joseki/26696',
      quote: 'Popular in the 17th century, this pincer is still played in contemporary games',
      translation: '两间低夹在十七世纪已流行，今天仍见于对局。', outcome: ['历史悠久', '后续可引发战斗'],
      moves: 'R16,P17,M17', kind: '复杂变化入口', note: '原站说明这种夹击并非总是温和，后续可能进入战斗；此条只展示入口。'
    }
  ];
  const bookTitle = '廖渝生《围棋定式大全（修订本）》';
  records.forEach(record => { record.sourceType = 'OGS'; });
  const sourceNotes = {
    'direct-33': ['星位先手占角，白棋点三三直接取角。原站说明白棋容易做活，但所得角地不大；黑棋保留向外发展的机会。', '这条只有两手，是定式的入口。黑棋下一手封哪一边，要看自己希望在哪一边发展。'],
    'direct-33-simple': ['白棋点三三后，黑棋向右边封挡，再以简明手顺取得相对安定的外侧棋形。原站说明黑棋可以继续在右边发展，也可以考虑脱先。', '本谱为原站标记的完成局面。黑棋仍有局部处理手段，因此不能把白棋已完全控制外侧作为结论。'],
    'low-pincer': ['黑棋一间低夹的目的，是限制白棋从右边轻易展开；白棋的应法会决定接下来是取角、出头，还是转向上边。', '当前仅到黑棋夹击，不是完整定式。可接着看本目录中的点三三入角、一间跳出、双飞和反夹。'],
    'low-pincer-basic': ['此谱中的拆边是原站标出的要点：两子墙向外三间拆，兼顾已有厚势与右边的发展空间。', '原站还说明在前一手的贴靠变化中，不能机械扳头；要看贴靠之子是否有接应。本条是完成谱，不宜脱离前面的全局配置照搬。'],
    'fighting-pattern': ['原站引用影山利郎的讲解，说明这类小目低挂遇夹后的行棋可形成双方各有所取的局面。', '本谱终局黑棋伸向右边，白棋取得上边的发展；原文特别提醒，不要只因对方一侧看起来宽广便误判局部得失。'],
    'small-avalanche': ['小雪崩并不只由角部棋形决定。原站明确把左下角的配置和征子是否成立列为判断条件。', '白棋在左下 D4 时，原站认为本变化对白有利；在 C4 或没有白棋接应时，黑棋才可考虑这条变化。本站只收录到当前七手入口。'],
    'direct-33-cover': ['白棋点三三入角后，黑棋选择封挡方向。OGS 的说明是向自己希望建设的一侧封挡；本谱选择右边，所以意图是右边的发展。', '本条只到黑棋封挡，白棋怎样在角里安定还需要续谱。封挡一手也不能单独当作完成定式。'],
    'pincer-corner-invasion': ['黑棋一间低夹后，白棋不在边上硬撑，而是点三三转入角部，以摆脱夹击的直接压力。', '原站说明接下来黑棋 R16 封挡是现代职业棋谱更常见的方向；Q17 仍与上边的配置有关。这一路停在白棋入角，尚未确定封挡方向。'],
    'pincer-jump': ['白棋一间跳的首要作用是出头，减轻黑棋夹击对它的压力。', '原站把黑棋守角和限制白棋向上边发展视为后续重点。当前四手只显示应对方向，不能据此判断双方局部已经安定。'],
    'pincer-double-approach': ['对白棋而言，这一着较轻，侧重外侧发展；与直接取角相比，对黑角的压力较弱。', 'OGS 给出黑棋 O17、O16、Q14 等不同应法。它们会把棋局带到不同取向，所以本页只把四手作为选择入口。'],
    'pincer-double-approach-modern': ['白棋转到上边的另一处继续施压。OGS 说明黑棋常考虑 O16 与 Q14 两个方向。', '原站认为 O16 略受 AI 偏好，Q14 在职业对局中更常见。此条还没有走到其中任何应法，不应把两种结果合成一条定式。'],
    'pincer-counter': ['反夹不是不看全局就能照走的一手。原站给出的适用背景是白棋已经在右下角立足，或右边对白棋有发展潜力。', '本页只展示反夹这个选择点；若右边没有接应，原站的有利条件并未成立。'],
    'pincer-moyo-prevention': ['白棋此着的一种用途是阻止黑棋在右边形成模样。原站是以附近已有黑棋作背景说明这点。', '本站棋谱只保留局部落子，没有把示意的背景棋子偷加进手顺；因此这一着的价值需要对照实际全盘。'],
    'corner-approach-crosscut': ['本谱展示星位低挂后托角的一条入口。原站说明后续 R15 最常见，其取向在外侧。', '原站也列出 Q18、S18、R18、Q17 等选择；六手终局仍是分支交叉点，不能当作定型结果。'],
    'corner-approach-thickness': ['此谱比前一条多走一手，落到白棋要在外势与简明下法间作决定的位置。', 'OGS 指出 Q15 可以形成外侧厚势，S15 则相对简明。页面上显示的是选择前的棋形，未替白棋决定下一手。'],
    'corner-approach-territory': ['这条分支把下一手落在守角方向，目标是角部实地。', '与取外势的分支相比，它的意图不同；原站仍列有后续变化，所以当前手数只标为变化入口。'],
    'corner-approach-simple': ['原站把这一应手描述为简明，但附有明确条件：上边和右边都空旷时，职业棋手通常不这样走。', '原因是此后白棋容易变厚。读这一路时要同时看两边是否已有棋子，不能只看局部顺手。'],
    'wide-extension': ['白棋作较宽的拆边后，黑棋也向外宽拆，双方把局部棋形延伸到边上。', '原站说明此时 Q15 的冲断暂时不构成问题，因此将这一处标为定式完成。这个判断针对当前手顺，不代表所有邻近配置都相同。'],
    'direct-33-extended': ['这是点三三后的长变化。原站标为已完成，同时仍提出白棋可以脱先，或在 Q12 加一手，避免黑棋对这块白棋取得先手。', '棋谱中第十六手重新落在 S17，是前面提子以后出现的合法复占。电子棋盘和下载棋谱都按提子后的实际局面复盘。'],
    'komoku-low-approach': ['一间低挂是小目最基本的挂角出发点之一。原站把它解释为分割黑角，双方此后围绕角地与外侧发展作选择。', '两手棋谱仅标出出发棋形，下一步的守角、踢或夹击都属于不同分支。'],
    'komoku-high-approach': ['白棋一间高挂比低挂更着眼于外侧，原站指出它有向下压迫黑棋和向中央发展外势的意味。', '这里仍只到挂角，黑棋怎样应对尚未确定；后面的小雪崩等复杂变化从不同应法展开。'],
    'shusaku-kosumi': ['秀策小尖是对白棋小目挂角较稳健的应法。原站的这一支四手后标为完成，并说明脱先也相当常见。', '稳健不等于各处都必须跟进；原站给出的是当前局部可暂时告一段落的判断。'],
    'komoku-kick': ['黑棋“踢”白棋，是先手争取角地的一种取向。OGS 说明这一手在 AlphaGo 之后重新受到关注。', '本谱继续到双方拆边，原站将该局面标为基础定式完成；比较它与小尖定型，可看出黑棋先取得角地的思路。'],
    'komoku-attach-draw-back': ['白棋高挂后黑棋托角，再退回守住角地。原站把黑棋的退列为实地要点。', '八手之后原站标记定式完成。黑棋偏重角部，白棋在外侧有发展方向；读谱时应结合附近棋子判断取舍。'],
    'sansan-shoulder': ['黑棋先占三三，白棋从外侧肩冲。原站说明黑棋之后向哪一侧发展取决于两侧已有棋子。', '这条八手变化在原站被列为基础完成谱，但方向选择来自全局，不能机械把一边判为永远更好。'],
    'komoku-high-pincer': ['黑棋一间高夹是较严厉的应法，目标是在外侧建立厚势。', '原站在后续节点说明当前形状常可以脱先，但局部仍可能继续。因而“定式完成”只表示原站认可暂时收束，不是无变化可读。'],
    'komoku-three-space-pincer': ['黑棋三间低夹比两间夹距离更远，原站称它较为舒缓。白棋因而有更宽的局部应对空间。', '十手谱的结果在原站标为黑得右边、白得角部、黑得先手。这是此分支的结果，不能直接套到其他夹距。'],
    'komoku-low-pincer-fight': ['小目一间低挂后，黑棋紧夹。OGS 的前序讲解指出，白棋在 Q15 挡是现代职业棋谱与 AI 常见的应法，会进入复杂战斗；P15 和 N16 是相对简明的选择。', '至第十手，原站把 Q13 列为现代下法，Q14 列为传统下法，M16 会进入复杂变化。本站这一支走 Q13，最终标记为黑得右边、白得上边、黑得先手。'],
    'komoku-two-space-high-pincer': ['两间高夹在实地与外势之间保持平衡，是原站对这手棋的描述。', '原站明确说随后选择很多；这里仅保留三手入口，因此没有把任何一种尚未展示的结果说成必然。'],
    'komoku-two-space-low-pincer': ['两间低夹是历史悠久的选择，原站指出从十七世纪到当代对局都可见。', '距离虽较一间夹宽，后续并不一定和平；原站提及仍可能引发战斗，本页只到夹击入口。']
  };
  const bookRecords = [{
    id: 'book-hoshi-contact', level: '进阶 30', name: '星位小飞挂 · 黑碰', original: '书中第 16 图：黑碰',
    source: bookTitle + ' · 第 6 页第 16 图', sourceType: '书中棋图',
    book: { page: 6, figure: 16, title: '黑碰', explanation: '对白棋小飞挂，黑棋在右边碰是书中介绍的有力应法。书中同时指出它并非旧时最常见的选择，白棋之后可下扳、立或上扳；本谱停在黑碰，尚未定型。' },
    overview: ['由星位、小飞挂、一间跳出再到白棋飞，黑棋选择右边碰。此条据书中第 16 图核对落点，保留为变化入口。', '书中列出白棋下扳、立、上扳等不同应法，所以五手图不能称为完整定式。'],
    moves: 'Q16,R14,O16,S16,R13', kind: '书中变化入口', outcome: ['星位小飞挂', '黑棋碰', '后续未定型'],
    note: '依据用户提供的扫描书逐点转录；只录入图中能够确认的五手。'
  }];
  const pachiRecords = (window.JOSEKI_PACHI || []).map(record => {
    const moves = record.moves.split(',');
    const opening = moves[0] === 'Q16' ? '星位小飞挂' : moves[1] === 'P16' ? '小目高挂' : '小目低挂';
    const thirdMove = { O16: '一间跳', O17: '小飞应', R12: '一间低夹', N17: '一间低夹', M17: '两间低夹', Q15: '小尖', Q17: '踢' }[moves[2]];
    const book = record.id === 'pachi-44-110'
      ? { page: 2, figure: 1, title: '飞 · 基本形', explanation: '这一路的前六手与书中第 1 图一致：白棋飞出，黑棋尖重视角部实利，白棋拆边不能省。书中下一图以黑棋转占大场收束；Pachi 的这条电子谱停在白棋拆边。' }
      : record.id === 'pachi-44-112'
        ? { page: 4, figure: 8, title: '黑夹', explanation: '本谱前九手与书中第 8 图相同。白棋飞后，黑棋夹，白棋转取角地，黑棋在右边形成厚势；书中提醒白棋不能过早左跳。第十手以后采用 Pachi 变化树的续谱。' }
        : null;
    const name = record.id === 'pachi-44-110' ? '星位小飞挂 · 飞后尖拆'
      : record.id === 'pachi-44-112' ? '星位小飞挂 · 飞后黑夹'
        : opening + (thirdMove ? ' · ' + thirdMove : '') + ' · 分支 ' + record.id.slice(-3);
    return { ...record, level: '参考变化', name, original: record.source,
      book, outcome: [record.family + '变化', moves.length + ' 手来源棋谱'],
      overview: book ? [record.id === 'pachi-44-110'
        ? '这是星位小飞挂后白飞、黑尖、白拆的一路。电子谱停在白棋拆边，可逐手观察角地和边上展开的交换。'
        : '这是星位小飞挂后白飞、黑夹的一路。书中第 8 图覆盖前九手；电子谱继续展示 Pachi 变化树中的后续。'] : [],
      note: record.note + (book ? ' 前段已与指定书页图号交叉核对。' : '') };
  });
  records.push(...bookRecords, ...pachiRecords, ...(window.JOSEKI_JOSEKLE || []), ...(window.JOSEKI_VARIATIONS || []));
  (window.JOSEKI_BOOKS || []).forEach(record => {
    const index = records.findIndex(item => item.id === record.id);
    if (index < 0) records.push(record);
    else records[index] = record;
  });
  records.forEach(record => {
    if (sourceNotes[record.id] && !record.bookRef) record.overview = sourceNotes[record.id];
    const moves = record.moves.split(',');
    const family = { Q16: '星位', R16: '小目', R17: '三三', R15: '目外', Q15: '高目' }[moves[0]] || '角部';
    const snow = 'R16,P16,P17,Q16,Q17,R15,O16';
    if (record.id === 'small-avalanche' || record.moves.startsWith(snow)) {
      record.topicKey = snow;
      record.topicTitle = '小雪崩定式';
    } else {
      record.topicKey = moves.slice(0, Math.min(5, moves.length)).join(',');
      record.topicTitle = family + ' · ' + moves.slice(1, 3).join(' → ');
    }
    if (/^josekle-/.test(record.id) && !record.bookRef) {
      record.name = record.topicTitle + ' · ' + moves.length + ' 手变化';
      if (!record.original || /^OGS 节点/.test(record.original)) record.original = '来源节点 #' + record.id.replace(/\D/g, '');
    }
    if (record.topicKeyOverride) record.topicKey = record.topicKeyOverride;
    if (record.topicTitleOverride) record.topicTitle = record.topicTitleOverride;
  });
  const levelOrder = { '入门': 0, '进阶': 1, '复杂变化': 2 };
  records.forEach(record => {
    const length = record.moves.split(',').length;
    const basic = record.basic || /基础/.test(record.kind || '') || (record.outcome || []).includes('基础定式');
    const complexName = /雪崩|征子|战斗型/.test(record.name || '');
    record.studyStage = record.stageOverride || (basic || length <= 7 ? '入门' : complexName || length >= 16 ? '复杂变化' : '进阶');
  });
  records.sort((a, b) => {
    return levelOrder[a.studyStage] - levelOrder[b.studyStage]
      || a.moves.split(',').length - b.moves.split(',').length
      || Number(a.sourceType === 'OGS 归档变化树') - Number(b.sourceType === 'OGS 归档变化树')
      || a.name.localeCompare(b.name, 'zh-CN');
  });
  const stageNumbers = { '入门': 0, '进阶': 0, '复杂变化': 0 };
  records.forEach(record => { record.level = record.studyStage + ' ' + String(++stageNumbers[record.studyStage]).padStart(3, '0'); });
  window.JOSEKI_RECORDS = records;
  const list = document.getElementById('joseki-list');
  const detail = document.getElementById('joseki-detail');
  if (!list || !detail) return;
  const indexToggle = document.getElementById('index-toggle');
  if (indexToggle) indexToggle.addEventListener('click', () => {
    const open = list.classList.toggle('is-open');
    list.closest('.study-index').classList.toggle('is-open', open);
    indexToggle.setAttribute('aria-expanded', String(open));
    indexToggle.textContent = open ? '收起目录' : '展开目录';
  });
  let current = records[0];
  let currentPlayback = current;
  let shown = 0;
  let indexStage = current.studyStage;

  const indexSearch = document.getElementById('index-search');
  function renderIndex() {
    const query = indexSearch ? indexSearch.value.trim().toLowerCase() : '';
    const matched = records.filter(record => record.studyStage === indexStage && (!query || (record.name + ' ' + record.moves + ' ' + record.source).toLowerCase().includes(query)));
    document.querySelectorAll('.index-stages button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.indexStage === indexStage)));
    const topics = new Map();
    matched.forEach(record => {
      const group = topics.get(record.topicKey);
      if (!group) topics.set(record.topicKey, { record, count: 1 });
      else {
        group.count++;
        if (record.id === current.id || (group.record.id !== current.id && (record.quote || record.book || record.sourceType === 'OGS 当前节点'))) group.record = record;
      }
    });
    const visible = [...topics.values()];
    const indexCount = document.getElementById('index-count');
    if (indexCount) indexCount.textContent = topics.size + ' 组棋形';
    list.replaceChildren();
    visible.forEach(group => {
      const record = group.record;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'joseki-item';
      button.dataset.id = record.id;
      button.classList.toggle('is-active', record.topicKey === current.topicKey);
      button.setAttribute('aria-pressed', String(record.topicKey === current.topicKey));
      if (record.topicKey === current.topicKey) button.setAttribute('aria-current', 'true');
      button.innerHTML = '<strong>' + record.topicTitle + '</strong><span>' + group.count + ' 路续谱 · ' + (record.openingLine?.moves || record.moves).split(',').length + ' 手</span>';
      button.addEventListener('click', () => select(record));
      list.appendChild(button);
    });
    if (!visible.length) {
      const hint = document.createElement('p');
      hint.className = 'index-hint';
      hint.textContent = '没有找到匹配的棋谱，试试其他名称或落点。';
      list.appendChild(hint);
    }
  }
  if (indexSearch) indexSearch.addEventListener('input', renderIndex);
  document.querySelectorAll('.index-stages button').forEach(button => button.addEventListener('click', () => {
    indexStage = button.dataset.indexStage;
    if (indexSearch) indexSearch.value = '';
    renderIndex();
  }));
  function revealCurrentInIndex() {
    const active = list.querySelector('.is-active');
    if (!active || !list.clientHeight) return;
    const bounds = list.getBoundingClientRect();
    const itemBounds = active.getBoundingClientRect();
    if (itemBounds.top < bounds.top) list.scrollTop += itemBounds.top - bounds.top;
    else if (itemBounds.bottom > bounds.bottom) list.scrollTop += itemBounds.bottom - bounds.bottom;
  }
  const indexCurrent = document.getElementById('index-current');
  if (indexCurrent) indexCurrent.addEventListener('click', () => {
    indexStage = current.studyStage;
    if (indexSearch) indexSearch.value = '';
    renderIndex();
    revealCurrentInIndex();
    list.querySelector('.is-active')?.focus({ preventScroll: true });
  });
  renderIndex();

  function renderDiagram(moves) {
    const diagram = detail.querySelector('#joseki-diagram');
    diagram.replaceChildren();
    const frame = window.JosekiBoard.frame(moves, currentPlayback);
    diagram.style.setProperty('--board-size', frame.size);
    diagram.style.setProperty('--point', Math.min(36, Math.floor(288 / frame.size)) + 'px');
    diagram.setAttribute('aria-label', frame.label + '，已播放 ' + shown + ' 手');
    detail.querySelector('.diagram-wrap p').textContent = frame.label + (currentPlayback.setup ? ' · 无数字棋子为前置棋形' : ' · 每颗棋子按原始落点显示');
    const stones = window.JosekiBoard.replay(moves, shown, currentPlayback);
    for (let y = frame.fromY; y < frame.fromY + frame.size; y += 1) {
      for (let x = frame.fromX; x < frame.fromX + frame.size; x += 1) {
        const point = document.createElement('span');
        point.className = 'diagram-point';
        if (x === 18) point.classList.add('edge-right');
        if (y === 0) point.classList.add('edge-top');
        if (x === 0) point.classList.add('edge-left');
        if (y === 18) point.classList.add('edge-bottom');
        if ([3, 9, 15].includes(x) && [3, 9, 15].includes(y)) point.classList.add('star');
        const stone = stones.get(y + ',' + x);
        if (stone) {
          point.classList.add('stone-' + stone.color);
          point.textContent = stone.number ? String(stone.number) : '';
        }
        diagram.appendChild(point);
      }
    }
    const active = detail.querySelectorAll('.move-chip');
    active.forEach((button, index) => {
      button.classList.toggle('is-shown', index < shown);
      button.classList.toggle('is-current', index === shown - 1);
      button.setAttribute('aria-pressed', String(index + 1 === shown));
    });
    detail.querySelector('#joseki-progress').textContent = shown === 0 && currentPlayback.setup ? '初始棋形' : '已播放 ' + shown + ' / ' + moves.length + ' 手';
    const scrubber = detail.querySelector('#joseki-scrubber');
    if (scrubber) {
      scrubber.value = shown;
      scrubber.setAttribute('aria-valuetext', '第 ' + shown + ' 手，共 ' + moves.length + ' 手');
    }
    detail.querySelector('#joseki-start').disabled = shown === 0;
    detail.querySelector('#joseki-prev').disabled = shown === 0;
    detail.querySelector('#joseki-next').disabled = shown === moves.length;
    detail.querySelector('#joseki-end').disabled = shown === moves.length;
  }
  function select(record, mode = 'full') {
    current = record;
    const playback = record.openingLine && mode !== 'book'
      ? { ...record, ...record.openingLine, setup: undefined, firstColor: 'black', startNumber: 1 }
      : record;
    currentPlayback = playback;
    indexStage = record.studyStage;
    shown = playback.moves.split(',').length;
    history.replaceState(null, '', 'joseki-detail.html?id=' + encodeURIComponent(record.id));
    document.title = record.name + ' · 定式讲解 · Cheney';
    if (indexToggle && matchMedia('(max-width: 760px)').matches) {
      list.classList.remove('is-open');
      list.closest('.study-index').classList.remove('is-open');
      indexToggle.setAttribute('aria-expanded', 'false');
      indexToggle.textContent = '展开目录';
    }
    renderIndex();
    revealCurrentInIndex();
    const moves = playback.moves.split(',');
    const sourceOnly = /^josekle-/.test(record.id) && !record.bookRef;
    const textBlocks = sourceOnly
      ? [record.sourceType === 'OGS 当前节点'
        ? '资料记录了下方的局部结果，但没有附上可直接转录的逐手文字解析。'
        : '这一谱线的落点可以逐手核对；资料没有附带完整的专业文字解析。']
      : (record.overview && record.overview.length ? record.overview : [record.translation, record.note]).filter(Boolean);
    const explanation = textBlocks.map((paragraph, index) => '<p class="study-paragraph"><span>' + String(index + 1).padStart(2, '0') + '</span>' + paragraph + '</p>').join('');
    const bookReference = record.book ? '<div class="book-reference"><small>书中对应图</small><b>' + bookTitle + ' · 第 ' + record.book.page + ' 页 · 第 ' + record.book.figure + ' 图「' + record.book.title + '」</b><p>' + record.book.explanation + '</p></div>' : '';
    const originalText = record.quote ? '<details class="source-original"><summary>参考资料英文短摘</summary><blockquote lang="en">“' + record.quote + '”</blockquote></details>' : '';
    const familyLabel = { Q16: '星位', R16: '小目', R17: '三三', R15: '目外', Q15: '高目' }[record.familyCode || moves[0]] || '角部';
    const formationParts = playback.setup ? [
      { label: '前置棋形', text: '本图从已有的黑白棋形继续。点「初始棋形」可单独查看；未给出的此前手顺不补编。' },
      { label: '本图续法', text: (playback.firstColor === 'white' ? '白' : '黑') + '先，从图中第 ' + (playback.startNumber || 1) + ' 手开始。全部落点在棋盘下方逐手列出，点击任意一手可查看对应局面。' }
    ] : [
      { label: '起手', text: '黑 1 ' + moves[0] + '，以' + familyLabel + '进入右上角。' },
      moves.length > 1 ? { label: '应对', text: '白 2 ' + moves[1] + (moves[2] ? '，黑 3 ' + moves[2] : '') + '，形成这组变化的共同起点。' } : null,
      moves.length > 4 ? { label: '展开', text: '第 4 至 ' + Math.min(7, moves.length) + ' 手：' + moves.slice(3, 7).join(' → ') + '。' } : null,
      moves.length > 7 ? { label: '续法', text: '其后依次 ' + moves.slice(7, 12).join(' → ') + (moves.length > 12 ? '，完整手顺见下方电子棋谱。' : '。') } : null
    ].filter(Boolean);
    const formation = '<ol class="formation-steps">' + formationParts.map((part, index) => '<li><span>' + String(index + 1).padStart(2, '0') + '</span><div><strong>' + part.label + '</strong><p>' + part.text + '</p></div></li>').join('') + '</ol>';
    const complete = /定式完成|完成谱/.test(record.kind || '');
    const variants = records.filter(item => item.id !== record.id && item.topicKey === record.topicKey
      && (!complete || /定式完成|完成谱/.test(item.kind || ''))
      && (record.id === 'small-avalanche' || (!item.moves.startsWith(record.moves + ',') && !record.moves.startsWith(item.moves + ','))));
    const variantCount = Math.min(4, variants.length);
    detail.innerHTML = `
      <header class="detail-top"><div><small>${record.studyStage} <span aria-hidden="true"> / </span> ${familyLabel} <span aria-hidden="true"> / </span> ${moves.length} 手</small><h2>${record.topicTitle}</h2></div><span class="lesson-seal" aria-hidden="true">棋谱</span></header>
      <div class="lesson-body">
      <section class="lesson-board" aria-label="电子棋谱">
        ${record.openingLine ? '<div class="record-modes" role="group" aria-label="选择棋谱"><button type="button" data-record-mode="full" aria-pressed="' + (mode !== 'book') + '">完整起手谱 · ' + record.openingLine.moves.split(',').length + ' 手</button><button type="button" data-record-mode="book" aria-pressed="' + (mode === 'book') + '">书图续谱 · ' + record.moves.split(',').length + ' 手</button></div>' : ''}
        <div class="record-title"><h3>电子棋谱</h3><span id="joseki-progress" role="status"></span></div>
        <div class="diagram-wrap"><div id="joseki-diagram" class="joseki-diagram" role="img" aria-label="当前手数的右上角局部图"></div><p>右上角局部棋谱</p></div>
        <label class="move-scrubber"><span class="sr-only">选择棋谱手数</span><input id="joseki-scrubber" type="range" min="0" max="${moves.length}" value="${moves.length}"></label>
        <div class="record-controls"><button id="joseki-start" type="button">${playback.setup ? '初始棋形' : '起手'}</button><button id="joseki-prev" type="button">上一手</button><button id="joseki-next" type="button">下一手</button><button id="joseki-end" type="button">全谱</button></div>
        ${playback.setup ? '<details class="setup-points"><summary>前置棋形 · 黑 ' + playback.setup.black.length + ' 子 / 白 ' + playback.setup.white.length + ' 子</summary><p>黑：' + (playback.setup.black.join('、') || '无') + '</p><p>白：' + (playback.setup.white.join('、') || '无') + '</p><p>这些棋子在书图中已存在，未提供的此前落子次序不补编。</p></details>' : ''}
        <details class="lesson-moves" open><summary>逐手落点 <span>完整 ${moves.length} 手</span></summary><p class="move-list-guide">${playback.startNumber > 1 ? '保留书中编号：第 ' + playback.startNumber + ' 至 ' + (playback.startNumber + moves.length - 1) + ' 手。' : '从第 1 手开始，全部着法如下。'}点击落点回看对应棋形。</p><div class="move-record" id="joseki-moves"></div></details>
        <button class="lesson-download" id="joseki-download" type="button">下载 SGF 棋谱 <span aria-hidden="true">↓</span></button>
      </section>
      <div class="lesson-commentary">
      <section class="detail-source"><div class="source-heading"><small>01 · 读解</small><h3>${sourceOnly ? '这一型的局部结果' : '这一路怎样理解'}</h3></div><div class="study-paragraphs">${explanation}</div>${bookReference}<div class="joseki-outcomes">${record.outcome.map(item => '<span>' + item + '</span>').join('')}</div>${originalText}<div class="source-heading formation-explain"><small>02 · 手顺</small><h3>这个定式怎样形成</h3></div>${formation}</section>
      ${variants.length ? '<section class="variation-section" aria-label="同一棋形的其他续法"><div class="variation-heading"><div><small>' + (record.setup ? '相同前置棋形' : '共用前 ' + record.topicKey.split(',').length + ' 手') + '</small><h3>' + (complete ? '这一型的其他定式分支' : '同一主干的其他续谱') + '</h3></div><span>' + variants.length + ' 路</span></div><div id="variation-list" class="variation-list"></div><button id="variation-more" class="variation-more" type="button" ' + (variants.length <= variantCount ? 'hidden' : '') + '>继续显示续谱</button></section>' : ''}
      </div></div>
      <details class="source-foot"><summary>资料记录</summary><p>${record.source}</p><small>${record.note}</small>${record.bookRef?.license ? '<p>原作：<a href="https://gogameguru.com/relentless/" target="_blank" rel="noopener noreferrer">Go Game Guru · Relentless</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a></p>' : ''}</details>`;
    detail.querySelectorAll('[data-record-mode]').forEach(button => button.addEventListener('click', () => select(record, button.dataset.recordMode)));
    if (variants.length) {
      const variationList = detail.querySelector('#variation-list');
      let variationsShown = variantCount;
      function renderVariants() {
        variationList.replaceChildren();
        variants.slice(0, variationsShown).forEach((item, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'variation-item';
          const suffix = item.moves.split(',').slice(record.topicKey.split(',').length);
          button.innerHTML = '<span>' + String(index + 1).padStart(2, '0') + '</span><strong>' + (item.bookRef ? item.name : (suffix.length ? suffix.slice(0, 5).join(' → ') + (suffix.length > 5 ? ' …' : '') : '另一路入口')) + '</strong><small>' + (item.openingLine?.moves || item.moves).split(',').length + ' 手</small>';
          button.addEventListener('click', () => select(item));
          variationList.appendChild(button);
        });
        detail.querySelector('#variation-more').hidden = variants.length <= variationsShown;
      }
      detail.querySelector('#variation-more').addEventListener('click', () => { variationsShown += 8; renderVariants(); });
      renderVariants();
    }
    const moveList = detail.querySelector('#joseki-moves');
    detail.querySelector('#joseki-scrubber').addEventListener('input', event => {
      shown = Number(event.target.value);
      renderDiagram(moves);
    });
    moves.forEach((move, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'move-chip';
      const color = window.JosekiBoard.colorAt(index, playback);
      const moveNumber = index + (playback.startNumber || 1);
      button.setAttribute('aria-label', '第 ' + moveNumber + ' 手，' + (color === 'black' ? '黑棋' : '白棋') + '，' + (move === 'pass' ? '停一手' : move));
      button.innerHTML = '<b>' + String(moveNumber).padStart(2, '0') + '</b><span class="' + color + '" aria-hidden="true"></span><em>' + (color === 'black' ? '黑' : '白') + '</em><strong>' + (move === 'pass' ? '停一手' : move) + '</strong>';
      button.addEventListener('click', () => { shown = index + 1; renderDiagram(moves); });
      moveList.appendChild(button);
    });
    detail.querySelector('#joseki-start').addEventListener('click', () => { shown = 0; renderDiagram(moves); });
    detail.querySelector('#joseki-prev').addEventListener('click', () => { shown = Math.max(0, shown - 1); renderDiagram(moves); });
    detail.querySelector('#joseki-next').addEventListener('click', () => { shown = Math.min(moves.length, shown + 1); renderDiagram(moves); });
    detail.querySelector('#joseki-end').addEventListener('click', () => { shown = moves.length; renderDiagram(moves); });
    detail.querySelector('#joseki-download').addEventListener('click', () => {
      const sgf = window.JosekiBoard.sgf(playback);
      const url = URL.createObjectURL(new Blob([sgf], { type: 'application/x-go-sgf;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = record.id + '.sgf';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    renderDiagram(moves);
  }
  const selectedId = new URLSearchParams(location.search).get('id');
  select(records.find(record => record.id === selectedId) || records[0]);
}());
