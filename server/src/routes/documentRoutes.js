import express from "express";
import multer from "multer";
import { uploadFileToDrive, getFileStreamFromDrive, getOrCreateClientFolder } from "../utils/googleDrive.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for documents
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname?.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
});

router.post("/documents/upload", upload.single("file"), async (req, res) => {
  try {
    const { clientId, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file provided" });
    }

    const { Document, Client } = req.app.locals.models;

    let folderId = null;

    if (clientId) {
      const clientRecord = await Client.findByPk(parseInt(clientId));
      if (clientRecord) {
        const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
        folderId = clientFolder.folderId;
      }
    }

    const driveResult = await uploadFileToDrive(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folderId
    );

    const document = await Document.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileId: driveResult.fileId,
      driveLink: driveResult.googleUserContentLink,
      webViewLink: driveResult.webViewLink,
      googleUserContentLink: driveResult.googleUserContentLink,
      folderId: folderId,
      clientId: clientId ? parseInt(clientId) : null,
      description: description || null,
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload document",
      error: error.message,
    });
  }
});

router.get("/documents", async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const { clientId } = req.query;

    const where = {};
    if (clientId) {
      where.clientId = parseInt(clientId);
    }

    const documents = await Document.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching documents",
      error: error.message,
    });
  }
});

router.get("/documents/:id", async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching document",
      error: error.message,
    });
  }
});

router.delete("/documents/:id", async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    await document.destroy();
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting document",
      error: error.message,
    });
  }
});

router.get("/documents/:id/stream", async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const fileStream = await getFileStreamFromDrive(document.fileId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${document.fileName}"`);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error streaming document:", error);
    res.status(500).json({
      success: false,
      message: "Error streaming document",
      error: error.message,
    });
  }
});

export default router;
