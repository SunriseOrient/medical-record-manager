# 医疗病例管理系统 - 客户端

Vue 3 + Vite + Element Plus 深色主题的单页应用，负责用户登录、病例管理和 AI 聊天前端体验。

## 核心特性

- JWT 路由守卫与 sessionStorage 会话保持
- 患者、病例管理组件化对话框，支持上传与预览
- AI 聊天界面，Markdown 渲染与历史记录展示
- API 服务层（Axios 拦截器）统一注入 token、错误处理
- 响应式布局与深色主题样式

## 快速开始

1. 确保已安装 Node.js 18+。
2. 进入前端目录安装依赖并启动：

```bash
cd client
npm install
npm run dev
```

默认端口：`http://localhost:5173`，Vite 代理将 `/api` 指向 `http://localhost:3000/api`（需先启动服务端）。

## 目录导航

- 结构说明：client/PROJECT_STRUCTURE.md
- 开发计划：client/DEVELOPMENT.md
- 本地调试：client/LOCAL_SETUP.md

## 主要工作流

- 用户认证：登录/注册 → 获取 token → sessionStorage 持久化 → 路由守卫校验
- 患者上下文：在 patientStore 选择当前患者，作为聊天/病例操作的上下文
- 病例上传：文件校验 → 上传 → 预览/OCR 文本展示
- AI 聊天：发送消息 → 调用 `/api/chat` → DeepSeek 回复 → Markdown 渲染
