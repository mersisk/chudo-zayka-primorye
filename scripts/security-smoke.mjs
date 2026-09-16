import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { escapeHtml } from "../src/ui.js";

const [index, runtime, app, ui] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../runtime-config.js", import.meta.url), "utf8"),
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../src/ui.js", import.meta.url), "utf8"),
]);

assert.match(index, /Content-Security-Policy/);
assert.match(index, /object-src 'none'/);
assert.match(index, /form-action 'self'/);
assert.doesNotMatch(index, /<script(?![^>]*(?:\bsrc=|type="application\/ld\+json"))/i);
assert.match(index, /"@type":\["LocalBusiness","EntertainmentBusiness"\]/);
assert.doesNotMatch(runtime, /(service[_-]?role|sb_secret_|sk-)[\w.-]{12,}/i);
assert.match(app, /validateLead\(/);
assert.match(app, /formatRussianPhone/);
assert.ok(ui.includes("replace(/[&<>\"']/g"));
assert.doesNotMatch(app, /\beval\s*\(|\bFunction\s*\(/);
assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), "&lt;img src=x onerror=alert(1)&gt;");

console.log("Базовая проверка безопасности пройдена");
