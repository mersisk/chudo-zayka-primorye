import { readConfig } from "./config.mjs";
import { createDatabase, pendingTelegramApplications, setTelegramResult } from "./db.mjs";
import { telegramText } from "./application.mjs";
import { sendTelegramMessage } from "./telegram.mjs";

const config = readConfig();
const database = createDatabase(config.databaseUrl);
let delivered = 0;
let failed = 0;

try {
  for (const application of await pendingTelegramApplications(database)) {
    try {
      await sendTelegramMessage(config.telegram, telegramText(application));
      await setTelegramResult(database, application.id, { delivered: true });
      delivered += 1;
    } catch (error) {
      await setTelegramResult(database, application.id, { delivered: false, error: error.message });
      failed += 1;
    }
  }
  console.log(`Telegram retry: sent ${delivered}, failed ${failed}`);
} finally {
  await database.end();
}
