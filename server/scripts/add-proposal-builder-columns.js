// Adds `documents.proposalId` (linking a generated proposal's exported
// PDF/DOCX Document rows back to their Proposal draft — "proposal" is
// already a valid documents.documentType value, so no enum change is
// needed here). The Proposal/ProposalTemplate/ProposalVersion/
// ProposalActivityLog tables themselves are brand new, so this app's
// sequelize.sync() (no `alter: true`) creates them automatically on next
// boot — only altering the existing `documents` table needs an explicit
// migration, same pattern as add-agreement-builder-columns.js. No new
// Client columns are needed — legalName/contactPersonName/gstin already
// exist from the Agreement Generator work.
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
  console.log("[add-proposal-builder-columns] Connected.");

  await sequelize.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "proposalId" INTEGER;`);
  console.log('[add-proposal-builder-columns] Ensured "proposalId" column on documents');

  await sequelize.query(`CREATE INDEX IF NOT EXISTS "documents_proposal_id" ON "documents" ("proposalId");`);
  console.log("[add-proposal-builder-columns] Ensured index on documents.proposalId");

  console.log("[add-proposal-builder-columns] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-proposal-builder-columns] Failed:", err);
  process.exit(1);
});
