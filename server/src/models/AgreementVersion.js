import { DataTypes } from "sequelize";

// A point-in-time snapshot of an Agreement's documentData — written on
// finalize and on an explicit "save version" action, NOT on every autosave
// tick (autosave just advances Agreement.documentData/revision directly,
// same as the Report editor). Lets a user restore an earlier version
// without needing full collaborative-editing/CRDT machinery.
const agreementVersionModel = (sequelize) => {
  const AgreementVersion = sequelize.define(
    "AgreementVersion",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // Soft reference (constraints: false, see models/index.js) so a
      // version row never blocks deleting its parent Agreement.
      agreementId: { type: DataTypes.INTEGER, allowNull: false },
      versionNumber: { type: DataTypes.INTEGER, allowNull: false },
      documentData: { type: DataTypes.TEXT, allowNull: false },
      savedBy: { type: DataTypes.STRING, allowNull: true },
      note: { type: DataTypes.STRING, allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "agreement_versions",
      updatedAt: false,
      indexes: [{ fields: ["agreementId"] }],
    }
  );

  return AgreementVersion;
};

export default agreementVersionModel;
