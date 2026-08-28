import express from "express";
import multer from "multer";
import { Op } from "sequelize";
import { uploadFileToDrive, getFileStreamFromDrive, getOrCreateClientFolder, getOrCreateClientSubfolder } from "../utils/googleDrive.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for agreements
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname?.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
});

// Broader upload for media-capable document types (currently just brand kit assets):
// logos, color palette images, and other brand imagery, plus PDF brand guidelines.
const mediaUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only image or PDF files are allowed"), false);
    }
  },
});

// Agreements and Proposals are admin-only (hidden from team members).
const ADMIN_ONLY_DOCUMENT_TYPES = ["agreement", "proposal"];

const requireAdminForAgreements = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

// Upload agreement with specific subfolder
router.post("/agreements/upload", requireAdminForAgreements, upload.single("file"), async (req, res) => {
  try {
    const { id, clientId, issuedDate, expiryDate, status, description } = req.body;

    const { Document, Client } = req.app.locals.models;

    let folderId = null;

    if (clientId) {
      const clientRecord = await Client.findByPk(parseInt(clientId));
      if (clientRecord) {
        const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
        const agreementsFolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Agreements");
        folderId = agreementsFolder.folderId;
      }
    }

    if (id) {
      const existingAgreement = await Document.findOne({
        where: { id, documentType: "agreement" },
      });

      if (!existingAgreement) {
        return res.status(404).json({ success: false, message: "Agreement not found" });
      }

      if (!req.file) {
        await existingAgreement.update({
          issuedDate: issuedDate || existingAgreement.issuedDate,
          expiryDate: expiryDate || existingAgreement.expiryDate,
          status: status || existingAgreement.status,
          description: description !== undefined ? description : existingAgreement.description,
        });
        return res.json({ success: true, message: "Agreement updated successfully", data: existingAgreement });
      }

      const driveResult = await uploadFileToDrive(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        folderId
      );

      const updated = await existingAgreement.update({
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        fileId: driveResult.fileId,
        driveLink: driveResult.googleUserContentLink,
        webViewLink: driveResult.webViewLink,
        googleUserContentLink: driveResult.googleUserContentLink,
        folderId: folderId,
        clientId: clientId ? parseInt(clientId) : existingAgreement.clientId,
        description: description || existingAgreement.description,
        issuedDate: issuedDate || existingAgreement.issuedDate,
        expiryDate: expiryDate || existingAgreement.expiryDate,
        status: status || existingAgreement.status,
      });

      return res.json({ success: true, message: "Agreement updated successfully", data: updated });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file provided" });
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
      documentType: "agreement",
      issuedDate: issuedDate || null,
      expiryDate: expiryDate || null,
      status: status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Agreement uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.error("Error uploading agreement:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload agreement",
      error: error.message,
    });
  }
});

// Upload other document types (invoices, reports, content_calendar)
router.post("/documents/upload", upload.single("file"), async (req, res) => {
  try {
    const { clientId, description, documentType } = req.body;

    if (ADMIN_ONLY_DOCUMENT_TYPES.includes(documentType) && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file provided" });
    }

    const { Document, Client } = req.app.locals.models;

    let folderId = null;

    if (clientId) {
      const clientRecord = await Client.findByPk(parseInt(clientId));
      if (clientRecord) {
        const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
        // Determine subfolder based on document type
        const subfolderName = documentType === "invoice" ? "Invoices" :
                              documentType === "report" ? "Reports" :
                              documentType === "content_calendar" ? "Content Calendar" :
                              documentType === "proposal" ? "Proposals" :
                              "Other";
        const subfolder = await getOrCreateClientSubfolder(clientFolder.folderId, subfolderName);
        folderId = subfolder.folderId;
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
      documentType: documentType || "other",
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

// Upload media-capable document types (currently: brand kit logos/images/PDFs)
router.post("/documents/upload-media", mediaUpload.single("file"), async (req, res) => {
  try {
    const { clientId, description, documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }
    if (!clientId) {
      return res.status(400).json({ success: false, message: "clientId is required" });
    }

    const { Document, Client } = req.app.locals.models;

    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const subfolderName = documentType === "brand_kit" ? "Brand Kit" : "Other";
    const subfolder = await getOrCreateClientSubfolder(clientFolder.folderId, subfolderName);

    const driveResult = await uploadFileToDrive(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      subfolder.folderId
    );

    const document = await Document.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileId: driveResult.fileId,
      driveLink: driveResult.googleUserContentLink,
      webViewLink: driveResult.webViewLink,
      googleUserContentLink: driveResult.googleUserContentLink,
      folderId: subfolder.folderId,
      clientId: parseInt(clientId),
      description: description || null,
      documentType: documentType || "other",
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.error("Error uploading media document:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload file",
      error: error.message,
    });
  }
});

// `page`/`limit` are optional — omitting them preserves the historical
// "return everything" behavior existing callers rely on.
router.get("/documents", async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const { clientId, documentType, page, limit } = req.query;

    const where = {};
    if (clientId) {
      where.clientId = parseInt(clientId);
    }
    if (documentType) {
      where.documentType = documentType;
    }
    // Push the admin-only-type exclusion into the query itself for
    // non-admins, instead of fetching every row and filtering in JS.
    if (req.user?.role !== "admin") {
      where.documentType = documentType
        ? ADMIN_ONLY_DOCUMENT_TYPES.includes(documentType)
          ? { [Op.in]: [] } // explicitly requested an admin-only type — matches nothing
          : documentType
        : { [Op.or]: [{ [Op.notIn]: ADMIN_ONLY_DOCUMENT_TYPES }, { [Op.is]: null }] };
    }

    const queryOptions = { where, order: [["createdAt", "DESC"]] };

    if (limit) {
      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page) || 1;
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;

      const { count, rows } = await Document.findAndCountAll(queryOptions);
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

    const documents = await Document.findAll(queryOptions);
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
    if (ADMIN_ONLY_DOCUMENT_TYPES.includes(document.documentType) && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
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
    if (ADMIN_ONLY_DOCUMENT_TYPES.includes(document.documentType) && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
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

// Agreement-specific routes
router.get("/agreements", requireAdminForAgreements, async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const { clientId, status } = req.query;

    const where = { documentType: "agreement" };
    if (clientId) where.clientId = parseInt(clientId);
    if (status) where.status = status;

    const agreements = await Document.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: agreements });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching agreements",
      error: error.message,
    });
  }
});

router.get("/agreements/:id", requireAdminForAgreements, async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const agreement = await Document.findOne({
      where: { id: req.params.id, documentType: "agreement" },
    });

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    res.json({ success: true, data: agreement });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching agreement",
      error: error.message,
    });
  }
});

router.put("/agreements/:id", requireAdminForAgreements, async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const { issuedDate, expiryDate, status, description } = req.body;

    const agreement = await Document.findOne({
      where: { id: req.params.id, documentType: "agreement" },
    });

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    // If status changed to active and was pending_signature, record signedAt
    const updateData = { issuedDate, expiryDate, status, description };
    if (status === "active" && agreement.status === "pending_signature") {
      updateData.signedAt = new Date();
    }

    await agreement.update(updateData);

    res.json({ success: true, message: "Agreement updated successfully", data: agreement });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating agreement",
      error: error.message,
    });
  }
});

router.delete("/agreements/:id", requireAdminForAgreements, async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const agreement = await Document.findOne({
      where: { id: req.params.id, documentType: "agreement" },
    });

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    await agreement.destroy();
    res.json({ success: true, message: "Agreement deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting agreement",
      error: error.message,
    });
  }
});

export default router;
