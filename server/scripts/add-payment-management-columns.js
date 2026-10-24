// Adds `documents.invoiceId` (linking a generated Payment Management
// invoice/receipt PDF back to its Invoice/Payment row — same soft-reference
// pattern as agreementId/proposalId/reportId) and the two new documentType
// enum values ("invoice_record", "payment_receipt") it uses — distinct from
// the existing plain "invoice" value, which the older, unrelated client-
// side-only Invoice Builder already owns, so the two features' Drive files
// never mix. The nine new Payment Management tables themselves need no
// migration — this app's sequelize.sync() (no `alter: true`) creates brand
// new tables automatically on next boot, same pattern as every other
// feature this session. Postgres enums can only grow via
// ALTER TYPE ... ADD VALUE, which sync() never issues automatically, hence
// this explicit script (mirrors add-document-type-values.js).
//
// Safe to run against a live database at any time: every statement is
// idempotent (ADD COLUMN IF NOT EXISTS / ADD VALUE IF NOT EXISTS), nothing
// existing is altered or dropped.
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
  console.log("[add-payment-management-columns] Connected.");

  await sequelize.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "invoiceId" INTEGER;`);
  console.log('[add-payment-management-columns] Ensured "invoiceId" column on documents');

  await sequelize.query(`CREATE INDEX IF NOT EXISTS "documents_invoice_id" ON "documents" ("invoiceId");`);
  console.log("[add-payment-management-columns] Ensured index on documents.invoiceId");

  // ALTER TYPE ... ADD VALUE cannot run inside a multi-statement transaction
  // block in older Postgres, so each is issued as its own query.
  await sequelize.query(`ALTER TYPE "enum_documents_documentType" ADD VALUE IF NOT EXISTS 'invoice_record';`);
  console.log('[add-payment-management-columns] Ensured "invoice_record" enum value');

  await sequelize.query(`ALTER TYPE "enum_documents_documentType" ADD VALUE IF NOT EXISTS 'payment_receipt';`);
  console.log('[add-payment-management-columns] Ensured "payment_receipt" enum value');

  console.log("[add-payment-management-columns] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-payment-management-columns] Failed:", err);
  process.exit(1);
});
