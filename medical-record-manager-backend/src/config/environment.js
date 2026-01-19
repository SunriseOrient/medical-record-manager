import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const config = {
  // 服务器配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // 数据库配置（MariaDB）

  // MariaDB 配置
  mariadb: {
    host: process.env.MARIADB_HOST || "127.0.0.1",
    port: parseInt(process.env.MARIADB_PORT || "3306"),
    user: process.env.MARIADB_USER || "root",
    password: process.env.MARIADB_PASSWORD || "",
    database: process.env.MARIADB_DATABASE || "medical_records",
    dialect: process.env.MARIADB_DIALECT || "mysql",
  },

  // DeepSeek API 配置
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  deepseekApiUrl: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com",

  // Coze API 配置
  cozeApiKey: process.env.COZE_API_KEY,
  cozeApiUrl: process.env.COZE_API_URL || "https://api.coze.cn",
  cozeWorkflowId: process.env.COZE_WORKFLOW_ID || "7585465251577217033",

  // 文件存储配置
  uploadDir: process.env.UPLOAD_DIR || "./medical-records",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "20971520"), // 20MB
  fileServiceBaseUrl:
    process.env.FILE_SERVICE_BASE_URL || "http://192.168.1.3:7070/file_store",
  uploadApiToken: process.env.UPLOAD_API_TOKEN,
  uploadApiTokenHeader: process.env.UPLOAD_API_TOKEN_HEADER || "x-file-token",

  // JWT 配置
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret_key_here",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",

  // 功能开关
  isDevelopment: process.env.NODE_ENV !== "production",
};

// 验证必需的配置
if (!config.deepseekApiKey && config.nodeEnv === "production") {
  console.warn("⚠️ 警告: DEEPSEEK_API_KEY 未配置");
}

export default config;
