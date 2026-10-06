import { DataTypes } from "sequelize";

const reportModel = (sequelize) => {
  const Report = sequelize.define(
    "Report",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      // Identifies a built-in starter layout (see reportTemplates.js on the
      // client) — null for a blank report or one created from a saved
      // ReportTemplate row (see templateId below).
      templateKey: { type: DataTypes.STRING, allowNull: true },
      // Soft reference (no FK constraint, same pattern as Document.leadId) —
      // only set when the report was created from a user-saved template.
      templateId: { type: DataTypes.INTEGER, allowNull: true },
      // The full editable document: { version, pageSize, pages: [...] }.
      // Stored as JSON-in-TEXT rather than a native JSONB column — this
      // app has no existing JSONB usage, and every other structured field
      // (e.g. TeamMember.bankDetails) already follows the stringify/parse
      // convention; matching it keeps one pattern across the codebase
      // instead of introducing a second.
      documentData: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM("draft", "generating", "completed", "failed"),
        allowNull: false,
        defaultValue: "draft",
      },
      // Set when status is "failed" — surfaced on the dashboard card and
      // cleared on the next successful export attempt.
      lastExportError: { type: DataTypes.TEXT, allowNull: true },
      // Bumped on every saved edit — lets the editor warn if the record
      // changed elsewhere since it was loaded (same spirit as optimistic
      // concurrency, without a full collaborative-editing system).
      revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      // Bumped on every successful PDF export. Each export uploads a new
      // Drive file (documentType "report" on the Document model, so it
      // also shows up in the client's existing Reports tab) rather than
      // overwriting the previous one — this always points at the latest.
      exportVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      driveFileId: { type: DataTypes.STRING, allowNull: true },
      driveFileName: { type: DataTypes.STRING, allowNull: true },
      driveWebViewLink: { type: DataTypes.STRING, allowNull: true },
      lastExportedAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.STRING, allowNull: true },
      updatedBy: { type: DataTypes.STRING, allowNull: true },
      // Soft delete (Trash) — set on delete, cleared on restore. A separate
      // "permanent delete" actually destroys the row (see reportRoutes.js).
      deletedAt: { type: DataTypes.DATE, allowNull: true },
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
      tableName: "reports",
      indexes: [{ fields: ["clientId"] }, { fields: ["status"] }, { fields: ["deletedAt"] }, { fields: ["templateId"] }],
    }
  );

  return Report;
};

export default reportModel;
