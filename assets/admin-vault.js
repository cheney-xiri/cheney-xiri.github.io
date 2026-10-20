/* Device-local encrypted connection. Passwords never leave this module. */
(() => {
  'use strict';
  const REPO = 'cheney-xiri/cheney-xiri.github.io';
  const STORAGE = 'cheney-owner-vault-v1:' + REPO;
  const encoder = new TextEncoder(), ITERATIONS = 600000;
  const aad = encoder.encode('cheney-management:' + REPO + ':1');
  const b64 = bytes => btoa(String.fromCharCode(...bytes));
  const unb64 = text => Uint8Array.from(atob(text), x => x.charCodeAt(0));
  function validate(record) {
    if (!record || record.format !== 'cheney-device-login-v1' || record.repo !== REPO || record.iterations !== ITERATIONS || typeof record.salt !== 'string' || typeof record.iv !== 'string' || typeof record.ciphertext !== 'string') throw new Error('这不是当前网站的加密登录备份');
    try {
      if (unb64(record.salt).length !== 16 || unb64(record.iv).length !== 12 || unb64(record.ciphertext).length < 20 || unb64(record.ciphertext).length > 600) throw new Error();
    } catch { throw new Error('加密备份格式不正确'); }
    return { format: record.format, repo: REPO, iterations: ITERATIONS, salt: record.salt, iv: record.iv, ciphertext: record.ciphertext };
  }
  function read() { const saved = localStorage.getItem(STORAGE); return saved ? validate(JSON.parse(saved)) : null; }
  async function key(password, salt) {
    if (!crypto.subtle) throw new Error('请使用 HTTPS 地址和较新的浏览器打开后台');
    const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function seal(secret, password) {
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('请设置 12 到 128 个字符的解锁密码');
    if (typeof secret !== 'string' || secret.length < 10 || secret.length > 255) throw new Error('连接凭据格式不正确');
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, await key(password, salt), encoder.encode(secret));
    return { format: 'cheney-device-login-v1', repo: REPO, iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), ciphertext: b64(new Uint8Array(ciphertext)) };
  }
  async function unlock(password) {
    const record = read(); if (!record) throw new Error('这台设备尚未连接，请先连接或导入加密登录备份');
    if (typeof password !== 'string' || password.length > 128) throw new Error('密码格式不正确');
    try {
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(record.iv), additionalData: aad }, await key(password, unb64(record.salt)), unb64(record.ciphertext));
      return new TextDecoder().decode(plaintext);
    } catch { throw new Error('密码不正确，或加密备份已损坏'); }
  }
  window.CHENEY_ADMIN_VAULT = {
    configured: () => { try { return !!read(); } catch { return false; } },
    unlock,
    async create(secret, password) { const record = await seal(secret, password); localStorage.setItem(STORAGE, JSON.stringify(record)); },
    async change(currentPassword, password) { const secret = await unlock(currentPassword); const record = await seal(secret, password); localStorage.setItem(STORAGE, JSON.stringify(record)); },
    export() { const record = read(); if (!record) throw new Error('请先连接这台设备'); return record; },
    import(text) { if (typeof text !== 'string' || text.length > 8192) throw new Error('备份文件过大'); const record = validate(JSON.parse(text)); localStorage.setItem(STORAGE, JSON.stringify(record)); }
  };
})();
