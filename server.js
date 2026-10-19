'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const ROOT = __dirname;
const DATA_DIR = process.env.CHENEY_DATA_DIR || path.join(ROOT, '.site-data');
// Keep local content outside the public directories and preserve the previous temporary store.
if (!process.env.CHENEY_DATA_DIR) {
  const previous = path.join(os.tmpdir(), 'cheney-site-guestbook');
  const marker = path.join(DATA_DIR, 'legacy-import-complete');
  if (!fs.existsSync(marker)) {
    fs.mkdirSync(DATA_DIR, { recursive:true });
    for (const name of ['messages.json','owner.json','journey.json','anime-notes.json']) {
      const source = path.join(previous, name), target = path.join(DATA_DIR, name);
      if (fs.existsSync(source) && !fs.existsSync(target)) fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
    }
    for (const folder of ['journey-media','uploads']) {
      const source = path.join(previous, folder), target = path.join(DATA_DIR, folder);
      if (fs.existsSync(source)) {
        fs.mkdirSync(target, { recursive:true });
        for (const file of fs.readdirSync(source, { withFileTypes:true })) {
          if (file.isFile() && /^[a-f0-9-]+\.(png|jpg|webp)$/.test(file.name) && !fs.existsSync(path.join(target,file.name))) fs.copyFileSync(path.join(source,file.name),path.join(target,file.name),fs.constants.COPYFILE_EXCL);
        }
      }
    }
    fs.writeFileSync(marker, new Date().toISOString(), { flag:'wx' });
  }
}
const STORE_FILE = path.join(DATA_DIR, 'messages.json');
const OWNER_FILE = path.join(DATA_DIR, 'owner.json');
const JOURNEY_FILE = path.join(DATA_DIR, 'journey.json');
const ANIME_NOTES_FILE = path.join(DATA_DIR, 'anime-notes.json');
const JOURNEY_MEDIA_DIR = path.join(DATA_DIR, 'journey-media');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3001);
const POST_GAP_MS = process.env.CHENEY_POST_GAP_MS === undefined ? 15000 : Number(process.env.CHENEY_POST_GAP_MS);
const KINDS = new Set(['wall', 'letter', 'ally', 'featured', 'anime']);
const ANIME_ID = /^[0-9]{1,9}$/;
const JOURNEY_STAGES = new Set(['junior', 'senior', 'university']);
const MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$/;
const recentPosts = new Map();
const loginAttempts = new Map();

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(JOURNEY_MEDIA_DIR, { recursive: true });

function respond(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });
  res.end(body);
}

function loadStore() {
  if (!fs.existsSync(STORE_FILE)) return { messages: [] };
  const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  if (!parsed || !Array.isArray(parsed.messages)) throw new Error('留言数据格式无效');
  return parsed;
}

function saveStore(store) {
  const temp = STORE_FILE + '.' + crypto.randomUUID() + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(store, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temp, STORE_FILE);
}

