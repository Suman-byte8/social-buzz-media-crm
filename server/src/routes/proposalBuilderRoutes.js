import express from "express";
import multer from "multer";
import { Op } from "sequelize";
import { uploadFileToDrive, getOrCreateClientFolder, getOrCreateClientSubfolder } from "../utils/googleDrive.js";
import { wrapUpload } from "../middleware/multerUpload.js";
import { cacheRoute } from "../middleware/cacheRoute.js";
import { invalidateCache } from "../utils/serverCache.js";
import { requireAdmin } from "../middleware/auth.js";
import { getMasterProposalTemplate, interpolateProposalPages, normalizeProposalDocumentData } from "../utils/proposalTemplates.js";

const router = express.Router();

// Same admin-only gate the existing upload-based Proposals feature already
// applies (documentRoutes.js's ADMIN_ONLY_DOCUMENT_TYPES) — this is a
// parallel creation path for the same document type, so it gets the same
// restriction, applied to every route in this file.
router.use(requireAdmin);

// The rendered PDF+DOCX upload at export time — generated client-side
// (html2canvas + jsPDF for the PDF, the `docx` package for the DOCX — see
// client/src/lib/Pdfexport.js and tiptapToDocx.js), posted here as two
// files in one request.
const exportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "pdf" && file.mimetype === "application/pdf") return cb(null, true);
    if (file.fieldname === "docx" && file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return cb(null, true);
    cb(new Error("Only a PDF and/or DOCX file is allowed"), false);
  },
});

