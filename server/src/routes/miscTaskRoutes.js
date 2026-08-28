import express from "express";
import multer from "multer";
import { uploadFileToDrive, getOrCreateClientFolder, getOrCreateClientSubfolder } from "../utils/googleDrive.js";

const router = express.Router();

const TYPE_OF_WORK_VALUES = ["banner", "video", "social_media_banner", "ooh"];
const STATUS_VALUES = ["pending", "progress", "delivered"];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB — creative assets (banners, videos) run larger than PDFs
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/|video\/)|application\/pdf$/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image, video, or PDF files are allowed"), false);
    }
  },
});

// GET /api/misc-tasks - list, optionally filtered
// `page`/`limit` are optional — omitting them preserves the historical
// "return everything" behavior existing callers rely on.
router.get("/misc-tasks", async (req, res) => {
  try {
    const { MiscTask } = req.app.locals.models;
    const { clientId, status, assignedTo, typeOfWork, page, limit } = req.query;

    const where = {};
    if (clientId) where.clientId = parseInt(clientId);
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = parseInt(assignedTo);
    if (typeOfWork) where.typeOfWork = typeOfWork;

    const queryOptions = { where, order: [["createdAt", "DESC"]] };

    if (limit) {
      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page) || 1;
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;

      const { count, rows } = await MiscTask.findAndCountAll(queryOptions);
      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(count / parsedLimit),
        },
      });
    }

    const miscTasks = await MiscTask.findAll(queryOptions);
    res.json({ success: true, data: miscTasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching miscellaneous tasks", error: error.message });
  }
});

// POST /api/misc-tasks/upload - create, or update (with optional new file) when `id` is present
router.post("/misc-tasks/upload", upload.single("file"), async (req, res) => {
  try {
    const { id, clientId, typeOfWork, assignedDate, deliveryDate, status, assignedTo } = req.body;
    const { MiscTask, Client } = req.app.locals.models;

    if (typeOfWork && !TYPE_OF_WORK_VALUES.includes(typeOfWork)) {
      return res.status(400).json({ success: false, message: `typeOfWork must be one of: ${TYPE_OF_WORK_VALUES.join(", ")}` });
    }
    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
    }

    if (id) {
      const existing = await MiscTask.findByPk(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      const updateData = {
        clientId: clientId ? parseInt(clientId) : existing.clientId,
        typeOfWork: typeOfWork || existing.typeOfWork,
        assignedDate: assignedDate || existing.assignedDate,
        deliveryDate: deliveryDate || existing.deliveryDate,
        status: status || existing.status,
        assignedTo: assignedTo ? parseInt(assignedTo) : existing.assignedTo,
      };

      if (req.file) {
        let folderId = null;
        const clientRecord = await Client.findByPk(updateData.clientId);
        if (clientRecord) {
          const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
          const subfolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Miscellaneous");
          folderId = subfolder.folderId;
        }

        const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, folderId);

        Object.assign(updateData, {
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          fileId: driveResult.fileId,
          driveLink: driveResult.googleUserContentLink,
          webViewLink: driveResult.webViewLink,
          googleUserContentLink: driveResult.googleUserContentLink,
          folderId,
        });
      }

      const updated = await existing.update(updateData);
      return res.json({ success: true, message: "Task updated successfully", data: updated });
    }

    if (!clientId || !typeOfWork) {
      return res.status(400).json({ success: false, message: "clientId and typeOfWork are required" });
    }

    let folderId = null;
    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const subfolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Miscellaneous");
    folderId = subfolder.folderId;

    let fileFields = {};
    if (req.file) {
      const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, folderId);
      fileFields = {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        fileId: driveResult.fileId,
        driveLink: driveResult.googleUserContentLink,
        webViewLink: driveResult.webViewLink,
        googleUserContentLink: driveResult.googleUserContentLink,
        folderId,
      };
    }

    const miscTask = await MiscTask.create({
      clientId: parseInt(clientId),
      typeOfWork,
      assignedDate: assignedDate || null,
      deliveryDate: deliveryDate || null,
      status: status || "pending",
      assignedTo: assignedTo ? parseInt(assignedTo) : null,
      ...fileFields,
    });

    res.status(201).json({ success: true, message: "Task created successfully", data: miscTask });
  } catch (error) {
    console.error("Error saving miscellaneous task:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to save task", error: error.message });
  }
});

// PUT /api/misc-tasks/:id - metadata-only update (no file change)
router.put("/misc-tasks/:id", async (req, res) => {
  try {
    const { MiscTask } = req.app.locals.models;
    const { clientId, typeOfWork, assignedDate, deliveryDate, status, assignedTo } = req.body;

    const miscTask = await MiscTask.findByPk(req.params.id);
    if (!miscTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (typeOfWork && !TYPE_OF_WORK_VALUES.includes(typeOfWork)) {
      return res.status(400).json({ success: false, message: `typeOfWork must be one of: ${TYPE_OF_WORK_VALUES.join(", ")}` });
    }
    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
    }

    await miscTask.update({
      clientId: clientId ? parseInt(clientId) : miscTask.clientId,
      typeOfWork: typeOfWork || miscTask.typeOfWork,
      assignedDate: assignedDate !== undefined ? assignedDate : miscTask.assignedDate,
      deliveryDate: deliveryDate !== undefined ? deliveryDate : miscTask.deliveryDate,
      status: status || miscTask.status,
      assignedTo: assignedTo !== undefined ? (assignedTo ? parseInt(assignedTo) : null) : miscTask.assignedTo,
    });

    res.json({ success: true, message: "Task updated successfully", data: miscTask });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating task", error: error.message });
  }
});

// DELETE /api/misc-tasks/:id
router.delete("/misc-tasks/:id", async (req, res) => {
  try {
    const { MiscTask } = req.app.locals.models;
    const miscTask = await MiscTask.findByPk(req.params.id);
    if (!miscTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await miscTask.destroy();
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting task", error: error.message });
  }
});

export default router;
