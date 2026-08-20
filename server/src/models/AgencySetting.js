import { DataTypes } from "sequelize";

const agencySettingModel = (sequelize) => {
  const AgencySetting = sequelize.define(
    "AgencySetting",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      logo: { type: DataTypes.STRING, allowNull: true },
      name: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      website: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      gstNumber: { type: DataTypes.STRING, allowNull: true },
      password: { type: DataTypes.STRING, allowNull: true },
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
      tableName: "agency_settings",
    }
  );

  return AgencySetting;
};

export default agencySettingModel;
