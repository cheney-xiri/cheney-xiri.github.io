(function () {
  'use strict';
  document.querySelectorAll('[data-poem-fold]').forEach(function (fold) {
    var lines = Array.from(fold.querySelectorAll('.fp-poem-line'));
    var toggle = fold.querySelector('[data-poem-toggle]');
    if (!toggle || lines.length <= 24) return;
    var expanded = false;
    function renderFold() {
      lines.forEach(function (line, index) { line.hidden = !expanded && index >= 8; });
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? '收起长篇 ↑' : '展开全文 ↓';
      toggle.setAttribute('aria-label', (expanded ? '收起《' : '展开《') + fold.dataset.poemTitle + '》全文');
    }
    renderFold();
    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      var above = fold.getBoundingClientRect().top < 0;
      expanded = !expanded;
      renderFold();
      if (!expanded && above) fold.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  });
  document.querySelectorAll('[data-reader]').forEach(function (reader) {
    var tabs = Array.from(reader.querySelectorAll('[data-reader-tab]'));
    var panels = Array.from(reader.querySelectorAll('[data-reader-panel]'));
    if (!tabs.length || tabs.length !== panels.length) return;
    var activeIndex = 0;
    var search = reader.querySelector('[data-reader-search]');
    var empty = reader.querySelector('[data-reader-empty]');
    function select(index, moveFocus, userAction) {
      activeIndex = index;
      tabs.forEach(function (tab, i) {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (moveFocus) tabs[index].focus();
      if (userAction && reader.hasAttribute('data-complete-poems') && reader.getBoundingClientRect().top < -80) {
        reader.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    }
    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { select(index, false, true); });
      tab.addEventListener('keydown', function (event) {
        var visible = tabs.map(function (t, i) { return t.hidden ? -1 : i; }).filter(function (i) { return i >= 0; });
        var position = visible.indexOf(index);
        var next = index;
        var vertical = tab.parentElement.getAttribute('aria-orientation') === 'vertical';
        if (event.key === 'Home') next = visible[0];
        else if (event.key === 'End') next = visible[visible.length - 1];
        else if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = visible[(position + 1) % visible.length];
        else if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = visible[(position + visible.length - 1) % visible.length];
        else return;
        event.preventDefault();
        select(next, true, true);
      });
    });
    if (search) search.addEventListener('input', function () {
      var term = search.value.trim().normalize('NFKC').toLowerCase();
      tabs.forEach(function (tab) { tab.hidden = !tab.dataset.search.normalize('NFKC').toLowerCase().includes(term); });
      var visible = tabs.map(function (tab, i) { return tab.hidden ? -1 : i; }).filter(function (i) { return i >= 0; });
      if (empty) empty.hidden = visible.length > 0;
      if (!visible.length) {
        tabs.forEach(function (tab, i) { tab.setAttribute('aria-selected', 'false'); tab.tabIndex = -1; panels[i].hidden = true; });
      } else select(visible.includes(activeIndex) ? activeIndex : visible[0], false);
    });
    reader.classList.add('reader-ready');
    select(0, false);
  });
  var sectionLinks = Array.from(document.querySelectorAll('.fp-sidebar a[href^="#"]'));
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(function (link) {
          var active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -55% 0px' });
    document.querySelectorAll('.fp-section').forEach(function (section) { observer.observe(section); });
  }
})();
