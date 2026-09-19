import express from "express";
import multer from "multer";
import { Op } from "sequelize";
import { uploadFileToDrive, getFileBufferFromDrive, getOrCreateClientFolder, getOrCreateClientSubfolder, getOrCreateLeadsFolder, getOrCreateTeamMembersFolder, trashFileInDrive } from "../utils/googleDrive.js";
import { fetchImageAsBuffer } from "../utils/fetchRemoteImage.js";
import { getCachedFile, setCachedFile } from "../utils/fileCache.js";
import { sendMail } from "../utils/mailer.js";
import { cacheRoute } from "../middleware/cacheRoute.js";
import { invalidateCache } from "../utils/serverCache.js";

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

// Broader upload for media-capable document types (currently just brand kit
// assets): any file type/size the Brand Kit wants to store — logos, brand
// guideline PDFs, video, zipped asset packs, fonts, whatever the client hands
// over. No fileFilter (any mimetype is accepted). The size cap is generous
// rather than unbounded because multer buffers the whole upload in process
// memory before it's streamed to Drive — an actually-unbounded limit would
// let one huge upload crash the server for everyone.
const mediaUpload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024, files: 20 }, // 200MB per file, up to 20 files per request
});

// Agreements, Proposals, and Salary Slips are admin-only (hidden from team
// members) — the last one because it carries compensation data.
const ADMIN_ONLY_DOCUMENT_TYPES = ["agreement", "proposal", "salary_slip"];

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

// Lead documents (proposals/agreements/anything else shared before a lead
// becomes a client) — any file type, multiple files per upload, same size
// cap as the other media-capable routes below (mediaUpload).
const leadUpload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024, files: 20 }, // 200MB per file, up to 20 files per request
});

// Maps a documentType to the Drive subfolder its files land in, for the
// media-capable upload routes (brand kit, creatives, strategy).
const MEDIA_SUBFOLDER_BY_TYPE = {
  brand_kit: "Brand Kit",
  creative: "Creatives",
  strategy: "Strategy",
  report: "Reports",
};
const mediaSubfolderName = (documentType) => MEDIA_SUBFOLDER_BY_TYPE[documentType] || "Other";

// Note attachments (documentType "note") share one Drive subfolder per
// noteAttachmentKind rather than one per document type — see
// Document.noteAttachmentKind.
const NOTE_SUBFOLDER_BY_KIND = {
  screenshot: "Note Screenshots",
  document: "Note Documents",
  image_link: "Note Images",
};

