// One-time setup: populates the new `services` table with the list that
// used to be hardcoded in AddEditClientModal.js (SERVICE_OPTIONS), so
// existing clients' "Services Provided" picker keeps showing the same
// options after switching to a real, admin-editable table. Safe to re-run —
// skips any name that already exists.
import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import { initModels } from "../src/models/index.js";

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

const { Service } = initModels(sequelize);

const EXISTING_SERVICES = [
  "Digital Marketing",
  "Performance Marketing",
  "Social Media Marketing",
  "Web Development",
  "Search Engine Optimization (Local SEO)",
  "Brand Identity",
  "Data Analytics",
  "Content Strategy",
  "Creative Design",
];

async function main() {
  await sequelize.authenticate();
  await sequelize.sync(); // non-destructive: only creates the services table if missing

  for (const name of EXISTING_SERVICES) {
    const [, created] = await Service.findOrCreate({ where: { name } });
    console.log(created ? `[seed] Created service: ${name}` : `[seed] Already exists: ${name}`);
  }

  console.log("[seed] Done.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
