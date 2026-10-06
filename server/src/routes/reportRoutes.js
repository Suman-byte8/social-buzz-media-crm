import express from "express";
import multer from "multer";
import { Op } from "sequelize";
import { uploadFileToDrive, getOrCreateClientFolder, getOrCreateClientSubfolder, trashFileInDrive } from "../utils/googleDrive.js";
import { wrapUpload } from "../middleware/multerUpload.js";
import { cacheRoute } from "../middleware/cacheRoute.js";
import { invalidateCache } from "../utils/serverCache.js";
import { BUILT_IN_TEMPLATES, getBuiltInTemplateByKey, cloneDocumentData, interpolateDocumentData, buildPagesFromAiPlan } from "../utils/reportTemplates.js";
import { analyzeScreenshotsForReport, MAX_IMAGES_TOTAL } from "../utils/geminiVision.js";

const router = express.Router();

// Screenshots dragged onto a report page while editing — any image type,
// same size cap as the other media-capable routes (brand kit, strategy).
const assetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

// The rendered PDF upload at export time — generated client-side
// (html2canvas + jsPDF, same pipeline as invoices/salary slips) and posted
// here as a file.
const exportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only a PDF file is allowed"), false);
  },
});

const parseDocumentData = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// Serializes a Report row for the API response — documentData comes back
// as a real object (not a JSON string) since every consumer wants the
// parsed structure, same as how bankDetails gets parsed before use
// elsewhere in this app.
const serializeReport = (report) => {
  const json = report.toJSON ? report.toJSON() : report;
  return { ...json, documentData: parseDocumentData(json.documentData) };
};

const canManageTemplate = (user, template) => user?.role === "admin" || template.createdBy === user?.name;

// ── Templates ────────────────────────────────────────────────────────────

router.get("/report-templates", async (req, res) => {
  try {
    const { ReportTemplate } = req.app.locals.models;
    const { category } = req.query;

    const where = {
      [Op.or]: [{ isShared: true }, { createdBy: req.user?.name }],
    };
    if (category) where.category = category;

    const savedTemplates = await ReportTemplate.findAll({ where, order: [["createdAt", "DESC"]] });

    const builtIn = BUILT_IN_TEMPLATES
      .filter((t) => !category || t.category === category)
      .map((t) => ({
        key: t.key,
        id: null,
        isBuiltIn: true,
        name: t.name,
        description: t.description,
        category: t.category,
        isShared: true,
        isDefaultForCategory: false,
      }));

    const saved = savedTemplates.map((t) => {
      const json = t.toJSON();
      return {
        key: null,
        id: json.id,
        isBuiltIn: false,
        name: json.name,
        description: json.description,
        category: json.category,
        isShared: json.isShared,
        isDefaultForCategory: json.isDefaultForCategory,
        createdBy: json.createdBy,
        canManage: canManageTemplate(req.user, t),
      };
    });

    res.json({ success: true, data: [...builtIn, ...saved] });
  } catch (error) {
    console.error("Error fetching report templates:", error);
    res.status(500).json({ success: false, message: "Error fetching report templates", error: error.message });
  }
});

// Saves the current state of a report's documentData as a new reusable
// template — the editor's "Save as template" action.
router.post("/report-templates", async (req, res) => {
  try {
    const { name, description, category, isShared, reportId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Template name is required" });
    }
    if (!reportId) {
      return res.status(400).json({ success: false, message: "reportId is required" });
    }

    const { Report, ReportTemplate } = req.app.locals.models;
    const sourceReport = await Report.findByPk(parseInt(reportId));
    if (!sourceReport) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const template = await ReportTemplate.create({
      name: name.trim(),
      description: description || null,
      documentData: sourceReport.documentData,
      category: category || null,
      isShared: Boolean(isShared),
      createdBy: req.user?.name || null,
    });

    res.status(201).json({ success: true, message: "Template saved", data: { ...template.toJSON(), documentData: parseDocumentData(template.documentData) } });
  } catch (error) {
    console.error("Error saving report template:", error);
    res.status(500).json({ success: false, message: "Error saving report template", error: error.message });
  }
});