// Upload agreement with specific subfolder
router.post("/agreements/upload", requireAdmin, upload.single("file"), async (req, res) => {
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
        await invalidateCache("documents");
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

      await invalidateCache("documents");
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

    await invalidateCache("documents");
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

    await invalidateCache("documents");
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

// Salary slip PDF upload — team-member-scoped rather than client-scoped
// (like invoices/agreements are for clients). Admin-gated server-side too
// (not just the sidebar/page-level gate) since the PDF carries compensation
// data.
router.post("/documents/upload-salary-slip", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const { teamMemberId, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file provided" });
    }
    if (!teamMemberId) {
      return res.status(400).json({ success: false, message: "teamMemberId is required" });
    }

    const { Document, TeamMember } = req.app.locals.models;
    const teamMember = await TeamMember.findByPk(parseInt(teamMemberId));
    if (!teamMember) {
      return res.status(404).json({ success: false, message: "Team member not found" });
    }

    // Same nesting pattern as a client's Drive subfolders: one shared
    // "Team Members" folder, one subfolder per member (already used for
    // avatar/resume uploads — see teamRoutes.js), then a "Salary Slip"
    // subfolder under that member's own folder.
    const teamFolder = await getOrCreateTeamMembersFolder();
    const memberFolder = await getOrCreateClientSubfolder(teamFolder.folderId, teamMember.name);
    const salarySlipFolder = await getOrCreateClientSubfolder(memberFolder.folderId, "Salary Slip");

    const driveResult = await uploadFileToDrive(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      salarySlipFolder.folderId
    );

    const document = await Document.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileId: driveResult.fileId,
      driveLink: driveResult.googleUserContentLink,
      webViewLink: driveResult.webViewLink,
      googleUserContentLink: driveResult.googleUserContentLink,
      folderId: salarySlipFolder.folderId,
      teamMemberId: parseInt(teamMemberId),
      description: description || null,
      documentType: "salary_slip",
    });

    await invalidateCache("documents");
    res.status(201).json({
      success: true,
      message: "Salary slip saved to Google Drive successfully",
      data: document,
    });
  } catch (error) {
    console.error("Error uploading salary slip:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload salary slip",
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
    const subfolderName = mediaSubfolderName(documentType);
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

    await invalidateCache("documents");
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

// Bulk variant of the above — same folder/document logic, but accepts
// several files in one request (e.g. selecting a whole batch of brand
// assets at once). Uploaded one at a time rather than in parallel so a
// large batch doesn't fire a burst of simultaneous Drive API calls; a
// per-file failure is recorded and skipped instead of aborting the whole
// batch, so one bad file doesn't lose the files that already succeeded.
router.post("/documents/upload-media-bulk", mediaUpload.array("files", 20), async (req, res) => {
  try {
    const { clientId, description, documentType } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files provided" });
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
    const subfolderName = mediaSubfolderName(documentType);
    const subfolder = await getOrCreateClientSubfolder(clientFolder.folderId, subfolderName);

    const uploaded = [];
    const failed = [];

    for (const file of req.files) {
      try {
        const driveResult = await uploadFileToDrive(file.buffer, file.originalname, file.mimetype, subfolder.folderId);

        const document = await Document.create({
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          fileId: driveResult.fileId,
          driveLink: driveResult.googleUserContentLink,
          webViewLink: driveResult.webViewLink,
          googleUserContentLink: driveResult.googleUserContentLink,
          folderId: subfolder.folderId,
          clientId: parseInt(clientId),
          description: description || null,
          documentType: documentType || "other",
        });

        uploaded.push(document);
      } catch (fileError) {
        console.error(`Error uploading file "${file.originalname}":`, fileError);
        failed.push({ fileName: file.originalname, error: fileError.message });
      }
    }

    if (uploaded.length > 0) await invalidateCache("documents");
    res.status(201).json({
      success: true,
      message:
        failed.length > 0
          ? `${uploaded.length} file(s) uploaded, ${failed.length} failed`
          : "Files uploaded successfully",
      data: uploaded,
      failed,
    });
  } catch (error) {
    console.error("Error bulk uploading media documents:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload files",
      error: error.message,
    });
  }
});

// Google Sheet/Doc "link" documents (currently: the client Strategy tab) —
// no file is uploaded to Drive; this just records the shared URL so it
// shows up alongside real uploads in the same list. See Document.js for
// why fileId is nullable and what linkUrl/linkType mean.
const GOOGLE_LINK_TYPES = ["google_sheet", "google_doc"];
const GOOGLE_LINK_URL_PATTERN = /^https:\/\/(docs|drive)\.google\.com\//i;

router.post("/documents/link", async (req, res) => {
  try {
    const { clientId, documentType, linkType, linkUrl, label, description } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: "clientId is required" });
    }
    if (!GOOGLE_LINK_TYPES.includes(linkType)) {
      return res.status(400).json({ success: false, message: "linkType must be google_sheet or google_doc" });
    }
    if (!linkUrl || !GOOGLE_LINK_URL_PATTERN.test(linkUrl.trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid Google Sheets/Docs link" });
    }

    const { Document, Client } = req.app.locals.models;
    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const document = await Document.create({
      fileName: label?.trim() || (linkType === "google_sheet" ? "Google Sheet" : "Google Doc"),
      linkUrl: linkUrl.trim(),
      linkType,
      clientId: parseInt(clientId),
      description: description || null,
      documentType: documentType || "other",
    });

    await invalidateCache("documents");
    res.status(201).json({ success: true, message: "Link added successfully", data: document });
  } catch (error) {
    console.error("Error adding document link:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add link",
      error: error.message,
    });
  }
});

