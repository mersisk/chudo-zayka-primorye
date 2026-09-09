import { catalogGroups, categories, getService, project, reviews, services, steps } from "./project.js";
import { store } from "./data/store.js";
import {
  escapeHtml,
  formatDate,
  onRouteChange,
  qs,
  qsa,
  renderLogin,
  renderShell,
  route,
  setNotice,
  statusLabel,
} from "./ui.js";

const CART_KEY = "chudo-zayka-cart-v1";

const icons = {
  arrow: "↗",
  plus: "+",
  check: "✓",
  spark: "✦",
};

function readCart() {
  try {
    const ids = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return [...new Set(ids)].filter((id) => getService(id));
  } catch {
    return [];
  }
}

function writeCart(ids) {
  localStorage.setItem(CART_KEY, JSON.stringify(ids));
}

function addToCart(id) {
  const cart = readCart();
  if (!cart.includes(id)) cart.push(id);
  writeCart(cart);
  setNotice("Добавили в заявку");
  updateCartBadges();
}

function removeFromCart(id) {
  writeCart(readCart().filter((item) => item !== id));
}

function updateCartBadges() {
  const count = readCart().length;
  for (const node of qsa("[data-cart-count]")) node.textContent = String(count);
  for (const node of qsa("[data-cart-link]")) node.classList.toggle("has-items", count > 0);
}

function formatPrice(value, prefix = "от") {
  if (value == null) return "Рассчитаем после заявки";
  return [prefix, `${new Intl.NumberFormat("ru-RU").format(value)} ₽`].filter(Boolean).join(" ");
}

function nav(active) {
  return [
    { href: "#/", label: "Главная", active: active === "home" },
    ...categories.map((category) => ({
      href: `#/catalog/${category.id}`,
      label: category.navTitle,
      active: active === category.id,
    })),
    { href: "#/reviews", label: "Отзывы", active: active === "reviews" },
  ];
}

function categoryLabel(category) {
  return categories.find((item) => item.id === category)?.title || "Программа";
}

function mediaStage(image, alt, className = "", loading = "lazy") {
  return `
    <span class="media-stage ${className}">
      <img class="media-stage__blur" src="${escapeHtml(image)}" alt="" aria-hidden="true" ${loading ? `loading="${loading}"` : ""}>
      <img class="media-stage__image" src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" ${loading ? `loading="${loading}"` : ""}>
    </span>
  `;
}