function loadAnimeNotes() {
  if (!fs.existsSync(ANIME_NOTES_FILE)) return {};
  const parsed = JSON.parse(fs.readFileSync(ANIME_NOTES_FILE, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('观影手记数据格式无效');
  return parsed;
}

function saveAnimeNotes(notes) {
  const temp = ANIME_NOTES_FILE + '.' + crypto.randomUUID() + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(notes, null, 2), { encoding:'utf8', mode:0o600 });
  fs.renameSync(temp, ANIME_NOTES_FILE);
}

function ownerConfigured() {
  return Boolean(process.env.CHENEY_OWNER_PASSWORD || fs.existsSync(OWNER_FILE));
}

function secureCompare(a, b) {
  const left = crypto.createHash('sha256').update(a).digest();
  const right = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

function verifyOwner(password) {
  if (typeof password !== 'string') return false;
  if (process.env.CHENEY_OWNER_PASSWORD) return secureCompare(password, process.env.CHENEY_OWNER_PASSWORD);
  if (!fs.existsSync(OWNER_FILE)) return false;
  const record = JSON.parse(fs.readFileSync(OWNER_FILE, 'utf8'));
  const attempted = crypto.scryptSync(password, record.salt, 64);
  const expected = Buffer.from(record.hash, 'hex');
  return attempted.length === expected.length && crypto.timingSafeEqual(attempted, expected);
}

function ownerPassword(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function loopback(req) {
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
}

function localRequest(req) {
  const boundLocally = ['127.0.0.1', 'localhost', '::1'].includes(HOST);
  let requestedLocally = false;
  try { requestedLocally = ['localhost', '127.0.0.1', '[::1]'].includes(new URL('http://' + req.headers.host).hostname); } catch {}
  return boundLocally && loopback(req) && requestedLocally;
}

function localEditing(req) {
  return process.env.NODE_ENV !== 'production' && process.env.CHENEY_LOCAL_EDIT !== '0' && localRequest(req);
}

function clientAddress(req) {
  if (process.env.CHENEY_TRUST_PROXY === '1' && loopback(req)) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',').map(x => x.trim()).filter(Boolean);
    if (forwarded.length && /^[a-f0-9:.]+$/i.test(forwarded[forwarded.length - 1])) return forwarded[forwarded.length - 1];
  }
  return req.socket.remoteAddress || 'unknown';
}

function rateLimited(map, key, gapMs) {
  const now = Date.now();
  const last = map.get(key) || 0;
  if (now - last < gapMs) return true;
  map.set(key, now);
  if (map.size > 10000) {
    for (const [entry, time] of map) if (now - time > 3600000) map.delete(entry);
  }
  return false;
}

async function readBytes(req, maxBytes = 16384) {
  let length = 0;
  const chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > maxBytes) throw Object.assign(new Error('内容过长'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readBody(req, maxBytes = 16384) {
  const bytes = await readBytes(req, maxBytes);
  try { return JSON.parse(bytes.toString('utf8')); }
  catch { throw Object.assign(new Error('请求格式不正确'), { status: 400 }); }
}

function cleanText(value, max) {
  return String(value == null ? '' : value).normalize('NFKC').trim().slice(0, max + 1);
}

function containsPrivateContact(values) {
  const combined = values.join(' ').normalize('NFKC').toLowerCase().replace(/[\u200b-\u200f\u2060\ufeff]/g, '');
  const chineseDigits = { 零:'0', 〇:'0', 一:'1', 二:'2', 三:'3', 四:'4', 五:'5', 六:'6', 七:'7', 八:'8', 九:'9' };
  const numbered = combined.replace(/[零〇一二三四五六七八九]/g, char => chineseDigits[char]);
  const compact = combined.replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
  const privateWechat = (process.env.CHENEY_PRIVATE_WECHAT || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/(?:^|[^\d])1[3-9](?:[\s.\-·_]{0,4}\d){9}(?!\d)/.test(numbered)) return true;
  if (privateWechat && compact.includes(privateWechat)) return true;
  if (/(?:微信号?|wechat|wxid|vx)\s*[:：号id\s-]*[a-z0-9_-]{5,}/i.test(combined)) return true;
  return false;
}

function publicView(message) {
  return {
    id: message.id,
    kind: message.kind,
    name: message.name,
    text: message.text,
    siteName: message.siteName,
    siteUrl: message.siteUrl,
    article: message.article,
    subject: message.subject,
    createdAt: message.createdAt,
    parentId: message.parentId
  };
}

function emptyJourney() {
  return { schoolIntro:'', story:'', moments:[], photos:[], growth:'', reflection:'' };
}

function loadJourney() {
  if (!fs.existsSync(JOURNEY_FILE)) return {};
  const parsed = JSON.parse(fs.readFileSync(JOURNEY_FILE, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('行旅内容格式无效');
  return parsed;
}

function saveJourney(data) {
  const temp = JOURNEY_FILE + '.' + crypto.randomUUID() + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), { encoding:'utf8', mode:0o600 });
  fs.renameSync(temp, JOURNEY_FILE);
}

function validJourneyText(value, max) {
  const cleaned = String(value == null ? '' : value).normalize('NFC').trim();
  if (cleaned.length > max) throw Object.assign(new Error('文字超出字数限制'), { status:400 });
  return cleaned;
}

function sanitizeJourney(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Object.assign(new Error('内容格式不正确'), { status:400 });
  if (!Array.isArray(body.moments) || body.moments.length > 12 || !Array.isArray(body.photos) || body.photos.length > 9) throw Object.assign(new Error('条目数量超出限制'), { status:400 });
  const entry = {
    schoolIntro:validJourneyText(body.schoolIntro, 1200),
    story:validJourneyText(body.story, 2500),
    moments:body.moments.map(item => ({ date:validJourneyText(item?.date, 28), title:validJourneyText(item?.title, 80), text:validJourneyText(item?.text, 800) })).filter(item => item.date || item.title || item.text),
    photos:body.photos.map(item => ({ id:String(item?.id || ''), caption:validJourneyText(item?.caption, 100), date:validJourneyText(item?.date, 28) })),
    growth:validJourneyText(body.growth, 2000),
    reflection:validJourneyText(body.reflection, 2000)
  };
  if (entry.photos.some(photo => !MEDIA_ID.test(photo.id) || !fs.existsSync(path.join(JOURNEY_MEDIA_DIR, photo.id)))) throw Object.assign(new Error('照片文件无效，请重新上传'), { status:400 });
  const words = [entry.schoolIntro,entry.story,entry.growth,entry.reflection,...entry.moments.flatMap(item => Object.values(item)),...entry.photos.flatMap(item => [item.caption,item.date])];
  if (containsPrivateContact(words)) throw Object.assign(new Error('请勿在公开内容中填写微信号或电话号码'), { status:400 });
  return entry;
}

function photoExtension(type, bytes) {
  if (type === 'image/webp' && bytes.length >= 12 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') return 'webp';
  if (type === 'image/jpeg' && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (type === 'image/png' && bytes.length >= 8 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  return '';
}

function ownerAllowed(req, res) {
  if (localEditing(req) || verifyOwner(ownerPassword(req)) || admin.allowed(req, !['GET','HEAD'].includes(req.method))) return true;
  if (rateLimited(loginAttempts, req.socket.remoteAddress || 'unknown', 1200)) respond(res, 429, { error:'请稍后重试' });
  else respond(res, 401, { error:'站主密钥不正确' });
  return false;
}

function safeOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return { allowed: true, headers: {} };
  try {
    const source = new URL(origin);
    const host = (req.headers.host || '').split(':')[0];
    const sameHost = source.hostname === host;
    const dev = process.env.NODE_ENV !== 'production' && source.port === '3000' && sameHost;
    const sameOrigin = source.host === req.headers.host;
    if (sameOrigin || dev) return { allowed: true, headers: { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } };
  } catch {}
  return { allowed: false, headers: {} };
}

function staticFile(req, res, pathname) {
  let relative;
  try { relative = decodeURIComponent(pathname === '/' ? 'index.html' : ['/admin','/admin/'].includes(pathname) ? 'admin/index.html' : pathname.slice(1)); }
  catch { return respond(res, 400, { error: '路径不正确' }); }
  const parts = relative.split(/[\\/]/);
  if (parts.some(part => !part || part === '..' || part.startsWith('.'))) return respond(res, 404, { error: '页面不存在' });
  const rootFiles = new Set(['index.html','books.html','henan.html','poems.json','admire-dark.png','hero-night.png','interaction-desktop.png','mobile-hero-final.png']);
  const folders = new Set(['assets','about','craft','figures','writing','works','interaction','journey','travels','pastimes','admin']);
  if (parts.length === 1 ? !rootFiles.has(relative) : !folders.has(parts[0])) return respond(res, 404, { error: '页面不存在' });
  if (parts[0] === 'interaction' && !relative.endsWith('.html')) return respond(res, 404, { error: '页面不存在' });
  const file = path.resolve(ROOT, ...parts);
  if (!file.startsWith(ROOT + path.sep)) return respond(res, 404, { error: '页面不存在' });
  let stat;
  try { stat = fs.statSync(file); } catch { return respond(res, 404, { error: '页面不存在' }); }
  if (!stat.isFile()) return respond(res, 404, { error: '页面不存在' });
  const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.mp4':'video/mp4'}[path.extname(file).toLowerCase()];
  if (!mime) return respond(res, 404, { error: '页面不存在' });
  if (relative.endsWith('.html')) {
    let html = fs.readFileSync(file, 'utf8');
    if (parts[0] !== 'admin') html = admin.decorate(relative, html, req);
    const bytes = Buffer.from(html);
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': bytes.length, 'Cache-Control':'no-store', 'Vary':'Cookie', 'X-Content-Type-Options':'nosniff' });
    return res.end(bytes);
  }
  res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size, 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(file).pipe(res);
}

const admin = require('./server/admin-core.cjs').createAdmin({
  root:ROOT, dataDir:DATA_DIR, ownerFile:OWNER_FILE, ownerConfigured, verifyOwner,
  localRequest, clientAddress, respond, readBody, readBytes, photoExtension,
  loadJourney, loadAnimeNotes, loadStore
});

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return staticFile(req, res, url.pathname);
  const cors = safeOrigin(req);
  if (!cors.allowed) return respond(res, 403, { error: '来源不被允许' });
  Object.entries(cors.headers).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token', 'Access-Control-Max-Age': '600' });
    return res.end();
  }

  if (await admin.handle(req, res, url)) return;

  if (url.pathname === '/api/health' && req.method === 'GET') return respond(res, 200, { ok: true });
  if (url.pathname === '/api/owner/verify' && req.method === 'GET') {
    if (!ownerAllowed(req, res)) return;
    return respond(res, 200, { ok:true });
  }
  const mediaMatch = url.pathname.match(/^\/api\/journey\/media\/([0-9a-f-]+\.(?:webp|jpg|png))$/);
  if (mediaMatch && req.method === 'GET') {
    const id = mediaMatch[1];
    if (!MEDIA_ID.test(id)) return respond(res, 404, { error:'照片不存在' });
    const file = path.join(JOURNEY_MEDIA_DIR, id);
    let stat;
    try { stat = fs.statSync(file); } catch { return respond(res, 404, { error:'照片不存在' }); }
    const mime = id.endsWith('.webp') ? 'image/webp' : id.endsWith('.png') ? 'image/png' : 'image/jpeg';
    res.writeHead(200, { 'Content-Type':mime, 'Content-Length':stat.size, 'Cache-Control':'public, max-age=31536000, immutable', 'X-Content-Type-Options':'nosniff' });
    return fs.createReadStream(file).pipe(res);
  }
  if (url.pathname === '/api/journey' && req.method === 'GET') {
    const stage = url.searchParams.get('stage');
    if (!JOURNEY_STAGES.has(stage)) return respond(res, 400, { error:'求学阶段不正确' });
    return respond(res, 200, { stage, content:loadJourney()[stage] || emptyJourney() });
  }
  if (url.pathname === '/api/journey' && req.method === 'POST') {
    if (!ownerAllowed(req, res)) return;
    const stage = url.searchParams.get('stage');
    if (!JOURNEY_STAGES.has(stage)) return respond(res, 400, { error:'求学阶段不正确' });
    const content = sanitizeJourney(await readBody(req, 65536));
    const all = loadJourney();
    all[stage] = content;
    saveJourney(all);
    return respond(res, 200, { ok:true, stage, content });
  }
  if (url.pathname === '/api/journey/photo' && req.method === 'POST') {
    if (!ownerAllowed(req, res)) return;
    const stage = url.searchParams.get('stage');
    if (!JOURNEY_STAGES.has(stage)) return respond(res, 400, { error:'求学阶段不正确' });
    const bytes = await readBytes(req, 5 * 1024 * 1024);
    const extension = photoExtension(req.headers['content-type'] || '', bytes);
    if (!extension) return respond(res, 400, { error:'请上传 JPG、PNG 或 WebP 照片' });
    const id = crypto.randomUUID() + '.' + extension;
    fs.writeFileSync(path.join(JOURNEY_MEDIA_DIR, id), bytes, { flag:'wx', mode:0o600 });
    return respond(res, 201, { ok:true, id, url:'/api/journey/media/' + id });
  }
  if (url.pathname === '/api/anime-note' && req.method === 'GET') {
    const id = url.searchParams.get('id') || '';
    if (!ANIME_ID.test(id)) return respond(res, 400, { error:'作品编号不正确' });
    return respond(res, 200, { content:loadAnimeNotes()[id] || null });
  }
  if (url.pathname === '/api/anime-note' && req.method === 'POST') {
    if (!ownerAllowed(req, res)) return;
    const id = url.searchParams.get('id') || '';
    if (!ANIME_ID.test(id)) return respond(res, 400, { error:'作品编号不正确' });
    const body = await readBody(req, 32768);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(res, 400, { error:'手记格式不正确' });
    const note = validJourneyText(body.note, 1500);
    const diary = validJourneyText(body.diary, 5000);
    const date = validJourneyText(body.date, 80);
    if (containsPrivateContact([note,diary,date])) return respond(res, 400, { error:'请勿在公开手记中填写微信号或电话号码' });
    const all = loadAnimeNotes();
    all[id] = { note, diary, date };
    saveAnimeNotes(all);
    return respond(res, 200, { ok:true, content:all[id] });
  }
  if (url.pathname === '/api/messages' && req.method === 'GET') {
    const kind = url.searchParams.get('kind');
    if (!KINDS.has(kind)) return respond(res, 400, { error: '留言类别不正确' });
    const subject = kind === 'anime' ? url.searchParams.get('subject') || '' : '';
    if (kind === 'anime' && !ANIME_ID.test(subject)) return respond(res, 400, { error:'作品编号不正确' });
    const visible = loadStore().messages.filter(message => message.kind === kind && (kind !== 'anime' || message.subject === subject) && message.visibility === 'public' && !containsPrivateContact([message.name,message.text,message.siteName,message.siteUrl,message.article]));
    return respond(res, 200, { messages: visible.slice(-120).reverse().map(publicView) });
  }
  if (url.pathname === '/api/messages' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.confirm) return respond(res, 400, { error: '提交未通过' });
    const kind = cleanText(body.kind, 20);
    if (!KINDS.has(kind)) return respond(res, 400, { error: '留言类别不正确' });
    const name = cleanText(body.name, 32) || '匿名访客';
    const text = cleanText(body.text, 1500);
    const siteName = kind === 'ally' ? cleanText(body.siteName, 60) : '';
    const siteUrl = kind === 'ally' ? cleanText(body.siteUrl, 240) : '';
    const article = kind === 'featured' ? cleanText(body.article, 80) : '';
    const subject = kind === 'anime' ? cleanText(body.subject, 20) : '';
    if (kind === 'anime' && !ANIME_ID.test(subject)) return respond(res, 400, { error:'作品编号不正确' });
    if (name.length > 32 || text.length < 2 || text.length > 1500 || siteName.length > 60 || siteUrl.length > 240 || article.length > 80) return respond(res, 400, { error: '请检查留言长度' });
    if (siteUrl) {
      try { const link = new URL(siteUrl); if (!['http:','https:'].includes(link.protocol)) throw new Error(); }
      catch { return respond(res, 400, { error: '网站地址应以 http:// 或 https:// 开头' }); }
    }
    if (containsPrivateContact([name,text,siteName,siteUrl,article])) return respond(res, 400, { error: '请勿发布微信号或电话号码' });
    const store = loadStore();
    const parentId = cleanText(body.parentId, 50);
    if (parentId) {
      const parent = store.messages.find(message => message.id === parentId);
      if (!parent || parent.kind !== kind || (kind === 'anime' && parent.subject !== subject) || parent.visibility !== 'public' || parent.parentId) return respond(res, 400, { error: '无法回复这条留言' });
    }
    const visibility = kind === 'letter' && body.visibility === 'private' && !parentId ? 'private' : 'public';
    if (kind === 'letter' && !['private','public'].includes(body.visibility) && !parentId) return respond(res, 400, { error: '请选择可见范围' });
    if (POST_GAP_MS > 0 && rateLimited(recentPosts, clientAddress(req), POST_GAP_MS)) return respond(res, 429, { error: '请稍等片刻再留言' });
    const message = { id: crypto.randomUUID(), kind, name, text, siteName, siteUrl, article, subject, visibility, parentId, createdAt: new Date().toISOString() };
    store.messages.push(message);
    saveStore(store);
    return respond(res, 201, { ok: true, id: message.id, visibility });
  }
  if (url.pathname === '/api/music-covers' && req.method === 'POST') {
    /* 本机预览时，页面把解析到的封面地址写回 assets/music-selection.json（公开部署时本机判定不成立，直接 403） */
    if (!localEditing(req)) return respond(res, 403, { error: '仅本机可直接写入歌单封面' });
    let payload;
    try { payload = await readBody(req, 524288); }
    catch (error) { return respond(res, error.status || 400, { error: error.message || '请求格式不正确' }); }
    const file = path.join(__dirname, 'assets', 'music-selection.json');
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return respond(res, 500, { error: '歌单文件读取失败' }); }
    const cleanUrl = value => {
      const text = String(value == null ? '' : value).trim().slice(0, 500);
      return /^https:\/\/[a-z0-9.-]+\//i.test(text) ? text : '';
    };
    const cleanLabel = value => String(value == null ? '' : value).trim().slice(0, 40);
    const covers = data.covers && typeof data.covers === 'object' && !Array.isArray(data.covers) ? data.covers : {};
    const pageMap = data.pages && typeof data.pages === 'object' && !Array.isArray(data.pages) ? data.pages : {};
    let addedCover = 0;
    let addedPage = 0;
    let addedInfo = 0;
    Object.entries(payload && payload.artwork && typeof payload.artwork === 'object' ? payload.artwork : {}).forEach(([key, value]) => {
      const url = cleanUrl(value);
      if (!url || typeof key !== 'string' || !key || key.length > 120) return;
      if (!covers[key]) addedCover++;
      covers[key] = url;
    });
    Object.entries(payload && payload.pages && typeof payload.pages === 'object' ? payload.pages : {}).forEach(([key, value]) => {
      if (typeof key !== 'string' || !key || key.length > 120) return;
      const record = value && typeof value === 'object' ? value : {};
      const url = cleanUrl(record.url);
      if (!url) return;
      if (!pageMap[key]) addedPage++;
      pageMap[key] = { url, platform: cleanLabel(record.platform) };
    });
    const infos = data.songInfo && typeof data.songInfo === 'object' && !Array.isArray(data.songInfo) ? data.songInfo : {};
    Object.entries(payload && payload.info && typeof payload.info === 'object' ? payload.info : {}).forEach(([key, value]) => {
      if (typeof key !== 'string' || !key || key.length > 120) return;
      const record = value && typeof value === 'object' ? value : {};
      const entry = {};
      ['title', 'artist', 'album'].forEach(field => {
        const text = String(record[field] == null ? '' : record[field]).trim().slice(0, 80);
        if (text) entry[field] = text;
      });
      if (!Object.keys(entry).length) return;
      if (!infos[key]) addedInfo++;
      infos[key] = entry;
    });
    if (!addedCover && !addedPage && !addedInfo) {
      return respond(res, 200, { ok: true, addedCover: 0, addedPage: 0, addedInfo: 0, totalCover: Object.keys(covers).length, totalPage: Object.keys(pageMap).length, totalInfo: Object.keys(infos).length });
    }
    data.covers = covers;
    data.pages = pageMap;
    data.songInfo = infos;
    const temp = file + '.' + crypto.randomUUID() + '.tmp';
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temp, file);
    return respond(res, 200, { ok: true, addedCover, addedPage, addedInfo, totalCover: Object.keys(covers).length, totalPage: Object.keys(pageMap).length, totalInfo: Object.keys(infos).length });
  }
  if (url.pathname === '/api/owner/status' && req.method === 'GET') return respond(res, 200, { configured: ownerConfigured(), localSetup: localRequest(req) && !ownerConfigured() && !localEditing(req), localEditing:localEditing(req) });
  if (url.pathname === '/api/owner/setup' && req.method === 'POST') {
    if (process.env.NODE_ENV === 'production' || !localRequest(req) || localEditing(req) || ownerConfigured()) return respond(res, 403, { error: '此处无法设置站主密钥' });
    const body = await readBody(req);
    const password = String(body.password || '');
    if (password.length < 12 || password.length > 128) return respond(res, 400, { error: '密钥需为 12 到 128 个字符' });
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    fs.writeFileSync(OWNER_FILE, JSON.stringify({ salt, hash }), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    return respond(res, 201, { ok: true });
  }
  if (url.pathname === '/api/owner/messages' && req.method === 'GET') {
    if (!ownerAllowed(req, res)) return;
    const kind = url.searchParams.get('kind');
    if (kind && kind !== 'anime') return respond(res, 400, { error:'留言类别不正确' });
    const visible = loadStore().messages.filter(message => kind === 'anime'
      ? message.kind === 'anime' && message.visibility === 'public'
      : message.kind === 'letter' && message.visibility === 'private');
    return respond(res, 200, { messages:visible.slice(-200).reverse().map(publicView) });
  }
  if (url.pathname === '/api/owner/delete' && req.method === 'POST') {
    if (!ownerAllowed(req, res)) return;
    const body = await readBody(req);
    const id = cleanText(body.id, 50);
    const store = loadStore();
    const before = store.messages.length;
    store.messages = store.messages.filter(message => message.id !== id && message.parentId !== id);
    if (store.messages.length === before) return respond(res, 404, { error: '留言不存在' });
    saveStore(store);
    return respond(res, 200, { ok: true });
  }
  return respond(res, 404, { error: '接口不存在' });
}

const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','SAMEORIGIN');
  handle(req, res).catch(error => {
    if (!error.status) console.error(error);
    if (!res.headersSent) respond(res, error.status || 500, { error: error.status ? error.message : '服务暂时不可用' });
    else res.end();
  });
});

server.on('close', () => admin.store.db.close());
if (require.main === module) server.listen(PORT, HOST, () => console.log(`Cheney site: http://${HOST}:${PORT} | data: ${DATA_DIR}`));
module.exports = { server, containsPrivateContact };
