import { DataTypes } from "sequelize";

// The master list of services the agency offers — what a client's
// "Services Provided" picker (AddEditClientModal.js) selects from. Client
// rows only ever store the selected service *names* as a comma-joined
// string (Client.servicesSelected), not a foreign key, so renaming or
// deleting a service here does not retroactively change any client's
// existing selection — same soft-reference tradeoff as everywhere else in
// this app that stores a name/string rather than an id.
const serviceModel = (sequelize) => {
  const Service = sequelize.define(
    "Service",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
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
      tableName: "services",
    }
  );

  return Service;
};

export default serviceModel;
