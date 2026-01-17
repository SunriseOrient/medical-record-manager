import { Sequelize, DataTypes } from "sequelize";
import config from "../config/environment.js";

const sequelize = new Sequelize(
  config.mariadb.database,
  config.mariadb.user,
  config.mariadb.password,
  {
    host: config.mariadb.host,
    port: config.mariadb.port,
    dialect: config.mariadb.dialect || "mysql",
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
    dialectOptions: {
      charset: "utf8mb4",
    },
  }
);

export { sequelize, DataTypes };

export default sequelize;
