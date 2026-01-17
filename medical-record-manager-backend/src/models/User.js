import { sequelize, DataTypes } from "./index.js";

export const User = sequelize.define(
  "User",
  {
    _id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 255],
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
  }
);
