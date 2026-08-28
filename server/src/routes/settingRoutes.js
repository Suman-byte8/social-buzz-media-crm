import express from "express";
import multer from "multer";
import { uploadFileToDrive, getFileBufferFromDrive } from "../utils/googleDrive.js";
import { getCachedFile, setCachedFile } from "../utils/fileCache.js";
import { encryptPassword, decryptPassword, comparePassword } from "../utils/password.js";
import { encryptText } from "../utils/encryption.js";
import { requireAdmin } from "../middleware/auth.js";

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
    // The email/password fields double as the admin's login credentials
    // (see handleUpdateSettings), so only the admin gets to see the password.
    settingsJson.password = req.user?.role === "admin" ? decryptPassword(settings.password) : "";

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

router.get("/settings", requireAdmin, handleGetSettings);
router.get("/settings/general", requireAdmin, handleGetSettings);

// POST or PUT /api/settings or /api/settings/general - Save/Update agency settings with ENCRYPTED password
const handleUpdateSettings = async (req, res) => {
  try {
    const { AgencySetting, User } = req.app.locals.models;
    const settings = await getOrCreateSettings(AgencySetting);
    const isAdmin = req.user?.role === "admin";

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

    // Email/password here double as the admin's login credentials, so only
    // the admin may change them — anyone else editing Settings must not be
    // able to hijack or lock out the admin account through this form.
    let updatedPassword = settings.password;
    if (isAdmin && password !== undefined && password !== null) {
      updatedPassword = encryptPassword(password);
    }

    const updateData = {
      logo: logo !== undefined ? logo : settings.logo,
      name: name !== undefined ? name : settings.name,
      email: isAdmin && email !== undefined ? email : settings.email,
      website: website !== undefined ? website : settings.website,
      address: address !== undefined ? address : settings.address,
      gstNumber: (gstNumber || gst_number) !== undefined ? (gstNumber || gst_number) : settings.gstNumber,
      password: updatedPassword,
    };

    await settings.update(updateData);

    if (isAdmin && (email !== undefined || password !== undefined)) {
      const adminUser = await User.findOne({ where: { role: "admin" } });
      if (adminUser) {
        const adminUpdate = {};
        if (email !== undefined && email) adminUpdate.email = String(email).trim().toLowerCase();
        if (password !== undefined && password) adminUpdate.password = encryptText(password);
        if (Object.keys(adminUpdate).length > 0) {
          await adminUser.update(adminUpdate);
        }
      }
    }

    const responseJson = settings.toJSON();
    responseJson.password = isAdmin ? decryptPassword(settings.password) : "";

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

router.post("/settings", requireAdmin, handleUpdateSettings);
router.post("/settings/general", requireAdmin, handleUpdateSettings);
router.put("/settings", requireAdmin, handleUpdateSettings);
router.put("/settings/general", requireAdmin, handleUpdateSettings);

// POST /api/settings/verify-password - Verify password matching
router.post("/settings/verify-password", requireAdmin, async (req, res) => {
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

    let cached = getCachedFile(fileId);
    if (!cached) {
      const { buffer, contentType } = await getFileBufferFromDrive(fileId);
      setCachedFile(fileId, buffer, contentType);
      cached = { buffer, contentType };
    }

    res.setHeader("Content-Type", cached.contentType || "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(cached.buffer);
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

router.post("/settings/upload-logo", requireAdmin, upload.single("logo"), handleLogoUpload);
router.post("/settings/upload-logo/file", requireAdmin, upload.single("file"), handleLogoUpload);

export default router;
