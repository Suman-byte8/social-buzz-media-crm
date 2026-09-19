// Adds `documents.teamMemberId` and "salary_slip" to the
// documents.documentType enum — for the Salary Slip Generator's "Save to
// Drive" action, which stores a generated PDF against a team member
// (rather than a client/lead/note, the only soft references documents had
// until now). Purely additive — this app's sequelize.sync() (no
// `alter: true`) never applies either kind of change on its own, so it has
// to be applied here explicitly. See add-note-attachment-columns.js for the
// same pattern.
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
  console.log("[add-salary-slip-columns] Connected.");

  // ALTER TYPE ... ADD VALUE cannot run inside a multi-statement transaction
  // block in older Postgres, so each statement is issued on its own.
  await sequelize.query(`ALTER TYPE "enum_documents_documentType" ADD VALUE IF NOT EXISTS 'salary_slip';`);
  console.log('[add-salary-slip-columns] Ensured "salary_slip" enum value');

  await sequelize.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "teamMemberId" INTEGER;`);
  console.log('[add-salary-slip-columns] Ensured "teamMemberId" column on documents');

  await sequelize.query(`CREATE INDEX IF NOT EXISTS "documents_team_member_id" ON "documents" ("teamMemberId");`);
  console.log('[add-salary-slip-columns] Ensured index on documents.teamMemberId');

  console.log("[add-salary-slip-columns] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-salary-slip-columns] Failed:", err);
  process.exit(1);
});
