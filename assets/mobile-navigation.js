/* Keep local pages in the current tab on phones. Some in-app browsers block
   the site's desktop-style target=_blank links without showing an error. */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 800px)');
  function useCurrentTab(event) {
    if (!phone.matches || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var target = event.target;
    var link = target && target.closest && target.closest('a[target="_blank"]');
    if (!link || link.hasAttribute('download')) return;
    try {
      if (new URL(link.href, location.href).origin === location.origin) link.target = '_self';
    } catch (_) { /* Leave malformed links to the browser. */ }
  }
  document.addEventListener('pointerdown', useCurrentTab, true);
  document.addEventListener('click', useCurrentTab, true);
})();
