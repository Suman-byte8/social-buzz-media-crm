import { DataTypes } from "sequelize";

const miscTaskModel = (sequelize) => {
  const MiscTask = sequelize.define(
    "MiscTask",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      typeOfWork: {
        type: DataTypes.ENUM("banner", "video", "social_media_banner", "ooh"),
        allowNull: false,
      },
      assignedDate: { type: DataTypes.DATEONLY, allowNull: true },
      deliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "progress", "delivered"),
        allowNull: false,
        defaultValue: "pending",
      },
      assignedTo: { type: DataTypes.INTEGER, allowNull: true },
      fileName: { type: DataTypes.STRING, allowNull: true },
      fileType: { type: DataTypes.STRING, allowNull: true },
      fileSize: { type: DataTypes.INTEGER, allowNull: true },
      fileId: { type: DataTypes.STRING, allowNull: true },
      driveLink: { type: DataTypes.STRING, allowNull: true },
      webViewLink: { type: DataTypes.STRING, allowNull: true },
      googleUserContentLink: { type: DataTypes.STRING, allowNull: true },
      folderId: { type: DataTypes.STRING, allowNull: true },
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
      tableName: "misc_tasks",
    }
  );

  return MiscTask;
};

export default miscTaskModel;
