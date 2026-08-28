import express from "express";
import multer from "multer";
import { Op } from "sequelize";
import {
  uploadFileToDrive,
  deleteFileFromDrive,
  getOrCreateClientFolder,
  getOrCreateClientSubfolder,
} from "../utils/googleDrive.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per creative (covers short video clips)
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image or video files are allowed for creatives!"), false);
    }
  },
});

const CREATIVES_SUBFOLDER = "Content Calendar Creatives";
const STATUS_VALUES = ["pending", "scheduled", "posted"];

const parseJsonArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatEntry = (data) => ({
  ...data,
  platforms: parseJsonArray(data.platforms),
  creatives: parseJsonArray(data.creatives),
});

// ── List entries ─────────────────────────────────────────────────────────
// `page`/`limit` are optional — omitting them preserves the historical
// "return everything" behavior existing callers rely on. Pagination is
// skipped when `platform` is set, since that filter is applied in JS
// (platforms are stored as a JSON-serialized array) after the SQL query
// runs, and paginating before that filter would make `total`/pages wrong.
router.get("/content-calendar", async (req, res) => {
  try {
    const { ContentCalendarEntry, Client } = req.app.locals.models;
    const { clientId, from, to, status, platform, page, limit } = req.query;

    const where = {};
    if (clientId && clientId !== "all") where.clientId = parseInt(clientId);
    if (status && STATUS_VALUES.includes(status)) where.status = status;
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }

    const queryOptions = { where, order: [["date", "ASC"]] };

    let entries;
    let pagination;
    const canPaginate = limit && !(platform && platform !== "all");
    if (canPaginate) {
      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page) || 1;
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;

      const { count, rows } = await ContentCalendarEntry.findAndCountAll(queryOptions);
      entries = rows;
      pagination = {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(count / parsedLimit),
      };
    } else {
      entries = await ContentCalendarEntry.findAll(queryOptions);
    }

    const clientIds = [...new Set(entries.map((e) => e.clientId).filter(Boolean))];
    const clients = await Client.findAll({
      where: { id: { [Op.in]: clientIds } },
      attributes: ["id", "name"],
    });

    let list = entries.map((e) => {
      const data = formatEntry(e.toJSON());
      const client = clients.find((c) => c.id === data.clientId);
      return { ...data, clientName: client ? client.name : null };
    });

    if (platform && platform !== "all") {
      list = list.filter((e) => e.platforms.includes(platform));
    }

    res.json({ success: true, data: list, ...(pagination ? { pagination } : {}) });
  } catch (error) {
    console.error("Error fetching content calendar entries:", error);
    res.status(500).json({ success: false, message: "Error fetching content calendar entries", error: error.message });
  }
});

