import cors from "cors";
import express from "express";
import connectDB from "./config/database.js";
import config from "./config/environment.js";
import { authenticateToken } from "./middleware/auth.js";

// 导入路由
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import medicalRecordRoutes from "./routes/medicalRecord.js";
import patientRoutes from "./routes/patient.js";

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 数据库连接
await connectDB();

// API 路由
app.use("/api/auth", authRoutes);
app.use("/api/patients", authenticateToken, patientRoutes);
app.use("/api/chat", authenticateToken, chatRoutes);
app.use("/api/medical-records", authenticateToken, medicalRecordRoutes);

// 健康检查
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "接口不存在",
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error("❌ 服务器错误:", err);
  res.status(500).json({
    success: false,
    message: "服务器错误",
    error: config.isDevelopment ? err.message : "未知错误",
  });
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     医疗病例管理系统 - 后端服务已启动                           ║
║     🚀 Server is running on http://localhost:${PORT}              ║
║     📝 环境: ${config.nodeEnv}                              ║
║     🗄️  数据库: ${config.mariadb.database}@${config.mariadb.host}:${config.mariadb.port}  ║
╚════════════════════════════════════════════════════════════╝
  `);
});
