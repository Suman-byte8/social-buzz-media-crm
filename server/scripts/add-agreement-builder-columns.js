// Adds `documents.agreementId` (linking a generated agreement's exported
// PDF/DOCX Document rows back to their Agreement draft — "agreement" is
// already a valid documents.documentType value, so no enum change is
// needed here) and three optional Client fields the agreement generator
// needs (legalName, contactPersonName, gstin). The Agreement/
// AgreementTemplate/AgreementVersion/AgreementActivityLog tables themselves
// are brand new, so this app's sequelize.sync() (no `alter: true`) creates
// them automatically on next boot — only altering the existing `documents`
// and `clients` tables needs an explicit migration, same pattern as
// add-report-builder-columns.js.
//
// Safe to run against a live database at any time: every statement uses
// ADD COLUMN IF NOT EXISTS, idempotent, nothing existing is altered/dropped.
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
  console.log("[add-agreement-builder-columns] Connected.");

  await sequelize.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "agreementId" INTEGER;`);
  console.log('[add-agreement-builder-columns] Ensured "agreementId" column on documents');

  await sequelize.query(`CREATE INDEX IF NOT EXISTS "documents_agreement_id" ON "documents" ("agreementId");`);
  console.log("[add-agreement-builder-columns] Ensured index on documents.agreementId");

  await sequelize.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "legalName" VARCHAR(255);`);
  await sequelize.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "contactPersonName" VARCHAR(255);`);
  await sequelize.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "gstin" VARCHAR(255);`);
  console.log("[add-agreement-builder-columns] Ensured legalName/contactPersonName/gstin columns on clients");

  console.log("[add-agreement-builder-columns] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-agreement-builder-columns] Failed:", err);
  process.exit(1);
});