router.put("/report-templates/:id", async (req, res) => {
  try {
    const { ReportTemplate } = req.app.locals.models;
    const template = await ReportTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    if (!canManageTemplate(req.user, template)) {
      return res.status(403).json({ success: false, message: "You can only edit templates you created" });
    }

    const { name, description, category, isShared, isDefaultForCategory } = req.body;
    await template.update({
      name: name !== undefined ? name : template.name,
      description: description !== undefined ? description : template.description,
      category: category !== undefined ? category : template.category,
      isShared: isShared !== undefined ? Boolean(isShared) : template.isShared,
      isDefaultForCategory: isDefaultForCategory !== undefined ? Boolean(isDefaultForCategory) : template.isDefaultForCategory,
    });

    res.json({ success: true, message: "Template updated", data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating template", error: error.message });
  }
});

router.delete("/report-templates/:id", async (req, res) => {
  try {
    const { ReportTemplate } = req.app.locals.models;
    const template = await ReportTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    if (!canManageTemplate(req.user, template)) {
      return res.status(403).json({ success: false, message: "You can only delete templates you created" });
    }
    await template.destroy();
    res.json({ success: true, message: "Template deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting template", error: error.message });
  }
});

// ── Reports ──────────────────────────────────────────────────────────────

router.get("/reports", cacheRoute("reports", 30), async (req, res) => {
  try {
    const { Report, Client } = req.app.locals.models;
    const { clientId, status, templateKey, search, page = 1, limit = 24, trashed } = req.query;

    const where = {};
    where.deletedAt = trashed === "true" ? { [Op.not]: null } : null;
    if (clientId) where.clientId = parseInt(clientId);
    if (status) where.status = status;
    if (templateKey) where.templateKey = templateKey;

    const include = [{ model: Client, as: "client", attributes: ["id", "name", "logo"] }];

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { createdBy: { [Op.iLike]: `%${search}%` } },
        { "$client.name$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page) || 1;

    const { count, rows } = await Report.findAndCountAll({
      where,
      include,
      order: [["updatedAt", "DESC"]],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      subQuery: false,
    });

    res.json({
      success: true,
      // documentData is the (potentially large) full editable document —
      // the list view only ever needs metadata for cards, so it's stripped
      // here rather than shipped for every report on every dashboard load.
      data: rows.map((r) => {
        const { documentData, ...rest } = r.toJSON();
        return rest;
      }),
      pagination: { total: count, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(count / parsedLimit) },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, message: "Error fetching reports", error: error.message });
  }
});

router.get("/reports/:id", async (req, res) => {
  try {
    const { Report, Client } = req.app.locals.models;
    const report = await Report.findByPk(req.params.id, {
      include: [{ model: Client, as: "client", attributes: ["id", "name", "logo"] }],
    });
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, data: serializeReport(report) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching report", error: error.message });
  }
});

router.post("/reports", async (req, res) => {
  try {
    const { clientId, title, templateKey, templateId } = req.body;
    if (!clientId) return res.status(400).json({ success: false, message: "clientId is required" });

    const { Report, Client, ReportTemplate } = req.app.locals.models;
    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    let documentData;
    let resolvedTemplateId = null;

    if (templateId) {
      const template = await ReportTemplate.findByPk(parseInt(templateId));
      if (!template) return res.status(404).json({ success: false, message: "Template not found" });
      if (!template.isShared && template.createdBy !== req.user?.name && req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "You don't have access to this template" });
      }
      documentData = cloneDocumentData(parseDocumentData(template.documentData));
      resolvedTemplateId = template.id;
    } else {
      const builtIn = getBuiltInTemplateByKey(templateKey) || getBuiltInTemplateByKey("blank");
      documentData = cloneDocumentData(builtIn.documentData);
    }

    documentData = interpolateDocumentData(documentData, {
      clientName: clientRecord.name,
      reportPeriod: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      preparedBy: req.user?.name || "",
      reportDate: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
    });

    const report = await Report.create({
      clientId: parseInt(clientId),
      title: title?.trim() || "Untitled Report",
      templateKey: templateId ? null : templateKey || "blank",
      templateId: resolvedTemplateId,
      documentData: JSON.stringify(documentData),
      status: "draft",
      createdBy: req.user?.name || null,
      updatedBy: req.user?.name || null,
    });

    await invalidateCache("reports");
    res.status(201).json({ success: true, message: "Report created", data: serializeReport(report) });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ success: false, message: "Error creating report", error: error.message });
  }
});

