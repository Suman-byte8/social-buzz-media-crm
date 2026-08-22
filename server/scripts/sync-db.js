import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import { initModels } from "../src/models/index.js";

dotenv.config();

const isDev = process.env.NODE_ENV === "development";

// Same SSL auto-detection as server/index.js — managed hosts (Neon, etc.) require TLS.
const DATABASE_URL_HOST = (process.env.DATABASE_URL || "").split("/")[2] || "";
const needsSslByDefault =
  process.env.DB_SSL === "true" ||
  /neon\.tech|supabase\.co|aws\.|azure|cleardb|elephantsql|aivencloud/i.test(
    DATABASE_URL_HOST
  );
const sslOptions = needsSslByDefault
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : undefined;

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: console.log,
    dialectOptions: sslOptions,
  });
} else if (process.env.DB_DATABASE) {
  sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "postgres",
      logging: console.log,
      dialectOptions: sslOptions,
    }
  );
} else {
  throw new Error(
    "Missing database configuration. Set DATABASE_URL or DB_* env vars."
  );
}

initModels(sequelize);

async function main() {
  console.log("Authenticating...");
  await sequelize.authenticate();
  console.log("Connection OK. Syncing models...");
  await sequelize.sync({ alter: isDev });
  console.log("Database synchronized successfully");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});