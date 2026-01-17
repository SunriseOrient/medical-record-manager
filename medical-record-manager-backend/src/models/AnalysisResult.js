import { sequelize, DataTypes } from "./index.js";

export const AnalysisResult = sequelize.define(
  "AnalysisResult",
  {
    _id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    medicalRecordIds: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    analysisContent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    analysisType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    analysisTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "analysis_results",
  }
);
