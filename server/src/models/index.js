import { DataTypes } from "sequelize";
import clientModel from "./Client.js";
import teamMemberModel from "./TeamMember.js";
import agencySettingModel from "./AgencySetting.js";

export const initModels = (sequelize) => {
  const Client = clientModel(sequelize, DataTypes);
  const TeamMember = teamMemberModel(sequelize, DataTypes);
  const AgencySetting = agencySettingModel(sequelize, DataTypes);
  return { Client, TeamMember, AgencySetting };
};