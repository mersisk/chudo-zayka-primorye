import { catalogGroups, categories, currentOffer, getService, project, reviews, services, steps } from "./project.js";
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
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(ids));
  } catch {
    throw new Error("Не удалось сохранить выбор в браузере");
  }
}

function addToCart(id, button) {
  const cart = readCart();
  if (!cart.includes(id)) cart.push(id);
  writeCart(cart);
  if (button) {
    button.classList.add("is-added");
    button.setAttribute("aria-label", "Добавлено в заявку");
    const marker = button.querySelector("span");
    if (marker) marker.textContent = icons.check;
    else button.textContent = icons.check;
  }
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

function servicePrice(service, prefix = "от") {
  const price = formatPrice(service.price, prefix);
  return service.price != null && service.priceUnit ? `${price} ${service.priceUnit}` : price;
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

function mediaCallouts(items, className = "") {
  return `
    <span class="media-callouts ${className}" aria-label="Коротко о фотографии">
      ${items.filter(Boolean).map((item, index) => `
        <span class="media-callout media-callout--${index + 1}"><i aria-hidden="true">${icons.spark}</i>${escapeHtml(item)}</span>
      `).join("")}
    </span>
  `;
}

function serviceCard(service, featured = false) {
  return `
    <article class="service-card tilt-card reveal ${featured ? "service-card--featured" : ""}">
      <a class="service-card__media" href="#/service/${encodeURIComponent(service.id)}" aria-label="Подробнее: ${escapeHtml(service.title)}">
        ${mediaStage(service.image, service.title)}
        <span class="media-shine" aria-hidden="true"></span>
        ${mediaCallouts([service.duration, "реальное фото"], "media-callouts--compact")}
      </a>
      <div class="service-card__body">
        <p class="micro-label">${escapeHtml(service.badge)} · ${escapeHtml(categoryLabel(service.category))} · ${escapeHtml(service.duration)}</p>
        <h3><a href="#/service/${encodeURIComponent(service.id)}">${escapeHtml(service.title)}</a></h3>
        <p>${escapeHtml(service.short)}</p>
        <div class="service-card__footer">
          <strong>${servicePrice(service)}</strong>
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

  if (matchMedia("(hover: hover) and (pointer: fine)").matches) for (const card of qsa(".tilt-card")) {
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
    button.addEventListener("click", () => {
      try {
        addToCart(button.dataset.serviceId, button);
      } catch (error) {
        setNotice(error.message, "error");
      }
    });
  }
  for (const link of qsa("[data-partner-url]")) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const modal = qs("#partner-modal");
      const title = link.dataset.partnerTitle || "Партнёрский сайт";
      const name = link.dataset.partnerName || link.dataset.partnerUrl;
      qs("[data-partner-modal-title]", modal).textContent = title;
      qs("[data-partner-modal-text]", modal).textContent = `Для этого направления откроется сайт партнёра ${name}.`;
      const go = qs("[data-partner-modal-go]", modal);
      go.href = link.dataset.partnerUrl;
      go.textContent = `Перейти на ${name} ↗`;
      modal.showModal();
    });
  }
  const partnerModal = qs("#partner-modal");
  for (const button of qsa("[data-partner-modal-close]", partnerModal)) button.addEventListener("click", () => partnerModal.close());
  qs("[data-partner-modal-go]", partnerModal)?.addEventListener("click", () => partnerModal.close());
  partnerModal?.addEventListener("click", (event) => {
    if (event.target === partnerModal) partnerModal.close();
  });
  updateCartBadges();
  bindMotion();
}

function renderHome() {
  const expressIds = ["arthur-pirozhkov", "stas-mikhailov", "gorilla", "labubu-express"];
  const showIds = ["neon-show", "foam-party", "cryo-show", "silver-disco"];
  const express = expressIds.map(getService).filter(Boolean);
  const shows = showIds.map(getService).filter(Boolean);
  const tickerItems = ["Аниматоры", "Экспресс-поздравления", "Шоу-программы", "Выпускные", "Услуги на мероприятии"];
  const tickerGroup = tickerItems.map((item) => `<span class="ticker__item">${escapeHtml(item)} <i>${icons.spark}</i></span>`).join("");

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
              <div><strong>6</strong><span>направлений праздника</span></div>
            </div>
          </div>
          <div class="hero-visual" aria-label="Реальные праздники Чудо Зайка">
            <div class="hero-orbit hero-orbit--one" aria-hidden="true"></div>
            <div class="hero-orbit hero-orbit--two" aria-hidden="true"></div>
            <div class="hero-collage">
              <div class="hero-photo-wrap">
                ${mediaStage("./public/media/catalog/graduations/photo-500.jpg", "Игровая программа на выпускном", "", "")}
                ${mediaCallouts(["живые эмоции", "реальные праздники", "всё под ключ"])}
              </div>
              <div class="hero-photo-small hero-photo-small--one">
                ${mediaStage("./public/media/catalog/inflatables/labubu/photo-337.jpg", "Экспресс-поздравление с Лабубу", "", "")}
              </div>
              <div class="hero-photo-small hero-photo-small--two">
                ${mediaStage("./public/media/catalog/shows/neon/photo-559.jpg", "Неоновое шоу", "", "")}
              </div>
            </div>
          </div>
        </div>
        <div class="ticker" aria-hidden="true">
          <div class="ticker__track"><div class="ticker__group">${tickerGroup}</div><div class="ticker__group">${tickerGroup}</div></div>
        </div>
      </section>

      <section class="section latest-offer-section">
        <div class="container latest-offer reveal">
          <a class="latest-offer__media" href="#/service/${currentOffer.id}">${mediaStage(currentOffer.image, currentOffer.title)}${mediaCallouts(["21–24 декабря", "1 900 ₽ с человека"], "media-callouts--compact")}</a>
          <div class="latest-offer__copy">
            <p class="eyebrow">Последнее предложение · 21–24 декабря</p>
            <h2>Автобус<br>Деда Мороза</h2>
            <p>Впервые в Большом Камне — часовое новогоднее приключение: танцы, песни, интерактивы и аттракцион эмоций. Каждому ребёнку — блеск-тату и новогодний коктейль. Бронирование: ${escapeHtml(project.phone)}.</p>
            <strong>${servicePrice(currentOffer, "")} · места ограничены</strong>
            <div class="latest-offer__actions"><a class="button button--primary" href="#/service/${currentOffer.id}">Смотреть предложение <span>${icons.arrow}</span></a><a class="button button--dark" href="${project.phoneHref}">Забронировать</a></div>
          </div>
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
  const headings = {
    animators: "Выберите тип героев",
    express: "Два вида экспресс-поздравлений",
    shows: "Выберите формат шоу",
    graduations: "Для какого выпуска",
    services: "Выберите услугу",
    programs: "Выберите программу",
  };
  return `
    <div class="catalog-groups">
      <div class="section-heading reveal">
        <div><p class="eyebrow">Выберите раздел</p><h2>${escapeHtml(headings[categoryId] || "Выберите раздел")}</h2></div>
        <p>Внутри — отдельная карточка каждого героя или программы с подходящими фотографиями и видео.</p>
      </div>
      <div class="catalog-group-grid">
        ${groups.map((group, index) => {
          const count = services.filter((item) => item.category === categoryId && item.subgroup === group.id).length;
          return `
          <a class="catalog-group-card reveal" style="--delay:${index * 70}ms" href="${escapeHtml(group.partnerUrl || `#/catalog/${categoryId}/${group.id}`)}" ${group.partnerUrl ? `data-partner-url="${escapeHtml(group.partnerUrl)}" data-partner-title="${escapeHtml(group.title)}" data-partner-name="${escapeHtml(group.partnerName || group.partnerUrl)}"` : ""}>
            <div class="catalog-group-card__visual">
              ${mediaStage(group.image, group.title, "catalog-group-card__media")}
              ${mediaCallouts([`${count} ${count === 1 ? "вариант" : "вариантов"}`], "media-callouts--compact")}
            </div>
            <div class="catalog-group-card__body">
              <h3>${escapeHtml(group.title)}</h3>
              <p>${escapeHtml(group.description)}</p><span class="text-link">Открыть раздел ${icons.arrow}</span>
            </div>
          </a>
        `;}).join("")}
      </div>
    </div>
  `;
}

function renderCatalog(categoryId, subgroupId = "") {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return renderNotFound();
  const groups = catalogGroups[category.id] || [];
  if (subgroupId && !groups.some((group) => group.id === subgroupId)) return renderNotFound();
  const filtered = services.filter((item) => item.category === category.id && (!subgroupId || item.subgroup === subgroupId));
  const activeGroup = groups.find((group) => group.id === subgroupId);
  const heroTitle = activeGroup?.title || category.title;
  const heroDescription = activeGroup?.description || category.description;
  const heroImage = activeGroup?.image || category.image;
  const totalCount = services.filter((item) => item.category === category.id).length;

  renderShell({
    title: `${heroTitle} — ${project.name}`,
    nav: nav(category.id),
    cartCount: readCart().length,
    backHref: activeGroup ? `#/catalog/${category.id}` : "#/",
    backLabel: activeGroup ? `Все разделы «${category.title}»` : "На главную",
    content: `
      <section class="catalog-hero">
        <div class="container catalog-hero__grid">
          <div class="reveal">
            <p class="eyebrow">${escapeHtml(activeGroup ? `${filtered.length} вариантов` : category.eyebrow)}</p>
            <h1 class="${heroTitle.length > 18 ? "catalog-hero__title--long" : ""}">${escapeHtml(heroTitle)}</h1>
            <p class="hero-lead">${escapeHtml(heroDescription)}</p>
          </div>
          <div class="catalog-hero__art reveal" style="--delay:120ms">
            ${mediaStage(heroImage, heroTitle, "catalog-hero__media", "")}
            ${mediaCallouts([activeGroup?.title || category.eyebrow, "обложка раздела", `${activeGroup ? filtered.length : totalCount} вариантов`])}
            <span class="catalog-hero__orbit" aria-hidden="true"></span>
          </div>
        </div>
      </section>
      <section class="section catalog-section">
        <div class="container">
          <div class="catalog-switch reveal" role="navigation" aria-label="Формат праздника">
            ${categories.map((item) => `<a href="#/catalog/${item.id}" ${item.id === category.id ? 'aria-current="page"' : ""}>${escapeHtml(item.title)}</a>`).join("")}
          </div>
          ${activeGroup ? `
            <div class="section-heading catalog-services-heading reveal"><div><p class="eyebrow">Каждый вариант — отдельно</p><h2>${escapeHtml(activeGroup.title)}</h2></div><p>${filtered.length} ${filtered.length === 1 ? "вариант" : "вариантов"} с фотографиями из мероприятий.</p></div>
            <div class="service-grid service-grid--catalog">${filtered.map((service) => serviceCard(service)).join("")}</div>
          ` : renderCatalogGroups(category.id)}
        </div>
      </section>
      ${renderFinalCta()}
    `,
  });
  bindCommon();
}

function renderSlide(slide, service, index) {
  if (slide.type === "video") return `<div class="detail-carousel__slide" data-slide="${index}" ${index ? "hidden" : ""}><video controls playsinline preload="metadata" poster="${escapeHtml(service.image)}"><source src="${escapeHtml(slide.src)}">Ваш браузер не поддерживает видео.</video></div>`;
  return `<div class="detail-carousel__slide" data-slide="${index}" ${index ? "hidden" : ""}>${mediaStage(slide.src, `${service.title}, фотография ${index + 1}`, "detail-gallery__media", index ? "lazy" : "")}${service.visualization && index === 0 ? '<span class="visualization-note">Визуализация программы</span>' : ""}</div>`;
}

function bindCarousel() {
  const carousel = qs("[data-carousel]");
  if (!carousel) return;
  const slides = qsa("[data-slide]", carousel);
  const thumbs = qsa("[data-slide-to]", carousel);
  const counter = qs("[data-carousel-counter]", carousel);
  let current = 0;
  let pointerStart = null;
  const show = (next) => {
    current = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      slide.hidden = index !== current;
      if (index !== current) qs("video", slide)?.pause();
    });
    thumbs.forEach((thumb, index) => thumb.setAttribute("aria-current", index === current ? "true" : "false"));
    if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
  };
  qs("[data-carousel-prev]", carousel)?.addEventListener("click", () => show(current - 1));
  qs("[data-carousel-next]", carousel)?.addEventListener("click", () => show(current + 1));
  thumbs.forEach((thumb) => thumb.addEventListener("click", () => show(Number(thumb.dataset.slideTo))));
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });
  carousel.addEventListener("pointerdown", (event) => { pointerStart = event.clientX; });
  carousel.addEventListener("pointerup", (event) => {
    if (pointerStart == null) return;
    const distance = event.clientX - pointerStart;
    if (Math.abs(distance) > 45) show(current + (distance < 0 ? 1 : -1));
    pointerStart = null;
  });
  show(0);
}

function renderService(id) {
  const service = getService(id);
  if (!service) return renderNotFound();
  const related = services.filter((item) => item.category === service.category && item.subgroup === service.subgroup && item.id !== service.id).slice(0, 3);
  const slides = [
    ...(service.gallery || [service.image]).map((src) => ({ type: "image", src })),
    ...(service.video ? [{ type: "video", src: service.video }] : []),
  ];

  renderShell({
    title: `${service.title} — ${project.name}`,
    nav: nav(service.category),
    cartCount: readCart().length,
    backHref: `#/catalog/${service.category}/${service.subgroup}`,
    backLabel: `К разделу «${categoryLabel(service.category)}»`,
    content: `
      <section class="detail-hero">
        <div class="container detail-grid">
          <div class="detail-gallery detail-carousel reveal" data-carousel tabindex="0" aria-label="Галерея: ${escapeHtml(service.title)}">
            <div class="detail-gallery__main">${slides.map((slide, index) => renderSlide(slide, service, index)).join("")}
              ${mediaCallouts([service.duration, "фото и видео", "можно добавить в заявку"])}
              ${slides.length > 1 ? `<button class="carousel-arrow carousel-arrow--prev" type="button" data-carousel-prev aria-label="Предыдущий материал">←</button><button class="carousel-arrow carousel-arrow--next" type="button" data-carousel-next aria-label="Следующий материал">→</button><span class="carousel-counter" data-carousel-counter>1 / ${slides.length}</span>` : ""}
            </div>
            ${slides.length > 1 ? `<div class="detail-gallery__thumbs">${slides.map((slide, index) => `<button type="button" class="detail-gallery__thumb" data-slide-to="${index}" aria-label="Открыть ${slide.type === "video" ? "видео" : `фотографию ${index + 1}`}" aria-current="${index === 0}">${mediaStage(slide.type === "video" ? service.image : slide.src, "", "detail-gallery__thumb-media")} ${slide.type === "video" ? '<span class="thumb-play">▶</span>' : ""}</button>`).join("")}</div>` : ""}
          </div>
          <div class="detail-copy reveal" style="--delay:100ms">
            <span class="detail-badge">${escapeHtml(service.badge)}</span>
            <p class="eyebrow">${escapeHtml(service.duration)}</p>
            <h1>${escapeHtml(service.title)}</h1>
            <p class="detail-price">${servicePrice(service)}</p>
            <p class="hero-lead">${escapeHtml(service.description)}</p>
            <div class="include-list">
              ${service.includes.map((item) => `<span><i>${icons.check}</i>${escapeHtml(item)}</span>`).join("")}
            </div>
            <div class="detail-actions">
              <button class="button button--primary add-to-cart" type="button" data-service-id="${escapeHtml(service.id)}">Добавить в заявку <span>${icons.plus}</span></button>
              <a class="button button--glass" href="${project.phoneHref}">Позвонить</a>
              ${service.externalUrl ? `<a class="button button--glass" href="${escapeHtml(service.externalUrl)}" data-partner-url="${escapeHtml(service.externalUrl)}" data-partner-title="${escapeHtml(service.title)}" data-partner-name="${escapeHtml(new URL(service.externalUrl).hostname)}">${escapeHtml(service.externalLabel || "Открыть сайт партнёра ↗")}</a>` : ""}
            </div>
            <p class="detail-note">Точную стоимость подтвердим после проверки даты, места и состава программы.</p>
          </div>
        </div>
      </section>
      <section class="section section--ink">
        <div class="container">
          <div class="section-heading reveal"><div><p class="eyebrow">Можно добавить</p><h2>Ещё варианты</h2></div></div>
          <div class="service-grid">${related.map((item) => serviceCard(item)).join("")}</div>
        </div>
      </section>
    `,
  });
  bindCommon();
  bindCarousel();
}

function renderReviews() {
  renderShell({
    title: `Отзывы — ${project.name}`,
    nav: nav("reviews"),
    cartCount: readCart().length,
    backHref: "#/",
    backLabel: "На главную",
    content: `
      <section class="reviews-hero">
        <div class="container reviews-hero__grid">
          <div class="reveal"><p class="eyebrow">Отзывы клиентов</p><h1>После нас<br><em>остаются эмоции</em></h1><p class="hero-lead">Собрали живые впечатления из Telegram-канала агентства. Без имён и личных контактов.</p></div>
          <div class="reviews-hero__visual reveal" style="--delay:100ms">
            ${mediaStage("./public/media/hero-lol.jpg", "Эмоции детей на празднике", "reviews-hero__media", "")}
            ${mediaCallouts(["живые эмоции", "реальные праздники", "отзывы из Telegram"])}
            <div class="reviews-score"><strong>5.0</strong><span>★★★★★</span><p>по опубликованным отзывам</p></div>
          </div>
        </div>
      </section>
      <section class="section reviews-page">
        <div class="container review-grid review-grid--page">${reviews.map(reviewCard).join("")}</div>
      </section>
      <section class="section proof-section">
        <div class="container proof-grid">
          <div class="proof-visual reveal">
            ${mediaStage("./public/media/bear-family.jpg", "Семейное поздравление с большим медведем", "proof-media")}
            ${mediaCallouts(["семейный сюрприз", "фото на память"])}
          </div>
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
    backHref: "#/",
    backLabel: "На главную",
    content: `
      <section class="cart-page">
        <div class="container">
          <div class="cart-heading reveal"><div><p class="eyebrow">Ваша заявка</p><h1>Соберём всё<br>в один праздник</h1></div><p>Оставьте контакт и дату. Заявка сохранится локально; базу подключим на следующем этапе.</p></div>
          ${items.length ? `
            <div class="cart-layout">
              <div class="cart-items reveal">
                  ${items.map((item) => `<article class="cart-item"><img src="${item.image}" alt=""><div><p>${escapeHtml(categoryLabel(item.category))}</p><h3>${escapeHtml(item.title)}</h3><span>${escapeHtml(item.duration)} · ${servicePrice(item)}</span></div><button class="remove-cart-item" data-service-id="${escapeHtml(item.id)}" type="button" aria-label="Убрать ${escapeHtml(item.title)}">×</button></article>`).join("")}
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
      try {
        removeFromCart(button.dataset.serviceId);
        renderCart();
      } catch (error) {
        setNotice(error.message, "error");
      }
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
      items: items.map((item) => ({ id: item.id, title: item.title, category: item.category, duration: item.duration, image: item.image, price: item.price, priceUnit: item.priceUnit || null })),
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
    backHref: "#/",
    backLabel: "На главную",
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
  renderShell({ title: `Заявки — ${project.name}`, nav: nav("workspace"), cartCount: readCart().length, backHref: "#/", backLabel: "На главную", content: '<section class="section"><div class="container"><p>Загружаем заявки…</p></div></section>' });
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
  renderShell({ title: `Страница не найдена — ${project.name}`, nav: nav(""), cartCount: readCart().length, backHref: "#/", backLabel: "На главную", content: `<section class="empty-cart"><h1>Здесь ничего нет</h1><p>Вернитесь в каталог и выберите программу.</p><a class="button button--primary" href="#/">На главную</a></section>` });
}

async function render() {
  const current = route();
  if (current === "/") return renderHome();
  if (current === "/reviews") return renderReviews();
  if (current === "/cart") return renderCart();
  if (current === "/thanks") return renderThanks();
  if (current === "/workspace") return renderWorkspace();
  if (current.startsWith("/catalog/")) {
    const [, , categoryId, subgroupId = ""] = current.split("/");
    return renderCatalog(categoryId, subgroupId);
  }
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
