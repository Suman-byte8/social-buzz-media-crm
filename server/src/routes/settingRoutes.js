import express from "express";
import multer from "multer";
import { uploadFileToDrive, getFileStreamFromDrive } from "../utils/googleDrive.js";
import { encryptPassword, decryptPassword, comparePassword } from "../utils/password.js";

const router = express.Router();

// Multer in-memory storage with 5MB file limit
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit validation
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (PNG, JPG, JPEG, WEBP, SVG) are allowed!"), false);
    }
  },
});

// Helper to get or initialize agency settings row
const getOrCreateSettings = async (AgencySetting) => {
  let settings = await AgencySetting.findOne();
  if (!settings) {
    settings = await AgencySetting.create({
      logo: null,
      name: null,
      email: null,
      website: null,
      address: null,
      gstNumber: null,
      password: null,
    });
  }
  return settings;
};

// GET /api/settings or /api/settings/general - Get agency settings with DECRYPTED password
const handleGetSettings = async (req, res) => {
  try {
    const { AgencySetting } = req.app.locals.models;
    const settings = await getOrCreateSettings(AgencySetting);
    
    const settingsJson = settings.toJSON();
    // Decrypt stored password so frontend receives plain text password
    settingsJson.password = decryptPassword(settings.password);

    res.json({ success: true, data: settingsJson });
  } catch (error) {
    console.error("Error fetching agency settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching agency settings",
      error: error.message,
    });
  }
};

router.get("/settings", handleGetSettings);
router.get("/settings/general", handleGetSettings);

// POST or PUT /api/settings or /api/settings/general - Save/Update agency settings with ENCRYPTED password
const handleUpdateSettings = async (req, res) => {
  try {
    const { AgencySetting } = req.app.locals.models;
    const settings = await getOrCreateSettings(AgencySetting);

    const {
      logo,
      name,
      email,
      website,
      address,
      gstNumber,
      gst_number,
      password,
    } = req.body;

    let updatedPassword = settings.password;
    if (password !== undefined && password !== null) {
      updatedPassword = encryptPassword(password);
    }

    const updateData = {
      logo: logo !== undefined ? logo : settings.logo,
      name: name !== undefined ? name : settings.name,
      email: email !== undefined ? email : settings.email,
      website: website !== undefined ? website : settings.website,
      address: address !== undefined ? address : settings.address,
      gstNumber: (gstNumber || gst_number) !== undefined ? (gstNumber || gst_number) : settings.gstNumber,
      password: updatedPassword,
    };

    await settings.update(updateData);

    const responseJson = settings.toJSON();
    responseJson.password = decryptPassword(settings.password);

    res.json({
      success: true,
      message: "Agency settings updated successfully",
      data: responseJson,
    });
  } catch (error) {
    console.error("Error updating agency settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating agency settings",
      error: error.message,
    });
  }
};

router.post("/settings", handleUpdateSettings);
router.post("/settings/general", handleUpdateSettings);
router.put("/settings", handleUpdateSettings);
router.put("/settings/general", handleUpdateSettings);

// POST /api/settings/verify-password - Verify password matching
router.post("/settings/verify-password", async (req, res) => {
  try {
    const { AgencySetting } = req.app.locals.models;
    const settings = await getOrCreateSettings(AgencySetting);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const isMatch = comparePassword(password, settings.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, isMatch: false, message: "Password does not match" });
    }

    res.json({ success: true, isMatch: true, message: "Password matches successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error verifying password", error: error.message });
  }
});

// GET /api/settings/logo-proxy/:fileId - Proxy Google Drive image stream directly to browser
router.get("/settings/logo-proxy/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileStream = await getFileStreamFromDrive(fileId);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error proxying Google Drive logo:", error.message);
    res.redirect(`https://drive.google.com/thumbnail?id=${req.params.fileId}&sz=w1000`);
  }
});

// POST /api/settings/upload-logo - Upload agency logo to Google Drive
const handleLogoUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No logo file provided or file exceeds 5MB limit" });
    }

    const driveResult = await uploadFileToDrive(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const logoUrl = driveResult.proxyLink;

    const { AgencySetting } = req.app.locals.models;
    const settings = await getOrCreateSettings(AgencySetting);
    await settings.update({ logo: logoUrl });

    const responseData = settings.toJSON();
    responseData.password = decryptPassword(settings.password);

    res.json({
      success: true,
      message: "Logo uploaded to Google Drive successfully",
      logoUrl: logoUrl,
      fileId: driveResult.fileId,
      googleUserContentLink: driveResult.googleUserContentLink,
      thumbnailLink: driveResult.thumbnailLink,
      webViewLink: driveResult.webViewLink,
      data: responseData,
    });
  } catch (error) {
    console.error("Error uploading logo to Google Drive:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload logo to Google Drive",
    });
  }
};

router.post("/settings/upload-logo", upload.single("logo"), handleLogoUpload);
router.post("/settings/upload-logo/file", upload.single("file"), handleLogoUpload);

// Debug endpoint - check raw DB password vs decrypted
router.get("/settings/debug-password", async (req, res) => {
  try {
    const { AgencySetting } = req.app.locals.models;
    const settings = await AgencySetting.findOne();
    if (!settings) {
      return res.json({ success: true, message: "No settings found" });
    }
    
    const rawPassword = settings.password;
    const { decryptPassword } = await import("../utils/password.js");
    const decrypted = decryptPassword(rawPassword);
    
    res.json({
      success: true,
      rawPassword: rawPassword,
      decryptedPassword: decrypted,
      isEncrypted: rawPassword && rawPassword.startsWith("enc:")
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
