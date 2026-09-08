// Adds "creative" and "strategy" to the documents.documentType enum, for
// the new Client Profile Creatives/Strategy tabs. Postgres enums can only
// grow via ALTER TYPE ... ADD VALUE — this app's sequelize.sync() (no
// `alter: true`) never issues that automatically, so it has to be applied
// here explicitly.
//
// Safe to run against a live database at any time: ADD VALUE IF NOT EXISTS
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
  console.log("[add-document-type-values] Connected.");

  // ALTER TYPE ... ADD VALUE cannot run inside a multi-statement transaction
  // block in older Postgres, so each is issued as its own query.
  await sequelize.query(`ALTER TYPE "enum_documents_documentType" ADD VALUE IF NOT EXISTS 'creative';`);
  console.log('[add-document-type-values] Ensured "creative" enum value');

  await sequelize.query(`ALTER TYPE "enum_documents_documentType" ADD VALUE IF NOT EXISTS 'strategy';`);
  console.log('[add-document-type-values] Ensured "strategy" enum value');

  console.log("[add-document-type-values] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-document-type-values] Failed:", err);
  process.exit(1);
});
