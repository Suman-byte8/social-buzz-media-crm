// One-time (but safely re-runnable) migration for two schema changes that
// shipped in the model but were never applied to the live database:
//
//   1. `clients.logo` (TEXT, nullable) — added in the "client logo upload"
//      feature. Purely additive.
//
//   2. `content_calendar_entries.status` (enum: pending/scheduled/posted) —
//      replaced the old boolean `posted` column. This one backfills from
//      the old `posted` column (if it's still there) instead of defaulting
//      every existing row to "pending", so previously-posted/scheduled
//      entries don't silently lose that state.
//
// Safe to run against a live database at any time: every step is
// idempotent (IF NOT EXISTS / guarded by an existence check) and nothing
// is dropped.
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

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = :table AND column_name = :column;`,
    { replacements: { table, column } }
  );
  return rows.length > 0;
}

async function main() {
  await sequelize.authenticate();
  console.log("[add-logo-and-status-columns] Connected.");

  // 1. clients.logo
  await sequelize.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "logo" TEXT;`);
  console.log('[add-logo-and-status-columns] Ensured "logo" column on clients');

  // 2. content_calendar_entries.status
  const hasStatus = await columnExists("content_calendar_entries", "status");
  if (hasStatus) {
    console.log('[add-logo-and-status-columns] "status" column already exists on content_calendar_entries, skipping');
  } else {
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_content_calendar_entries_status" AS ENUM ('pending', 'scheduled', 'posted');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log("[add-logo-and-status-columns] Ensured enum type");

    await sequelize.query(`
      ALTER TABLE "content_calendar_entries"
      ADD COLUMN "status" "enum_content_calendar_entries_status" NOT NULL DEFAULT 'pending';
    `);
    console.log('[add-logo-and-status-columns] Added "status" column (defaulted to pending)');

    const hasOldPosted = await columnExists("content_calendar_entries", "posted");
    if (hasOldPosted) {
      const [, meta] = await sequelize.query(
        `UPDATE "content_calendar_entries" SET "status" = 'posted' WHERE "posted" = true;`
      );
      console.log(`[add-logo-and-status-columns] Backfilled status='posted' from old posted column for ${meta.rowCount ?? 0} row(s)`);
    } else {
      console.log("[add-logo-and-status-columns] No old \"posted\" column found, nothing to backfill");
    }
  }

  console.log("[add-logo-and-status-columns] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-logo-and-status-columns] Failed:", err);
  process.exit(1);
});
