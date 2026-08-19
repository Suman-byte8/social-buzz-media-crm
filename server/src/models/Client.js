import { DataTypes } from "sequelize";

const clientModel = (sequelize) => {
  const Client = sequelize.define(
    "Client",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: true },
      responsibleUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      renewalDate: { type: DataTypes.DATE, allowNull: true },
      invoiceNumber: { type: DataTypes.STRING, allowNull: true },
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
      tableName: "clients",
    },
  );

  return Client;
};

export default clientModel;