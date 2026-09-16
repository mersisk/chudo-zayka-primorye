import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const app = await readFile(resolve(root, "src/app.js"), "utf8");

assert.match(app, /fetch\("\/api\/applications"/);
assert.match(app, /credentials:\s*"same-origin"/);
assert.match(app, /consent:\s*true/);
assert.match(app, /items:\s*items\.map\(\(item\) => \(\{ id: item\.id \}\)\)/);
assert.doesNotMatch(app, /store\.create\(\s*["']lead["']/);
assert.match(app, /Не удалось отправить заявку\. Попробуйте ещё раз или свяжитесь с нами по телефону\./);
assert.match(app, /form\.reset\(\)/);
console.log("Проверка production-отправки заявки пройдена");
