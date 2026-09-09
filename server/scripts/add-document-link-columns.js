// Adds `documents.linkUrl` / `documents.linkType` (both nullable STRING)
// and relaxes `documents.fileId` to nullable, for the Strategy tab's new
// "share a Google Sheet/Doc link" option — a link entry has no file
// actually uploaded to Drive, so it can't satisfy the old NOT NULL fileId
// constraint. Purely additive/relaxing — this app's sequelize.sync() (no
// `alter: true`) never applies either kind of change on its own, so it has
// to be applied here explicitly. See add-lead-documents-column.js for the
// same pattern.
//
// Safe to run against a live database at any time: ADD COLUMN IF NOT EXISTS
// and DROP NOT NULL are both idempotent, and nothing existing is altered or
// dropped — every current row already has a fileId, so relaxing the
// constraint doesn't touch any data.
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
  console.log("[add-document-link-columns] Connected.");

  await sequelize.query(`ALTER TABLE "documents" ALTER COLUMN "fileId" DROP NOT NULL;`);
  console.log('[add-document-link-columns] Relaxed "fileId" to nullable');

  await sequelize.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "linkUrl" VARCHAR(255);`);
  console.log('[add-document-link-columns] Ensured "linkUrl" column on documents');

  await sequelize.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "linkType" VARCHAR(255);`);
  console.log('[add-document-link-columns] Ensured "linkType" column on documents');

  console.log("[add-document-link-columns] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-document-link-columns] Failed:", err);
  process.exit(1);
});
