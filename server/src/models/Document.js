import { DataTypes } from "sequelize";

const documentModel = (sequelize) => {
  const Document = sequelize.define(
    "Document",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fileName: { type: DataTypes.STRING, allowNull: false },
      fileType: { type: DataTypes.STRING, allowNull: true },
      fileSize: { type: DataTypes.INTEGER, allowNull: true },
      // Nullable: a "link" entry (see linkUrl/linkType below) points at an
      // external Google Sheet/Doc instead of a file actually stored in
      // Drive, so it has no fileId of its own.
      fileId: { type: DataTypes.STRING, allowNull: true },
      driveLink: { type: DataTypes.STRING, allowNull: true },
      webViewLink: { type: DataTypes.STRING, allowNull: true },
      googleUserContentLink: { type: DataTypes.STRING, allowNull: true },
      folderId: { type: DataTypes.STRING, allowNull: true },
      // A shared external link (e.g. the client's Strategy Google Sheet/Doc)
      // instead of an uploaded file — mutually exclusive with fileId in
      // practice, though not enforced at the DB level. linkType is only set
      // alongside linkUrl.
      linkUrl: { type: DataTypes.STRING, allowNull: true },
      linkType: { type: DataTypes.STRING, allowNull: true },
      clientId: { type: DataTypes.INTEGER, allowNull: true },
      // Soft reference (no FK constraint, see models/index.js) — a lead can
      // be deleted (e.g. converted to a client) without losing the
      // proposals/agreements that were shared with it.
      leadId: { type: DataTypes.INTEGER, allowNull: true },
      // Soft reference (no FK constraint, same as leadId) — only set when
      // documentType is "note" (see noteAttachmentKind below). Ties a
      // screenshot/document/image-link back to the MeetingNote it was
      // attached to.
      noteId: { type: DataTypes.INTEGER, allowNull: true },
      // Only set when documentType is "note" — which of the three note
      // attachment flows this came from: a pasted screenshot, an uploaded
      // document, or an external image link that got mirrored into Drive.
      // A STRING rather than another ENUM, same reasoning as linkType below.
      noteAttachmentKind: { type: DataTypes.STRING, allowNull: true },
      // Soft reference (no FK constraint, same as leadId/noteId) — only set
      // when documentType is "salary_slip". A team member's Drive folder
      // (not a client's) is where these land — see getOrCreateTeamMembersFolder.
      teamMemberId: { type: DataTypes.INTEGER, allowNull: true },
      // Soft reference (no FK constraint, same as leadId/noteId/teamMemberId)
      // — only set when documentType is "report_asset": an image uploaded
      // while editing a Report Builder report (screenshots dragged onto a
      // page). The report's own exported PDF is a separate Document row
      // with documentType "report" (clientId + reportId both set) — the
      // existing type ClientFilesTab's Reports tab already lists, so an
      // exported report shows up there automatically.
      reportId: { type: DataTypes.INTEGER, allowNull: true },
      // Soft reference (no FK constraint, same as reportId) — only set when
      // this Document is a generated agreement's exported PDF/DOCX (see
      // agreementBuilderRoutes.js's export endpoint). Ties the export back
      // to its editable Agreement draft; a manually-uploaded agreement
      // (the pre-existing /agreements/upload flow) leaves this null.
      agreementId: { type: DataTypes.INTEGER, allowNull: true },
      // Soft reference (no FK constraint, same as agreementId) — only set
      // when this Document is a generated proposal's exported PDF/DOCX (see
      // proposalBuilderRoutes.js's export endpoint). Ties the export back
      // to its editable Proposal draft; a manually-uploaded proposal (the
      // pre-existing /proposals/upload flow) leaves this null.
      proposalId: { type: DataTypes.INTEGER, allowNull: true },
      // Soft reference (no FK constraint, same as agreementId/proposalId) —
      // only set when this Document is an exported Payment Management
      // invoice PDF or payment receipt PDF (see paymentRoutes.js's export
      // endpoints). Distinct from the older, unrelated documentType
      // "invoice" used by the client-side-only Invoice Builder, which never
      // sets this column.
      invoiceId: { type: DataTypes.INTEGER, allowNull: true },
      uploadedBy: { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      // Agreement-specific fields
      documentType: {
        type: DataTypes.ENUM("agreement", "proposal", "invoice", "invoice_record", "payment_receipt", "report", "content_calendar", "brand_kit", "creative", "strategy", "lead", "note", "salary_slip", "report_asset", "other"),
        allowNull: true,
        defaultValue: "other",
      },
      issuedDate: { type: DataTypes.DATEONLY, allowNull: true },
      expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
      status: {
        type: DataTypes.ENUM("active", "pending_signature", "expired"),
        allowNull: true,
        defaultValue: "active",
      },
      signedAt: { type: DataTypes.DATE, allowNull: true },
      signedBy: { type: DataTypes.STRING, allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "documents",
      indexes: [
        { fields: ["clientId"] },
        { fields: ["leadId"] },
        { fields: ["noteId"] },
        { fields: ["teamMemberId"] },
        { fields: ["reportId"] },
        { fields: ["agreementId"] },
        { fields: ["proposalId"] },
        { fields: ["invoiceId"] },
        { fields: ["documentType"] },
        { fields: ["status"] },
      ],
    }
  );

  return Document;
};

export default documentModel;
