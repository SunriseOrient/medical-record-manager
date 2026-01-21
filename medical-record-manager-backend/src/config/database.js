import sequelize from "../models/index.js";

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    // 只在生产环境或首次启动时同步，避免热更新导致重复创建索引
    // 开发环境请使用 migrations/init.js 手动初始化数据库
    if (process.env.NODE_ENV === 'production' || process.env.FORCE_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log("✅ MariaDB 连接成功并已同步模型");
    } else {
      console.log("✅ MariaDB 连接成功（跳过自动同步，请使用 migrations/init.js 初始化数据库）");
    }
  } catch (error) {
    console.error("❌ MariaDB 连接失败:", error.message);
    process.exit(1);
  }
};

export default connectDB;
