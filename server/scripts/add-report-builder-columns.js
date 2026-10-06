// Adds `documents.reportId` and "report_asset" to the documents.documentType
// enum — for the Report Builder's screenshot/asset uploads (an image
// dragged onto a report page while editing). The Report and ReportTemplate
// tables themselves are brand new, so this app's sequelize.sync() (no
// `alter: true`) creates them automatically on next boot — only altering
// the existing `documents` table needs an explicit migration, same as
// every other extension to that table (see add-salary-slip-columns.js,
// add-note-attachment-columns.js for the same pattern).
//
// Safe to run against a live database at any time: ADD COLUMN IF NOT EXISTS
// and ADD VALUE IF NOT EXISTS are both idempotent, and nothing existing is
// altered or dropped.
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
  console.log("[add-report-builder-columns] Connected.");

  // ALTER TYPE ... ADD VALUE cannot run inside a multi-statement transaction
  // block in older Postgres, so each statement is issued on its own.
  await sequelize.query(`ALTER TYPE "enum_documents_documentType" ADD VALUE IF NOT EXISTS 'report_asset';`);
  console.log('[add-report-builder-columns] Ensured "report_asset" enum value');

  await sequelize.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "reportId" INTEGER;`);
  console.log('[add-report-builder-columns] Ensured "reportId" column on documents');

  await sequelize.query(`CREATE INDEX IF NOT EXISTS "documents_report_id" ON "documents" ("reportId");`);
  console.log('[add-report-builder-columns] Ensured index on documents.reportId');

  console.log("[add-report-builder-columns] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-report-builder-columns] Failed:", err);
  process.exit(1);
});
