import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { absoluteUrl, imageUrl, indexablePaths, organizationSchema, pageSchema, renderablePaths, seoForPath, siteUrl, staticSeoMarkup } from "../src/seo.js";
import { buildClientBundle } from "./client-bundle.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of ["index.html", "runtime-config.js", "robots.txt"]) {
  await cp(resolve(root, entry), resolve(dist, entry), { recursive: true });
}

const assetVersion = process.env.GITHUB_SHA?.slice(0, 12) || String(Date.now());
const clientAssets = await buildClientBundle({ root, dist, version: assetVersion });
const builtIndex = resolve(dist, "index.html");
const indexTemplate = await readFile(builtIndex, "utf8");
const indexHtml = indexTemplate
  .replace("./src/styles.css?v=__ASSET_VERSION__", clientAssets.styleHref)
  .replace("./src/app.js?v=__ASSET_VERSION__", clientAssets.scriptHref)
  .replaceAll("__ASSET_VERSION__", assetVersion);

const basePath = `${new URL(siteUrl).pathname.replace(/\/$/, "")}/`;
const criticalImages = (meta) => meta.path === "/"
  ? [
    "./public/media/catalog/graduations/photo-500.jpg",
    "./public/media/catalog/inflatables/labubu/photo-337.jpg",
    "./public/media/catalog/shows/neon/photo-559.jpg",
  ]
  : [meta.image];

const pageHtml = (meta) => {
  const canonical = absoluteUrl(meta.path);
  const schema = JSON.stringify([organizationSchema(), pageSchema(meta)]);
  return (indexHtml
    .replaceAll("__ASSET_VERSION__", assetVersion)
    .replace('<meta name="robots" content="index,follow" data-seo="robots">', `<meta name="robots" content="index,follow" data-seo="robots">`)
    .replace(/<meta name="description"[^>]*data-seo="description">/, `<meta name="description" content="${meta.description}" data-seo="description">`)
    .replace(/<link rel="canonical"[^>]*data-seo="canonical">/, `<link rel="canonical" href="${canonical}" data-seo="canonical">`)
    .replace(/<meta property="og:title"[^>]*data-seo="og:title">/, `<meta property="og:title" content="${meta.title}" data-seo="og:title">`)
    .replace(/<meta property="og:description"[^>]*data-seo="og:description">/, `<meta property="og:description" content="${meta.description}" data-seo="og:description">`)
    .replace(/<meta property="og:image"[^>]*data-seo="og:image">/, `<meta property="og:image" content="${imageUrl(meta.image)}" data-seo="og:image">`)
    .replace(/<meta property="og:url"[^>]*data-seo="og:url">/, `<meta property="og:url" content="${canonical}" data-seo="og:url">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace("</head>", `${criticalImages(meta).map((image, index) => `<link rel="preload" as="image" href="${imageUrl(image)}"${index === 0 ? ' fetchpriority="high"' : ""}>`).join("")}</head>`)
    .replace('<head>', `<head><base href="${basePath}">`)
    .replace(/<div id="app">[\s\S]*?<\/div>\s*<script src="\.\/runtime-config\.js">/, `<div id="app">${staticSeoMarkup(meta)}</div>\n    <script src="./runtime-config.js">`)
    .replace(/<script id="seo-schema" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="seo-schema" type="application/ld+json">${schema}</script>`));
};

await writeFile(builtIndex, pageHtml(seoForPath("/")));

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
