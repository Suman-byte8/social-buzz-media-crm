// Adds `tasks.assignedById` (INTEGER, nullable) — who assigned the task,
// as opposed to the existing TaskAssignee join table which tracks who it's
// assigned TO. Purely additive — this app's sequelize.sync() (no
// `alter: true`) never adds columns to an already-existing table on its
// own, so it has to be applied here explicitly. See
// add-misc-task-notes-column.js for the same pattern.
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
  console.log("[add-task-assigned-by-column] Connected.");

  await sequelize.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "assignedById" INTEGER;`);
  console.log('[add-task-assigned-by-column] Ensured "assignedById" column on tasks');

  await sequelize.query(`CREATE INDEX IF NOT EXISTS "tasks_assigned_by_id" ON "tasks" ("assignedById");`);
  console.log('[add-task-assigned-by-column] Ensured index on tasks.assignedById');

  console.log("[add-task-assigned-by-column] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-task-assigned-by-column] Failed:", err);
  process.exit(1);
});
