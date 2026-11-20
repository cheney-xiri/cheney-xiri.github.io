(function () {
  'use strict';

  const home = document.getElementById('ink-home');
  const motions = {
    '#top .seal': 'stamp',
    '#about .portrait, #admire .admire-book-body img': 'portrait',
    '#journey .journey-entry': 'timeline',
    '#craft .craft-family-head h3, #writing .wen-curated-heading': 'brush',
    '#pastimes .interest-card-art img': 'frame',
    '#works .works-thumb img, #reading .book-cover': 'leaf',
    '#travels .travel-city-visual': 'landmark',
    '#writing .wen-curated-seal': 'stamp',
    '#links .interaction-door, #contact .ccard-mark': 'letter'
  };

  const observer = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
    for (const { target, intersectionRatio } of entries) {
      if (intersectionRatio >= 0.18) target.classList.add('entry-in-view');
      // Wait for the whole element to leave before allowing a replay.
      else if (intersectionRatio === 0) target.classList.remove('entry-in-view');
    }
  }, { threshold: [0, 0.18], rootMargin: '-36px 0px -24px' });

  function watch(element, motion) {
    if (!element || element.hasAttribute('data-entry-motion')) return;
    element.dataset.entryMotion = motion;
    if (observer) observer.observe(element);
    else element.classList.add('entry-in-view');
  }

  if (!home) {
    watch(document.querySelector('main h1, main [role="heading"][aria-level="1"]') ||
      document.querySelector('h1'), 'heading');
    return;
  }

  function watchHome(root) {
    for (const [selector, motion] of Object.entries(motions)) {
      root.querySelectorAll(selector).forEach(element => watch(element, motion));
    }
  }

  watchHome(home);
  // These two lists are populated after the homepage has rendered.
  const listUpdates = new MutationObserver(records => {
    for (const list of new Set(records.map(record => record.target))) watchHome(list);
  });
  for (const id of ['travel-cities', 'book-shelf']) {
    const list = document.getElementById(id);
    if (list) listUpdates.observe(list, { childList: true });
  }
}());