// Bulk PDF upload for a lead — proposals/agreements shared with a company
// before they convert to a client. Same one-at-a-time-with-per-file-failure
// approach as upload-media-bulk above, into a per-lead Drive subfolder
// under a shared "Leads" folder rather than a client folder.
router.post("/documents/upload-lead-bulk", leadUpload.array("files", 10), async (req, res) => {
  try {
    const { leadId, description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No PDF files provided" });
    }
    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    const { Document, Lead } = req.app.locals.models;

    const leadRecord = await Lead.findByPk(parseInt(leadId));
    if (!leadRecord) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    const leadsFolder = await getOrCreateLeadsFolder();
    const leadFolder = await getOrCreateClientSubfolder(leadsFolder.folderId, `${leadRecord.companyName} - Documents`);

    const uploaded = [];
    const failed = [];

    for (const file of req.files) {
      try {
        const driveResult = await uploadFileToDrive(file.buffer, file.originalname, file.mimetype, leadFolder.folderId);

        const document = await Document.create({
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          fileId: driveResult.fileId,
          driveLink: driveResult.googleUserContentLink,
          webViewLink: driveResult.webViewLink,
          googleUserContentLink: driveResult.googleUserContentLink,
          folderId: leadFolder.folderId,
          leadId: parseInt(leadId),
          description: description || null,
          documentType: "lead",
        });

        uploaded.push(document);
      } catch (fileError) {
        console.error(`Error uploading file "${file.originalname}":`, fileError);
        failed.push({ fileName: file.originalname, error: fileError.message });
      }
    }

    if (uploaded.length > 0) await invalidateCache("documents");
    res.status(201).json({
      success: true,
      message:
        failed.length > 0
          ? `${uploaded.length} file(s) uploaded, ${failed.length} failed`
          : "Files uploaded successfully",
      data: uploaded,
      failed,
    });
  } catch (error) {
    console.error("Error bulk uploading lead documents:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload files",
      error: error.message,
    });
  }
});

// Note attachments (screenshot dump / documents / image links) — any file
// type, multiple files per upload, into a per-client Drive subfolder keyed
// by `kind` (see NOTE_SUBFOLDER_BY_KIND). Mirrors upload-media-bulk above,
// but tagged with noteId/noteAttachmentKind instead of a documentType per
// kind, so the Notes tab can fetch all three kinds for a client in one call.
router.post("/documents/upload-note-bulk", mediaUpload.array("files", 20), async (req, res) => {
  try {
    const { clientId, noteId, kind, description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files provided" });
    }
    if (!clientId) {
      return res.status(400).json({ success: false, message: "clientId is required" });
    }
    if (!NOTE_SUBFOLDER_BY_KIND[kind]) {
      return res.status(400).json({ success: false, message: "kind must be screenshot or document" });
    }

    const { Document, Client } = req.app.locals.models;

    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const subfolder = await getOrCreateClientSubfolder(clientFolder.folderId, NOTE_SUBFOLDER_BY_KIND[kind]);

    const uploaded = [];
    const failed = [];

    for (const file of req.files) {
      try {
        const driveResult = await uploadFileToDrive(file.buffer, file.originalname, file.mimetype, subfolder.folderId);

        const document = await Document.create({
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          fileId: driveResult.fileId,
          driveLink: driveResult.googleUserContentLink,
          webViewLink: driveResult.webViewLink,
          googleUserContentLink: driveResult.googleUserContentLink,
          folderId: subfolder.folderId,
          clientId: parseInt(clientId),
          noteId: noteId ? parseInt(noteId) : null,
          noteAttachmentKind: kind,
          description: description || null,
          documentType: "note",
        });

        uploaded.push(document);
      } catch (fileError) {
        console.error(`Error uploading file "${file.originalname}":`, fileError);
        failed.push({ fileName: file.originalname, error: fileError.message });
      }
    }

    if (uploaded.length > 0) await invalidateCache("documents");
    res.status(201).json({
      success: true,
      message:
        failed.length > 0
          ? `${uploaded.length} file(s) uploaded, ${failed.length} failed`
          : "Files uploaded successfully",
      data: uploaded,
      failed,
    });
  } catch (error) {
    console.error("Error bulk uploading note attachments:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload files",
      error: error.message,
    });
  }
});

