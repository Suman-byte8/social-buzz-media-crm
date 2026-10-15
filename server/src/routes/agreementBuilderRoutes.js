import express from "express";
import multer from "multer";
import { Op } from "sequelize";
import { uploadFileToDrive, getOrCreateClientFolder, getOrCreateClientSubfolder, trashFileInDrive } from "../utils/googleDrive.js";
import { wrapUpload } from "../middleware/multerUpload.js";
import { cacheRoute } from "../middleware/cacheRoute.js";
import { invalidateCache } from "../utils/serverCache.js";
import { requireAdmin } from "../middleware/auth.js";
import { getMasterAgreementTemplate, interpolateAgreementDocument } from "../utils/agreementTemplates.js";

const router = express.Router();

// Same admin-only gate the existing upload-based Agreements feature already
// applies (documentRoutes.js's ADMIN_ONLY_DOCUMENT_TYPES) — this is a
// parallel creation path for the same document type, so it gets the same
// restriction, applied to every route in this file.
router.use(requireAdmin);

// The rendered PDF+DOCX upload at export time — generated client-side
// (html2canvas + jsPDF for the PDF, the `docx` package for the DOCX — see
// client/src/lib/agreementPagination.js and tiptapToDocx.js), posted here
// as two files in one request.
const exportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "pdf" && file.mimetype === "application/pdf") return cb(null, true);
    if (file.fieldname === "docx" && file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return cb(null, true);
    cb(new Error("Only a PDF and/or DOCX file is allowed"), false);
  },
});

// A signed copy the client sends back — any common scan/photo format, not
// just PDF, since this is often a phone photo of a physically-signed page.
const signedCopyUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only a PDF, PNG, or JPG file is allowed"), false);
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

// Serializes an Agreement row for the API response — documentData and
// clientDataSnapshot come back as real objects, not JSON strings, same
// parse-before-send convention reportRoutes.js's serializeReport follows.
const serializeAgreement = (agreement) => {
  const json = agreement.toJSON ? agreement.toJSON() : agreement;
  return {
    ...json,
    documentData: parseJsonField(json.documentData, { type: "doc", content: [] }),
    clientDataSnapshot: parseJsonField(json.clientDataSnapshot, null),
  };
};

const canManageTemplate = (user, template) => user?.role === "admin" || template.createdBy === user?.name;

