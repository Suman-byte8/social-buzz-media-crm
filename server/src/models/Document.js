import { DataTypes } from "sequelize";

const documentModel = (sequelize) => {
  const Document = sequelize.define(
    "Document",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fileName: { type: DataTypes.STRING, allowNull: false },
      fileType: { type: DataTypes.STRING, allowNull: true },
      fileSize: { type: DataTypes.INTEGER, allowNull: true },
      fileId: { type: DataTypes.STRING, allowNull: false },
      driveLink: { type: DataTypes.STRING, allowNull: true },
      webViewLink: { type: DataTypes.STRING, allowNull: true },
      googleUserContentLink: { type: DataTypes.STRING, allowNull: true },
      folderId: { type: DataTypes.STRING, allowNull: true },
      clientId: { type: DataTypes.INTEGER, allowNull: true },
      uploadedBy: { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      // Agreement-specific fields
      documentType: {
        type: DataTypes.ENUM("agreement", "proposal", "invoice", "report", "content_calendar", "other"),
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
    }
  );

  return Document;
};

export default documentModel;