// A note's "image links" flow — the user pastes a URL to an image hosted
// elsewhere; we fetch it server-side (see fetchRemoteImage.js for the SSRF
// guards) and store the actual bytes in Drive, rather than just recording
// the external link the way the Strategy tab's Google Sheet/Doc links do.
// The original URL is kept on linkUrl for reference, but the Drive copy
// (fileId/stream) is what the UI shows going forward.
router.post("/documents/note-image-link", async (req, res) => {
  try {
    const { clientId, noteId, imageUrl } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: "clientId is required" });
    }
    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ success: false, message: "imageUrl is required" });
    }

    const { Document, Client } = req.app.locals.models;
    const clientRecord = await Client.findByPk(parseInt(clientId));
    if (!clientRecord) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const { buffer, contentType, fileName } = await fetchImageAsBuffer(imageUrl.trim());

    const clientFolder = await getOrCreateClientFolder(clientRecord.name, clientRecord.id);
    const subfolder = await getOrCreateClientSubfolder(clientFolder.folderId, NOTE_SUBFOLDER_BY_KIND.image_link);

    const driveResult = await uploadFileToDrive(buffer, fileName, contentType, subfolder.folderId);

    const document = await Document.create({
      fileName,
      fileType: contentType,
      fileSize: buffer.length,
      fileId: driveResult.fileId,
      driveLink: driveResult.googleUserContentLink,
      webViewLink: driveResult.webViewLink,
      googleUserContentLink: driveResult.googleUserContentLink,
      folderId: subfolder.folderId,
      clientId: parseInt(clientId),
      noteId: noteId ? parseInt(noteId) : null,
      noteAttachmentKind: "image_link",
      linkUrl: imageUrl.trim(),
      documentType: "note",
    });

    await invalidateCache("documents");
    res.status(201).json({ success: true, message: "Image saved to Drive", data: document });
  } catch (error) {
    console.error("Error saving note image link:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to save image link",
      error: error.message,
    });
  }
});

// `page`/`limit` are optional — omitting them preserves the historical
// "return everything" behavior existing callers rely on.
router.get("/documents", cacheRoute("documents", 120), async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const { clientId, leadId, noteId, teamMemberId, documentType, page, limit } = req.query;

    const where = {};
    if (clientId) {
      where.clientId = parseInt(clientId);
    }
    if (leadId) {
      where.leadId = parseInt(leadId);
    }
    if (noteId) {
      where.noteId = parseInt(noteId);
    }
    if (teamMemberId) {
      where.teamMemberId = parseInt(teamMemberId);
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

    // Link entries (Google Sheet/Doc — see documents/link above) have no
    // fileId, since nothing was ever uploaded to Drive for them.
    if (document.fileId) {
      try {
        await trashFileInDrive(document.fileId);
      } catch (driveErr) {
        // Best-effort: the file may already be missing/trashed in Drive, or
        // the Drive API call could fail transiently — don't let that block
        // removing the record itself.
        console.warn("Could not trash document file in Drive:", driveErr.message);
      }
    }

    await document.destroy();
    await invalidateCache("documents");
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
    if (!document.fileId) {
      return res.status(400).json({ success: false, message: "This is a link, not an uploaded file — open linkUrl directly instead" });
    }

    let cached = getCachedFile(document.fileId);
    if (!cached) {
      const { buffer, contentType } = await getFileBufferFromDrive(document.fileId);
      setCachedFile(document.fileId, buffer, contentType);
      cached = { buffer, contentType };
    }

    // Prefer the content type recorded at upload time (from the browser's
    // File.type — e.g. "image/png" for a brand kit logo) over whatever
    // Drive's API reports, falling back to that only if it's missing. This
    // used to be hardcoded to "application/pdf" for every document, which
    // silently broke any non-PDF file (brand kit images): helmet sets
    // X-Content-Type-Options: nosniff globally, so the browser refuses to
    // render an <img> whose declared Content-Type doesn't match an image
    // type, regardless of what the actual bytes are.
    const contentType = document.fileType || cached.contentType || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${document.fileName}"`);
    // Same reasoning as logo-proxy in settingRoutes.js: Helmet's default
    // frame-ancestors 'self' blocks the frontend (a different origin) from
    // embedding this in an <iframe> (AgreementViewModal's preview). This
    // route is already in PUBLIC_ASSET_PATHS (no auth), so relaxing it to
    // allow framing doesn't expose anything new.
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    // A given document's fileId is never mutated in place (re-uploads
    // create a new Document/fileId), so letting the browser cache the
    // response is safe. Without this, a grid of many thumbnails re-fetches
    // every one of them on every visit, competing for the browser's ~6
    // concurrent connections per origin — later thumbnails just sit and
    // wait instead of appearing.
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.send(cached.buffer);
  } catch (error) {
    console.error("Error streaming document:", error);
    res.status(500).json({
      success: false,
      message: "Error streaming document",
      error: error.message,
    });
  }
});

