import { DataTypes } from "sequelize";
import clientModel from "./Client.js";
import teamMemberModel from "./TeamMember.js";
import agencySettingModel from "./AgencySetting.js";
import documentModel from "./Document.js";
import taskModel from "./Task.js";
import meetingNoteModel from "./MeetingNote.js";
import contentCalendarEntryModel from "./ContentCalendarEntry.js";
import miscTaskModel from "./MiscTask.js";
import userModel from "./User.js";

export const initModels = (sequelize) => {
  const Client = clientModel(sequelize, DataTypes);
  const TeamMember = teamMemberModel(sequelize, DataTypes);
  const AgencySetting = agencySettingModel(sequelize, DataTypes);
  const Document = documentModel(sequelize, DataTypes);
  const Task = taskModel(sequelize, DataTypes);
  const MeetingNote = meetingNoteModel(sequelize, DataTypes);
  const ContentCalendarEntry = contentCalendarEntryModel(sequelize, DataTypes);
  const MiscTask = miscTaskModel(sequelize, DataTypes);
  const User = userModel(sequelize, DataTypes);

  Client.hasMany(Document, { foreignKey: "clientId", as: "documents" });
  Document.belongsTo(Client, { foreignKey: "clientId", as: "client" });

  Client.hasMany(Task, { foreignKey: "clientId", as: "tasks" });
  Task.belongsTo(Client, { foreignKey: "clientId", as: "client" });

  Client.hasMany(MeetingNote, { foreignKey: "clientId", as: "meetingNotes" });
  MeetingNote.belongsTo(Client, { foreignKey: "clientId", as: "client" });

  Client.hasMany(ContentCalendarEntry, { foreignKey: "clientId", as: "contentCalendarEntries" });
  ContentCalendarEntry.belongsTo(Client, { foreignKey: "clientId", as: "client" });

  Client.hasMany(MiscTask, { foreignKey: "clientId", as: "miscTasks" });
  MiscTask.belongsTo(Client, { foreignKey: "clientId", as: "client" });

  TeamMember.hasMany(MiscTask, { foreignKey: "assignedTo", as: "miscTasks" });
  MiscTask.belongsTo(TeamMember, { foreignKey: "assignedTo", as: "assignee" });

  return { Client, TeamMember, AgencySetting, Document, Task, MeetingNote, ContentCalendarEntry, MiscTask, User };
};