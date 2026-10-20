/* Reveal only on this device after its owner supplies the unlock password. */
(() => {
  'use strict';
  if (!window.CHENEY_ADMIN_VAULT || window.CHENEY_CONNECTION_DIALOG) return;
  const make = (tag, text) => { const el = document.createElement(tag); if (text) el.textContent = text; return el; };
  function open() {
    const dialog = make('dialog'), heading = make('h2', '查看／复制连接凭据'), form = make('form'), label = make('label', '输入你的解锁密码'), password = make('input'), status = make('p'), result = make('section'), token = make('input'), unlock = make('button', '在本机解锁'), close = make('button', '关闭');
    let secret = '';
    form.className = 'editor-form'; password.type = 'password'; password.autocomplete = 'current-password'; password.required = true; password.maxLength = 128; password.setAttribute('aria-label', '解锁密码'); label.append(password); unlock.type = 'submit'; unlock.className = 'primary'; close.type = 'button'; close.onclick = () => dialog.close();
    token.type = 'password'; token.readOnly = true; token.autocomplete = 'off'; token.setAttribute('aria-label', '一次性连接凭据'); result.hidden = true;
    const reveal = make('button', '显示'), copy = make('button', '复制连接凭据'); reveal.type = copy.type = 'button';
    reveal.onclick = () => { token.type = token.type === 'password' ? 'text' : 'password'; reveal.textContent = token.type === 'password' ? '显示' : '隐藏'; };
    copy.onclick = async () => { try { await navigator.clipboard.writeText(secret); status.textContent = '已复制。可在另一台设备的“一次性连接凭据”中粘贴。'; } catch { token.type = 'text'; token.focus(); token.select(); status.textContent = '请长按上方文字复制，或按 Ctrl+C。'; } };
    result.append(make('p', '这就是当前网站的连接凭据。请只复制到你自己的管理页面。'), token, reveal, copy);
    form.append(label, unlock); status.setAttribute('role', 'status'); dialog.append(heading, make('p', '密码和解密结果都留在本机，不会发送到聊天或代码仓库。'), form, status, result, close); document.body.append(dialog);
    form.onsubmit = async event => { event.preventDefault(); unlock.disabled = true; status.textContent = '正在本机解锁…'; try { secret = await window.CHENEY_ADMIN_VAULT.unlock(password.value); form.reset(); form.hidden = true; token.value = secret; result.hidden = false; status.textContent = '已解锁。'; } catch (error) { status.textContent = error.message; } finally { unlock.disabled = false; } };
    const timeout = setTimeout(() => { if (dialog.open) dialog.close(); }, 120000);
    dialog.addEventListener('close', () => { clearTimeout(timeout); secret = ''; password.value = ''; token.value = ''; dialog.remove(); }, { once: true }); dialog.showModal(); password.focus();
  }
  function attach() {
    const foot = document.querySelector('.sidebar-foot');
    if (!foot || foot.querySelector('[data-copy-connection]')) return;
    const button = make('button', '查看／复制连接凭据'); button.type = 'button'; button.dataset.copyConnection = ''; button.onclick = open; foot.append(button);
  }
  window.CHENEY_CONNECTION_DIALOG = { open };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
})();
