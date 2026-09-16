import { catalogGroups, categories, getService, project, services } from "./project.js";

const trimSlash = (value = "") => value.replace(/\/+$/, "");
const pathOnly = (value = "/") => {
  const normalized = `/${String(value).replace(/^\/+|\/+$/g, "")}`.replace(/\/{2,}/g, "/");
  return normalized === "/" ? "/" : normalized;
};

export const siteUrl = trimSlash(project.siteUrl);
export const absoluteUrl = (path = "/") => {
  const normalized = pathOnly(path);
  return normalized === "/" ? `${siteUrl}/` : `${siteUrl}${normalized}`;
};
export const imageUrl = (image = project.logo) => `${siteUrl}/${String(image).replace(/^\.\//, "")}`;

const homepage = {
  path: "/",
  title: "Чудо Зайка — аниматорское агентство во Владивостоке",
  description: "«Чудо Зайка» — аниматорское агентство во Владивостоке: детские аниматоры, шоу-программы, экспресс-поздравления, выпускные и праздники для детей.",
  image: "./public/media/catalog/animator-cards/photo-509.jpg",
  h1: "Чудо Зайка — аниматорское агентство во Владивостоке",
};

export function seoForPath(inputPath = "/") {
  const path = pathOnly(inputPath);
  if (path === "/") return homepage;
  if (path === "/reviews") return {
    path, title: "Отзывы об аниматорах — Чудо Зайка Владивосток", h1: "Отзывы о праздниках «Чудо Зайка»",
    description: "Отзывы родителей и гостей о детских праздниках, аниматорах и экспресс-поздравлениях агентства «Чудо Зайка» во Владивостоке.", image: "./public/media/hero-lol.jpg",
  };
  if (path === "/cart") return { path, title: "Заявка — Чудо Зайка", h1: "Оставить заявку", description: "Оставьте заявку на праздник в аниматорском агентстве «Чудо Зайка».", image: homepage.image, noindex: true };
  if (path === "/thanks") return { path, title: "Заявка сохранена — Чудо Зайка", h1: "Заявка сохранена", description: "Заявка на праздник сохранена.", image: homepage.image, noindex: true };
  if (path === "/agreement") return { path, title: "Пользовательское соглашение — Чудо Зайка", h1: "Пользовательское соглашение", description: "Пользовательское соглашение сайта аниматорского агентства «Чудо Зайка».", image: homepage.image, noindex: true };
  if (path === "/privacy") return { path, title: "Политика конфиденциальности — Чудо Зайка", h1: "Политика конфиденциальности", description: "Политика обработки персональных данных сайта «Чудо Зайка».", image: homepage.image, noindex: true };
  if (path.startsWith("/service/")) {
    const service = getService(decodeURIComponent(path.split("/")[2] || ""));
    if (service) return {
      path, title: `${service.title} во Владивостоке — Чудо Зайка`, h1: service.title,
      description: `${service.short} Заказать программу агентства «Чудо Зайка» во Владивостоке и Приморском крае.`, image: service.image,
    };
  }
  if (path.startsWith("/catalog/")) {
    const [, , categoryId, subgroupId] = path.split("/");
    const category = categories.find((item) => item.id === categoryId);
    const group = subgroupId ? (catalogGroups[categoryId] || []).find((item) => item.id === subgroupId) : null;
    if (category) {
      const title = group?.title || category.title;
      const description = group?.description || category.description;
      return {
        path, title: `${title} во Владивостоке — Чудо Зайка`, h1: title,
        description: `${description} Аниматорское агентство «Чудо Зайка» работает во Владивостоке и Приморском крае.`, image: group?.image || category.image,
      };
    }
  }
  return { path, title: `Страница не найдена — ${project.name}`, h1: "Страница не найдена", description: homepage.description, image: homepage.image, noindex: true };
}

export function indexablePaths() {
  return [
    "/",
    "/reviews",
    ...categories.flatMap((category) => [
      `/catalog/${category.id}`,
      ...(catalogGroups[category.id] || []).filter((group) => !group.partnerUrl).map((group) => `/catalog/${category.id}/${group.id}`),
    ]),
    ...services.map((service) => `/service/${service.id}`),
  ];
}

export function renderablePaths() {
  return [...indexablePaths(), "/cart", "/thanks", "/agreement", "/privacy"];
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "EntertainmentBusiness"],
    name: project.name,
    description: "Аниматорское агентство: детские аниматоры, шоу-программы и праздники во Владивостоке.",
    url: siteUrl,
    logo: imageUrl(project.logo),
    image: imageUrl(homepage.image),
    telephone: project.phone,
    sameAs: [project.telegram],
    address: { "@type": "PostalAddress", addressLocality: "Владивосток", addressRegion: "Приморский край", addressCountry: "RU" },
    areaServed: [{ "@type": "City", name: "Владивосток" }, { "@type": "AdministrativeArea", name: "Приморский край" }],
  };
}

export function pageSchema(meta) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta.title,
    description: meta.description,
    url: absoluteUrl(meta.path),
    isPartOf: { "@type": "WebSite", name: project.name, url: siteUrl },
    primaryImageOfPage: imageUrl(meta.image),
  };
}

export function staticSeoMarkup(meta) {
  return `<main id="main"><article><h1>${meta.h1}</h1><p>${meta.description}</p><p>«Чудо Зайка» — аниматорское агентство во Владивостоке. Выберите программу и оставьте заявку на сайте.</p></article></main>`;
}
