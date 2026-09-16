import { createDatabase, migrate } from "./db.mjs";
import { readConfig } from "./config.mjs";

const config = readConfig({ requireTelegram: false });
const database = createDatabase(config.databaseUrl);
try {
  await migrate(database);
  console.log("Миграция applications выполнена");
} finally {
  await database.end();
}
