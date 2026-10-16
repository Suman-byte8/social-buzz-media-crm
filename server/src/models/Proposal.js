import { DataTypes } from "sequelize";

// Mirrors Agreement.js field-for-field — same "one JSON-in-TEXT
// documentData blob, optimistic-concurrency revision counter, soft delete"
// shape. Status vocabulary differs from Agreement's: a proposal's lifecycle
// ends in accepted/declined (it's never itself "signed" — the Agreement
// generated from an accepted proposal is what gets signed).
const proposalModel = (sequelize) => {
  const Proposal = sequelize.define(
    "Proposal",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      // Soft reference (no FK constraint, same pattern as Agreement.templateId)
      // — only set when created from a user-saved ProposalTemplate row; null
      // for the built-in master template.
      templateId: { type: DataTypes.INTEGER, allowNull: true },
      // "SBM/PROP/2026/001" — generated once at creation (see
      // proposalBuilderRoutes.js), never regenerated, unique.
      proposalNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      title: { type: DataTypes.STRING, allowNull: false },
      // Tiptap's JSON document (ProseMirror doc), stringified — same
      // stringify/parse convention as Agreement.documentData.
      documentData: { type: DataTypes.TEXT, allowNull: false },
      // The client fields actually used to fill the template, frozen at
      // finalize time — so a later edit to the Client record never silently
      // changes what a finalized proposal says it was built from. Null
      // until the first finalize.
      clientDataSnapshot: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("draft", "pending_review", "ready_to_send", "sent", "accepted", "declined", "expired", "cancelled", "archived"),
        allowNull: false,
        defaultValue: "draft",
      },
      revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      finalizedAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.STRING, allowNull: true },
      updatedBy: { type: DataTypes.STRING, allowNull: true },
      // Soft delete (Trash), same as Agreement.deletedAt.
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
      tableName: "proposal_drafts",
      indexes: [{ fields: ["clientId"] }, { fields: ["status"] }, { fields: ["deletedAt"] }, { fields: ["templateId"] }],
    }
  );

  return Proposal;
};

export default proposalModel;
