import { sequelize, DataTypes } from "./index.js";

export const Patient = sequelize.define(
  "Patient",
  {
    _id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    patientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    idNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "patients",
  }
);
