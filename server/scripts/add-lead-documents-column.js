// Adds `documents.leadId` (INTEGER, nullable) and "lead" to the
// documents.documentType enum, for the Leads page's new file-upload field
// (proposals/agreements shared with a lead before it converts to a client).
// Purely additive — this app's sequelize.sync() (no `alter: true`) never
// adds columns or enum values to an already-existing table/type on its own,
// so it has to be applied here explicitly. See add-misc-task-notes-column.js
// and add-document-type-values.js for the same pattern.
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
  console.log("[add-lead-documents-column] Connected.");

  // ALTER TYPE ... ADD VALUE cannot run inside a multi-statement transaction
  // block in older Postgres, so each statement is issued on its own.
  await sequelize.query(`ALTER TYPE "enum_documents_documentType" ADD VALUE IF NOT EXISTS 'lead';`);
  console.log('[add-lead-documents-column] Ensured "lead" enum value');

  await sequelize.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "leadId" INTEGER;`);
  console.log('[add-lead-documents-column] Ensured "leadId" column on documents');

  await sequelize.query(`CREATE INDEX IF NOT EXISTS "documents_lead_id" ON "documents" ("leadId");`);
  console.log('[add-lead-documents-column] Ensured index on documents.leadId');

  console.log("[add-lead-documents-column] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-lead-documents-column] Failed:", err);
  process.exit(1);
});
