// Read public OGS positions leading to the explicit Joseki: Done tag.
// No account, tokens, or private endpoints are used. Checkpoints make retries resumable.
const fs = require('node:fs');
const path = require('node:path');
const folder = path.resolve(__dirname, '../data/joseki/ogs-live');
fs.mkdirSync(folder, { recursive: true });
const cache = path.join(folder, 'completed-tree.json');
const state = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8'))
  : { startedAt: new Date().toISOString(), nodes: {}, fetched: [], pending: ['root'], errors: [] };
const fetched = new Set(state.fetched);
const queued = new Set(state.pending);
const pending = [...state.pending];
let requests = 0;
const allowed = node => node && ['GOOD', 'IDEAL'].includes(node.category);
const keep = node => ({ node_id: String(node.node_id), play: node.play, category: node.category,
  description: node.description, tags: node.tags || [], joseki_source: node.joseki_source,
  next_moves: node.next_moves || [], see_also: node.see_also || [] });
const save = () => fs.writeFileSync(cache, JSON.stringify({ ...state,
  updatedAt: new Date().toISOString(), fetched: [...fetched], pending,
  completed: Object.values(state.nodes).filter(n => n.tags.some(t => t.description === 'Joseki: Done')).length
}, null, 2) + '\n');
function enqueue(id) {
  id = String(id);
  if (!queued.has(id) && !fetched.has(id)) { queued.add(id); pending.push(id); }
}
async function fetchPosition(id) {
  const response = await fetch('https://online-go.com/oje/positions?id=' + id + '&tfilterid=37&mode=0', {
    headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) {
    const error = Error('HTTP ' + response.status);
    error.rateLimited = response.status === 429;
    throw error;
  }
  const items = await response.json();
  if (!Array.isArray(items)) throw Error('Unexpected response');
  const parent = items.find(item => id === 'root' ? item.play === '.root' : String(item.node_id) === id);
  if (!parent) throw Error('Missing requested node');
  state.nodes[parent.node_id] = keep(parent);
  const children = parent.next_moves.filter(allowed);
  for (const edge of children) {
    // Five conventional corner openings; don't import whole-board opening trees.
    if (id === 'root' && !['Q16', 'R16', 'R17', 'Q15', 'R15'].includes(edge.placement)) continue;
    const child = items.find(item => String(item.node_id) === String(edge.node_id));
    if (!child) { enqueue(edge.node_id); continue; }
    state.nodes[child.node_id] = keep(child);
    for (const next of child.next_moves.filter(allowed)) enqueue(next.node_id);
  }
  fetched.add(id);
}
(async () => {
  while (pending.length) {
    const batch = pending.splice(0, 3);
    const results = await Promise.allSettled(batch.map(fetchPosition));
    let rateLimited = false;
    for (let i = 0; i < results.length; i++) if (results[i].status === 'rejected') {
      const id = batch[i];
      const tries = state.errors.filter(e => e.id === id).length;
      state.errors.push({ id, error: results[i].reason.message, at: new Date().toISOString() });
      if (results[i].reason.rateLimited) rateLimited = true;
      if (tries < 2 || results[i].reason.rateLimited) pending.push(id);
    }
    requests += batch.length;
    save();
    if (rateLimited) { console.log('Stopped on HTTP 429. Queue saved; resume only after the service cooldown.'); break; }
    if (requests % 30 < 3 || !pending.length) console.log(JSON.stringify({ requests,
      nodes: Object.keys(state.nodes).length, pending: pending.length,
      completed: Object.values(state.nodes).filter(n => n.tags.some(t => t.description === 'Joseki: Done')).length,
      errors: state.errors.length }));
    await new Promise(resolve => setTimeout(resolve, 650));
  }
  save();
})().catch(error => { save(); console.error(error); process.exitCode = 1; });
