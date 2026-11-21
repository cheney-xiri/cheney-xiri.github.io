(function () {
  'use strict';
  const section = document.getElementById('space-timeline');
  if (!section) return;
  const stories = [...section.querySelectorAll('[data-chronicle-story]')];
  if (!stories.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const periods = [
    {end:1979, title:'从观测宇宙到踏上月球'},
    {end:2009, title:'望远镜与行星探测器'},
    {end:2019, title:'引力波、月背与黑洞'},
    {end:Infinity, title:'深空观测与样本返回'}
  ];
  const layout = document.createElement('div');
  layout.className = 'history-layout';
  const tabs = document.createElement('div');
  tabs.className = 'history-periods';
  tabs.setAttribute('role','tablist');
  tabs.setAttribute('aria-label','探索时期');
  const pages = document.createElement('div');
  pages.className = 'history-pages';
  const buttons = [], panels = [];
  let active = 0, requested = null, timer, resizeFrame;
  const byPeriod = periods.map(() => []);
  for (const story of stories) {
    const year = Number(story.querySelector('.chronicle-year>span').textContent);
    byPeriod[periods.findIndex(period => year <= period.end)].push(story);
  }

  function makeEvent(story, open) {
    const date = story.querySelector('.chronicle-year>span').textContent;
    const title = story.querySelector('h3').textContent;
    const item = document.createElement('li');
    const entry = document.createElement('details');
    entry.open = open;
    const summary = document.createElement('summary');
    const year = document.createElement('span');
    year.className = 'history-year';
    year.textContent = date;
    const heading = document.createElement('strong');
    heading.textContent = title;
    const mark = document.createElement('i');
    mark.setAttribute('aria-hidden','true');
    summary.append(year, heading, mark);
    const body = document.createElement('div');
    body.className = 'history-detail';
    const copy = story.querySelector('.chronicle-copy');
    copy.querySelector('h3').remove();
    body.append(copy);
    const photo = story.querySelector('.chronicle-photo');
    if (photo) body.append(photo);
    entry.append(summary, body);
    item.append(entry);
    return item;
  }
  byPeriod.forEach((group, i) => {
    if (!group.length) return;
    const index = panels.length;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'history-tab-' + i;
    button.setAttribute('role','tab');
    const range = document.createElement('span');
    const eventYear = record => record.querySelector('.chronicle-year>span').textContent;
    range.textContent = eventYear(group[0]) + '—' + eventYear(group[group.length - 1]);
    const name = document.createElement('strong');
    name.textContent = periods[i].title;
    button.append(range,name);
    const panel = document.createElement('div');
    panel.className = 'history-period';
    panel.id = 'history-period-' + i;
    panel.setAttribute('role','tabpanel');
    panel.setAttribute('aria-labelledby',button.id);
    button.setAttribute('aria-controls',panel.id);
    const list = document.createElement('ol');
    list.className = 'history-events';
    group.forEach((story, j) => list.append(makeEvent(story, j === 0)));
    panel.append(list);
    panels.push(panel);
    buttons.push(button);
    button.addEventListener('click', () => select(index));
    tabs.append(button);
    pages.append(panel);
  });
  layout.append(tabs,pages);
  section.querySelector('.chronicle-stage').replaceWith(layout);
  section.querySelector('.chronicle-navigation').remove();
  section.querySelector('.chronicle-progress').remove();

  function fit() {
    pages.style.height = panels[active].offsetHeight + 'px';
  }
  function show(index) {
    const moveFocus = panels[active].contains(document.activeElement);
    active = index;
    buttons.forEach((button,i) => {
      button.setAttribute('aria-selected',String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      panels[i].inert = i !== index;
    });
    if (moveFocus) buttons[index].focus({preventScroll:true});
    const button = buttons[index];
    if (tabs.scrollWidth > tabs.clientWidth) {
      tabs.scrollTo({left:button.offsetLeft - (tabs.clientWidth - button.offsetWidth)/2, behavior:'instant'});
    }
    fit();
  }
  function select(index) {
    requested = index;
    show(index);
    pages.scrollTo({left:index * pages.clientWidth,behavior:reduce.matches ? 'instant' : 'smooth'});
  }
  function settled() {
    clearTimeout(timer);
    const index = Math.min(panels.length-1, Math.max(0, Math.round(pages.scrollLeft / pages.clientWidth)));
    if (requested !== null && Math.abs(pages.scrollLeft - requested * pages.clientWidth) > 2) return;
    requested = null;
    if (index !== active) show(index);
  }
  pages.addEventListener('pointerdown', () => { requested = null; }, {passive:true});
  pages.addEventListener('wheel', () => { requested = null; }, {passive:true});
  pages.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(settled,150); }, {passive:true});
  pages.addEventListener('scrollend',settled);
  tabs.addEventListener('keydown', event => {
    const target = {ArrowLeft:active-1,ArrowRight:active+1,Home:0,End:panels.length-1}[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(Math.max(0, Math.min(panels.length-1, target)));
    buttons[active].focus({preventScroll:true});
  });
  show(0);
  const sizes = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(fit);
  });
  panels.forEach(panel => sizes.observe(panel));
}());
