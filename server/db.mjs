import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

export function createDatabase(databaseUrl) {
  return new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export async function migrate(database) {
  const sql = await readFile(resolve(root, "server/migrations/001_applications.sql"), "utf8");
  await database.query(sql);
}

export async function insertApplication(database, application) {
  const result = await database.query(
    `INSERT INTO applications (
      id, status, name, phone, event_date, city, child_age, comment, items, known_total, telegram_status
    ) VALUES ($1, 'new', $2, $3, $4, $5, $6, $7, $8::jsonb, $9, 'pending')
    RETURNING id, created_at`,
    [
      application.id,
      application.name,
      application.phone,
      application.eventDate,
      application.city || null,
      application.childAge || null,
      application.comment || null,
      JSON.stringify(application.items),
      application.knownTotal,
    ],
  );
  return result.rows[0];
}

export async function setTelegramResult(database, id, { delivered, error = null }) {
  await database.query(
    `UPDATE applications
     SET telegram_status = $2, telegram_error = $3, telegram_sent_at = CASE WHEN $2 = 'sent' THEN now() ELSE NULL END
     WHERE id = $1`,
    [id, delivered ? "sent" : "failed", error ? String(error).slice(0, 500) : null],
  );
}

export async function pendingTelegramApplications(database, limit = 20) {
  const result = await database.query(
    `SELECT id, name, phone, event_date, city, child_age, comment, items, known_total
     FROM applications
     WHERE telegram_status IN ('pending', 'failed')
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    eventDate: typeof row.event_date === "string" ? row.event_date : row.event_date.toISOString().slice(0, 10),
    city: row.city || "",
    childAge: row.child_age || "",
    comment: row.comment || "",
    items: row.items,
    knownTotal: row.known_total,
  }));
}
