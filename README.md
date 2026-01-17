# 医疗病例管理系统（medical-record-manager）

面向医疗场景的病例管理与 AI 辅助分析，包含后端 API 服务（Express + Sequelize + MariaDB）与前端 SPA（Vue 3 + Vite + Element Plus）。

## 仓库结构

- medical-record-manager-backend/：后端服务
- medical-record-manager-frontend/：前端应用
- doc/：需求说明书、开发计划等文档

## 快速开始

1. 启动数据库：本地 MariaDB 10.5+，创建数据库 `medical_records`。
2. 启动后端：

   ```bash
   cd medical-record-manager-backend
   npm install
   npm run dev
   ```

   - 默认地址：http://localhost:3000，基础路径 `/api`
   - 环境变量参考后端 README（包含数据库、DeepSeek、Coze、JWT、PORT）。

3. 启动前端：

   ```bash
   cd medical-record-manager-frontend
   npm install
   npm run dev
   ```

   - 默认地址：http://localhost:5173
   - 代理：`/api` -> `http://localhost:3000/api`（需先启动后端）。

## 主要特性

- JWT 认证与路由守卫，token 默认 8 小时有效。
- 患者与病例管理：上传/预览/编辑/删除（图片、PDF），OCR 提取文本。
- 聊天与 AI 分析：调用 DeepSeek，历史记录持久化与 Markdown 渲染。
- 文件服务：本地存储与下载，后续可扩展到对象存储。

## 文档索引

- 需求说明书：doc/需求说明书.md
- 开发计划：doc/开发计划.md
- 后端说明：medical-record-manager-backend/README.md
- 前端说明：medical-record-manager-frontend/README.md

## 开发提示

- 前端 patientStore 选择的患者用于聊天/病例上下文。
- 上传限制：当前校验 JPG/PNG/PDF，大小 20MB；可按需调整。
- 生产环境建议：密码加密、上传与输入校验、JWT 刷新策略、日志/监控与 CI 流程。
