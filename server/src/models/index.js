import { DataTypes } from "sequelize";
import clientModel from "./Client.js";

export const initModels = (sequelize) => {
  const Client = clientModel(sequelize, DataTypes);
  return { Client };
};