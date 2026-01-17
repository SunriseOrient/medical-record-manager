import { sequelize, DataTypes } from "./index.js";

const MedicalRecord = sequelize.define(
  "MedicalRecord",
  {
    _id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    recordType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    checkTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalFileName: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "原始上传的文件名，用于前端展示",
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    extractedText: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },
  },
  {
    tableName: "medical_records",
    createdAt: "uploadedAt",
    updatedAt: "updatedAt",
  }
);

export default MedicalRecord;
