(function () {
  'use strict';
  const topicId = new URLSearchParams(location.search).get('topic');
  if (topicId === 'physics') { location.replace('physics.html'); return; }
  if (topicId === 'reading') { location.replace('../books.html'); return; }
  if (topicId === 'travel') { location.replace('../index.html#travels'); return; }
  if (topicId === 'games') { location.replace('games.html'); return; }
  if (topicId === 'anime') { location.replace('anime.html'); return; }
  const $ = id => document.getElementById(id);
  const addText = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = value;
    return node;
  };
  function setError(message) {
    $('pastime-title').textContent = '未找到这一卷';
    $('pastime-line').textContent = message;
    $('pastime-intro-text').textContent = '请返回志趣总览，选择想读的小卷。';
  }
  fetch('../assets/pastimes.json', { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(data => {
      const topics = Array.isArray(data.topics) ? data.topics : [];
      const current = topics.findIndex(topic => topic.id === topicId);
      if (current < 0) { setError('这页暂不存在。'); return; }
      const topic = topics[current];
      document.body.dataset.topic = topic.id;
      document.title = `${topic.name} · 志趣 · Cheney`;
      $('pastime-crumb-name').textContent = topic.name;
      $('pastime-overline').textContent = `${topic.number} / 志趣小卷`;
      $('pastime-title').textContent = topic.name;
      $('pastime-line').textContent = topic.line;
      $('pastime-hero-image').src = `../assets/pastime-images/${topic.id}.webp?v=2`;
      $('pastime-intro-text').textContent = topic.intro;
      const indexShell = document.querySelector('.pastime-index');
      const nav = $('pastime-index-nav');
      const panel = $('pastime-index-panel');
      function appendCues(section, destination) {
        if (!Array.isArray(section.cues) || !section.cues.length) return;
        const list = addText('ul', 'pastime-scene-cues');
        section.cues.forEach(cue => list.append(addText('li', '', cue)));
        destination.append(list);
      }
      if (topic.id === 'anime' || topic.id === 'videos') {
        indexShell.classList.add(`pastime-index--${topic.id}`);
        nav.remove();
        panel.remove();
        const heading = addText('header', 'pastime-scene-heading');
        heading.append(addText('small', '', topic.id === 'anime' ? `分镜卷 · ${topic.sections.length}幕` : `短片流 · ${topic.sections.length}则`));
        heading.append(addText('h2', '', topic.id === 'anime' ? '一帧一念，连成故事' : '刷过之后，留下什么'));
        indexShell.append(heading);
        const collection = addText('div', `pastime-scene-collection pastime-scene-collection--${topic.id}`);
        topic.sections.forEach((section, index) => {
          const card = addText('article', 'pastime-scene-card');
          const imageWrap = addText('div', 'pastime-scene-card-art');
          const image = document.createElement('img');
          image.src = `../assets/pastime-images/${topic.id}.webp?v=2`;
          image.alt = '';
          image.loading = 'lazy';
          imageWrap.append(image);
          const copy = addText('div', 'pastime-scene-card-copy');
          copy.append(addText('small', '', `${String(index + 1).padStart(2, '0')} / ${topic.id === 'anime' ? '分镜' : '随记'}`));
          copy.append(addText('h3', '', section.title));
          copy.append(addText('p', '', section.text));
          appendCues(section, copy);
          card.append(imageWrap, copy);
          collection.append(card);
        });
        indexShell.append(collection);
      } else {
        indexShell.classList.add(`pastime-index--${topic.id}`);
        nav.querySelector('.pastime-index-label').textContent = topic.id === 'music' ? `唱片内页 · ${topic.sections.length}面` : `剪辑轨道 · ${topic.sections.length}幕`;
        const sectionButtons = [];
        function selectSection(index) {
          const section = topic.sections[index];
          if (!section) return;
          sectionButtons.forEach((button, buttonIndex) => {
            button.setAttribute('aria-pressed', String(buttonIndex === index));
          });
          panel.replaceChildren();
          panel.dataset.number = String(index + 1).padStart(2, '0');
          panel.append(addText('small', '', `${String(index + 1).padStart(2, '0')} / ${topic.name}`));
          panel.append(addText('h2', '', section.title));
          panel.append(addText('p', '', section.text));
          appendCues(section, panel);
        }
        topic.sections.forEach((section, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.setAttribute('aria-controls', 'pastime-index-panel');
          button.setAttribute('aria-pressed', 'false');
          button.append(addText('small', '', String(index + 1).padStart(2, '0')));
          button.append(addText('span', '', section.title));
          button.addEventListener('click', () => selectSection(index));
          nav.append(button);
          sectionButtons.push(button);
        });
        selectSection(0);
      }
      indexShell.hidden = false;
      const siblings = $('pastime-siblings');
      [[topics[current - 1], '前一卷'], [topics[current + 1], '后一卷']].forEach(([next, label]) => {
        if (!next) return;
        const link = document.createElement('a');
        link.href = next.id === 'reading' ? '../books.html' : next.id === 'travel' ? '../index.html#travels' : next.id === 'games' ? 'games.html' : next.id === 'anime' ? 'anime.html' : `detail.html?topic=${encodeURIComponent(next.id)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.append(addText('small', '', label));
        link.append(addText('span', '', next.name));
        siblings.append(link);
      });
    })
    .catch(() => setError('内容暂时无法载入，请稍后刷新。'));
})();
