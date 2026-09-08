import fs from "node:fs";
import path from "node:path";

const exportDir = process.argv[2];
const mode = process.argv[3] ?? "summary";
const query = process.argv.slice(4).join(" ");

if (!exportDir) {
  console.error("Usage: node scripts/catalog-export.mjs /path/to/telegram-export");
  process.exit(1);
}

const sourcePath = path.join(exportDir, "messages.html");
const source = fs.readFileSync(sourcePath, "utf8");

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function htmlToText(value = "") {
  return decodeEntities(
    value
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p>|<\/blockquote>|<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

const messageChunks = source.split('<div class="message ').slice(1);
const messages = messageChunks.flatMap((chunk) => {
  const id = chunk.match(/id="message(\d+)"/)?.[1];
  if (!id) return [];

  const date = chunk.match(/class="pull_right date details" title="([^"]+)"/)?.[1] ?? "";
  const textHtml = chunk.match(/<div class="text">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const text = htmlToText(textHtml);
  const media = [...chunk.matchAll(/href="((?:photos|video_files|round_video_messages|files)\/[^"#?]+)"/g)]
    .map((match) => match[1])
    .filter((value, index, values) => values.indexOf(value) === index);

  return [{ id: Number(id), date, text, media }];
});

const categories = {
  express: [/экспресс/i, /ростов/i, /гигант/i, /поздравлен/i, /ар[тф]ур\s+пирожков/i, /галустян/i, /киркоров/i, /стас\s+михайлов/i],
  parties: [/аниматор/i, /программ/i, /праздник/i, /день рожд/i, /квест/i, /шоу/i, /выпускн/i],
  reviews: [/отзыв/i, /спасибо/i, /благодар/i, /рекоменд/i, /профессионал/i, /в восторг/i],
  prices: [/\b\d[\d\s.]{2,}\s*(?:₽|р\.?|руб)/i, /цена/i, /стоимост/i],
};

const summary = Object.fromEntries(
  Object.entries(categories).map(([name, patterns]) => [
    name,
    messages
      .filter((message) => matchesAny(message.text, patterns))
      .map((message) => ({
        ...message,
        absoluteMedia: message.media.map((item) => path.join(exportDir, item)),
      })),
  ])
);

const compact = {
  exportDir,
  totals: {
    messages: messages.length,
    withText: messages.filter((message) => message.text).length,
    withMedia: messages.filter((message) => message.media.length).length,
  },
  categories: Object.fromEntries(Object.entries(summary).map(([name, items]) => [name, items.length])),
  messages,
  summary,
};

if (mode === "all") {
  process.stdout.write(`${JSON.stringify(compact, null, 2)}\n`);
} else if (mode === "query" || mode === "query-compact") {
  const pattern = new RegExp(query, "i");
  const matches = messages
    .filter((message) => pattern.test(message.text))
    .map((message) => ({
      ...message,
      ...(mode === "query-compact" ? { text: message.text.slice(0, 900) } : {}),
      absoluteMedia: message.media.map((item) => path.join(exportDir, item)),
    }));
  process.stdout.write(`${JSON.stringify(matches, null, 2)}\n`);
} else {
  const highlights = Object.fromEntries(
    Object.entries(summary).map(([name, items]) => [
      name,
      items
        .filter((item) => item.media.length)
        .slice(-30)
        .map((item) => ({
          id: item.id,
          date: item.date,
          text: item.text.slice(0, 500),
          media: item.absoluteMedia,
        })),
    ])
  );
  process.stdout.write(`${JSON.stringify({ totals: compact.totals, categories: compact.categories, highlights }, null, 2)}\n`);
}
