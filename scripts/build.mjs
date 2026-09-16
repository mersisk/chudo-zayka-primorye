import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { absoluteUrl, imageUrl, indexablePaths, organizationSchema, pageSchema, renderablePaths, seoForPath, siteUrl, staticSeoMarkup } from "../src/seo.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of ["index.html", "src", "runtime-config.js", "robots.txt"]) {
  await cp(resolve(root, entry), resolve(dist, entry), { recursive: true });
}

const assetVersion = process.env.GITHUB_SHA?.slice(0, 12) || String(Date.now());
const builtIndex = resolve(dist, "index.html");
const indexHtml = await readFile(builtIndex, "utf8");
await writeFile(builtIndex, indexHtml.replaceAll("__ASSET_VERSION__", assetVersion));

const basePath = `${new URL(siteUrl).pathname.replace(/\/$/, "")}/`;
const pageHtml = (meta) => {
  const canonical = absoluteUrl(meta.path);
  const schema = JSON.stringify([organizationSchema(), pageSchema(meta)]);
  return (indexHtml
    .replaceAll("__ASSET_VERSION__", assetVersion)
    .replace('<meta name="description" content="«Чудо Зайка» — аниматорское агентство во Владивостоке: детские аниматоры, шоу-программы, экспресс-поздравления, выпускные и праздники для детей." data-seo="description">', `<meta name="description" content="${meta.description}" data-seo="description">`)
    .replace('<meta name="robots" content="index,follow" data-seo="robots">', `<meta name="robots" content="index,follow" data-seo="robots">`)
    .replace('<link rel="canonical" href="https://mersisk.github.io/chudo-zayka-primorye/" data-seo="canonical">', `<link rel="canonical" href="${canonical}" data-seo="canonical">`)
    .replace('<meta property="og:title" content="Чудо Зайка — аниматорское агентство во Владивостоке" data-seo="og:title">', `<meta property="og:title" content="${meta.title}" data-seo="og:title">`)
    .replace('<meta property="og:description" content="Детские аниматоры, шоу-программы и праздники во Владивостоке." data-seo="og:description">', `<meta property="og:description" content="${meta.description}" data-seo="og:description">`)
    .replace('<meta property="og:image" content="https://mersisk.github.io/chudo-zayka-primorye/public/media/catalog/animator-cards/photo-509.jpg" data-seo="og:image">', `<meta property="og:image" content="${imageUrl(meta.image)}" data-seo="og:image">`)
    .replace('<meta property="og:url" content="https://mersisk.github.io/chudo-zayka-primorye/" data-seo="og:url">', `<meta property="og:url" content="${canonical}" data-seo="og:url">`)
    .replace('<title>Чудо Зайка — аниматорское агентство во Владивостоке</title>', `<title>${meta.title}</title>`)
    .replace('<head>', `<head><base href="${basePath}">`)
    .replace(/<div id="app">[\s\S]*?<\/div>\s*<script src="\.\/runtime-config\.js">/, `<div id="app">${staticSeoMarkup(meta)}</div>\n    <script src="./runtime-config.js">`)
    .replace(/<script id="seo-schema" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="seo-schema" type="application/ld+json">${schema}</script>`));
};

for (const path of renderablePaths()) {
  if (path === "/") continue;
  const target = resolve(dist, path.replace(/^\//, ""), "index.html");
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(target, pageHtml(seoForPath(path)));
}

const sitemapUrls = indexablePaths().map((path) => `  <url><loc>${absoluteUrl(path)}</loc></url>`).join("\n");
await writeFile(resolve(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`);

try {
  await access(resolve(root, "public"));
  await cp(resolve(root, "public"), resolve(dist, "public"), { recursive: true });
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

execFileSync(process.execPath, [resolve(root, "scripts/build-seo-smoke.mjs")], { stdio: "inherit" });

console.log("Готово: папка dist собрана. Её можно публиковать на статическом хостинге.");
