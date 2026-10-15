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
import taskAssigneeModel from "./TaskAssignee.js";
import leadModel from "./Lead.js";
import notificationModel from "./Notification.js";
import serviceModel from "./Service.js";
import reportModel from "./Report.js";
import reportTemplateModel from "./ReportTemplate.js";
import agreementModel from "./Agreement.js";
import agreementTemplateModel from "./AgreementTemplate.js";
import agreementVersionModel from "./AgreementVersion.js";
import agreementActivityLogModel from "./AgreementActivityLog.js";

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
  const TaskAssignee = taskAssigneeModel(sequelize, DataTypes);
  const Lead = leadModel(sequelize, DataTypes);
  const Notification = notificationModel(sequelize, DataTypes);
  const Service = serviceModel(sequelize, DataTypes);
  const Report = reportModel(sequelize, DataTypes);
  const ReportTemplate = reportTemplateModel(sequelize, DataTypes);
  const Agreement = agreementModel(sequelize, DataTypes);
  const AgreementTemplate = agreementTemplateModel(sequelize, DataTypes);
  const AgreementVersion = agreementVersionModel(sequelize, DataTypes);
  const AgreementActivityLog = agreementActivityLogModel(sequelize, DataTypes);

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

  Task.belongsToMany(TeamMember, {
    through: TaskAssignee,
    as: "assigneeMembers",
    foreignKey: "taskId",
    otherKey: "teamMemberId",
  });
  Task.belongsTo(TeamMember, { foreignKey: "assignedById", as: "assignedByMember", constraints: false });
  TeamMember.belongsToMany(Task, {
    through: TaskAssignee,
    as: "assignedTasks",
    foreignKey: "teamMemberId",
    otherKey: "taskId",
  });

  Task.hasMany(Notification, { foreignKey: "taskId", as: "notifications", constraints: false });
  Notification.belongsTo(Task, { foreignKey: "taskId", as: "task", constraints: false });

  Lead.hasMany(Document, { foreignKey: "leadId", as: "documents", constraints: false });
  Document.belongsTo(Lead, { foreignKey: "leadId", as: "lead", constraints: false });

  MeetingNote.hasMany(Document, { foreignKey: "noteId", as: "attachments", constraints: false });
  Document.belongsTo(MeetingNote, { foreignKey: "noteId", as: "note", constraints: false });

  TeamMember.hasMany(Document, { foreignKey: "teamMemberId", as: "salarySlips", constraints: false });
  Document.belongsTo(TeamMember, { foreignKey: "teamMemberId", as: "teamMember", constraints: false });

  // Aliased "builderReports" rather than "reports" — Client already has a
  // real `reports` TEXT column (a legacy free-text field, unrelated to the
  // Report Builder), and Sequelize refuses an association alias that
  // collides with an existing attribute name.
  Client.hasMany(Report, { foreignKey: "clientId", as: "builderReports" });
  Report.belongsTo(Client, { foreignKey: "clientId", as: "client" });

  Report.hasMany(Document, { foreignKey: "reportId", as: "assets", constraints: false });
  Document.belongsTo(Report, { foreignKey: "reportId", as: "report", constraints: false });

  ReportTemplate.hasMany(Report, { foreignKey: "templateId", as: "reports", constraints: false });
  Report.belongsTo(ReportTemplate, { foreignKey: "templateId", as: "template", constraints: false });

  // Aliased "agreementDrafts" rather than "agreements" — the existing
  // upload-based Agreements feature already refers to a client's agreement
  // *Documents* as "agreements" throughout the UI/API, so reusing that word
  // here would be ambiguous even though it wouldn't technically collide.
  Client.hasMany(Agreement, { foreignKey: "clientId", as: "agreementDrafts" });
  Agreement.belongsTo(Client, { foreignKey: "clientId", as: "client" });

  // A generated agreement's finalized PDF/DOCX exports are ordinary
  // Document rows (documentType "agreement") — same "export creates a new
  // Document rather than overwriting" pattern Report.assets uses — so they
  // appear in the existing Agreements dashboard/tab automatically.
  Agreement.hasMany(Document, { foreignKey: "agreementId", as: "exports", constraints: false });
  Document.belongsTo(Agreement, { foreignKey: "agreementId", as: "agreementDraft", constraints: false });

  AgreementTemplate.hasMany(Agreement, { foreignKey: "templateId", as: "agreements", constraints: false });
  Agreement.belongsTo(AgreementTemplate, { foreignKey: "templateId", as: "template", constraints: false });

  Agreement.hasMany(AgreementVersion, { foreignKey: "agreementId", as: "versions", constraints: false });
  AgreementVersion.belongsTo(Agreement, { foreignKey: "agreementId", as: "agreement", constraints: false });

  Agreement.hasMany(AgreementActivityLog, { foreignKey: "agreementId", as: "activityLogs", constraints: false });
  AgreementActivityLog.belongsTo(Agreement, { foreignKey: "agreementId", as: "agreement", constraints: false });

  return {
    Client,
    TeamMember,
    AgencySetting,
    Document,
    Task,
    MeetingNote,
    ContentCalendarEntry,
    MiscTask,
    User,
    TaskAssignee,
    Lead,
    Notification,
    Service,
    Report,
    ReportTemplate,
    Agreement,
    AgreementTemplate,
    AgreementVersion,
    AgreementActivityLog,
  };
};