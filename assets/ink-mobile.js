/* Mobile paintings have their own portrait compositions. Native sticky layers
   keep long chapters readable without stretching the art or adding scroll work. */
(function () {
  'use strict';
  if (document.documentElement.dataset.inkPreserve) return;
  var media = window.matchMedia('(max-width: 800px)');
  var observer;

  function sync() {
    if (observer) observer.disconnect();
    document.querySelectorAll('[data-mobile-ink-layer]').forEach(function (el) { el.remove(); });
    if (!media.matches) return;
    if (document.body.id !== 'ink-home') {
      var backdrop = document.createElement('div');
      backdrop.className = 'mobile-page-scene';
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('data-mobile-ink-layer', '');
      document.body.prepend(backdrop);
      return;
    }
    var scenes = [];
    document.querySelectorAll('#ink-home section.juan').forEach(function (section) {
      var layer = document.createElement('div');
      layer.className = 'mobile-ink-scene';
      layer.setAttribute('aria-hidden', 'true');
      layer.setAttribute('data-mobile-ink-layer', '');
      var art = document.createElement('div');
      art.className = 'mobile-ink-art';
      layer.append(art);
      section.prepend(layer);
      scenes.push({ section: section, art: art });
    });
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var art = entry.target.querySelector('.mobile-ink-art');
          if (art) art.dataset.ready = 'true';
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '100% 0px 100% 0px' });
      scenes.forEach(function (scene) { observer.observe(scene.section); });
    } else {
      scenes.forEach(function (scene) { scene.art.dataset.ready = 'true'; });
    }
  }
  if (media.addEventListener) media.addEventListener('change', sync);
  else media.addListener(sync);
  sync();
})();
