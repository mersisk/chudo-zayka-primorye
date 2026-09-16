import assert from "node:assert/strict";
import { absoluteUrl, imageUrl, indexablePaths, organizationSchema, seoForPath } from "../src/seo.js";

const expectedSiteUrl = "https://chydozaika.ru";

const paths = indexablePaths();
assert.ok(paths.length > 20, "Карта сайта должна включать публичные страницы.");
assert.equal(new Set(paths).size, paths.length, "В карте сайта не должно быть дублей.");
assert.ok(paths.every((path) => !path.includes("#")), "Индексируемые URL не должны использовать hash.");
assert.equal(absoluteUrl("/service/arthur-pirozhkov"), `${expectedSiteUrl}/service/arthur-pirozhkov`);
assert.equal(imageUrl("./public/media/logo.jpg"), `${expectedSiteUrl}/public/media/logo.jpg`);
const home = seoForPath("/");
assert.match(home.title, /аниматоры во Владивостоке и Приморском крае/i);
assert.match(home.description, /Чудо Зайка/);
for (const path of paths) {
  const meta = seoForPath(path);
  assert.ok(meta.title.length > 10, `Нет title: ${path}`);
  assert.ok(meta.description.length > 50, `Нет description: ${path}`);
  assert.ok(meta.h1, `Нет H1: ${path}`);
  assert.ok(meta.image, `Нет OG-изображения: ${path}`);
}
const business = organizationSchema();
assert.equal(business.name, "Чудо Зайка");
assert.equal(business.address.addressLocality, "Владивосток");
assert.equal(business.telephone, "+7 (994) 994-04-33");
assert.deepEqual(business.areaServed.map((area) => area.name), ["Владивосток", "Большой Камень", "Находка", "Артём", "Уссурийск", "Фокино", "Приморский край"]);
console.log("SEO-проверка пройдена");