function serviceCard(service, featured = false) {
  return `
    <article class="service-card tilt-card reveal ${featured ? "service-card--featured" : ""}">
      <a class="service-card__media" href="#/service/${encodeURIComponent(service.id)}" aria-label="Подробнее: ${escapeHtml(service.title)}">
        ${mediaStage(service.image, service.title)}
        <span class="media-shine" aria-hidden="true"></span>
        <span class="service-card__badge">${escapeHtml(service.badge)}</span>
      </a>
      <div class="service-card__body">
        <p class="micro-label">${escapeHtml(categoryLabel(service.category))} · ${escapeHtml(service.duration)}</p>
        <h3><a href="#/service/${encodeURIComponent(service.id)}">${escapeHtml(service.title)}</a></h3>
        <p>${escapeHtml(service.short)}</p>
        <div class="service-card__footer">
          <strong>${formatPrice(service.price)}</strong>
          <div class="service-card__actions">
            <a class="round-link" href="#/service/${encodeURIComponent(service.id)}" aria-label="Открыть ${escapeHtml(service.title)}">${icons.arrow}</a>
            <button class="icon-button add-to-cart" type="button" data-service-id="${escapeHtml(service.id)}" aria-label="Добавить ${escapeHtml(service.title)} в заявку">${icons.plus}</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function reviewCard(review, index) {
  return `
    <article class="review-card reveal" style="--delay:${index * 70}ms">
      <div class="review-card__stars" aria-label="5 из 5">★★★★★</div>
      <blockquote>«${escapeHtml(review.text)}»</blockquote>
      <p><strong>${escapeHtml(review.context)}</strong><span>${escapeHtml(review.source)}</span></p>
    </article>
  `;
}

function bindMotion() {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    for (const node of qsa(".reveal")) node.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });
  for (const node of qsa(".reveal")) observer.observe(node);

  for (const card of qsa(".tilt-card")) {
    card.addEventListener("pointermove", (event) => {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.setProperty("--rotate-x", `${y * -5}deg`);
      card.style.setProperty("--rotate-y", `${x * 7}deg`);
      card.style.setProperty("--glow-x", `${(x + 0.5) * 100}%`);
      card.style.setProperty("--glow-y", `${(y + 0.5) * 100}%`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--rotate-x");
      card.style.removeProperty("--rotate-y");
    });
  }

  const heroVisual = qs(".hero-visual");
  if (heroVisual) {
    heroVisual.addEventListener("pointermove", (event) => {
      const box = heroVisual.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      heroVisual.style.setProperty("--hero-x", `${x * 18}px`);
      heroVisual.style.setProperty("--hero-y", `${y * 14}px`);
    }, { passive: true });
  }
}

function bindCommon() {
  for (const button of qsa(".add-to-cart")) {
    button.addEventListener("click", () => addToCart(button.dataset.serviceId));
  }
  updateCartBadges();
  bindMotion();
}

function renderHome() {
  const expressIds = ["arthur-pirozhkov", "stas-mikhailov", "gorilla", "labubu-express"];
  const showIds = ["neon-show", "foam-party", "cryo-show", "silver-disco"];
  const express = expressIds.map(getService).filter(Boolean);
  const shows = showIds.map(getService).filter(Boolean);
  const tickerText = "АНИМАТОРЫ ✦ ЭКСПРЕСС-ПОЗДРАВЛЕНИЯ ✦ ШОУ-ПРОГРАММЫ ✦ ВЫПУСКНЫЕ ✦ ";

  renderShell({
    title: `${project.name} — аниматорское агентство в Приморье`,
    nav: nav("home"),
    cartCount: readCart().length,
    content: `
      <section class="hero-section">
        <div class="aurora aurora--one" aria-hidden="true"></div>
        <div class="aurora aurora--two" aria-hidden="true"></div>
        <div class="container hero-layout">
          <div class="hero-copy">
            <p class="eyebrow"><span>${icons.spark}</span> Владивосток · Приморский край</p>
            <h1>Праздник<br><em>на полную</em></h1>
            <p class="hero-lead">${escapeHtml(project.lead)}</p>
            <div class="hero-actions">
              <a class="button button--primary magnetic" href="#/catalog/animators">Открыть каталог <span>${icons.arrow}</span></a>
              <a class="button button--glass" href="#/reviews">Смотреть отзывы</a>
            </div>
            <div class="hero-facts" aria-label="Коротко о каталоге">
              <div><strong>30+</strong><span>персонажей и ростовых героев</span></div>
              <div><strong>10+</strong><span>шоу и дополнений</span></div>
              <div><strong>4</strong><span>направления праздника</span></div>
            </div>
          </div>
          <div class="hero-visual" aria-label="Реальные праздники Чудо Зайка">
            <div class="hero-orbit hero-orbit--one" aria-hidden="true"></div>
            <div class="hero-orbit hero-orbit--two" aria-hidden="true"></div>
            <div class="hero-collage">
              <div class="hero-photo-wrap">
                ${mediaStage("./public/media/hero-wide.jpg", "Большой праздник с мишкой Барни", "", "")}
              </div>
              <div class="hero-photo-small hero-photo-small--one">
                ${mediaStage("./public/media/hero-lol.jpg", "Праздник с куклой LOL", "", "")}
              </div>
              <div class="hero-photo-small hero-photo-small--two">
                ${mediaStage("./public/media/hero-action.jpg", "Игровая программа на открытой площадке", "", "")}
              </div>
            </div>
            <div class="floating-card floating-card--top"><span>30+</span> героев</div>
            <div class="floating-card floating-card--right"><span>✦</span> реальные фото</div>
            <div class="floating-card floating-card--left"><span>10+</span> шоу</div>
            <div class="floating-card floating-card--bottom"><span>24/7</span> заявка на сайте</div>
          </div>
        </div>
        <div class="ticker" aria-hidden="true">
          <div class="ticker__track"><span>${tickerText}</span><span>${tickerText}</span></div>
        </div>
      </section>

      <section id="directions" class="section formats-section">
        <div class="container">
          <div class="section-heading reveal">
            <div><p class="eyebrow">Весь каталог</p><h2>Что устроим<br>на вашем празднике?</h2></div>
            <p>Все направления разделены по смыслу. Экспресс — отдельная большая линейка персонажей, а шоу можно выбрать самостоятельно.</p>
          </div>
          <div class="format-grid">
            ${categories.map((category, index) => `
              <a class="format-card reveal" style="--delay:${index * 110}ms" href="#/catalog/${category.id}">
                <span class="format-card__media">${mediaStage(category.image, category.title)}</span>
                <span class="format-card__content">
                  <span class="format-card__number">0${index + 1}</span>
                  <span class="format-card__eyebrow">${escapeHtml(category.eyebrow)}</span>
                  <strong>${escapeHtml(category.title)}</strong>
                  <span>${escapeHtml(category.description)}</span>
                </span>
                <span class="format-card__arrow">${icons.arrow}</span>
              </a>
            `).join("")}
          </div>
        </div>
      </section>

      <section class="section section--ink">
        <div class="container">
          <div class="section-heading reveal">
            <div><p class="eyebrow">Экспресс-поздравления</p><h2>Большая линейка<br>для короткого сюрприза</h2></div>
            <a class="text-link" href="#/catalog/express">Все персонажи <span>${icons.arrow}</span></a>
          </div>
          <div class="service-grid">${express.map((service) => serviceCard(service)).join("")}</div>
        </div>
      </section>

      <section class="section party-preview">
        <div class="container">
          <div class="section-heading reveal">
            <div><p class="eyebrow">Шоу-программы</p><h2>Можно выбрать<br>отдельное шоу</h2></div>
            <a class="text-link" href="#/catalog/shows">Все шоу <span>${icons.arrow}</span></a>
          </div>
          <div class="service-grid">${shows.map((service) => serviceCard(service)).join("")}</div>
        </div>
      </section>

      <section class="section process-section">
        <div class="container">
          <div class="section-heading reveal"><div><p class="eyebrow">Как заказать</p><h2>Три шага<br>до праздника</h2></div></div>
          <div class="steps-grid">
            ${steps.map((step, index) => `
              <article class="step-card reveal" style="--delay:${index * 90}ms">
                <div class="step-card__top"><span>${escapeHtml(step.number)}</span><i aria-hidden="true">${escapeHtml(step.icon)}</i></div>
                <div class="step-card__copy"><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></div>
              </article>
            `).join("")}
          </div>
        </div>
      </section>

      <section class="section reviews-preview">
        <div class="container">
          <div class="section-heading reveal">
            <div><p class="eyebrow">Реальные отзывы</p><h2>Эмоции говорят<br>сами за себя</h2></div>
            <a class="text-link" href="#/reviews">Все отзывы <span>${icons.arrow}</span></a>
          </div>
          <div class="review-grid">${reviews.slice(0, 3).map(reviewCard).join("")}</div>
        </div>
      </section>

      ${renderFinalCta()}
    `,
  });
  bindCommon();
}

function renderFinalCta() {
  return `
    <section class="section final-cta-section">
      <div class="container">
        <div class="final-cta reveal">
          <span class="final-cta__orb" aria-hidden="true"></span>
          <p class="eyebrow">Есть дата? Зафиксируем её</p>
          <h2>Соберите праздник<br>в одной заявке</h2>
          <p>Добавляйте героев и программы. Мы проверим свободное время и свяжемся, чтобы уточнить детали.</p>
          <a class="button button--light" href="#/cart">Открыть заявку <span>${icons.arrow}</span></a>
        </div>
      </div>
    </section>
  `;
}

function renderCatalogGroups(categoryId) {
  const groups = catalogGroups[categoryId] || [];
  if (!groups.length) return "";
  return `
    <div class="catalog-groups">
      <div class="section-heading reveal">
        <div><p class="eyebrow">Все доступные образы</p><h2>${categoryId === "express" ? "Кого можно пригласить" : "Выберите любимого героя"}</h2></div>
        <p>Список собран по полному экспорту канала. Конкретный костюм и свободное время подтвердим по заявке.</p>
      </div>
      <div class="catalog-group-grid">
        ${groups.map((group, index) => `
          <article class="catalog-group-card reveal" style="--delay:${index * 70}ms">
            ${mediaStage(group.image, group.title, "catalog-group-card__media")}
            <div class="catalog-group-card__body">
              <h3>${escapeHtml(group.title)}</h3>
              <div class="character-cloud">${group.items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderCatalog(categoryId) {
  const category = categories.find((item) => item.id === categoryId) || categories[0];
  const filtered = services.filter((service) => service.category === category.id);

  renderShell({
    title: `${category.title} — ${project.name}`,
    nav: nav(category.id),
    cartCount: readCart().length,
    content: `
      <section class="catalog-hero">
        <div class="container catalog-hero__grid">
          <div class="reveal">
            <a class="back-link" href="#/">← На главную</a>
            <p class="eyebrow">${escapeHtml(category.eyebrow)}</p>
            <h1>${escapeHtml(category.title)}</h1>
            <p class="hero-lead">${escapeHtml(category.description)}</p>
          </div>
          <div class="catalog-hero__art reveal" style="--delay:120ms">
            ${mediaStage(category.image, category.title, "catalog-hero__media", "")}
            <span class="catalog-hero__orbit" aria-hidden="true"></span>
          </div>
        </div>
      </section>
      <section class="section catalog-section">
        <div class="container">
          <div class="catalog-switch reveal" role="navigation" aria-label="Формат праздника">
            ${categories.map((item) => `<a href="#/catalog/${item.id}" ${item.id === category.id ? 'aria-current="page"' : ""}>${escapeHtml(item.title)}</a>`).join("")}
          </div>
          ${renderCatalogGroups(category.id)}
          <div class="section-heading catalog-services-heading reveal"><div><p class="eyebrow">Можно добавить в заявку</p><h2>${category.id === "express" ? "Популярные экспресс-герои" : "Программы направления"}</h2></div></div>
          <div class="service-grid service-grid--catalog">${filtered.map((service) => serviceCard(service)).join("")}</div>
        </div>
      </section>
      ${renderFinalCta()}
    `,
  });
  bindCommon();
}

function renderService(id) {
  const service = getService(id);
  if (!service) return renderNotFound();
  const related = services.filter((item) => item.category === service.category && item.id !== service.id).slice(0, 3);

  renderShell({
    title: `${service.title} — ${project.name}`,
    nav: nav(service.category),
    cartCount: readCart().length,
    content: `
      <section class="detail-hero">
        <div class="container detail-grid">
          <div class="detail-gallery reveal">
            <div class="detail-gallery__main">
              ${mediaStage(service.gallery[0], service.title, "detail-gallery__media", "")}
              <span class="detail-badge">${escapeHtml(service.badge)}</span>
            </div>
            ${service.gallery.slice(1).length ? `<div class="detail-gallery__thumbs">${service.gallery.slice(1).map((image, index) => mediaStage(image, `${service.title}, фотография ${index + 2}`, "detail-gallery__thumb")).join("")}</div>` : ""}
          </div>
          <div class="detail-copy reveal" style="--delay:100ms">
            <a class="back-link" href="#/catalog/${service.category}">← ${escapeHtml(categoryLabel(service.category))}</a>
            <p class="eyebrow">${escapeHtml(service.duration)}</p>
            <h1>${escapeHtml(service.title)}</h1>
            <p class="detail-price">${formatPrice(service.price)}</p>
            <p class="hero-lead">${escapeHtml(service.description)}</p>
            <div class="include-list">
              ${service.includes.map((item) => `<span><i>${icons.check}</i>${escapeHtml(item)}</span>`).join("")}
            </div>
            <div class="detail-actions">
              <button class="button button--primary add-to-cart" type="button" data-service-id="${escapeHtml(service.id)}">Добавить в заявку <span>${icons.plus}</span></button>
              <a class="button button--glass" href="${project.phoneHref}">Позвонить</a>
            </div>
            <p class="detail-note">Точную стоимость подтвердим после проверки даты, места и состава программы.</p>
          </div>
        </div>
      </section>
      ${service.video ? `
        <section class="section video-section">
          <div class="container video-grid">
            <div class="reveal"><p class="eyebrow">Живой момент</p><h2>Посмотрите,<br>как это выглядит</h2><p>Видео из реального праздника опубликовано в Telegram-канале агентства.</p></div>
            <div class="video-shell reveal" style="--delay:120ms"><video controls playsinline preload="metadata" poster="${service.image}"><source src="${service.video}" type="video/mp4">Ваш браузер не поддерживает видео.</video></div>
          </div>
        </section>
      ` : ""}
      <section class="section section--ink">
        <div class="container">
          <div class="section-heading reveal"><div><p class="eyebrow">Можно добавить</p><h2>Ещё варианты</h2></div></div>
          <div class="service-grid">${related.map((item) => serviceCard(item)).join("")}</div>
        </div>
      </section>
    `,
  });
  bindCommon();
}

function renderReviews() {
  renderShell({
    title: `Отзывы — ${project.name}`,
    nav: nav("reviews"),
    cartCount: readCart().length,
    content: `
      <section class="reviews-hero">
        <div class="container reviews-hero__grid">
          <div class="reveal"><p class="eyebrow">Отзывы клиентов</p><h1>После нас<br><em>остаются эмоции</em></h1><p class="hero-lead">Собрали живые впечатления из Telegram-канала агентства. Без имён и личных контактов.</p></div>
          <div class="reviews-score reveal" style="--delay:100ms"><strong>5.0</strong><span>★★★★★</span><p>по опубликованным отзывам</p></div>
        </div>
      </section>
      <section class="section reviews-page">
        <div class="container review-grid review-grid--page">${reviews.map(reviewCard).join("")}</div>
      </section>
      <section class="section proof-section">
        <div class="container proof-grid">
          <img class="reveal" src="./public/media/bear-family.jpg" alt="Семейное поздравление с большим медведем">
          <div class="reveal" style="--delay:100ms"><p class="eyebrow">Почему нас рекомендуют</p><h2>Слышим идею.<br>Берём праздник на себя.</h2><ul class="proof-list"><li>всегда остаёмся на связи до события;</li><li>подстраиваем программу под возраст и гостей;</li><li>привозим костюмы, реквизит и музыкальное сопровождение;</li><li>помогаем сохранить сюрприз до самого выхода героя.</li></ul></div>
        </div>
      </section>
      ${renderFinalCta()}
    `,
  });
  bindCommon();
}

function cartSummary(items) {
  const knownTotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const hasCalculated = items.some((item) => item.price == null);
  return `
    <div class="cart-summary">
      <div><span>Выбрано</span><strong>${items.length}</strong></div>
      <div><span>${hasCalculated ? "Известная часть стоимости" : "Предварительно"}</span><strong>${knownTotal ? formatPrice(knownTotal, "") : "После расчёта"}</strong></div>
    </div>
  `;
}

function renderCart() {
  const items = readCart().map(getService).filter(Boolean);
  renderShell({
    title: `Заявка — ${project.name}`,
    nav: nav("cart"),
    cartCount: items.length,
    content: `
      <section class="cart-page">
        <div class="container">
          <div class="cart-heading reveal"><div><p class="eyebrow">Ваша заявка</p><h1>Соберём всё<br>в один праздник</h1></div><p>Оставьте контакт и дату. Заявка сохранится локально; базу подключим на следующем этапе.</p></div>
          ${items.length ? `
            <div class="cart-layout">
              <div class="cart-items reveal">
                ${items.map((item) => `<article class="cart-item"><img src="${item.image}" alt=""><div><p>${escapeHtml(categoryLabel(item.category))}</p><h3>${escapeHtml(item.title)}</h3><span>${escapeHtml(item.duration)} · ${formatPrice(item.price)}</span></div><button class="remove-cart-item" data-service-id="${escapeHtml(item.id)}" type="button" aria-label="Убрать ${escapeHtml(item.title)}">×</button></article>`).join("")}
                ${cartSummary(items)}
              </div>
              <form id="request-form" class="request-form reveal" style="--delay:100ms" novalidate>
                <h2>Детали события</h2>
                <div class="form-grid">
                  <label>Как вас зовут<input name="name" autocomplete="name" maxlength="80" required placeholder="Ваше имя"></label>
                  <label>Телефон<input name="phone" type="tel" autocomplete="tel" maxlength="32" required placeholder="+7 900 000-00-00"></label>
                  <label>Дата события<input name="eventDate" type="date" required></label>
                  <label>Город или район<input name="city" autocomplete="address-level2" maxlength="120" placeholder="Например, Владивосток"></label>
                  <label>Возраст ребёнка<input name="childAge" inputmode="numeric" maxlength="30" placeholder="Если праздник детский"></label>
                  <label class="form-grid__wide">Комментарий<textarea name="comment" maxlength="1000" placeholder="Место, количество гостей, пожелания"></textarea></label>
                </div>
                <label class="consent"><input name="consent" type="checkbox" required><span>Согласен на использование этих данных для связи по заявке.</span></label>
                <p id="form-error" class="field-error" hidden></p>
                <button class="button button--primary button--wide" type="submit">Отправить заявку <span>${icons.arrow}</span></button>
                <p class="form-note">Пока данные сохраняются только в браузере этого устройства.</p>
              </form>
            </div>
          ` : `
            <div class="empty-cart reveal"><span>✦</span><h2>Корзина пока пустая</h2><p>Выберите героя или шоу — всё добавится сюда, а затем уйдёт одной заявкой.</p><div><a class="button button--primary" href="#/catalog/express">Экспресс-поздравления</a><a class="button button--glass" href="#/catalog/shows">Шоу-программы</a></div></div>
          `}
        </div>
      </section>
    `,
  });

  for (const button of qsa(".remove-cart-item")) {
    button.addEventListener("click", () => {
      removeFromCart(button.dataset.serviceId);
      renderCart();
    });
  }

  qs("#request-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      eventDate: String(data.get("eventDate") || "").trim(),
      city: String(data.get("city") || "").trim(),
      childAge: String(data.get("childAge") || "").trim(),
      comment: String(data.get("comment") || "").trim(),
      items: items.map((item) => ({ id: item.id, title: item.title, price: item.price })),
      knownTotal: items.reduce((sum, item) => sum + (item.price || 0), 0),
    };
    const error = qs("#form-error");
    const digits = payload.phone.replace(/\D/g, "");

    if (payload.name.length < 2 || digits.length < 10 || !payload.eventDate || !data.get("consent")) {
      error.textContent = "Заполните имя, телефон, дату и отметьте согласие на связь.";
      error.hidden = false;
      return;
    }

    error.hidden = true;
    const button = qs('button[type="submit"]', form);
    button.disabled = true;
    button.textContent = "Отправляем…";

    try {
      await store.create("lead", payload, "new");
      writeCart([]);
      location.hash = "#/thanks";
    } catch (cause) {
      error.textContent = cause instanceof Error ? cause.message : "Не удалось сохранить заявку";
      error.hidden = false;
      button.disabled = false;
      button.innerHTML = `Отправить заявку <span>${icons.arrow}</span>`;
    }
  });
  bindMotion();
}

function renderThanks() {
  renderShell({
    title: `Заявка сохранена — ${project.name}`,
    nav: nav("cart"),
    cartCount: 0,
    content: `<section class="thanks-page"><div class="thanks-orbit" aria-hidden="true"></div><div class="container"><div class="thanks-card reveal"><span class="thanks-icon">${icons.check}</span><p class="eyebrow">Заявка сохранена</p><h1>Праздник<br>уже ближе</h1><p>В этой версии заявка хранится только на вашем устройстве. Когда подключим базу, она будет сразу попадать менеджеру.</p><div><a class="button button--primary" href="#/">На главную</a><a class="button button--glass" href="${project.phoneHref}">Позвонить сейчас</a></div></div></div></section>`,
  });
  bindMotion();
}

async function workspaceContent() {
  const session = await store.session();
  if (store.mode === "supabase" && !session) return renderLogin();
  const records = await store.list("lead");
  return `<section class="section workspace-page"><div class="container"><div class="section-heading"><div><p class="eyebrow">Внутренний экран</p><h1>Заявки</h1></div><p>${store.mode === "local" ? "Локальные записи видны только в этом браузере." : `Вход: ${escapeHtml(session?.user?.email || "владелец")}`}</p></div><div class="record-list">${records.length ? records.map((record) => `<article class="record" data-id="${record.id}"><div><span class="status-pill">${escapeHtml(statusLabel(record.status))}</span><h3>${escapeHtml(record.payload.name || "Без имени")}</h3><p><strong>${escapeHtml(record.payload.phone || record.payload.contact || "Контакт не указан")}</strong></p><p>${escapeHtml((record.payload.items || []).map((item) => item.title).join(", ") || record.payload.problem || "")}</p><p class="record-meta">${formatDate(record.created_at)}</p></div><div><label>Статус<select class="status-select">${["new", "contacted", "done"].map((status) => `<option value="${status}" ${record.status === status ? "selected" : ""}>${statusLabel(status)}</option>`).join("")}</select></label><button class="archive button button--glass button--small">В архив</button></div></article>`).join("") : `<div class="empty-cart"><h2>Заявок пока нет</h2><a class="button button--primary" href="#/">Открыть сайт</a></div>`}</div></div></section>`;
}

async function renderWorkspace() {
  renderShell({ title: `Заявки — ${project.name}`, nav: nav("workspace"), cartCount: readCart().length, content: '<section class="section"><div class="container"><p>Загружаем заявки…</p></div></section>' });
  qs("#main").innerHTML = await workspaceContent();

  const loginForm = qs("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const error = qs("#login-error");
      try {
        await store.signIn(String(data.get("email")), String(data.get("password")));
        await renderWorkspace();
      } catch (cause) {
        error.textContent = cause instanceof Error ? cause.message : "Не удалось войти";
        error.hidden = false;
      }
    });
    return;
  }

  for (const node of qsa(".record")) {
    const id = node.dataset.id;
    qs(".status-select", node).addEventListener("change", async (event) => {
      await store.update(id, { status: event.currentTarget.value });
      setNotice("Статус сохранён");
    });
    qs(".archive", node).addEventListener("click", async () => {
      await store.archive(id);
      await renderWorkspace();
      setNotice("Заявка в архиве");
    });
  }
}

function renderNotFound() {
  renderShell({ title: `Страница не найдена — ${project.name}`, nav: nav(""), cartCount: readCart().length, content: `<section class="empty-cart"><h1>Здесь ничего нет</h1><p>Вернитесь в каталог и выберите программу.</p><a class="button button--primary" href="#/">На главную</a></section>` });
}

async function render() {
  const current = route();
  if (current === "/") return renderHome();
  if (current === "/reviews") return renderReviews();
  if (current === "/cart") return renderCart();
  if (current === "/thanks") return renderThanks();
  if (current === "/workspace") return renderWorkspace();
  if (current.startsWith("/catalog/")) return renderCatalog(current.split("/")[2]);
  if (current.startsWith("/service/")) return renderService(decodeURIComponent(current.split("/")[2] || ""));
  return renderNotFound();
}

onRouteChange(() => {
  const run = async () => {
    await render();
    window.scrollTo(0, 0);
  };
  const safeRun = () => run().catch((error) => {
    console.error(error);
    setNotice(error.message || "Не удалось открыть страницу", "error");
  });
  if (document.startViewTransition) document.startViewTransition(safeRun);
  else safeRun();
});
