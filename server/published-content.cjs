'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { sanitize } = require('./content-store.cjs');

// Only public, deliberately published content belongs in this repository file.
// Passwords, drafts, sessions and visitor messages never enter this snapshot.
function applyPublishedContent(store, root) {
  const file = path.join(root, 'data', 'online-content.json');
  if (!fs.existsSync(file)) return { journey: {}, animeNotes: {} };
  const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (snapshot.version !== 1 || !Array.isArray(snapshot.entries)) throw new Error('在线内容文件格式不正确');
  const update = store.db.prepare('INSERT INTO entries(id,collection,base_path,draft,published,revision,touched,created_at,updated_at) VALUES(?,?,?,?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET draft=excluded.draft,published=excluded.published,revision=excluded.revision,touched=1,updated_at=excluded.updated_at');
  const seen = new Set();
  store.db.exec('BEGIN');
  try {
    for (const item of snapshot.entries) {
      if (!store.labels[item.collection] || typeof item.id !== 'string' || !item.id.startsWith(item.collection + ':') || item.id.length > 180 || seen.has(item.id)) throw new Error('在线内容编号不正确或重复');
      seen.add(item.id);
      const existing = store.get(item.id);
      const data = item.data === null ? existing?.draft : sanitize(item.collection, item.data);
      if (!data) continue;
      const revision = Number(item.revision);
      if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('在线内容版本不正确');
      const now = new Date().toISOString();
      update.run(item.id, item.collection, existing?.basePath || '', JSON.stringify(data), item.data === null ? null : JSON.stringify(data), revision, existing?.createdAt || now, now);
    }
    store.db.exec('COMMIT');
  } catch (error) { store.db.exec('ROLLBACK'); throw error; }
  return { journey: snapshot.journey || {}, animeNotes: snapshot.animeNotes || {} };
}
module.exports = { applyPublishedContent };
