import { createServer } from "node:http";
import { createDatabase, insertApplication, setTelegramResult } from "./db.mjs";
import { readConfig } from "./config.mjs";
import { prepareApplication, telegramText } from "./application.mjs";
import { sendTelegramMessage } from "./telegram.mjs";

const config = readConfig();
const database = createDatabase(config.databaseUrl);
const requests = new Map();

function clientIp(request) {
  const forwarded = request.headers["x-forwarded-for"];
  return String(forwarded || request.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function allowRequest(request) {
  const now = Date.now();
  const ip = clientIp(request);
  const state = requests.get(ip);
  if (!state || now - state.startedAt >= config.rateLimitWindowMs) {
    requests.set(ip, { startedAt: now, count: 1 });
    return true;
  }
  state.count += 1;
  return state.count <= config.rateLimitMax;
}

function json(response, statusCode, data, origin = "") {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...(origin === config.corsOrigin ? { "access-control-allow-origin": config.corsOrigin, vary: "Origin" } : {}),
  });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > config.jsonLimitBytes) {
    const error = new Error("Слишком большой запрос");
    error.statusCode = 413;
    throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > config.jsonLimitBytes) {
      const error = new Error("Слишком большой запрос");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Некорректный JSON");
    error.statusCode = 400;
    throw error;
  }
}

const server = createServer(async (request, response) => {
  const origin = String(request.headers.origin || "").replace(/\/$/, "");
  if (origin && origin !== config.corsOrigin) return json(response, 403, { error: "Недопустимый origin" });
  if (request.method === "OPTIONS" && request.url === "/api/applications") {
    response.writeHead(204, {
      "access-control-allow-origin": config.corsOrigin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "Origin",
    });
    return response.end();
  }
  if (request.method === "GET" && request.url === "/api/health") return json(response, 200, { ok: true }, origin);
  if (request.method !== "POST" || request.url !== "/api/applications") return json(response, 404, { error: "Не найдено" }, origin);
  if (!allowRequest(request)) return json(response, 429, { error: "Слишком много запросов. Попробуйте немного позже." }, origin);
  if (!String(request.headers["content-type"] || "").toLowerCase().startsWith("application/json")) return json(response, 415, { error: "Ожидается JSON" }, origin);

  try {
    const application = prepareApplication(await readJson(request));
    const saved = await insertApplication(database, application);
    sendTelegramMessage(config.telegram, telegramText(application))
      .then(() => setTelegramResult(database, saved.id, { delivered: true }))
      .catch((error) => {
        console.error("Telegram delivery failed", { applicationId: saved.id, error: error.message });
        return setTelegramResult(database, saved.id, { delivered: false, error: error.message });
      })
      .catch((error) => console.error("Telegram status update failed", { applicationId: saved.id, error: error.message }));
    return json(response, 201, { id: saved.id, status: "saved" }, origin);
  } catch (error) {
    if (error.statusCode) return json(response, error.statusCode, { error: error.message }, origin);
    console.error("Application request failed", error);
    return json(response, 500, { error: "Не удалось сохранить заявку. Попробуйте ещё раз или позвоните нам." }, origin);
  }
});

server.listen(config.port, config.host, () => console.log(`Chudo Zayka API listens on ${config.host}:${config.port}`));

async function shutdown() {
  server.close();
  await database.end();
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
