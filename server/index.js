import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
import { Sequelize } from "sequelize";
import { initModels } from "./src/models/index.js";

const isDev = process.env.NODE_ENV === "development";

// Prefer DATABASE_URL (connection string) — this is how Render's managed
// Postgres (and Neon/Supabase/Aiven) exposes the database. Falls back to the
// individual DB_* vars for a locally-configured PostgreSQL.
let sequelize;
// Determine SSL automatically: Neon/Supabase/managed databases require TLS.
const DATABASE_URL_HOST = (process.env.DATABASE_URL || "").split("/")[2] || "";
const needsSslByDefault =
  process.env.DB_SSL === "true" ||
  /neon\.tech|supabase\.co|aws\.|azure|cleardb|elephantsql|aivencloud/i.test(
    DATABASE_URL_HOST
  );
const sslOptions = needsSslByDefault
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : undefined;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: isDev ? console.log : false,
    dialectOptions: sslOptions,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  });
  console.log(`[DB] Using DATABASE_URL (connection string) ssl=${!!sslOptions}`);
} else if (process.env.DB_DATABASE) {
  sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "postgres",
      logging: isDev ? console.log : false,
      dialectOptions: sslOptions,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    }
  );
  console.log(`[DB] Using DB_* env vars (host=${process.env.DB_HOST})`);
} else {
  console.error(
    "[DB] Missing database configuration. Set DATABASE_URL in Render " +
      "(or DB_HOST/DB_USER/DB_PASS/DB_DATABASE/DB_PORT). All /api/* routes will fail until this is fixed."
  );
  // Best-effort instance so the app still boots and logs a descriptive error.
  sequelize = new Sequelize("postgres", "postgres", "", {
    host: "localhost",
    dialect: "postgres",
    logging: false,
  });
}

const models = initModels(sequelize);
app.locals.models = models;

// Connect + sync with retries (handles Render cold starts / slow DB boot)
const connectWithRetry = async (retries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log(`[DB] Connection established (attempt ${attempt})`);
      await sequelize.sync({ alter: isDev });
      console.log("Database synchronized");
      return;
    } catch (err) {
      console.error(
        `[DB] Connection attempt ${attempt}/${retries} failed:`,
        err.message || err
      );
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.error(
          "[DB] Giving up after",
          retries,
          "attempts. Check DATABASE_URL / DB_* env vars in Render."
        );
      }
    }
  }
};
connectWithRetry();

// Routes
import clientRoutes from "./src/routes/clientRoutes.js";
import teamRoutes from "./src/routes/teamRoutes.js";
import settingRoutes from "./src/routes/settingRoutes.js";
import documentRoutes from "./src/routes/documentRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";
import meetingNoteRoutes from "./src/routes/meetingNoteRoutes.js";
app.use("/api", clientRoutes);
app.use("/api", teamRoutes);
app.use("/api", settingRoutes);
app.use("/api", documentRoutes);
app.use("/api", taskRoutes);
app.use("/api", meetingNoteRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CRM API is running"
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;