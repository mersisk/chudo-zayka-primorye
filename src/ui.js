export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function setNotice(message, type = "success") {
  const node = qs("#global-notice");
  if (!node) return;
  node.textContent = message;
  node.className = `notice notice--${type}`;
  node.hidden = false;
  window.clearTimeout(window.__aircNoticeTimer);
  window.__aircNoticeTimer = window.setTimeout(() => {
    node.hidden = true;
  }, 4500);
}

export function renderShell({ title, nav, content, cartCount = 0 }) {
  document.title = title;
  const root = qs("#app");
  root.innerHTML = `
    <header class="site-header-wrap">
      <div class="site-header">
        <a class="brand" href="#/" aria-label="Чудо Зайка — на главную">
          <img src="./public/media/logo.jpg" alt="">
          <span><strong>Чудо Зайка</strong><small>аниматорское агентство</small></span>
        </a>
        <nav class="nav" aria-label="Главная навигация">
          ${nav.map((item) => `<a href="${item.href}" ${item.active ? 'aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`).join("")}
        </nav>
        <a class="cart-link" href="#/cart" data-cart-link aria-label="Открыть заявку, выбрано: ${cartCount}">
          <span>Заявка</span><b data-cart-count>${cartCount}</b>
        </a>
      </div>
    </header>
    <main id="main">${content}</main>
    <div id="global-notice" class="notice" hidden role="status" aria-live="polite"></div>
    <footer class="site-footer-wrap">
      <div class="site-footer">
        <a class="brand brand--footer" href="#/">
          <img src="./public/media/logo.jpg" alt="">
          <span><strong>Чудо Зайка</strong><small>Владивосток · Приморский край</small></span>
        </a>
        <div class="footer-links">
          <a href="#/catalog/express">Экспресс-поздравления</a>
          <a href="#/catalog/party">Праздники</a>
          <a href="#/reviews">Отзывы</a>
        </div>
        <div class="footer-contact">
          <a href="tel:+79949940433">+7 (994) 994-04-33</a>
          <a href="https://t.me/CongratulationsinPrimorye" target="_blank" rel="noreferrer">Telegram ↗</a>
        </div>
      </div>
      <div class="footer-bottom"><span>© 2024–2026 «Чудо Зайка»</span><span>Заявки сейчас сохраняются локально</span></div>
    </footer>
  `;
}

export function route() {
  const hash = location.hash.replace(/^#/, "") || "/";
  return hash.split("?")[0];
}

export function onRouteChange(callback) {
  addEventListener("hashchange", callback);
  callback();
}

export function statusLabel(status) {
  return ({
    new: "Новая",
    in_progress: "В работе",
    done: "Готово",
    archived: "Архив",
    contacted: "Связались",
    proposal: "Предложение",
    won: "Договорились",
    lost: "Закрыто",
    blocked: "Заблокировано",
  })[status] || status;
}

export function renderLogin() {
  return `
    <section class="panel narrow">
      <p class="eyebrow">Внутренний экран</p>
      <h1>Войди как владелец</h1>
      <p class="lead">В локальном режиме вход не нужен. Эта форма появляется, когда включён Supabase.</p>
      <form id="login-form" class="stack">
        <label>Почта<input name="email" type="email" autocomplete="username" required></label>
        <label>Пароль<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="button" type="submit">Войти в рабочее пространство</button>
        <p id="login-error" class="field-error" hidden></p>
      </form>
    </section>
  `;
}
