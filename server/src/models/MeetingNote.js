import { DataTypes } from "sequelize";

const meetingNoteModel = (sequelize) => {
  const MeetingNote = sequelize.define(
    "MeetingNote",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      meetingDate: { type: DataTypes.DATEONLY, allowNull: true },
      meetingType: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "other",
      },
      attendees: { type: DataTypes.TEXT, allowNull: true },
      actionItems: { type: DataTypes.TEXT, allowNull: true },
      // A single reference link (e.g. a recording, shared doc, or ticket)
      // attached to the note — separate from the "image links" flow, which
      // mirrors external images into Drive as Document rows (see
      // Document.noteAttachmentKind).
      link: { type: DataTypes.STRING, allowNull: true },
      clientId: { type: DataTypes.INTEGER, allowNull: true },
      createdBy: { type: DataTypes.STRING, allowNull: true },
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
      tableName: "meeting_notes",
      indexes: [{ fields: ["clientId"] }],
    }
  );

  return MeetingNote;
};

export default meetingNoteModel;
