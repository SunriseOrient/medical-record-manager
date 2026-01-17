import { sequelize, DataTypes } from "./index.js";

const ChatHistory = sequelize.define(
  "ChatHistory",
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
    patientId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    userMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    aiReply: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    relatedRecordIds: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    messageType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "text",
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "chat_histories",
  }
);

export default ChatHistory;
