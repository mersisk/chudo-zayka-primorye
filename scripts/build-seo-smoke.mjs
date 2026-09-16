import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { absoluteUrl, indexablePaths, seoForPath } from "../src/seo.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const sitemap = await readFile(resolve(dist, "sitemap.xml"), "utf8");
const robots = await readFile(resolve(dist, "robots.txt"), "utf8");
const rootHtml = await readFile(resolve(dist, "index.html"), "utf8");

assert.doesNotMatch(rootHtml, /(?:href|src)="(?:\.\/)?src\//);
assert.doesNotMatch(rootHtml, /(?:href|src)="\/src\//);
const styleAsset = rootHtml.match(/href="(\/assets\/styles\.[^"]+\.css)"/)?.[1];
const scriptAsset = rootHtml.match(/src="(\/assets\/app\.[^"]+\.js)"/)?.[1];
assert.ok(styleAsset, "Production CSS должен подключаться из /assets.");
assert.ok(scriptAsset, "Production JS должен подключаться из /assets.");
await access(resolve(dist, styleAsset.slice(1)));
const clientBundlePath = resolve(dist, scriptAsset.slice(1));
const clientBundle = await readFile(clientBundlePath, "utf8");
assert.doesNotMatch(clientBundle, /^\s*import\s/m);
execFileSync(process.execPath, ["--check", clientBundlePath], { stdio: "pipe" });
await assert.rejects(access(resolve(dist, "src")));

assert.match(robots, /Allow: \//);
assert.match(robots, new RegExp(`Sitemap: ${absoluteUrl("/sitemap.xml").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
for (const path of indexablePaths()) {
  assert.match(sitemap, new RegExp(absoluteUrl(path).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  if (path === "/") continue;
  const html = await readFile(resolve(dist, path.slice(1), "index.html"), "utf8");
  const meta = seoForPath(path);
  assert.doesNotMatch(html, /(?:href|src)="(?:\.\/|\/)?src\//);
  assert.match(html, new RegExp(`<title>${meta.title}</title>`));
  assert.match(html, new RegExp(`rel="canonical" href="${absoluteUrl(path)}"`));
  assert.match(html, /application\/ld\+json/);
  assert.match(html, new RegExp(`<h1>${meta.h1}</h1>`));
}

console.log("Проверка SEO-сборки пройдена");
