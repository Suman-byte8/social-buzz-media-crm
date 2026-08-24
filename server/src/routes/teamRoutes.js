import express from "express";

const router = express.Router();

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
router.get("/team-members", async (req, res) => {
  try {
    const { TeamMember } = req.app.locals.models;
    const teamMembers = await TeamMember.findAll({
      order: [["createdAt", "DESC"]],
    });
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