// "Auto-generate from screenshots" — uploads every screenshot to the
// client's Drive "Report Assets" subfolder (same as a manual upload inside
// the editor), sends them to Gemini for a suggested title/grouping/
// headings/KPIs (see geminiVision.js), and builds a real, fully-editable
// report from the result. The upload always happens regardless of whether
// the AI analysis itself succeeds — a Gemini hiccup should never lose the
// user's screenshots, just fall back to a plain, ungrouped gallery they can
// rearrange by hand. `aiGenerated: false` on the response tells the
// frontend to say so rather than imply the layout was AI-written when it
// wasn't.
router.post("/reports/auto-generate", wrapUpload(assetUpload.array("files", MAX_IMAGES_TOTAL)), async (req, res) => {
  try {
    const { clientId, title } = req.body;
    if (!clientId) return res.status(400).json({ success: false, message: "clientId is required" });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "At least one screenshot is required" });
    }

    const { Report, Client, Document } = req.app.locals.models;
    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const assetsFolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Report Assets");

    // Upload every screenshot first — this is the part that must never be
    // lost, so it happens before anything AI-related is even attempted.
    const uploadedAssets = [];
    for (const file of req.files) {
      const driveResult = await uploadFileToDrive(file.buffer, file.originalname, file.mimetype, assetsFolder.folderId);
      const asset = await Document.create({
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileId: driveResult.fileId,
        driveLink: driveResult.googleUserContentLink,
        webViewLink: driveResult.webViewLink,
        googleUserContentLink: driveResult.googleUserContentLink,
        folderId: assetsFolder.folderId,
        clientId: clientRecord.id,
        documentType: "report_asset",
      });
      uploadedAssets.push({ id: asset.id, src: `/api/documents/${asset.id}/stream` });
    }

    let documentData;
    let aiGenerated = true;
    let aiError = null;
    let resolvedTitle = title?.trim() || "";

    // buildPagesFromAiPlan reuses the same coverPage()/thankYouPage() chrome
    // as every built-in template, {{token}} placeholders included — these
    // need the same interpolation pass POST /reports gives a template-based
    // report, or the cover/thank-you pages would show literal "{{clientName}}"
    // text instead of the real client name/date.
    const interpolationValues = {
      clientName: clientRecord.name,
      reportPeriod: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      preparedBy: req.user?.name || "",
      reportDate: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
    };

    try {
      const plan = await analyzeScreenshotsForReport(req.files.map((f) => ({ buffer: f.buffer, mimeType: f.mimetype })));
      documentData = interpolateDocumentData(buildPagesFromAiPlan(plan, uploadedAssets, { clientName: clientRecord.name }), interpolationValues);
      resolvedTitle = resolvedTitle || plan.reportTitle;
    } catch (err) {
      console.error("Gemini auto-generate failed, falling back to a plain gallery:", err.message);
      aiGenerated = false;
      aiError = err.message;
      resolvedTitle = resolvedTitle || "Performance Report";
      // Deterministic fallback: every uploaded screenshot in simple
      // 4-per-page groups, no AI-written headings/KPIs.
      const fallbackPlan = { reportTitle: resolvedTitle, reportSubtitle: "", pages: [] };
      for (let i = 0; i < uploadedAssets.length; i += 4) {
        fallbackPlan.pages.push({
          pageTitle: "Screenshots",
          summary: "",
          imageIndexes: Array.from({ length: Math.min(4, uploadedAssets.length - i) }, (_, j) => i + j),
          kpis: [],
        });
      }
      documentData = interpolateDocumentData(buildPagesFromAiPlan(fallbackPlan, uploadedAssets, { clientName: clientRecord.name }), interpolationValues);
    }

    // Each report_asset Document needs its final reportId filled in — they
    // were created above without one since the report didn't exist yet.
    const report = await Report.create({
      clientId: clientRecord.id,
      title: resolvedTitle,
      templateKey: "blank",
      documentData: JSON.stringify(documentData),
      status: "draft",
      createdBy: req.user?.name || null,
      updatedBy: req.user?.name || null,
    });
    await Document.update({ reportId: report.id }, { where: { id: uploadedAssets.map((a) => a.id) } });

    await invalidateCache("reports");
    res.status(201).json({
      success: true,
      message: aiGenerated ? "Report generated from your screenshots" : "Screenshots uploaded, but AI analysis failed — added as a plain gallery instead",
      data: { report: serializeReport(report), aiGenerated, aiError },
    });
  } catch (error) {
    console.error("Error auto-generating report:", error);
    res.status(500).json({ success: false, message: error.message || "Error auto-generating report", error: error.message });
  }
});

