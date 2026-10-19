(function () {
  'use strict';

  var entries = {
    writing: {
      name:'写作', group:'文心', level:'文心 · 文字', image:'craft-writing.webp',
      tagline:'落笔有声，所思有形。',
      lead:'写作把观察、经历与思考整理成可以传达的文字。从找到真正想说的事，到安排结构、反复修改，每一步都让表达更清楚。',
      caption:'一纸一笔，留住所思所见。',
      steps:[['积累与观察','从阅读、日常与真实经历中，发现值得记下的细节。'],['立意与结构','想清楚要说什么，再让段落围绕同一个中心展开。'],['推敲与修改','删去多余的话，校准语气、节奏与事实，使文章更有力量。']],
      works:[]
    },
    poetry: {
      name:'作诗', group:'文心', level:'文心 · 诗作', image:'craft-poetry.webp',
      tagline:'取一瞬心意，写成几行诗。',
      lead:'作诗始于触动，也成于推敲。先捕捉景物与情绪，再寻找贴切的意象、节奏和用字，让短短数行容得下一片心境。',
      caption:'有景可入诗，有情可落笔。',
      steps:[['捕捉诗意','从一处景、一句话或一种情绪出发，找到诗的起点。'],['经营声律','让意象和句读彼此照应，留意轻重、停顿与余韵。'],['炼字成篇','反复斟酌字句，保留最能传达心意的表达。']],
      works:[]
    },
    photography: {
      name:'摄影', group:'观物', level:'观物 · 影像', image:'craft-photography.webp',
      tagline:'循光取景，留住此刻。',
      lead:'摄影是选择如何观看世界。光线的方向、取景的边界与按下快门的时刻，共同决定一张照片里留下的故事。',
      caption:'山河有色，光影有时。',
      steps:[['辨认光线','观察明暗、色温和光的方向，寻找画面最有意味的时刻。'],['安排构图','在远近、留白与线条之间取舍，让主体自然浮现。'],['整理成组','从单张照片走向一组影像，让画面之间彼此呼应。']],
      works:[]
    },
    go: {
      name:'围棋', group:'观物', level:'观物 · 对弈', image:'craft-go.webp',
      tagline:'落子有先后，方寸见全局。',
      lead:'围棋让每一步局部选择都与全局相连。布局时看方向，中盘时辨轻重，终局后再回头复盘，思考往往比胜负更久。',
      caption:'黑白相向，取舍之间见章法。',
      steps:[['布局取势','观察棋盘整体，选择值得经营的方向与空间。'],['中盘判断','比较攻守与轻重，分清眼前所得和长远价值。'],['复盘求进','回看关键转折，理解每一步背后的判断。']],
      works:[]
    },
    dizi: {
      name:'笛子', group:'清音', level:'清音 · 管乐', image:'craft-dizi.webp',
      tagline:'一管清音，随气息远行。',
      lead:'笛声由呼吸开始，经过指法与节奏，才有了旋律的起伏。音色的明暗、长音的平稳与乐句的呼吸，都是表达的一部分。',
      caption:'竹管藏清音，吹向远山。',
      steps:[['稳住气息','用平稳的呼吸支撑清楚、连贯的发音。'],['熟悉指法','练习音阶与指法转换，让音准和节拍更加稳定。'],['读懂乐句','在强弱、停顿与换气之间，慢慢吹出旋律的层次。']],
      works:[]
    },
    guitar: {
      name:'吉他', group:'清音', level:'清音 · 弦乐', image:'craft-guitar.webp',
      tagline:'拨弦成歌，让旋律流淌。',
      lead:'吉他把和弦、节拍与旋律交织在一起。稳定的手感是基础，恰当的速度和轻重，则让同一段音乐呈现不同的情绪。',
      caption:'弦上有歌，指间有风。',
      steps:[['建立手感','熟悉持琴、按弦与拨弦，让每个音发得清楚。'],['听见节奏','练习和弦转换与节拍，使伴奏保持自然的流动。'],['完成表达','将旋律、和弦与强弱结合，奏出完整的段落。']],
      works:[]
    }
  };

  /* 每门技艺适合留下的内容各不相同；这些是栏目说明，不代表站主已有记录。 */
  var profiles = {
    writing: {
      focusLead:'把写作过程也留下来，文章之外还有选题与改稿。',
      focus:[['选题札记','记下一次观察、一个问题，或一段值得展开的经历。'],['改稿对照','留存初稿与修改后的关键段落，看表达怎样变得清楚。'],['文章归档','为成文补上日期、主题与简短引言，便于往后翻阅。']],
      archiveKicker:'其三 · 文稿', archiveTitle:'文章与手稿', archiveDescription:'完整文章、草稿和改稿记录，可以在这里逐篇收录。',
      toggleName:'文稿', emptyMark:'文', emptyTitle:'文稿待续', emptyNote:'待你添入文章或手稿，这里会形成自己的文字目录。', itemLabel:'文稿', footer:'纸上有迹，来日可续'
    },
    poetry: {
      focusLead:'一首诗的缘起、推敲与定稿，都值得有迹可寻。',
      focus:[['诗意缘起','记下触动你的场景、人物或一句忽然浮现的话。'],['炼字留痕','保留斟酌过的字句，记录为何取此舍彼。'],['诗稿成卷','为定稿标明题目与写作时间，也可附吟诵录音。']],
      archiveKicker:'其三 · 诗笺', archiveTitle:'诗稿与吟录', archiveDescription:'短诗、组诗与吟诵片段，可在这里逐一收藏。',
      toggleName:'诗稿', emptyMark:'诗', emptyTitle:'诗笺待续', emptyNote:'有诗稿或吟诵录音时，再为此卷添上你的声音。', itemLabel:'诗稿', footer:'诗笺未尽，且待续篇'
    },
    photography: {
      focusLead:'影像不止于快门，也包括拍摄时的选择和后来的整理。',
      focus:[['拍摄札记','记下地点、光线与想要呈现的画面。'],['选片取舍','从相近画面中挑选一张，想清楚它为何留下。'],['组图编排','按主题或地点排成一组，让照片之间有呼应。']],
      archiveKicker:'其三 · 影集', archiveTitle:'影像集', archiveDescription:'单张作品、主题组图与拍摄札记，可在这里汇成影集。',
      toggleName:'影像', emptyMark:'影', emptyTitle:'影集待续', emptyNote:'待你选好照片，便可在此加入影像与拍摄说明。', itemLabel:'影像', footer:'逐光成影，慢慢成卷'
    },
    go: {
      focusLead:'以棋局为单位记录思考，重在判断与复盘。',
      focus:[['对局档案','记下对弈时间、执黑执白与棋局背景。'],['关键一手','标出局面转折，写下当时的判断与备选变化。'],['复盘所得','回看得失与遗憾，把下一次想改进的地方记下来。']],
      archiveKicker:'其三 · 个人棋记', archiveTitle:'对局笔记', archiveDescription:'这里暂未收录个人对局；棋盘中的对局可以下载为 SGF，留在自己的设备上复盘。',
      toggleName:'栏目说明', emptyMark:'棋', emptyTitle:'个人棋局待记', emptyNote:'此处尚无已上传棋局。以后可按时间、执黑执白和关键一手整理个人复盘。', itemLabel:'棋局', footer:'一局未尽，复盘常新'
    },
    dizi: {
      focusLead:'留住练习的细处：气息、指法与一支曲子的变化。',
      focus:[['曲目清单','记下正在练习的曲目与所用笛调。'],['气息与指法','记录换气、长音、指法转换等具体难点。'],['片段回听','用短录音回听音准、节奏与音色的变化。']],
      archiveKicker:'其三 · 清音', archiveTitle:'曲目与练习', archiveDescription:'曲目、练习片段与回听心得，都可以留在这一页。',
      toggleName:'练习', emptyMark:'笛', emptyTitle:'清音待录', emptyNote:'可从一支正在练的曲子开始，补上练习片段与心得。', itemLabel:'练习记录', footer:'气息绵长，清音可续'
    },
    guitar: {
      focusLead:'用曲目和片段记录手感、节奏与弹奏中的变化。',
      focus:[['曲目清单','记下想练和正在练的歌，以及所用和弦。'],['节奏难点','标出换和弦、扫弦与节拍不稳的段落。'],['片段回听','录下一小段，再听音色、速度和强弱是否自然。']],
      archiveKicker:'其三 · 弦歌', archiveTitle:'曲目与练习', archiveDescription:'曲目进度、弹奏片段与练习心得，可在这里慢慢积累。',
      toggleName:'练习', emptyMark:'弦', emptyTitle:'弦歌待录', emptyNote:'可先添一首正在练的曲子，再补和弦、节奏与录音。', itemLabel:'练习记录', footer:'弦上有声，日日有进'
    }
  };

  var order = ['writing','poetry','photography','go','dizi','guitar'];
  var key = document.body.dataset.craftSkill;
  var item = entries[key];
  if (!item) return;
  var profile = profiles[key];
  var index = order.indexOf(key);
  document.title = item.name + ' · Cheney';
  document.getElementById('craft-detail-number').textContent = '技艺 · ' + String(index + 1).padStart(2, '0') + ' / ' + String(order.length).padStart(2, '0');
  document.getElementById('craft-detail-group').textContent = item.group;
  document.getElementById('craft-detail-level').textContent = item.level;
  document.getElementById('craft-detail-title').textContent = item.name;
  document.getElementById('craft-detail-tagline').textContent = item.tagline;
  document.getElementById('craft-detail-lead').textContent = item.lead;
  document.getElementById('craft-detail-caption').textContent = item.caption;
  var image = document.getElementById('craft-detail-image');
  image.src = '../assets/' + item.image;
  image.alt = item.name + '主题配图';

  var steps = document.getElementById('craft-detail-steps');
  item.steps.forEach(function (step, stepIndex) {
    var row = document.createElement('li');
    var number = document.createElement('span');
    number.className = 'craft-step-number';
    number.textContent = String(stepIndex + 1).padStart(2, '0');
    var title = document.createElement('h3');
    title.textContent = step[0];
    var description = document.createElement('p');
    description.textContent = step[1];
    row.append(number, title, description);
    steps.appendChild(row);
  });

  var focus = document.createElement('section');
  focus.className = 'craft-detail-focus';
  focus.setAttribute('aria-labelledby', 'craft-focus-heading');
  var focusHead = document.createElement('header');
  var focusKicker = document.createElement('p');
  focusKicker.textContent = '其二 · 留痕方式';
  var focusTitle = document.createElement('h2');
  focusTitle.id = 'craft-focus-heading';
  focusTitle.textContent = '如何记下这一程';
  var focusLead = document.createElement('span');
  focusLead.textContent = profile.focusLead;
  focusHead.append(focusKicker, focusTitle, focusLead);
  var focusList = document.createElement('div');
  focusList.className = 'craft-focus-grid';
  profile.focus.forEach(function (point, pointIndex) {
    var card = document.createElement('article');
    card.className = 'craft-focus-card';
    var number = document.createElement('span');
    number.textContent = String(pointIndex + 1).padStart(2, '0');
    var heading = document.createElement('h3');
    heading.textContent = point[0];
    var description = document.createElement('p');
    description.textContent = point[1];
    card.append(number, heading, description);
    focusList.append(card);
  });
  focus.append(focusHead, focusList);
  document.querySelector('.craft-detail-path').insertAdjacentElement('afterend', focus);

  var pathPanel = document.querySelector('.craft-detail-path');
  var switcher = document.createElement('nav');
  switcher.className = 'craft-detail-switcher';
  switcher.setAttribute('aria-label', '翻阅技艺手记');
  var panels = [pathPanel, focus];
  var labels = ['01 · 练习脉络', '02 · 留痕方式'];
  var switches = panels.map(function (panel, panelIndex) {
    panel.id = 'craft-detail-panel-' + panelIndex;
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = labels[panelIndex];
    button.setAttribute('aria-controls', panel.id);
    button.setAttribute('aria-pressed', String(panelIndex === 0));
    button.addEventListener('click', function () {
      panels.forEach(function (entry, entryIndex) {
        entry.hidden = entryIndex !== panelIndex;
        switches[entryIndex].setAttribute('aria-pressed', String(entryIndex === panelIndex));
      });
    });
    switcher.append(button);
    return button;
  });
  focus.hidden = true;
  document.querySelector('.craft-detail-hero').insertAdjacentElement('afterend', switcher);

  var archiveHeading = document.querySelector('.craft-portfolio-heading > div');
  archiveHeading.querySelector('p').textContent = profile.archiveKicker;
  archiveHeading.querySelector('h2').textContent = profile.archiveTitle;
  archiveHeading.querySelector('span').textContent = profile.archiveDescription;
  document.querySelector('.craft-detail-footer > span').textContent = profile.footer;
  var jump = document.querySelector('.craft-detail-jump');
  jump.firstChild.textContent = '浏览' + profile.archiveTitle + ' ';

  var worksPanel = document.getElementById('craft-detail-works');
  if (!item.works.length) {
    var empty = document.createElement('div');
    empty.className = 'craft-work-empty';
    var mark = document.createElement('span');
    mark.className = 'craft-work-empty-mark';
    mark.setAttribute('aria-hidden','true');
    mark.textContent = profile.emptyMark;
    var emptyTitle = document.createElement('strong');
    emptyTitle.textContent = profile.emptyTitle;
    var emptyNote = document.createElement('span');
    emptyNote.textContent = profile.emptyNote;
    empty.append(mark, emptyTitle, emptyNote);
    worksPanel.appendChild(empty);
  } else {
    item.works.forEach(function (work) {
      var card = document.createElement('article');
      card.className = 'craft-work-card';
      if (work.video) {
        var video = document.createElement('video');
        video.className = 'craft-work-video';
        video.src = work.video;
        video.controls = true;
        video.preload = 'metadata';
        if (work.image) video.poster = work.image;
        card.appendChild(video);
      } else if (work.image) {
        var cover = document.createElement('img');
        cover.className = 'craft-work-cover';
        cover.src = work.image;
        cover.alt = work.alt || work.title || '作品配图';
        cover.loading = 'lazy';
        card.appendChild(cover);
      }
      var meta = document.createElement('p');
      meta.className = 'craft-work-meta';
      meta.textContent = [work.category,work.date].filter(Boolean).join(' · ') || profile.itemLabel;
      var title = document.createElement('h3');
      title.textContent = work.title || '未命名作品';
      card.append(meta, title);
      if (work.description) {
        var description = document.createElement('p');
        description.className = 'craft-work-description';
        description.textContent = work.description;
        card.appendChild(description);
      }
      if (work.audio) {
        var audio = document.createElement('audio');
        audio.className = 'craft-work-audio';
        audio.src = work.audio;
        audio.controls = true;
        audio.preload = 'none';
        card.appendChild(audio);
      }
      if (work.href) {
        var link = document.createElement('a');
        link.href = work.href;
        link.textContent = work.linkLabel || '查看' + profile.itemLabel;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        card.appendChild(link);
      }
      worksPanel.appendChild(card);
    });
  }

  var toggle = document.getElementById('craft-works-toggle');
  toggle.firstChild.textContent = '展开' + profile.toggleName + ' ';
  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    worksPanel.hidden = expanded;
    toggle.firstChild.textContent = (expanded ? '展开' : '收起') + profile.toggleName + ' ';
    toggle.querySelector('span').textContent = expanded ? '＋' : '－';
  });

  function setSibling(id, siblingKey, direction) {
    var link = document.getElementById(id);
    var label = document.createElement('small');
    var title = document.createElement('strong');
    if (siblingKey) {
      link.href = siblingKey + '.html';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      label.textContent = direction === 'prev' ? '← 上一门技艺' : '下一门技艺 →';
      title.textContent = entries[siblingKey].name;
    } else {
      link.href = '../index.html#craft';
      label.textContent = '返回';
      title.textContent = '技艺总览';
    }
    link.append(label, title);
  }
  setSibling('craft-prev', order[index - 1], 'prev');
  setSibling('craft-next', order[index + 1], 'next');
})();
