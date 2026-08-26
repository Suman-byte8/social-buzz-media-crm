import { DataTypes } from "sequelize";

const contentCalendarEntryModel = (sequelize) => {
  const ContentCalendarEntry = sequelize.define(
    "ContentCalendarEntry",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      holiday: { type: DataTypes.STRING, allowNull: true },
      postTitle: { type: DataTypes.STRING, allowNull: true },
      content: { type: DataTypes.TEXT, allowNull: true },
      caption: { type: DataTypes.TEXT, allowNull: true },
      hashtags: { type: DataTypes.TEXT, allowNull: true },
      // JSON-stringified array, e.g. ["facebook","instagram"]
      platforms: { type: DataTypes.TEXT, allowNull: true },
      posted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      postedAt: { type: DataTypes.DATE, allowNull: true },
      // JSON-stringified array of { fileId, fileName, mimeType, driveLink, webViewLink, thumbnailLink, folderId, uploadedAt }
      creatives: { type: DataTypes.TEXT, allowNull: true },
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
      tableName: "content_calendar_entries",
    }
  );

  return ContentCalendarEntry;
};

export default contentCalendarEntryModel;
