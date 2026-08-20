import express from "express";

const router = express.Router();

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

// GET /api/settings or /api/settings/general - Get agency settings
const handleGetSettings = async (req, res) => {
  try {
    const { AgencySetting } = req.app.locals.models;
    const settings = await getOrCreateSettings(AgencySetting);
    res.json({ success: true, data: settings });
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

// POST or PUT /api/settings or /api/settings/general - Save/Update agency settings
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

    const updateData = {
      logo: logo !== undefined ? logo : settings.logo,
      name: name !== undefined ? name : settings.name,
      email: email !== undefined ? email : settings.email,
      website: website !== undefined ? website : settings.website,
      address: address !== undefined ? address : settings.address,
      gstNumber: (gstNumber || gst_number) !== undefined ? (gstNumber || gst_number) : settings.gstNumber,
      password: password !== undefined ? password : settings.password,
    };

    await settings.update(updateData);

    res.json({
      success: true,
      message: "Agency settings updated successfully",
      data: settings,
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

export default router;
