/**
 * 数据库初始化 Migration 脚本
 * 用于创建所有表结构
 * 
 * 使用方式：
 * node migrations/init.js
 */

import sequelize from "../src/models/index.js";
import { User } from "../src/models/User.js";
import { Patient } from "../src/models/Patient.js";
import MedicalRecord from "../src/models/MedicalRecord.js";
import ChatHistory from "../src/models/ChatHistory.js";
import { AnalysisResult } from "../src/models/AnalysisResult.js";
import config from "../src/config/environment.js";

async function runMigration() {
  try {
    console.log("🔄 开始初始化数据库...");
    
    // 1. 测试连接
    await sequelize.authenticate();
    console.log("✅ 数据库连接成功");

    // 2. 同步所有模型（创建表）
    console.log("📋 创建表结构...");
    await sequelize.sync({ alter: true });
    console.log("✅ 表结构创建成功");

    // 3. 创建索引
    console.log("🔑 创建索引...");
    await sequelize.query("CREATE INDEX IF NOT EXISTS idx_patients_userId ON patients(userId);");
    await sequelize.query("CREATE INDEX IF NOT EXISTS idx_medical_records_patientId ON medical_records(patientId);");
    await sequelize.query("CREATE INDEX IF NOT EXISTS idx_chat_histories_userId ON chat_histories(userId);");
    await sequelize.query("CREATE INDEX IF NOT EXISTS idx_chat_histories_patientId ON chat_histories(patientId);");
    await sequelize.query("CREATE INDEX IF NOT EXISTS idx_analysis_results_patientId ON analysis_results(patientId);");
    await sequelize.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);");
    console.log("✅ 索引创建成功");

    // 4. 输出表结构信息
    console.log("\n📊 数据库表结构信息：");
    console.log("─".repeat(50));
    
    const tables = ["users", "patients", "medical_records", "chat_histories", "analysis_results"];
    for (const table of tables) {
      const columns = await sequelize.query(`DESCRIBE ${table};`);
      console.log(`\n表名: ${table}`);
      columns[0].forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === "NO" ? "NOT NULL" : ""}${col.Key === "PRI" ? " PRIMARY KEY" : ""}${col.Key === "UNI" ? " UNIQUE" : ""}`);
      });
    }

    console.log("\n" + "─".repeat(50));
    console.log("✨ 数据库初始化完成！");
    console.log(`\n配置信息：`);
    console.log(`  - 数据库: ${config.mariadb.database}`);
    console.log(`  - 主机: ${config.mariadb.host}:${config.mariadb.port}`);
    console.log(`  - 用户: ${config.mariadb.user}`);
    console.log(`  - 环境: ${config.nodeEnv}`);

  } catch (error) {
    console.error("❌ 数据库初始化失败:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行 migration
runMigration();
