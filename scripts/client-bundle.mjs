import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const modules = [
  {
    name: "project",
    file: "project.js",
    exports: ["project", "categories", "catalogGroups", "services", "currentOffer", "reviews", "steps", "getService"],
  },
  {
    name: "seo",
    file: "seo.js",
    exports: ["siteUrl", "absoluteUrl", "imageUrl", "seoForPath", "indexablePaths", "renderablePaths", "organizationSchema", "pageSchema", "staticSeoMarkup"],
  },
  {
    name: "ui",
    file: "ui.js",
    exports: ["qs", "qsa", "escapeHtml", "formatDate", "setNotice", "applySeo", "renderShell", "getRoute", "route", "routeHref", "onRouteChange", "statusLabel", "renderLogin"],
  },
  {
    name: "store",
    file: "data/store.js",
    exports: ["store"],
  },
  {
    name: "validation",
    file: "validation.js",
    exports: ["normalizeRussianPhone", "formatRussianPhone", "validateLead"],
  },
];

function withoutImports(source) {
  const lines = source.split("\n");
  const kept = [];
  let insideImport = false;

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!insideImport && trimmed.startsWith("import ")) {
      insideImport = !trimmed.includes(";");
      continue;
    }
    if (insideImport) {
      if (trimmed.includes(";")) insideImport = false;
      continue;
    }
    kept.push(line);
  }

  if (insideImport) throw new Error("Незавершённый import в клиентском модуле.");
  return kept.join("\n");
}

function moduleBody(source) {
  return withoutImports(source).replace(/^(\s*)export\s+/gm, "$1").trim();
}

export async function buildClientBundle({ root, dist, version }) {
  const sourceRoot = resolve(root, "src");
  const assets = resolve(dist, "assets");
  const jsName = `app.${version}.js`;
  const cssName = `styles.${version}.css`;
  const output = ["/* Чудо Зайка: production client bundle */"];

  for (const spec of modules) {
    const source = await readFile(resolve(sourceRoot, spec.file), "utf8");
    output.push(
      `const __${spec.name} = (() => {`,
      moduleBody(source),
      `return { ${spec.exports.join(", ")} };`,
      "})();",
      `const { ${spec.exports.join(", ")} } = __${spec.name};`,
    );
  }

  const app = await readFile(resolve(sourceRoot, "app.js"), "utf8");
  output.push("(() => {", moduleBody(app), "})();", "");

  await mkdir(assets, { recursive: true });
  await writeFile(resolve(assets, jsName), output.join("\n"));
  await writeFile(resolve(assets, cssName), await readFile(resolve(sourceRoot, "styles.css"), "utf8"));

  return {
    scriptHref: `/assets/${jsName}`,
    styleHref: `/assets/${cssName}`,
  };
}
