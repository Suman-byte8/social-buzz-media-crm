import express from "express";
import multer from "multer";
import { 
  uploadFileToDrive,
  getFileStreamFromDrive,
  getOrCreateClientFolder,
  getOrCreateClientSubfolder,
  performGoogleDriveApiRequest
} from "../utils/googleDrive.js";
import { Document } from "../models/Document.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname?.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  }
});

/**
 * @route POST /api/agreements
 * @desc Upload a new agreement
 * @body { file: FormData, clientId, issuedDate, expiryDate, status, description }
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const {
      clientId,
      issuedDate,
      expiryDate,
      status = "active",
      description = ""
    } = req.body;

    // Validate fields
    if (!clientId || !file) {
      return res.status(400).json({ message: "Client ID and file are required" });
    }

    const driveResult = await uploadFileToDrive(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      // Get or create Agreements subfolder
      await getOrCreateClientSubfolder(await getOrCreateClientFolder("Placeholder", 0), "Agreements")
    );

    const document = await Document.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileId: driveResult.fileId,
      driveLink: driveResult.driveLink,
      folderId: driveResult.folderId,
      clientId,
      documentType: "agreement",
      issuedDate,
      expiryDate,
      status,
      description
    });

    res.status(201).json({
      success: true,
      message: "Agreement uploaded successfully",
      data: document
    });
  } catch (error) {
    console.error("Error uploading agreement:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error uploading agreement",
      error: error.message
    });
  }
});

/**
 * @route GET /api/agreements
 * @desc Get all agreements (optionally filtered by clientId)
 */
router.get("/", async (req, res) => {
  try {
    const { clientId } = req.query;
    
    let whereClause = { documentType: "agreement" };
    
    if (clientId) {
      whereClause.clientId = clientId;
    }

    const agreements = await Document.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: agreements });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching agreements",
      error: error.message 
    });
  }
});

/**
 * @route PUT /api/agreements/:id
 * @desc Update an agreement
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const agreement = await Document.findOne({
      where: { id, documentType: "agreement" }
    });

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    await agreement.update(updateData);
    res.json({
      success: true,
      message: "Agreement updated successfully",
      data: agreement
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error updating agreement",
      error: error.message 
    });
  }
});

/**
 * @route DELETE /api/agreements/:id
 * @desc Delete an agreement
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const agreement = await Document.findOne({
      where: { id, documentType: "agreement" }
    });

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    await agreement.destroy();
    res.json({ success: true, message: "Agreement deleted successfully" });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error deleting agreement",
      error: error.message 
    });
  }
});

export default router;