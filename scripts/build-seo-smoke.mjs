import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { absoluteUrl, indexablePaths, seoForPath } from "../src/seo.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const sitemap = await readFile(resolve(dist, "sitemap.xml"), "utf8");
const robots = await readFile(resolve(dist, "robots.txt"), "utf8");

assert.match(robots, /Allow: \//);
assert.match(robots, /Sitemap: https:\/\/mersisk\.github\.io\/chudo-zayka-primorye\/sitemap\.xml/);
for (const path of indexablePaths()) {
  assert.match(sitemap, new RegExp(absoluteUrl(path).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  if (path === "/") continue;
  const html = await readFile(resolve(dist, path.slice(1), "index.html"), "utf8");
  const meta = seoForPath(path);
  assert.match(html, new RegExp(`<title>${meta.title}</title>`));
  assert.match(html, new RegExp(`rel="canonical" href="${absoluteUrl(path)}"`));
  assert.match(html, /application\/ld\+json/);
  assert.match(html, new RegExp(`<h1>${meta.h1}</h1>`));
}

console.log("Проверка SEO-сборки пройдена");
