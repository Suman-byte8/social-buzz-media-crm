// Adds `misc_tasks.notes` (TEXT, nullable) for the Miscellaneous page's new
// notes/description field. Purely additive — this app's sequelize.sync()
// (no `alter: true`) never adds columns to an already-existing table on its
// own, so it has to be applied here explicitly.
//
// Safe to run against a live database at any time: ADD COLUMN IF NOT EXISTS
// is idempotent, and nothing existing is altered or dropped.
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

async function main() {
  await sequelize.authenticate();
  console.log("[add-misc-task-notes-column] Connected.");

  await sequelize.query(`ALTER TABLE "misc_tasks" ADD COLUMN IF NOT EXISTS "notes" TEXT;`);
  console.log('[add-misc-task-notes-column] Ensured "notes" column on misc_tasks');

  console.log("[add-misc-task-notes-column] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-misc-task-notes-column] Failed:", err);
  process.exit(1);
});
