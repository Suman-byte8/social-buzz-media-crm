import express from "express";
import multer from "multer";
import {
  uploadFileToDrive,
  getOrCreateTeamMembersFolder,
  getOrCreateClientSubfolder,
} from "../utils/googleDrive.js";

const router = express.Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Profile image must be a PNG file"), false);
    }
  },
});

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Helper to format array or object values to text/JSON
const formatField = (val) => {
  if (val === undefined || val === null) return null;
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === "object") return JSON.stringify(val);
  return val;
};

// Helper to safely parse dates without producing Invalid Date errors
const parseDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// POST /api/team-members - Create a new team member
router.post("/team-members", async (req, res) => {
  try {
    const { TeamMember } = req.app.locals.models;
    const {
      // 1. Personal & Contact Information
      name,
      email,
      number,
      phoneNumber,
      whatsappNumber,
      whatsapp_number,
      address,
      aadharNumber,
      aadhar_number,
      avatar,
      profileImage,
      profile_image,
      resume,
      bankDetails,
      bank_details,

      // 2. Job & Position Details
      designation,
      department,
      employmentType,
      type_of_employment,
      hireDate,
      hire_date,
      managerReportTo,
      manager_report_to,

      // 3. Work & Status Details
      status = null,
      assignedWorks,
      assigned_works = null,
      clientHandling,
      client_handling = null,
    } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Team member name is required" });
    }

    const memberData = {
      // Personal & Contact Information
      name,
      email: email || null,
      number: number || phoneNumber || null,
      whatsappNumber: whatsappNumber || whatsapp_number || null,
      address: address || null,
      aadharNumber: aadharNumber || aadhar_number || null,
      avatar: avatar || profileImage || profile_image || null,
      resume: resume || null,
      bankDetails: formatField(bankDetails !== undefined ? bankDetails : bank_details),

      // Job & Position Details
      designation: designation || null,
      department: department || designation || null,
      employmentType: employmentType || type_of_employment || null,
      hireDate: parseDate(hireDate || hire_date),
      managerReportTo: managerReportTo || manager_report_to || null,

      // Work & Status Details
      status: status !== undefined ? status : null,
      assignedWorks: formatField(
        assignedWorks !== undefined ? assignedWorks : assigned_works,
      ),
      clientHandling: formatField(
        clientHandling !== undefined ? clientHandling : client_handling,
      ),
    };

    const teamMember = await TeamMember.create(memberData);

    res.status(201).json({
      success: true,
      message: "Team member added successfully",
      data: teamMember,
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    res.status(500).json({
      success: false,
      message: "Error adding team member",
      error: error.message,
    });
  }
});

// GET /api/team-members - Get all team members
// `page`/`limit` are optional — omitting them preserves the historical
// "return everything" behavior existing callers rely on; passing them
// opts into paginated results plus a `pagination` block, same shape as
// the clients/tasks endpoints.
router.get("/team-members", async (req, res) => {
  try {
    const { TeamMember } = req.app.locals.models;
    const { page, limit } = req.query;
    const queryOptions = { order: [["createdAt", "DESC"]] };

    if (limit) {
      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page) || 1;
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;

      const { count, rows } = await TeamMember.findAndCountAll(queryOptions);
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

    const teamMembers = await TeamMember.findAll(queryOptions);
    res.json({ success: true, data: teamMembers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching team members",
      error: error.message,
    });
  }
});

// GET /api/team-members/:id - Get team member by ID
router.get("/team-members/:id", async (req, res) => {
  try {
    const { TeamMember } = req.app.locals.models;
    const teamMember = await TeamMember.findByPk(req.params.id);
    if (!teamMember) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found" });
    }
    res.json({ success: true, data: teamMember });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching team member",
      error: error.message,
    });
  }
});

