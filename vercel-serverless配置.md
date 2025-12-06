# Vercel Serverless函数配置

Vercel需要将Express应用改为Serverless函数格式。有两种方案：

## 方案1：使用Vercel的API路由（推荐）

创建 `api/server.js` 文件，将Express应用包装为Serverless函数。

## 方案2：使用vercel.json配置（当前方案）

当前的 `vercel.json` 只配置了AI路由，需要添加后端API路由。

## 快速方案：直接部署server目录

Vercel支持直接部署Node.js应用，但需要配置：

1. 在项目根目录创建 `vercel.json`
2. 配置server目录为独立服务
3. 设置环境变量
4. 部署

让我为你创建完整的Vercel配置。

