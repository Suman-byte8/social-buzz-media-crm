// One-time (but safely re-runnable) perf migration: adds indexes on the
// foreign-key and status/type columns every list endpoint filters by.
// Postgres does NOT auto-index a plain integer FK-shaped column — only
// `unique: true` columns and primary keys get one automatically. Without
// these, every "tasks for this client" / "documents of this type" style
// query is a sequential scan.
//
// Purely additive — `CREATE INDEX IF NOT EXISTS` never touches existing
// columns or data, so this is safe to run against a live database (local
// or production) at any time, independent of the non-destructive
// `sequelize.sync()` that runs on server boot.
import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const DATABASE_URL_HOST = (process.env.DATABASE_URL || "").split("/")[2] || "";
const needsSslByDefault =
  process.env.DB_SSL === "true" ||
  /neon\.tech|supabase\.co|aws\.|azure|cleardb|elephantsql|aivencloud/i.test(DATABASE_URL_HOST);
const sslOptions = needsSslByDefault ? { ssl: { require: true, rejectUnauthorized: false } } : undefined;

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { dialect: "postgres", logging: false, dialectOptions: sslOptions })
  : new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "postgres",
      logging: false,
      dialectOptions: sslOptions,
    });

const INDEXES = [
  { name: "tasks_client_id", table: "tasks", column: "clientId" },
  { name: "tasks_status", table: "tasks", column: "status" },
  { name: "tasks_priority", table: "tasks", column: "priority" },
  { name: "documents_client_id", table: "documents", column: "clientId" },
  { name: "documents_document_type", table: "documents", column: "documentType" },
  { name: "documents_status", table: "documents", column: "status" },
  { name: "meeting_notes_client_id", table: "meeting_notes", column: "clientId" },
  { name: "content_calendar_entries_client_id", table: "content_calendar_entries", column: "clientId" },
  { name: "content_calendar_entries_status", table: "content_calendar_entries", column: "status" },
  { name: "misc_tasks_client_id", table: "misc_tasks", column: "clientId" },
  { name: "misc_tasks_assigned_to", table: "misc_tasks", column: "assignedTo" },
  { name: "misc_tasks_status", table: "misc_tasks", column: "status" },
  { name: "team_members_email", table: "team_members", column: "email" },
];

// `ILIKE '%term%'` (leading wildcard) can never use a plain btree index —
// these columns back free-text search boxes (client search, meeting notes
// search), so they get a trigram GIN index instead, which pg_trgm can use
// for substring matches. Requires the pg_trgm extension; most managed
// Postgres hosts (Neon, Supabase, Render, RDS) allow creating it without
// superuser. If the host forbids it, we log a warning and move on — the
// app still works, just without the search speedup.
const TRIGRAM_INDEXES = [
  { name: "clients_name_trgm", table: "clients", column: "name" },
  { name: "clients_email_trgm", table: "clients", column: "email" },
  { name: "clients_industry_trgm", table: "clients", column: "industry" },
  { name: "meeting_notes_title_trgm", table: "meeting_notes", column: "title" },
];

async function main() {
  await sequelize.authenticate();
  console.log("[add-indexes] Connected. Creating missing indexes...");

  for (const { name, table, column } of INDEXES) {
    const indexName = `idx_${name}`;
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" ("${column}");`
    );
    console.log(`[add-indexes] Ensured ${indexName} on ${table}(${column})`);
  }

  try {
    await sequelize.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    for (const { name, table, column } of TRIGRAM_INDEXES) {
      const indexName = `idx_${name}`;
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" USING gin ("${column}" gin_trgm_ops);`
      );
      console.log(`[add-indexes] Ensured trigram index ${indexName} on ${table}(${column})`);
    }
  } catch (err) {
    console.warn(
      "[add-indexes] Could not create pg_trgm extension/indexes (may need elevated DB privileges on this host). Free-text search will still work, just without this speedup. Error:",
      err.message
    );
  }

  console.log("[add-indexes] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-indexes] Failed:", err);
  process.exit(1);
});
