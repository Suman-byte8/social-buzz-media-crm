// One-time setup: creates the single admin account and single team-member
// account this app expects. Safe to re-run — it skips any role that already
// has a user. Change passwords afterward from the app (admin can view/rotate
// the team member's password from Settings > Login Access).
import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import { initModels } from "../src/models/index.js";
import { encryptText } from "../src/utils/encryption.js";

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

const { User } = initModels(sequelize);

async function ensureUser(role, defaults) {
  const existing = await User.findOne({ where: { role } });
  if (existing) {
    console.log(`[seed] ${role} already exists (${existing.email}) — skipping.`);
    return;
  }
  const created = await User.create({
    name: defaults.name,
    email: defaults.email,
    password: encryptText(defaults.password),
    role,
  });
  console.log(`[seed] Created ${role}: ${created.email} / ${defaults.password}`);
}

async function main() {
  await sequelize.authenticate();
  await sequelize.sync(); // non-destructive: only creates the users table if missing

  await ensureUser("admin", {
    name: process.env.SEED_ADMIN_NAME || "Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@socialbuzzmedia.com",
    password: process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!",
  });

  await ensureUser("team_member", {
    name: process.env.SEED_TEAM_NAME || "Team Member",
    email: process.env.SEED_TEAM_EMAIL || "team@socialbuzzmedia.com",
    password: process.env.SEED_TEAM_PASSWORD || "ChangeMe123!",
  });

  console.log("[seed] Done. Log in and rotate these passwords from Settings > Login Access.");
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