router.get("/content-calendar/:id", async (req, res) => {
  try {
    const { ContentCalendarEntry } = req.app.locals.models;
    const entry = await ContentCalendarEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Content calendar entry not found" });
    }
    res.json({ success: true, data: formatEntry(entry.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching entry", error: error.message });
  }
});

// ── Create entry ─────────────────────────────────────────────────────────
router.post("/content-calendar", async (req, res) => {
  try {
    const { ContentCalendarEntry } = req.app.locals.models;
    const { clientId, date, holiday, postTitle, content, caption, hashtags, platforms, status } = req.body;

    if (!clientId || !date) {
      return res.status(400).json({ success: false, message: "clientId and date are required" });
    }

    const resolvedStatus = STATUS_VALUES.includes(status) ? status : "pending";

    const entry = await ContentCalendarEntry.create({
      clientId: parseInt(clientId),
      date,
      holiday: holiday || null,
      postTitle: postTitle || null,
      content: content || null,
      caption: caption || null,
      hashtags: hashtags || null,
      platforms: Array.isArray(platforms) && platforms.length > 0 ? JSON.stringify(platforms) : null,
      status: resolvedStatus,
      postedAt: resolvedStatus === "posted" ? new Date() : null,
    });

    res.status(201).json({ success: true, message: "Content calendar entry created", data: formatEntry(entry.toJSON()) });
  } catch (error) {
    console.error("Error creating content calendar entry:", error);
    res.status(500).json({ success: false, message: "Error creating content calendar entry", error: error.message });
  }
});

// ── Update entry ─────────────────────────────────────────────────────────
router.put("/content-calendar/:id", async (req, res) => {
  try {
    const { ContentCalendarEntry } = req.app.locals.models;
    const entry = await ContentCalendarEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Content calendar entry not found" });
    }

    const { clientId, date, holiday, postTitle, content, caption, hashtags, platforms, status } = req.body;

    const updateData = {
      clientId: clientId !== undefined ? parseInt(clientId) : entry.clientId,
      date: date !== undefined ? date : entry.date,
      holiday: holiday !== undefined ? holiday : entry.holiday,
      postTitle: postTitle !== undefined ? postTitle : entry.postTitle,
      content: content !== undefined ? content : entry.content,
      caption: caption !== undefined ? caption : entry.caption,
      hashtags: hashtags !== undefined ? hashtags : entry.hashtags,
      platforms: platforms !== undefined
        ? (Array.isArray(platforms) && platforms.length > 0 ? JSON.stringify(platforms) : null)
        : entry.platforms,
    };

    if (status !== undefined && STATUS_VALUES.includes(status)) {
      updateData.status = status;
      if (status === "posted" && entry.status !== "posted") updateData.postedAt = new Date();
      if (status !== "posted") updateData.postedAt = null;
    }

    await entry.update(updateData);

    res.json({ success: true, message: "Content calendar entry updated", data: formatEntry(entry.toJSON()) });
  } catch (error) {
    console.error("Error updating content calendar entry:", error);
    res.status(500).json({ success: false, message: "Error updating content calendar entry", error: error.message });
  }
});

// ── Delete entry ─────────────────────────────────────────────────────────
router.delete("/content-calendar/:id", async (req, res) => {
  try {
    const { ContentCalendarEntry } = req.app.locals.models;
    const entry = await ContentCalendarEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Content calendar entry not found" });
    }

    const creatives = parseJsonArray(entry.creatives);
    for (const creative of creatives) {
      try {
        await deleteFileFromDrive(creative.fileId);
      } catch (err) {
        console.warn("Could not delete creative from Drive:", err.message);
      }
    }

    await entry.destroy();
    res.json({ success: true, message: "Content calendar entry deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting entry", error: error.message });
  }
});

// ── Upload creatives to an entry ────────────────────────────────────────
router.post("/content-calendar/:id/creatives", upload.array("files", 10), async (req, res) => {
  try {
    const { ContentCalendarEntry, Client } = req.app.locals.models;
    const entry = await ContentCalendarEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Content calendar entry not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files provided" });
    }

    let folderId = null;
    const client = await Client.findByPk(entry.clientId);
    if (client) {
      const clientFolder = await getOrCreateClientFolder(client.name, client.id);
      const creativesFolder = await getOrCreateClientSubfolder(clientFolder.folderId, CREATIVES_SUBFOLDER);
      folderId = creativesFolder.folderId;
    }

    const existingCreatives = parseJsonArray(entry.creatives);
    const newCreatives = [];

    for (const file of req.files) {
      const driveResult = await uploadFileToDrive(file.buffer, file.originalname, file.mimetype, folderId);
      newCreatives.push({
        fileId: driveResult.fileId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        driveLink: driveResult.googleUserContentLink,
        webViewLink: driveResult.webViewLink,
        thumbnailLink: driveResult.thumbnailLink,
        folderId,
        uploadedAt: new Date().toISOString(),
      });
    }

    const updatedCreatives = [...existingCreatives, ...newCreatives];
    await entry.update({ creatives: JSON.stringify(updatedCreatives) });

    res.status(201).json({ success: true, message: "Creatives uploaded", data: formatEntry(entry.toJSON()) });
  } catch (error) {
    console.error("Error uploading creatives:", error);
    res.status(500).json({ success: false, message: error.message || "Error uploading creatives", error: error.message });
  }
});

// ── Delete a single creative from an entry ──────────────────────────────
router.delete("/content-calendar/:id/creatives/:fileId", async (req, res) => {
  try {
    const { ContentCalendarEntry } = req.app.locals.models;
    const entry = await ContentCalendarEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Content calendar entry not found" });
    }

    const creatives = parseJsonArray(entry.creatives);
    const remaining = creatives.filter((c) => c.fileId !== req.params.fileId);

    if (remaining.length !== creatives.length) {
      try {
        await deleteFileFromDrive(req.params.fileId);
      } catch (err) {
        console.warn("Could not delete creative from Drive:", err.message);
      }
    }

    await entry.update({ creatives: JSON.stringify(remaining) });

    res.json({ success: true, message: "Creative removed", data: formatEntry(entry.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error removing creative", error: error.message });
  }
});

export default router;
