// One-time migration: backfills the new task_assignees join table from the
// legacy tasks.assignees JSON-in-TEXT column. Safe to re-run — inserts are
// findOrCreate'd, so running it twice just no-ops the second time.
//
// Before writing anything, dumps every task's current `assignees` value to
// server/backups/ so the pre-migration state can be reconstructed if needed.
// The old column itself is left untouched (not cleared, not dropped) — this
// script only ever adds rows to the new table.
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";
import { initModels } from "../src/models/index.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const { Task, TeamMember, TaskAssignee } = initModels(sequelize);

async function main() {
  await sequelize.authenticate();
  // Non-destructive: only creates task_assignees since it doesn't exist yet;
  // never alters the existing tasks/team_members tables.
  await sequelize.sync();

  const tasks = await Task.findAll({ attributes: ["id", "assignees"] });

  const backupDir = path.join(__dirname, "..", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `task-assignees-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(tasks.map((t) => t.toJSON()), null, 2));
  console.log(`[migrate] Backed up ${tasks.length} tasks' assignees to ${backupPath}`);

  const validMemberIds = new Set((await TeamMember.findAll({ attributes: ["id"] })).map((m) => m.id));

  let linked = 0;
  let skippedInvalid = 0;

  for (const task of tasks) {
    let ids = [];
    try {
      ids = task.assignees ? JSON.parse(task.assignees) : [];
    } catch {
      ids = [];
    }
    if (!Array.isArray(ids)) continue;

    for (const rawId of ids) {
      const teamMemberId = parseInt(rawId);
      if (!validMemberIds.has(teamMemberId)) {
        skippedInvalid++;
        continue;
      }
      await TaskAssignee.findOrCreate({ where: { taskId: task.id, teamMemberId } });
      linked++;
    }
  }

  console.log(`[migrate] Done. ${linked} assignee links ensured, ${skippedInvalid} invalid/stale ids skipped.`);
  console.log("[migrate] tasks.assignees is left in place, untouched, as a rollback reference — the app no longer reads it.");

  // sequelize.sync() creates the table from the model but doesn't add FK
  // constraints to an already-existing table, so add them explicitly here.
  // ON DELETE CASCADE means deleting a task or team member automatically
  // cleans up its join rows — no manual cleanup needed in the routes.
  const addConstraint = async (name, sql) => {
    try {
      await sequelize.query(sql);
      console.log(`[migrate] Added constraint ${name}`);
    } catch (err) {
      if (/already exists/i.test(err.message)) {
        console.log(`[migrate] Constraint ${name} already present`);
      } else {
        throw err;
      }
    }
  };

  await addConstraint(
    "task_assignees_task_fk",
    `ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_fk" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE;`
  );
  await addConstraint(
    "task_assignees_member_fk",
    `ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_member_fk" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE CASCADE;`
  );
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
