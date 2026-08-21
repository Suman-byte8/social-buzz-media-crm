import { DataTypes } from "sequelize";
import clientModel from "./Client.js";
import teamMemberModel from "./TeamMember.js";
import agencySettingModel from "./AgencySetting.js";
import documentModel from "./Document.js";
import taskModel from "./Task.js";

export const initModels = (sequelize) => {
  const Client = clientModel(sequelize, DataTypes);
  const TeamMember = teamMemberModel(sequelize, DataTypes);
  const AgencySetting = agencySettingModel(sequelize, DataTypes);
  const Document = documentModel(sequelize, DataTypes);
  const Task = taskModel(sequelize, DataTypes);
  
  Client.hasMany(Document, { foreignKey: "clientId", as: "documents" });
  Document.belongsTo(Client, { foreignKey: "clientId", as: "client" });
  
  Client.hasMany(Task, { foreignKey: "clientId", as: "tasks" });
  Task.belongsTo(Client, { foreignKey: "clientId", as: "client" });

  return { Client, TeamMember, AgencySetting, Document, Task };
};