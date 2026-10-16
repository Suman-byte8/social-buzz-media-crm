import { DataTypes } from "sequelize";

// Mirrors Report.js closely — same "one JSON-in-TEXT documentData blob,
// optimistic-concurrency revision counter, soft delete" shape, adapted for
// a flowing rich-text (Tiptap) document instead of a page/element canvas.
const agreementModel = (sequelize) => {
  const Agreement = sequelize.define(
    "Agreement",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      // Soft reference (no FK constraint, same pattern as Report.templateId)
      // — only set when created from a user-saved AgreementTemplate row;
      // null for the built-in master template.
      templateId: { type: DataTypes.INTEGER, allowNull: true },
      // "SBM/AGR/2026/001" — generated once at creation (see
      // agreementBuilderRoutes.js), never regenerated, unique.
      agreementNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      title: { type: DataTypes.STRING, allowNull: false },
      // Tiptap's JSON document (ProseMirror doc), stringified — same
      // stringify/parse convention as Report.documentData.
      documentData: { type: DataTypes.TEXT, allowNull: false },
      // The client fields actually used to fill the template, frozen at
      // finalize time — so a later edit to the Client record never silently
      // changes what a finalized agreement says it was built from. Null
      // until the first finalize.
      clientDataSnapshot: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM(
          "draft",
          "pending_review",
          "ready_to_send",
          "sent",
          "awaiting_signature",
          "signed",
          "active",
          "expired",
          "cancelled",
          "archived"
        ),
        allowNull: false,
        defaultValue: "draft",
      },
      revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      finalizedAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.STRING, allowNull: true },
      updatedBy: { type: DataTypes.STRING, allowNull: true },
      // Soft delete (Trash), same as Report.deletedAt.
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
      tableName: "agreement_drafts",
      indexes: [{ fields: ["clientId"] }, { fields: ["status"] }, { fields: ["deletedAt"] }, { fields: ["templateId"] }],
    }
  );

  return Agreement;
};

export default agreementModel;
