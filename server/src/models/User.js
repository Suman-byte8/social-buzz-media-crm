import { DataTypes } from "sequelize";

const userModel = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      // Reversibly encrypted (see utils/encryption.js), not hashed — the admin
      // needs to be able to view and hand out the team member's password.
      password: { type: DataTypes.TEXT, allowNull: false },
      role: {
        type: DataTypes.ENUM("admin", "team_member"),
        allowNull: false,
        defaultValue: "team_member",
      },
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
      tableName: "users",
    }
  );

  return User;
};

export default userModel;
