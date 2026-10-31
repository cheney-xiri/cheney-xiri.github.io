/* Keep local pages in the current tab on phones. Some in-app browsers block
   the site's desktop-style target=_blank links without showing an error. */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 800px)');
  function useCurrentTab(event) {
    if (!phone.matches || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var target = event.target;
    var link = target && target.closest && target.closest('a[href]');
    if (!link || link.hasAttribute('download')) return;
    try {
      var url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      if (link.target === '_blank') link.target = '_self';
      // Pages redirects ordinary .html URLs to clean URLs. Avoid that extra
      // round trip on the mirror while leaving directory index paths alone.
      if (location.hostname === 'cheney-xiri.pages.dev' && /\/[^/]+\.html$/i.test(url.pathname) && !/\/index\.html$/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\.html$/i, '');
        link.href = url.href;
      }
    } catch (_) { /* Leave malformed links to the browser. */ }
  }
  document.addEventListener('pointerdown', useCurrentTab, true);
  document.addEventListener('click', useCurrentTab, true);
  document.addEventListener('click', function (event) {
    if (!phone.matches || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest('#ink-home a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    var url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
    var notice = document.getElementById('mobile-opening-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'mobile-opening-notice';
      notice.setAttribute('role', 'status');
      notice.style.cssText = 'position:fixed;z-index:9999;bottom:1.2rem;left:50%;transform:translateX(-50%);padding:.6rem 1rem;background:#233d3a;color:#f4f3e9;border-radius:2px;font-size:14px;box-shadow:0 4px 18px #0003;pointer-events:none';
      notice.textContent = '正在打开…';
      document.body.appendChild(notice);
    }
    notice.hidden = false;
    window.setTimeout(function () { notice.hidden = true; }, 8000);
  });
  window.addEventListener('pageshow', function () {
    var notice = document.getElementById('mobile-opening-notice');
    if (notice) notice.hidden = true;
  });
})();