// Appends one row to the activity log — best-effort (a logging failure
// should never fail the actual action it's recording).
async function logActivity(models, agreementId, action, user, metadata) {
  try {
    await models.AgreementActivityLog.create({
      agreementId,
      action,
      userName: user?.name || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (err) {
    console.warn("Could not record agreement activity:", err.message);
  }
}

// "SBM/AGR/{year}/{###}" — the 3-digit sequence is COUNT(*)+1 scoped to the
// current year, computed in the same transaction as the Agreement.create()
// call immediately after this to minimize (not formally eliminate — a
// reasonable tradeoff for this agency's actual concurrency) the race
// between two agreements being created at the same moment.
async function generateAgreementNumber(Agreement, transaction) {
  const year = new Date().getFullYear();
  const count = await Agreement.count({
    where: { createdAt: { [Op.gte]: new Date(`${year}-01-01`), [Op.lt]: new Date(`${year + 1}-01-01`) } },
    transaction,
  });
  const sequence = String(count + 1).padStart(3, "0");
  return `SBM/AGR/${year}/${sequence}`;
}

// Values a client-selected agreement's placeholders resolve to right now —
// used both at creation (baked into documentData immediately, same
// {{token}}-replace-once approach reportTemplates.js's coverPage() uses)
// and again at finalize time (to build clientDataSnapshot).
function buildInterpolationValues(clientRecord, agencySetting, { agreementNumber, effectiveDate }) {
  return {
    clientLegalName: clientRecord.legalName || clientRecord.name,
    clientContactPerson: clientRecord.contactPersonName || "",
    clientEmail: clientRecord.email || "",
    clientPhone: clientRecord.phoneNumber || "",
    clientAddress: clientRecord.address || "",
    clientGstin: clientRecord.gstin || "",
    agencyRepresentative: "Samim Akhter",
    agencyAddress: agencySetting?.address || "",
    agencyGstin: agencySetting?.gstNumber || "",
    agencyEmail: agencySetting?.email || "",
    agreementNumber,
    effectiveDate: effectiveDate || "",
  };
}

// ── Templates ────────────────────────────────────────────────────────────

router.get("/agreement-templates", async (req, res) => {
  try {
    const { AgreementTemplate } = req.app.locals.models;
    const savedTemplates = await AgreementTemplate.findAll({
      where: { [Op.or]: [{ isShared: true }, { createdBy: req.user?.name }] },
      order: [["createdAt", "DESC"]],
    });

    const master = getMasterAgreementTemplate();
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
    console.error("Error fetching agreement templates:", error);
    res.status(500).json({ success: false, message: "Error fetching agreement templates", error: error.message });
  }
});

// Saves the current state of an agreement's documentData as a new reusable
// template — the editor's "Save as template" action, same pattern as
// Report's POST /report-templates.
router.post("/agreement-templates", async (req, res) => {
  try {
    const { name, description, isShared, agreementId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Template name is required" });
    if (!agreementId) return res.status(400).json({ success: false, message: "agreementId is required" });

    const { Agreement, AgreementTemplate } = req.app.locals.models;
    const sourceAgreement = await Agreement.findByPk(parseInt(agreementId));
    if (!sourceAgreement) return res.status(404).json({ success: false, message: "Agreement not found" });

    const template = await AgreementTemplate.create({
      name: name.trim(),
      description: description || null,
      documentData: sourceAgreement.documentData,
      isShared: Boolean(isShared),
      createdBy: req.user?.name || null,
    });

    res.status(201).json({ success: true, message: "Template saved", data: { ...template.toJSON(), documentData: parseJsonField(template.documentData) } });
  } catch (error) {
    console.error("Error saving agreement template:", error);
    res.status(500).json({ success: false, message: "Error saving agreement template", error: error.message });
  }
});

router.put("/agreement-templates/:id", async (req, res) => {
  try {
    const { AgreementTemplate } = req.app.locals.models;
    const template = await AgreementTemplate.findByPk(req.params.id);
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

router.delete("/agreement-templates/:id", async (req, res) => {
  try {
    const { AgreementTemplate } = req.app.locals.models;
    const template = await AgreementTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    if (!canManageTemplate(req.user, template)) return res.status(403).json({ success: false, message: "You can only delete templates you created" });
    await template.destroy();
    res.json({ success: true, message: "Template deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting template", error: error.message });
  }
});

// ── Agreements ───────────────────────────────────────────────────────────

router.get("/agreement-drafts", cacheRoute("agreement-drafts", 30), async (req, res) => {
  try {
    const { Agreement, Client } = req.app.locals.models;
    const { clientId, status, search, page = 1, limit = 24, trashed } = req.query;

    const where = {};
    where.deletedAt = trashed === "true" ? { [Op.not]: null } : null;
    if (clientId) where.clientId = parseInt(clientId);
    if (status) where.status = status;

    const include = [{ model: Client, as: "client", attributes: ["id", "name", "logo"] }];
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { agreementNumber: { [Op.iLike]: `%${search}%` } },
        { "$client.name$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page) || 1;

    const { count, rows } = await Agreement.findAndCountAll({
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
      // metadata, same stripping reportRoutes.js's GET /reports does.
      data: rows.map((r) => {
        const { documentData, clientDataSnapshot, ...rest } = r.toJSON();
        return rest;
      }),
      pagination: { total: count, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(count / parsedLimit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching agreements", error: error.message });
  }
});

router.get("/agreement-drafts/:id", async (req, res) => {
  try {
    const { Agreement, Client, Document } = req.app.locals.models;
    // Full editor view needs more than the list card does — the
    // Placeholder sidebar inserts these real values (not raw {{tokens}},
    // which only get resolved once at creation — see
    // buildInterpolationValues) so a user re-inserting a field later still
    // gets something meaningful rather than literal unresolved text.
    // `exports` (this agreement's Document rows) is what lets the editor's
    // Email/WhatsApp actions target the latest exported PDF.
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [
        { model: Client, as: "client", attributes: ["id", "name", "legalName", "contactPersonName", "email", "phoneNumber", "whatsappNumber", "address", "gstin", "logo"] },
        { model: Document, as: "exports" },
      ],
      // `order` inside an include only sorts eager-loaded *singular*
      // associations reliably — for a hasMany like this it's silently
      // ignored, so the association-qualified form at the top level is
      // what actually sorts `exports` (verified against the live DB).
      order: [[{ model: Document, as: "exports" }, "createdAt", "DESC"]],
    });
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });
    res.json({ success: true, data: serializeAgreement(agreement) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching agreement", error: error.message });
  }
});

// Creates a draft: clones the chosen template (built-in master or a saved
// AgreementTemplate), bakes the client's current data + a freshly-generated
// agreement number into its {{token}} placeholders, and saves it.
router.post("/agreement-drafts", async (req, res) => {
  try {
    const { clientId, templateId, title, effectiveDate } = req.body;
    if (!clientId) return res.status(400).json({ success: false, message: "clientId is required" });

    const { Agreement, AgreementTemplate, Client, AgencySetting } = req.app.locals.models;
    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    let baseDocumentData;
    let resolvedTemplateId = null;
    if (templateId) {
      const template = await AgreementTemplate.findByPk(parseInt(templateId));
      if (!template) return res.status(404).json({ success: false, message: "Template not found" });
      baseDocumentData = parseJsonField(template.documentData);
      resolvedTemplateId = template.id;
    } else {
      baseDocumentData = getMasterAgreementTemplate().documentData;
    }

    const agencySetting = await AgencySetting.findOne();

    const sequelize = Agreement.sequelize;
    const result = await sequelize.transaction(async (transaction) => {
      const agreementNumber = await generateAgreementNumber(Agreement, transaction);
      const values = buildInterpolationValues(clientRecord, agencySetting, { agreementNumber, effectiveDate });
      const documentData = interpolateAgreementDocument(baseDocumentData, values);

      return Agreement.create(
        {
          clientId: clientRecord.id,
          templateId: resolvedTemplateId,
          agreementNumber,
          title: title?.trim() || `${clientRecord.name} Service Agreement`,
          documentData: JSON.stringify(documentData),
          status: "draft",
          createdBy: req.user?.name || null,
          updatedBy: req.user?.name || null,
        },
        { transaction }
      );
    });

    await logActivity(req.app.locals.models, result.id, "created", req.user);
    await invalidateCache("agreement-drafts");
    res.status(201).json({ success: true, message: "Agreement created", data: serializeAgreement(result) });
  } catch (error) {
    console.error("Error creating agreement:", error);
    res.status(500).json({ success: false, message: "Error creating agreement", error: error.message });
  }
});

// Full save (manual Save + the editor's debounced autosave both hit this).
// Same expectedRevision optimistic-concurrency pattern as PUT /reports/:id.
router.put("/agreement-drafts/:id", async (req, res) => {
  try {
    const { Agreement } = req.app.locals.models;
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });

    const { title, documentData, expectedRevision } = req.body;

    if (expectedRevision !== undefined && parseInt(expectedRevision) !== agreement.revision) {
      return res.status(409).json({
        success: false,
        message: "This agreement was changed elsewhere since you opened it.",
        data: serializeAgreement(agreement),
      });
    }

    await agreement.update({
      title: title !== undefined ? title : agreement.title,
      documentData: documentData !== undefined ? JSON.stringify(documentData) : agreement.documentData,
      updatedBy: req.user?.name || agreement.updatedBy,
      revision: agreement.revision + 1,
    });

    await invalidateCache("agreement-drafts");
    res.json({ success: true, message: "Agreement saved", data: serializeAgreement(agreement) });
  } catch (error) {
    console.error("Error saving agreement:", error);
    res.status(500).json({ success: false, message: "Error saving agreement", error: error.message });
  }
});

// Snapshots the current documentData into a new AgreementVersion, freezes
// the client data used (clientDataSnapshot), and advances status — the
// spec's own stated default: a finalized agreement's recorded client data
// never silently drifts if the Client record is edited afterward.
router.post("/agreement-drafts/:id/finalize", async (req, res) => {
  try {
    const { Agreement, AgreementVersion, Client, AgencySetting } = req.app.locals.models;
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });

    const clientRecord = await Client.findByPk(agreement.clientId);
    const agencySetting = await AgencySetting.findOne();
    const snapshot = clientRecord
      ? buildInterpolationValues(clientRecord, agencySetting, { agreementNumber: agreement.agreementNumber })
      : null;

    const lastVersion = await AgreementVersion.findOne({ where: { agreementId: agreement.id }, order: [["versionNumber", "DESC"]] });
    await AgreementVersion.create({
      agreementId: agreement.id,
      versionNumber: (lastVersion?.versionNumber || 0) + 1,
      documentData: agreement.documentData,
      savedBy: req.user?.name || null,
      note: req.body?.note || null,
    });

    await agreement.update({
      status: "ready_to_send",
      finalizedAt: new Date(),
      clientDataSnapshot: snapshot ? JSON.stringify(snapshot) : agreement.clientDataSnapshot,
      updatedBy: req.user?.name || agreement.updatedBy,
    });

    await logActivity(req.app.locals.models, agreement.id, "finalized", req.user);
    await invalidateCache("agreement-drafts");
    res.json({ success: true, message: "Agreement finalized", data: serializeAgreement(agreement) });
  } catch (error) {
    console.error("Error finalizing agreement:", error);
    res.status(500).json({ success: false, message: "Error finalizing agreement", error: error.message });
  }
});

router.post("/agreement-drafts/:id/duplicate", async (req, res) => {
  try {
    const { Agreement } = req.app.locals.models;
    const source = await Agreement.findByPk(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: "Agreement not found" });

    const sequelize = Agreement.sequelize;
    const duplicated = await sequelize.transaction(async (transaction) => {
      const agreementNumber = await generateAgreementNumber(Agreement, transaction);
      return Agreement.create(
        {
          clientId: source.clientId,
          templateId: source.templateId,
          agreementNumber,
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
    await invalidateCache("agreement-drafts");
    res.status(201).json({ success: true, message: "Agreement duplicated", data: serializeAgreement(duplicated) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error duplicating agreement", error: error.message });
  }
});

// Soft delete — moves to Trash. Previously exported Document rows (PDF/
// DOCX already shared/saved to Drive) are left untouched, same policy
// DELETE /reports/:id follows.
router.delete("/agreement-drafts/:id", async (req, res) => {
  try {
    const { Agreement } = req.app.locals.models;
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });
    await agreement.update({ deletedAt: new Date() });
    await invalidateCache("agreement-drafts");
    res.json({ success: true, message: "Agreement moved to trash" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting agreement", error: error.message });
  }
});

router.post("/agreement-drafts/:id/restore", async (req, res) => {
  try {
    const { Agreement } = req.app.locals.models;
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });
    await agreement.update({ deletedAt: null });
    await invalidateCache("agreement-drafts");
    res.json({ success: true, message: "Agreement restored", data: serializeAgreement(agreement) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error restoring agreement", error: error.message });
  }
});

// ── Export (upload the client-rendered PDF/DOCX, record the result) ────

router.post("/agreement-drafts/:id/export", wrapUpload(exportUpload.fields([{ name: "pdf", maxCount: 1 }, { name: "docx", maxCount: 1 }])), async (req, res) => {
  try {
    const { Agreement, Client, Document } = req.app.locals.models;
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });

    const pdfFile = req.files?.pdf?.[0];
    const docxFile = req.files?.docx?.[0];
    if (!pdfFile) return res.status(400).json({ success: false, message: "A PDF file is required" });

    const clientRecord = await Client.findByPk(agreement.clientId);
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    // Same per-client "Agreements" Drive subfolder the existing upload-based
    // flow already uses (documentRoutes.js's /agreements/upload) — a
    // generated export lands right alongside manually-uploaded agreements.
    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const agreementsFolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Agreements");

    const pdfResult = await uploadFileToDrive(pdfFile.buffer, pdfFile.originalname, pdfFile.mimetype, agreementsFolder.folderId);

    // The PDF is what the existing Agreements dashboard/tab (and its Email
    // button) already knows how to display — a new Document row per export
    // (never overwritten), same "export creates, never overwrites" pattern
    // Report's export endpoint follows.
    const exportedDoc = await Document.create({
      fileName: pdfFile.originalname,
      fileType: pdfFile.mimetype,
      fileSize: pdfFile.size,
      fileId: pdfResult.fileId,
      driveLink: pdfResult.googleUserContentLink,
      webViewLink: pdfResult.webViewLink,
      googleUserContentLink: pdfResult.googleUserContentLink,
      folderId: agreementsFolder.folderId,
      clientId: clientRecord.id,
      agreementId: agreement.id,
      description: agreement.title,
      documentType: "agreement",
      status: "pending_signature",
    });

    let docxDoc = null;
    if (docxFile) {
      const docxResult = await uploadFileToDrive(docxFile.buffer, docxFile.originalname, docxFile.mimetype, agreementsFolder.folderId);
      docxDoc = await Document.create({
        fileName: docxFile.originalname,
        fileType: docxFile.mimetype,
        fileSize: docxFile.size,
        fileId: docxResult.fileId,
        driveLink: docxResult.googleUserContentLink,
        webViewLink: docxResult.webViewLink,
        googleUserContentLink: docxResult.googleUserContentLink,
        folderId: agreementsFolder.folderId,
        clientId: clientRecord.id,
        agreementId: agreement.id,
        description: `${agreement.title} (DOCX)`,
        documentType: "agreement",
      });
    }

    await agreement.update({ status: agreement.status === "draft" ? "pending_review" : agreement.status, updatedBy: req.user?.name || agreement.updatedBy });

    await logActivity(req.app.locals.models, agreement.id, "exported", req.user, { pdfDocumentId: exportedDoc.id, docxDocumentId: docxDoc?.id });
    await invalidateCache("agreement-drafts");
    await invalidateCache("documents");
    res.status(201).json({
      success: true,
      message: "Agreement exported and saved to Drive",
      data: { agreement: serializeAgreement(agreement), pdfDocument: exportedDoc, docxDocument: docxDoc },
    });
  } catch (error) {
    console.error("Error exporting agreement:", error);
    res.status(500).json({ success: false, message: "Error exporting agreement", error: error.message });
  }
});

// The ONLY path that may move an agreement to "signed" — never a typed
// name or a status dropdown flip (see Agreement's status enum / the
// feature's acceptance criteria). Also reuses the Agreements Drive
// subfolder and creates a Document row, same as a regular export.
router.post("/agreement-drafts/:id/signed-copy", wrapUpload(signedCopyUpload.single("file")), async (req, res) => {
  try {
    const { Agreement, Client, Document } = req.app.locals.models;
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });
    if (!req.file) return res.status(400).json({ success: false, message: "A signed copy file is required" });

    const clientRecord = await Client.findByPk(agreement.clientId);
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const agreementsFolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Agreements");
    const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, agreementsFolder.folderId);

    const signedDoc = await Document.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileId: driveResult.fileId,
      driveLink: driveResult.googleUserContentLink,
      webViewLink: driveResult.webViewLink,
      googleUserContentLink: driveResult.googleUserContentLink,
      folderId: agreementsFolder.folderId,
      clientId: clientRecord.id,
      agreementId: agreement.id,
      description: `${agreement.title} (Signed copy)`,
      documentType: "agreement",
      status: "active",
      signedAt: new Date(),
      signedBy: req.user?.name || null,
    });

    await agreement.update({ status: "signed", updatedBy: req.user?.name || agreement.updatedBy });

    await logActivity(req.app.locals.models, agreement.id, "signed_copy_uploaded", req.user, { documentId: signedDoc.id });
    await invalidateCache("agreement-drafts");
    await invalidateCache("documents");
    res.status(201).json({ success: true, message: "Signed copy uploaded", data: { agreement: serializeAgreement(agreement), document: signedDoc } });
  } catch (error) {
    console.error("Error uploading signed copy:", error);
    res.status(500).json({ success: false, message: "Error uploading signed copy", error: error.message });
  }
});

// ── Status, versions, activity ──────────────────────────────────────────

// A plain status change not covered by the more specific actions above
// (e.g. marking "sent" after emailing, or "cancelled"/"archived") — never
// accepts "signed" here, enforced server-side regardless of what the
// client sends.
router.put("/agreement-drafts/:id/status", async (req, res) => {
  try {
    const { Agreement } = req.app.locals.models;
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });

    const { status } = req.body;
    if (status === "signed") {
      return res.status(400).json({ success: false, message: "Upload a signed copy to mark an agreement as signed." });
    }
    const allowed = ["draft", "pending_review", "ready_to_send", "sent", "awaiting_signature", "active", "expired", "cancelled", "archived"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

    const from = agreement.status;
    await agreement.update({ status, updatedBy: req.user?.name || agreement.updatedBy });

    await logActivity(req.app.locals.models, agreement.id, "status_changed", req.user, { from, to: status });
    await invalidateCache("agreement-drafts");
    res.json({ success: true, message: "Status updated", data: serializeAgreement(agreement) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating status", error: error.message });
  }
});

router.get("/agreement-drafts/:id/versions", async (req, res) => {
  try {
    const { AgreementVersion } = req.app.locals.models;
    const versions = await AgreementVersion.findAll({
      where: { agreementId: req.params.id },
      order: [["versionNumber", "DESC"]],
      attributes: { exclude: ["documentData"] }, // list view: metadata only, same as the agreements list
    });
    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching versions", error: error.message });
  }
});

router.post("/agreement-drafts/:id/versions/:versionId/restore", async (req, res) => {
  try {
    const { Agreement, AgreementVersion } = req.app.locals.models;
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });
    const version = await AgreementVersion.findOne({ where: { id: req.params.versionId, agreementId: agreement.id } });
    if (!version) return res.status(404).json({ success: false, message: "Version not found" });

    await agreement.update({
      documentData: version.documentData,
      revision: agreement.revision + 1,
      updatedBy: req.user?.name || agreement.updatedBy,
    });

    await logActivity(req.app.locals.models, agreement.id, "version_restored", req.user, { versionNumber: version.versionNumber });
    await invalidateCache("agreement-drafts");
    res.json({ success: true, message: "Version restored", data: serializeAgreement(agreement) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error restoring version", error: error.message });
  }
});

router.get("/agreement-drafts/:id/activity", async (req, res) => {
  try {
    const { AgreementActivityLog } = req.app.locals.models;
    const logs = await AgreementActivityLog.findAll({
      where: { agreementId: req.params.id },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: logs.map((l) => ({ ...l.toJSON(), metadata: parseJsonField(l.metadata) })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching activity", error: error.message });
  }
});

export default router;
