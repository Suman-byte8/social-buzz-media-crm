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

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false
  }
);

const models = initModels(sequelize);
app.locals.models = models;

// Sync database
sequelize.sync({ alter: process.env.NODE_ENV === "development" })
  .then(() => console.log("Database synchronized"))
  .catch(err => console.error("Database sync error:", err));

// Routes
import clientRoutes from "./src/routes/clientRoutes.js";
import teamRoutes from "./src/routes/teamRoutes.js";
app.use("/api", clientRoutes);
app.use("/api", teamRoutes);

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