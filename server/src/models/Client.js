import { DataTypes } from "sequelize";

const clientModel = (sequelize) => {
  const Client = sequelize.define(
    "Client",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      logo: { type: DataTypes.TEXT, allowNull: true },
      industry: { type: DataTypes.STRING, allowNull: true },
      phoneNumber: { type: DataTypes.STRING, allowNull: true },
      whatsappNumber: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      website: { type: DataTypes.STRING, allowNull: true },
      servicesSelected: { type: DataTypes.TEXT, allowNull: true },
      clientManagedBy: { type: DataTypes.INTEGER, allowNull: true },
      clientHealth: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
      },
      proposals: { type: DataTypes.TEXT, allowNull: true },
      credentials: { type: DataTypes.TEXT, allowNull: true },
      campaigns: { type: DataTypes.TEXT, allowNull: true },
      socialMediaAccounts: { type: DataTypes.TEXT, allowNull: true },
      reports: { type: DataTypes.TEXT, allowNull: true },
      invoices: { type: DataTypes.TEXT, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      renewal: { type: DataTypes.DATE, allowNull: true },
      // The date the client actually became a client (editable) — distinct
      // from `createdAt`, which is just when this row was inserted and is
      // always "now" (so it's wrong for a client onboarded before this CRM
      // record was created). Defaults to `createdAt` if never set.
      clientSince: { type: DataTypes.DATEONLY, allowNull: true },
      contentCalendar: { type: DataTypes.TEXT, allowNull: true },
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
