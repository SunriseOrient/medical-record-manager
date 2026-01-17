# 医疗病例管理系统 - 服务端

基于 Express.js + Sequelize + MariaDB 的 API 服务，提供认证、患者/病例管理、聊天与 AI/OCR 能力。

## 核心特性

- 用户、患者、病例、聊天、分析结果模型及关联
- JWT 认证中间件（默认 8 小时有效期）
- 文件上传/存储/预览能力（图片、PDF）
- Coze OCR 与 DeepSeek AI 调用链路
- RESTful API 路由分层、服务层拆分

## 快速开始

1. 确保已安装 Node.js 18+、MariaDB 10.5+，并已启动数据库。
2. 在 server/.env 配置环境变量（示例见下方）。
3. 安装依赖并启动开发服务器：

```bash
cd server
npm install
npm run dev
```

服务默认运行在 http://localhost:3000。

## 环境变量示例

```
MARIADB_HOST=127.0.0.1
MARIADB_PORT=3306
MARIADB_USER=root
MARIADB_PASSWORD=your_password_here
MARIADB_DATABASE=medical_records
DEEPSEEK_API_KEY=your_key_here
COZE_API_KEY=your_key_here
JWT_SECRET=your_jwt_secret
PORT=3000
```

## 目录导航

- 结构说明：server/PROJECT_STRUCTURE.md
- 开发计划：server/DEVELOPMENT.md
- 本地调试：server/LOCAL_SETUP.md

## API 基础信息

- 基础路径：/api
- 鉴权：除 /api/auth/\* 外其余接口需携带 Authorization: Bearer <token>