// Emails a document to a given address with the actual file attached
// (rather than a link) — used by the invoice "Send Email" action. Requires
// SMTP_HOST/SMTP_USER/SMTP_PASS to be set in .env; see utils/mailer.js.
router.post("/documents/:id/email", async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const { to, subject, text } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: "Recipient email (to) is required" });
    }

    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    if (ADMIN_ONLY_DOCUMENT_TYPES.includes(document.documentType) && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    let cached = getCachedFile(document.fileId);
    if (!cached) {
      const driveStart = Date.now();
      const { buffer, contentType } = await getFileBufferFromDrive(document.fileId);
      console.log(`[documents/email] Drive fetch took ${Date.now() - driveStart}ms for file ${document.fileId}`);
      setCachedFile(document.fileId, buffer, contentType);
      cached = { buffer, contentType };
    }

    const mailStart = Date.now();
    await sendMail({
      to,
      subject: subject || `Document: ${document.fileName}`,
      text: text || "Please find the attached document.",
      attachments: [
        {
          filename: document.fileName,
          content: cached.buffer,
          // Was hardcoded to "application/pdf" — fine while every document
          // type really was a PDF (agreements/invoices), but lead documents
          // can now be any file type, so a photo or spreadsheet would have
          // been mislabeled and could arrive corrupted/unopenable.
          contentType: document.fileType || cached.contentType || "application/octet-stream",
        },
      ],
    });
    console.log(`[documents/email] SMTP send took ${Date.now() - mailStart}ms`);

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending document email:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send email",
      error: error.message,
    });
  }
});

// Agreement-specific routes
// `page`/`limit` are optional — omitting them preserves the historical
// "return everything" behavior existing callers rely on (e.g. a client
// profile's Agreement tab, which wants its one client's full list).
router.get("/agreements", requireAdmin, cacheRoute("documents", 120), async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const { clientId, status, search, page, limit } = req.query;

    const where = { documentType: "agreement" };
    if (clientId) where.clientId = parseInt(clientId);
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { fileName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
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

    const agreements = await Document.findAll(queryOptions);
    res.json({ success: true, data: agreements });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching agreements",
      error: error.message,
    });
  }
});

router.get("/agreements/:id", requireAdmin, async (req, res) => {
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

router.put("/agreements/:id", requireAdmin, async (req, res) => {
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
    await invalidateCache("documents");

    res.json({ success: true, message: "Agreement updated successfully", data: agreement });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating agreement",
      error: error.message,
    });
  }
});

router.delete("/agreements/:id", requireAdmin, async (req, res) => {
  try {
    const { Document } = req.app.locals.models;
    const agreement = await Document.findOne({
      where: { id: req.params.id, documentType: "agreement" },
    });

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    try {
      await trashFileInDrive(agreement.fileId);
    } catch (driveErr) {
      // Best-effort: the file may already be missing/trashed in Drive, or
      // the Drive API call could fail transiently — don't let that block
      // removing the record itself.
      console.warn("Could not trash agreement file in Drive:", driveErr.message);
    }

    await agreement.destroy();
    await invalidateCache("documents");
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
