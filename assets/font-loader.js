(function () {
  'use strict';
  function loadFonts() {
    document.querySelectorAll('meta[data-cheney-fonts-href]').forEach(function (placeholder) {
      var href = placeholder.getAttribute('data-cheney-fonts-href');
      if (!href || !/^https:\/\/fonts\.googleapis\.com\/css2\?/.test(href)) return;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.addEventListener('load', function () { link.media = 'all'; }, { once: true });
      link.addEventListener('error', function () { link.remove(); }, { once: true });
      document.head.appendChild(link);
    });
  }
  function schedule() {
    requestAnimationFrame(function () { requestAnimationFrame(loadFonts); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();
