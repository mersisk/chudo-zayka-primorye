const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Не задана обязательная переменная окружения ${name}`);
  return value;
};

const integer = (name, fallback, min, max) => {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Некорректное значение ${name}`);
  return value;
};

export function readConfig({ requireTelegram = true } = {}) {
  const config = {
    host: process.env.HOST || "127.0.0.1",
    port: integer("PORT", 3000, 1, 65535),
    databaseUrl: required("DATABASE_URL"),
    corsOrigin: required("CORS_ORIGIN").replace(/\/$/, ""),
    rateLimitWindowMs: integer("API_RATE_LIMIT_WINDOW_MS", 60_000, 1_000, 3_600_000),
    rateLimitMax: integer("API_RATE_LIMIT_MAX", 10, 1, 100),
    jsonLimitBytes: integer("API_JSON_LIMIT_BYTES", 24_576, 1_024, 262_144),
    telegram: requireTelegram ? {
      botToken: required("BOT_TOKEN"),
      chatId: required("TELEGRAM_CHAT_ID"),
      proxyHost: required("PROXY_HOST"),
      proxyPort: integer("PROXY_PORT", 1080, 1, 65535),
      proxyUser: required("PROXY_USER"),
      proxyPass: required("PROXY_PASS"),
    } : null,
  };
  if (config.host !== "127.0.0.1" && config.host !== "::1") throw new Error("API должен слушать только localhost");
  return config;
}
