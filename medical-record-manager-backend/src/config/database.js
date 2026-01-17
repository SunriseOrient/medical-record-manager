import sequelize from "../models/index.js";

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ MariaDB 连接成功并已同步模型");
  } catch (error) {
    console.error("❌ MariaDB 连接失败:", error.message);
    process.exit(1);
  }
};

export default connectDB;
