// One-time (but safely re-runnable) migration: adds the `website` and
// `clientSince` columns to the existing clients table. Purely additive —
// `ADD COLUMN IF NOT EXISTS` never touches existing columns or data, so
// this is safe to run against a live database at any time, independent of
// the non-destructive `sequelize.sync()` that runs on server boot (which
// only creates whole tables that don't exist yet, not new columns on
// existing ones).
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
  console.log("[add-client-columns] Connected.");

  await sequelize.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "website" VARCHAR(255);`);
  console.log('[add-client-columns] Ensured "website" column');

  await sequelize.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "clientSince" DATE;`);
  console.log('[add-client-columns] Ensured "clientSince" column');

  // Backfill clientSince for existing rows from createdAt, so "Client
  // Since" keeps showing a sensible date for clients added before this
  // column existed, instead of blank until someone edits them.
  const [, meta] = await sequelize.query(
    `UPDATE "clients" SET "clientSince" = "createdAt"::date WHERE "clientSince" IS NULL;`
  );
  console.log(`[add-client-columns] Backfilled clientSince from createdAt for ${meta.rowCount ?? 0} row(s)`);

  console.log("[add-client-columns] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[add-client-columns] Failed:", err);
  process.exit(1);
});