const parseJsonField = (raw, fallback = null) => {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

// Serializes a Proposal row for the API response — documentData and
// clientDataSnapshot come back as real objects, not JSON strings, same
// convention agreementBuilderRoutes.js's serializeAgreement follows.
// normalizeProposalDocumentData upgrades any row saved in an older shape on
// the way out, so the client never has to special-case it.
const serializeProposal = (proposal) => {
  const json = proposal.toJSON ? proposal.toJSON() : proposal;
  return {
    ...json,
    documentData: normalizeProposalDocumentData(parseJsonField(json.documentData, null)),
    clientDataSnapshot: parseJsonField(json.clientDataSnapshot, null),
  };
};

const canManageTemplate = (user, template) => user?.role === "admin" || template.createdBy === user?.name;

// Appends one row to the activity log — best-effort, same pattern as
// agreementBuilderRoutes.js's logActivity.
async function logActivity(models, proposalId, action, user, metadata) {
  try {
    await models.ProposalActivityLog.create({
      proposalId,
      action,
      userName: user?.name || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (err) {
    console.warn("Could not record proposal activity:", err.message);
  }
}

// "SBM/PROP/{year}/{###}" — same COUNT(*)+1-scoped-to-year-in-transaction
// approach as agreementBuilderRoutes.js's generateAgreementNumber.
async function generateProposalNumber(Proposal, transaction) {
  const year = new Date().getFullYear();
  const count = await Proposal.count({
    where: { createdAt: { [Op.gte]: new Date(`${year}-01-01`), [Op.lt]: new Date(`${year + 1}-01-01`) } },
    transaction,
  });
  const sequence = String(count + 1).padStart(3, "0");
  return `SBM/PROP/${year}/${sequence}`;
}

const formatLongDate = (date) => date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

// Values a client-selected proposal's placeholders resolve to right now —
// used both at creation and again at finalize time (to build
// clientDataSnapshot), same role agreementBuilderRoutes.js's
// buildInterpolationValues plays.
function buildInterpolationValues(clientRecord, agencySetting, { proposalNumber, dateOfIssue, validUntil }) {
  return {
    clientLegalName: clientRecord.legalName || clientRecord.name,
    clientContactPerson: clientRecord.contactPersonName || "",
    agencyEmail: agencySetting?.email || "",
    proposalNumber,
    dateOfIssue,
    validUntil,
  };
}

// ── Templates ────────────────────────────────────────────────────────────

router.get("/proposal-templates", async (req, res) => {
  try {
    const { ProposalTemplate } = req.app.locals.models;
    const savedTemplates = await ProposalTemplate.findAll({
      where: { [Op.or]: [{ isShared: true }, { createdBy: req.user?.name }] },
      order: [["createdAt", "DESC"]],
    });

    const master = getMasterProposalTemplate();
    const builtIn = [{ key: master.key, id: null, isBuiltIn: true, name: master.name, description: master.description, isShared: true }];

    const saved = savedTemplates.map((t) => {
      const json = t.toJSON();
      return {
        key: null,
        id: json.id,
        isBuiltIn: false,
        name: json.name,
        description: json.description,
        isShared: json.isShared,
        createdBy: json.createdBy,
        canManage: canManageTemplate(req.user, t),
      };
    });

    res.json({ success: true, data: [...builtIn, ...saved] });
  } catch (error) {
    console.error("Error fetching proposal templates:", error);
    res.status(500).json({ success: false, message: "Error fetching proposal templates", error: error.message });
  }
});

// Saves the current state of a proposal's documentData as a new reusable
// template — the editor's "Save as template" action.
router.post("/proposal-templates", async (req, res) => {
  try {
    const { name, description, isShared, proposalId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Template name is required" });
    if (!proposalId) return res.status(400).json({ success: false, message: "proposalId is required" });

    const { Proposal, ProposalTemplate } = req.app.locals.models;
    const sourceProposal = await Proposal.findByPk(parseInt(proposalId));
    if (!sourceProposal) return res.status(404).json({ success: false, message: "Proposal not found" });

    const template = await ProposalTemplate.create({
      name: name.trim(),
      description: description || null,
      documentData: sourceProposal.documentData,
      isShared: Boolean(isShared),
      createdBy: req.user?.name || null,
    });

    res.status(201).json({ success: true, message: "Template saved", data: { ...template.toJSON(), documentData: parseJsonField(template.documentData) } });
  } catch (error) {
    console.error("Error saving proposal template:", error);
    res.status(500).json({ success: false, message: "Error saving proposal template", error: error.message });
  }
});

router.put("/proposal-templates/:id", async (req, res) => {
  try {
    const { ProposalTemplate } = req.app.locals.models;
    const template = await ProposalTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    if (!canManageTemplate(req.user, template)) return res.status(403).json({ success: false, message: "You can only edit templates you created" });

    const { name, description, isShared } = req.body;
    await template.update({
      name: name !== undefined ? name : template.name,
      description: description !== undefined ? description : template.description,
      isShared: isShared !== undefined ? Boolean(isShared) : template.isShared,
    });

    res.json({ success: true, message: "Template updated", data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating template", error: error.message });
  }
});

router.delete("/proposal-templates/:id", async (req, res) => {
  try {
    const { ProposalTemplate } = req.app.locals.models;
    const template = await ProposalTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    if (!canManageTemplate(req.user, template)) return res.status(403).json({ success: false, message: "You can only delete templates you created" });
    await template.destroy();
    res.json({ success: true, message: "Template deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting template", error: error.message });
  }
});

// ── Proposals ────────────────────────────────────────────────────────────

router.get("/proposal-drafts", cacheRoute("proposal-drafts", 30), async (req, res) => {
  try {
    const { Proposal, Client } = req.app.locals.models;
    const { clientId, status, search, page = 1, limit = 24, trashed } = req.query;

    const where = {};
    where.deletedAt = trashed === "true" ? { [Op.not]: null } : null;
    if (clientId) where.clientId = parseInt(clientId);
    if (status) where.status = status;

    const include = [{ model: Client, as: "client", attributes: ["id", "name", "logo"] }];
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { proposalNumber: { [Op.iLike]: `%${search}%` } },
        { "$client.name$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page) || 1;

    const { count, rows } = await Proposal.findAndCountAll({
      where,
      include,
      order: [["updatedAt", "DESC"]],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      subQuery: false,
    });

    res.json({
      success: true,
      // documentData is the full editable document — list view only needs
      // metadata, same stripping agreementBuilderRoutes.js's GET uses.
      data: rows.map((r) => {
        const { documentData, clientDataSnapshot, ...rest } = r.toJSON();
        return rest;
      }),
      pagination: { total: count, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(count / parsedLimit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching proposals", error: error.message });
  }
});

router.get("/proposal-drafts/:id", async (req, res) => {
  try {
    const { Proposal, Client, Document } = req.app.locals.models;
    const proposal = await Proposal.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: "client",
          attributes: [
            "id", "name", "legalName", "contactPersonName", "email", "phoneNumber", "whatsappNumber",
            "address", "gstin", "logo", "website", "industry", "servicesSelected", "clientSince",
          ],
        },
        { model: Document, as: "exports" },
      ],
      // `order` inside an include only sorts eager-loaded *singular*
      // associations reliably — the top-level association-qualified form
      // is what actually sorts `exports` (same fix verified for Agreements).
      order: [[{ model: Document, as: "exports" }, "createdAt", "DESC"]],
    });
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });
    res.json({ success: true, data: serializeProposal(proposal) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching proposal", error: error.message });
  }
});

// Creates a draft: clones the chosen template (built-in master or a saved
// ProposalTemplate), bakes the client's current data + a freshly-generated
// proposal number/dates into its {{token}} placeholders, and saves it.
router.post("/proposal-drafts", async (req, res) => {
  try {
    const { clientId, templateId, title, dateOfIssue } = req.body;
    if (!clientId) return res.status(400).json({ success: false, message: "clientId is required" });

    const { Proposal, ProposalTemplate, Client, AgencySetting } = req.app.locals.models;
    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    let baseDocumentData;
    let resolvedTemplateId = null;
    if (templateId) {
      const template = await ProposalTemplate.findByPk(parseInt(templateId));
      if (!template) return res.status(404).json({ success: false, message: "Template not found" });
      baseDocumentData = normalizeProposalDocumentData(parseJsonField(template.documentData));
      resolvedTemplateId = template.id;
    } else {
      baseDocumentData = getMasterProposalTemplate().documentData;
    }

    const agencySetting = await AgencySetting.findOne();

    const sequelize = Proposal.sequelize;
    const result = await sequelize.transaction(async (transaction) => {
      const proposalNumber = await generateProposalNumber(Proposal, transaction);
      const issueDate = dateOfIssue ? new Date(dateOfIssue) : new Date();
      const validUntilDate = new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      const values = buildInterpolationValues(clientRecord, agencySetting, {
        proposalNumber,
        dateOfIssue: formatLongDate(issueDate),
        validUntil: formatLongDate(validUntilDate),
      });
      const documentData = interpolateProposalPages(baseDocumentData, values);

      return Proposal.create(
        {
          clientId: clientRecord.id,
          templateId: resolvedTemplateId,
          proposalNumber,
          title: title?.trim() || `${clientRecord.name} Proposal`,
          documentData: JSON.stringify(documentData),
          status: "draft",
          createdBy: req.user?.name || null,
          updatedBy: req.user?.name || null,
        },
        { transaction }
      );
    });

    await logActivity(req.app.locals.models, result.id, "created", req.user);
    await invalidateCache("proposal-drafts");
    res.status(201).json({ success: true, message: "Proposal created", data: serializeProposal(result) });
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({ success: false, message: "Error creating proposal", error: error.message });
  }
});

// Full save (manual Save + the editor's debounced autosave both hit this).
// Same expectedRevision optimistic-concurrency pattern as PUT /agreement-drafts/:id.
router.put("/proposal-drafts/:id", async (req, res) => {
  try {
    const { Proposal } = req.app.locals.models;
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });

    const { title, documentData, expectedRevision } = req.body;

    if (expectedRevision !== undefined && parseInt(expectedRevision) !== proposal.revision) {
      return res.status(409).json({
        success: false,
        message: "This proposal was changed elsewhere since you opened it.",
        data: serializeProposal(proposal),
      });
    }

    await proposal.update({
      title: title !== undefined ? title : proposal.title,
      documentData: documentData !== undefined ? JSON.stringify(documentData) : proposal.documentData,
      updatedBy: req.user?.name || proposal.updatedBy,
      revision: proposal.revision + 1,
    });

    await invalidateCache("proposal-drafts");
    res.json({ success: true, message: "Proposal saved", data: serializeProposal(proposal) });
  } catch (error) {
    console.error("Error saving proposal:", error);
    res.status(500).json({ success: false, message: "Error saving proposal", error: error.message });
  }
});

// Snapshots the current documentData into a new ProposalVersion, freezes
// the client data used (clientDataSnapshot), and advances status.
router.post("/proposal-drafts/:id/finalize", async (req, res) => {
  try {
    const { Proposal, ProposalVersion, Client, AgencySetting } = req.app.locals.models;
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });

    const clientRecord = await Client.findByPk(proposal.clientId);
    const agencySetting = await AgencySetting.findOne();
    const snapshot = clientRecord
      ? buildInterpolationValues(clientRecord, agencySetting, { proposalNumber: proposal.proposalNumber, dateOfIssue: "", validUntil: "" })
      : null;

    const lastVersion = await ProposalVersion.findOne({ where: { proposalId: proposal.id }, order: [["versionNumber", "DESC"]] });
    await ProposalVersion.create({
      proposalId: proposal.id,
      versionNumber: (lastVersion?.versionNumber || 0) + 1,
      documentData: proposal.documentData,
      savedBy: req.user?.name || null,
      note: req.body?.note || null,
    });

    await proposal.update({
      status: "ready_to_send",
      finalizedAt: new Date(),
      clientDataSnapshot: snapshot ? JSON.stringify(snapshot) : proposal.clientDataSnapshot,
      updatedBy: req.user?.name || proposal.updatedBy,
    });

    await logActivity(req.app.locals.models, proposal.id, "finalized", req.user);
    await invalidateCache("proposal-drafts");
    res.json({ success: true, message: "Proposal finalized", data: serializeProposal(proposal) });
  } catch (error) {
    console.error("Error finalizing proposal:", error);
    res.status(500).json({ success: false, message: "Error finalizing proposal", error: error.message });
  }
});

router.post("/proposal-drafts/:id/duplicate", async (req, res) => {
  try {
    const { Proposal } = req.app.locals.models;
    const source = await Proposal.findByPk(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: "Proposal not found" });

    const sequelize = Proposal.sequelize;
    const duplicated = await sequelize.transaction(async (transaction) => {
      const proposalNumber = await generateProposalNumber(Proposal, transaction);
      return Proposal.create(
        {
          clientId: source.clientId,
          templateId: source.templateId,
          proposalNumber,
          title: `${source.title} (Copy)`,
          documentData: source.documentData,
          status: "draft",
          createdBy: req.user?.name || null,
          updatedBy: req.user?.name || null,
        },
        { transaction }
      );
    });

    await logActivity(req.app.locals.models, duplicated.id, "created", req.user, { duplicatedFrom: source.id });
    await invalidateCache("proposal-drafts");
    res.status(201).json({ success: true, message: "Proposal duplicated", data: serializeProposal(duplicated) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error duplicating proposal", error: error.message });
  }
});

// Soft delete — moves to Trash. Previously exported Document rows are left
// untouched, same policy DELETE /agreement-drafts/:id follows.
router.delete("/proposal-drafts/:id", async (req, res) => {
  try {
    const { Proposal } = req.app.locals.models;
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });
    await proposal.update({ deletedAt: new Date() });
    await invalidateCache("proposal-drafts");
    res.json({ success: true, message: "Proposal moved to trash" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting proposal", error: error.message });
  }
});

router.post("/proposal-drafts/:id/restore", async (req, res) => {
  try {
    const { Proposal } = req.app.locals.models;
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });
    await proposal.update({ deletedAt: null });
    await invalidateCache("proposal-drafts");
    res.json({ success: true, message: "Proposal restored", data: serializeProposal(proposal) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error restoring proposal", error: error.message });
  }
});

// ── Export (upload the client-rendered PDF/DOCX, record the result) ────

router.post("/proposal-drafts/:id/export", wrapUpload(exportUpload.fields([{ name: "pdf", maxCount: 1 }, { name: "docx", maxCount: 1 }])), async (req, res) => {
  try {
    const { Proposal, Client, Document } = req.app.locals.models;
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });

    const pdfFile = req.files?.pdf?.[0];
    const docxFile = req.files?.docx?.[0];
    if (!pdfFile) return res.status(400).json({ success: false, message: "A PDF file is required" });

    const clientRecord = await Client.findByPk(proposal.clientId);
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    // Same per-client "Proposals" Drive subfolder the existing upload-based
    // flow already uses (documentRoutes.js) — a generated export lands
    // right alongside manually-uploaded proposals.
    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const proposalsFolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Proposals");

    const pdfResult = await uploadFileToDrive(pdfFile.buffer, pdfFile.originalname, pdfFile.mimetype, proposalsFolder.folderId);

    // The PDF is what the existing Proposals tab already knows how to
    // display — a new Document row per export (never overwritten), same
    // "export creates, never overwrites" pattern Agreement's export follows.
    const exportedDoc = await Document.create({
      fileName: pdfFile.originalname,
      fileType: pdfFile.mimetype,
      fileSize: pdfFile.size,
      fileId: pdfResult.fileId,
      driveLink: pdfResult.googleUserContentLink,
      webViewLink: pdfResult.webViewLink,
      googleUserContentLink: pdfResult.googleUserContentLink,
      folderId: proposalsFolder.folderId,
      clientId: clientRecord.id,
      proposalId: proposal.id,
      description: proposal.title,
      documentType: "proposal",
      status: "active",
    });

    let docxDoc = null;
    if (docxFile) {
      const docxResult = await uploadFileToDrive(docxFile.buffer, docxFile.originalname, docxFile.mimetype, proposalsFolder.folderId);
      docxDoc = await Document.create({
        fileName: docxFile.originalname,
        fileType: docxFile.mimetype,
        fileSize: docxFile.size,
        fileId: docxResult.fileId,
        driveLink: docxResult.googleUserContentLink,
        webViewLink: docxResult.webViewLink,
        googleUserContentLink: docxResult.googleUserContentLink,
        folderId: proposalsFolder.folderId,
        clientId: clientRecord.id,
        proposalId: proposal.id,
        description: `${proposal.title} (DOCX)`,
        documentType: "proposal",
      });
    }

    await proposal.update({ status: proposal.status === "draft" ? "pending_review" : proposal.status, updatedBy: req.user?.name || proposal.updatedBy });

    await logActivity(req.app.locals.models, proposal.id, "exported", req.user, { pdfDocumentId: exportedDoc.id, docxDocumentId: docxDoc?.id });
    await invalidateCache("proposal-drafts");
    await invalidateCache("documents");
    res.status(201).json({
      success: true,
      message: "Proposal exported and saved to Drive",
      data: { proposal: serializeProposal(proposal), pdfDocument: exportedDoc, docxDocument: docxDoc },
    });
  } catch (error) {
    console.error("Error exporting proposal:", error);
    res.status(500).json({ success: false, message: "Error exporting proposal", error: error.message });
  }
});

// ── Status, versions, activity ──────────────────────────────────────────

router.put("/proposal-drafts/:id/status", async (req, res) => {
  try {
    const { Proposal } = req.app.locals.models;
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });

    const { status } = req.body;
    const allowed = ["draft", "pending_review", "ready_to_send", "sent", "accepted", "declined", "expired", "cancelled", "archived"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

    const from = proposal.status;
    await proposal.update({ status, updatedBy: req.user?.name || proposal.updatedBy });

    await logActivity(req.app.locals.models, proposal.id, "status_changed", req.user, { from, to: status });
    await invalidateCache("proposal-drafts");
    res.json({ success: true, message: "Status updated", data: serializeProposal(proposal) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating status", error: error.message });
  }
});

router.get("/proposal-drafts/:id/versions", async (req, res) => {
  try {
    const { ProposalVersion } = req.app.locals.models;
    const versions = await ProposalVersion.findAll({
      where: { proposalId: req.params.id },
      order: [["versionNumber", "DESC"]],
      attributes: { exclude: ["documentData"] },
    });
    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching versions", error: error.message });
  }
});

router.post("/proposal-drafts/:id/versions/:versionId/restore", async (req, res) => {
  try {
    const { Proposal, ProposalVersion } = req.app.locals.models;
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });
    const version = await ProposalVersion.findOne({ where: { id: req.params.versionId, proposalId: proposal.id } });
    if (!version) return res.status(404).json({ success: false, message: "Version not found" });

    await proposal.update({
      documentData: version.documentData,
      revision: proposal.revision + 1,
      updatedBy: req.user?.name || proposal.updatedBy,
    });

    await logActivity(req.app.locals.models, proposal.id, "version_restored", req.user, { versionNumber: version.versionNumber });
    await invalidateCache("proposal-drafts");
    res.json({ success: true, message: "Version restored", data: serializeProposal(proposal) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error restoring version", error: error.message });
  }
});

router.get("/proposal-drafts/:id/activity", async (req, res) => {
  try {
    const { ProposalActivityLog } = req.app.locals.models;
    const logs = await ProposalActivityLog.findAll({
      where: { proposalId: req.params.id },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: logs.map((l) => ({ ...l.toJSON(), metadata: parseJsonField(l.metadata) })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching activity", error: error.message });
  }
});

export default router;
