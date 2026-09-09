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
      uploadedBy: { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      // Agreement-specific fields
      documentType: {
        type: DataTypes.ENUM("agreement", "proposal", "invoice", "report", "content_calendar", "brand_kit", "creative", "strategy", "lead", "other"),
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
        { fields: ["documentType"] },
        { fields: ["status"] },
      ],
    }
  );

  return Document;
};

export default documentModel;
