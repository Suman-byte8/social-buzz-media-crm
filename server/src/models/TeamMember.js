import { DataTypes } from "sequelize";

const teamMemberModel = (sequelize) => {
  const TeamMember = sequelize.define(
    "TeamMember",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      // Personal & Contact Information
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: true },
      number: { type: DataTypes.STRING, allowNull: true },
      whatsappNumber: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      aadharNumber: { type: DataTypes.STRING, allowNull: true },
      avatar: { type: DataTypes.TEXT, allowNull: true },
      resume: { type: DataTypes.TEXT, allowNull: true },
      bankDetails: { type: DataTypes.TEXT, allowNull: true },

      // Job & Position Details
      designation: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      employmentType: { type: DataTypes.STRING, allowNull: true }, // full-time, internship, freelance
      hireDate: { type: DataTypes.DATEONLY, allowNull: true },
      managerReportTo: { type: DataTypes.STRING, allowNull: true },

      // Work & Status Details
      status: { type: DataTypes.STRING, allowNull: true, defaultValue: null }, // active / inactive / null
      assignedWorks: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      clientHandling: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },

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
      tableName: "team_members",
    }
  );

  return TeamMember;
};

export default teamMemberModel;