// Full save (manual Save, and the editor's debounced autosave both hit
// this). `expectedRevision` is optional — when the client sends the
// revision it loaded, a mismatch means the report changed elsewhere since
// then; the client decides whether to warn and overwrite or reload.
router.put("/reports/:id", async (req, res) => {
  try {
    const { Report } = req.app.locals.models;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    const { title, documentData, expectedRevision } = req.body;

    if (expectedRevision !== undefined && parseInt(expectedRevision) !== report.revision) {
      return res.status(409).json({
        success: false,
        message: "This report was changed elsewhere since you opened it.",
        data: serializeReport(report),
      });
    }

    await report.update({
      title: title !== undefined ? title : report.title,
      documentData: documentData !== undefined ? JSON.stringify(documentData) : report.documentData,
      updatedBy: req.user?.name || report.updatedBy,
      revision: report.revision + 1,
    });

    await invalidateCache("reports");
    res.json({ success: true, message: "Report saved", data: serializeReport(report) });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ success: false, message: "Error saving report", error: error.message });
  }
});

router.post("/reports/:id/duplicate", async (req, res) => {
  try {
    const { Report } = req.app.locals.models;
    const source = await Report.findByPk(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: "Report not found" });

    const duplicated = await Report.create({
      clientId: source.clientId,
      title: `${source.title} (Copy)`,
      templateKey: source.templateKey,
      templateId: source.templateId,
      documentData: JSON.stringify(cloneDocumentData(parseDocumentData(source.documentData))),
      status: "draft",
      createdBy: req.user?.name || null,
      updatedBy: req.user?.name || null,
    });

    await invalidateCache("reports");
    res.status(201).json({ success: true, message: "Report duplicated", data: serializeReport(duplicated) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error duplicating report", error: error.message });
  }
});

// Soft delete — moves to Trash. Assets/exported PDFs are left untouched in
// Drive; permanently deleting (below) is what cleans those up.
router.delete("/reports/:id", async (req, res) => {
  try {
    const { Report } = req.app.locals.models;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    await report.update({ deletedAt: new Date() });
    await invalidateCache("reports");
    res.json({ success: true, message: "Report moved to trash" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting report", error: error.message });
  }
});

router.post("/reports/:id/restore", async (req, res) => {
  try {
    const { Report } = req.app.locals.models;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    await report.update({ deletedAt: null });
    await invalidateCache("reports");
    res.json({ success: true, message: "Report restored", data: serializeReport(report) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error restoring report", error: error.message });
  }
});

// Permanent delete — trashes every asset this report owns in Drive (not
// hard-deleted there either, same trash-not-destroy policy
// trashFileInDrive already uses everywhere else), then removes the row.
// Deliberately does NOT touch previously exported PDFs (documentType
// "report" Document rows) — those are the client-facing deliverables
// already shared from the client's Reports tab, and deleting the report
// builder's working copy shouldn't retroactively pull back something
// already delivered.
router.delete("/reports/:id/permanent", async (req, res) => {
  try {
    const { Report, Document } = req.app.locals.models;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    const assets = await Document.findAll({ where: { reportId: report.id, documentType: "report_asset" } });
    for (const asset of assets) {
      try {
        if (asset.fileId) await trashFileInDrive(asset.fileId);
      } catch (driveErr) {
        console.warn("Could not trash report asset in Drive:", driveErr.message);
      }
    }
    await Document.destroy({ where: { reportId: report.id, documentType: "report_asset" } });

    await report.destroy();
    await invalidateCache("reports");
    res.json({ success: true, message: "Report permanently deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error permanently deleting report", error: error.message });
  }
});

// ── Assets (screenshots used inside a report) ───────────────────────────

router.post("/reports/:id/assets", wrapUpload(assetUpload.single("file")), async (req, res) => {
  try {
    const { Report, Client, Document } = req.app.locals.models;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    if (!req.file) return res.status(400).json({ success: false, message: "No image file provided" });

    const clientRecord = await Client.findByPk(report.clientId);
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const assetsFolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Report Assets");

    const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, assetsFolder.folderId);

    const asset = await Document.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileId: driveResult.fileId,
      driveLink: driveResult.googleUserContentLink,
      webViewLink: driveResult.webViewLink,
      googleUserContentLink: driveResult.googleUserContentLink,
      folderId: assetsFolder.folderId,
      clientId: clientRecord.id,
      reportId: report.id,
      documentType: "report_asset",
    });

    res.status(201).json({ success: true, message: "Asset uploaded", data: asset });
  } catch (error) {
    console.error("Error uploading report asset:", error);
    res.status(500).json({ success: false, message: "Error uploading report asset", error: error.message });
  }
});

router.get("/reports/:id/assets", async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const assets = await Document.findAll({
      where: { reportId: req.params.id, documentType: "report_asset" },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching report assets", error: error.message });
  }
});

// ── Export (upload the client-rendered PDF, record the result) ─────────

router.post("/reports/:id/export", wrapUpload(exportUpload.single("file")), async (req, res) => {
  try {
    const { Report, Client, Document } = req.app.locals.models;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    if (!req.file) return res.status(400).json({ success: false, message: "No PDF file provided" });

    const clientRecord = await Client.findByPk(report.clientId);
    if (!clientRecord) return res.status(404).json({ success: false, message: "Client not found" });

    try {
      const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
      const reportsFolder = await getOrCreateClientSubfolder(clientFolder.folderId, "Reports");

      const driveResult = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype, reportsFolder.folderId);

      // A new Document row per export (never overwritten) — this is what
      // makes the exported PDF show up in the client's existing Reports
      // tab (ClientFilesTab with documentType "report") automatically,
      // and keeps every past export as its own recoverable version.
      const exportedDoc = await Document.create({
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        fileId: driveResult.fileId,
        driveLink: driveResult.googleUserContentLink,
        webViewLink: driveResult.webViewLink,
        googleUserContentLink: driveResult.googleUserContentLink,
        folderId: reportsFolder.folderId,
        clientId: clientRecord.id,
        reportId: report.id,
        description: report.title,
        documentType: "report",
      });

      await report.update({
        status: "completed",
        lastExportError: null,
        exportVersion: report.exportVersion + 1,
        driveFileId: driveResult.fileId,
        driveFileName: req.file.originalname,
        driveWebViewLink: driveResult.webViewLink,
        lastExportedAt: new Date(),
      });

      await invalidateCache("reports");
      await invalidateCache("documents");
      res.status(201).json({ success: true, message: "Report exported and saved to Drive", data: { report: serializeReport(report), document: exportedDoc } });
    } catch (driveErr) {
      console.error("Error exporting report to Drive:", driveErr);
      await report.update({ status: "failed", lastExportError: driveErr.message });
      await invalidateCache("reports");
      res.status(502).json({ success: false, message: driveErr.message || "Failed to save the exported PDF to Google Drive", error: driveErr.message });
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({ success: false, message: "Error exporting report", error: error.message });
  }
});

export default router;
