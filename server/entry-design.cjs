'use strict';

const themes = {
  'index.html': 'home', 'books.html': 'reading', 'henan.html': 'travels',
  'about/ai.html': 'focus', 'craft/photography.html': 'focus',
  'craft/writing.html': 'writing', 'craft/poetry.html': 'writing',
  'craft/dizi.html': 'sound', 'craft/guitar.html': 'sound',
  'pastimes/physics.html': 'orbit', 'interaction/letter.html': 'letter'
};
const entryVersion = '20261120-chapters-2';

// The development server and both public builds use the same entry treatment.
function withEntryDesign(file, html) {
  const section = file.split('/')[0];
  if (section === 'admin' || file === 'journey/edit.html' || file === 'interaction/owner.html') return html;
  const theme = themes[file] || section;
  return html.replace(/<html\b/i, '<html data-entry-theme="' + theme + '"')
    .replace(/<\/head>/i, `<link rel="stylesheet" href="/assets/entry-transitions.css?v=${entryVersion}">
<script src="/assets/entry-motion.js?v=${entryVersion}" defer></script>
$&`);
}

module.exports = { withEntryDesign };