// PUT /api/team-members/:id - Update team member
router.put("/team-members/:id", async (req, res) => {
  try {
    const { TeamMember } = req.app.locals.models;
    const teamMember = await TeamMember.findByPk(req.params.id);
    if (!teamMember) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found" });
    }

    const {
      name,
      email,
      number,
      phoneNumber,
      whatsappNumber,
      whatsapp_number,
      address,
      aadharNumber,
      aadhar_number,
      avatar,
      profileImage,
      profile_image,
      resume,
      bankDetails,
      bank_details,
      designation,
      department,
      employmentType,
      type_of_employment,
      hireDate,
      hire_date,
      managerReportTo,
      manager_report_to,
      status,
      assignedWorks,
      assigned_works,
      clientHandling,
      client_handling,
    } = req.body;

    const updateData = {
      name: name ?? teamMember.name,
      email: email !== undefined ? email : teamMember.email,
      number:
        (number || phoneNumber) !== undefined
          ? number || phoneNumber
          : teamMember.number,
      whatsappNumber:
        (whatsappNumber || whatsapp_number) !== undefined
          ? whatsappNumber || whatsapp_number
          : teamMember.whatsappNumber,
      address: address !== undefined ? address : teamMember.address,
      aadharNumber:
        (aadharNumber || aadhar_number) !== undefined
          ? aadharNumber || aadhar_number
          : teamMember.aadharNumber,
      avatar:
        (avatar || profileImage || profile_image) !== undefined
          ? avatar || profileImage || profile_image
          : teamMember.avatar,
      resume: resume !== undefined ? resume : teamMember.resume,
      bankDetails:
        bankDetails !== undefined || bank_details !== undefined
          ? formatField(bankDetails ?? bank_details)
          : teamMember.bankDetails,
      designation:
        designation !== undefined ? designation : teamMember.designation,
      department: department !== undefined ? department : teamMember.department,
      employmentType:
        (employmentType || type_of_employment) !== undefined
          ? employmentType || type_of_employment
          : teamMember.employmentType,
      hireDate:
        hireDate !== undefined || hire_date !== undefined
          ? parseDate(hireDate ?? hire_date)
          : teamMember.hireDate,
      managerReportTo:
        (managerReportTo || manager_report_to) !== undefined
          ? managerReportTo || manager_report_to
          : teamMember.managerReportTo,
      status: status !== undefined ? status : teamMember.status,
      assignedWorks:
        assignedWorks !== undefined || assigned_works !== undefined
          ? formatField(assignedWorks ?? assigned_works)
          : teamMember.assignedWorks,
      clientHandling:
        clientHandling !== undefined || client_handling !== undefined
          ? formatField(clientHandling ?? client_handling)
          : teamMember.clientHandling,
    };

    await teamMember.update(updateData);

    res.json({
      success: true,
      message: "Team member updated successfully",
      data: teamMember,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating team member",
      error: error.message,
    });
  }
});

// POST /api/team-members/:id/upload-avatar - Upload/replace a member's
// profile photo. Stored in Google Drive (Team Members/<member name>/),
// same pattern as client logos — the DB column just holds the resulting
// proxy link, not the file itself.
router.post("/team-members/:id/upload-avatar", avatarUpload.single("avatar"), async (req, res) => {
  try {
    const { TeamMember } = req.app.locals.models;
    const teamMember = await TeamMember.findByPk(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ success: false, message: "Team member not found" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided, or it exceeds the 1MB limit / isn't a PNG" });
    }

    const teamFolder = await getOrCreateTeamMembersFolder();
    const memberFolder = await getOrCreateClientSubfolder(teamFolder.folderId, teamMember.name);
    const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, memberFolder.folderId);

    await teamMember.update({ avatar: driveResult.proxyLink });

    res.json({ success: true, message: "Profile image uploaded successfully", data: teamMember });
  } catch (error) {
    console.error("Error uploading team member avatar:", error);
    res.status(500).json({ success: false, message: error.message || "Error uploading profile image", error: error.message });
  }
});

// POST /api/team-members/:id/upload-resume - Upload/replace a member's resume.
router.post("/team-members/:id/upload-resume", resumeUpload.single("resume"), async (req, res) => {
  try {
    const { TeamMember } = req.app.locals.models;
    const teamMember = await TeamMember.findByPk(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ success: false, message: "Team member not found" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided, or it exceeds the 10MB limit" });
    }

    const teamFolder = await getOrCreateTeamMembersFolder();
    const memberFolder = await getOrCreateClientSubfolder(teamFolder.folderId, teamMember.name);
    const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, memberFolder.folderId);

    await teamMember.update({ resume: driveResult.proxyLink });

    res.json({ success: true, message: "Resume uploaded successfully", data: teamMember });
  } catch (error) {
    console.error("Error uploading team member resume:", error);
    res.status(500).json({ success: false, message: error.message || "Error uploading resume", error: error.message });
  }
});

// DELETE /api/team-members/:id - Delete team member
router.delete("/team-members/:id", async (req, res) => {
  try {
    const { TeamMember } = req.app.locals.models;
    const teamMember = await TeamMember.findByPk(req.params.id);
    if (!teamMember) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found" });
    }

    await teamMember.destroy();
    res.json({ success: true, message: "Team member deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting team member",
      error: error.message,
    });
  }
});

export default router;
