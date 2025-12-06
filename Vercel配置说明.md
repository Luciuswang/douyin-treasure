# Vercel配置问题修复说明

## 🔍 问题诊断

根据错误信息 `net::ERR_CONNECTION_REFUSED`，Vercel服务器无法连接。可能的原因：

1. **Root Directory配置问题**：Vercel项目Root Directory设置为`server`，但`vercel.json`在根目录
2. **路径问题**：`api/server.js`需要引用`server/index.js`，但路径可能不正确
3. **部署配置不匹配**：vercel.json配置与实际部署设置不一致

## ✅ 解决方案

### 方案1：修改Vercel项目Root Directory（推荐）

1. 登录Vercel Dashboard
2. 进入项目 `totofun-server007`
3. 进入 Settings → General
4. 找到 "Root Directory" 设置
5. 将Root Directory从 `server` 改为 `.`（根目录）
6. 保存并重新部署

### 方案2：使用server目录下的vercel.json

如果必须保持Root Directory为`server`，需要：

1. 使用 `server/vercel.json`（已创建）
2. 修改 `api/server.js` 的路径引用
3. 确保所有路径相对于server目录

### 方案3：简化配置（最简单）

创建一个简单的serverless函数入口：

1. 在`server`目录创建`api`目录
2. 将`api/server.js`移到`server/api/server.js`
3. 使用`server/vercel.json`配置

## 🚀 推荐操作步骤

### 步骤1：检查Vercel项目配置

访问：https://vercel.com/dashboard
1. 找到项目 `totofun-server007`
2. 进入 Settings → General
3. 检查 Root Directory 设置

### 步骤2：根据Root Directory选择方案

**如果Root Directory是 `.`（根目录）**：
- 使用根目录的 `vercel.json`
- 确保 `api/server.js` 路径正确

**如果Root Directory是 `server`**：
- 使用 `server/vercel.json`
- 需要调整所有路径引用

### 步骤3：重新部署

1. 推送代码到GitHub
2. Vercel会自动重新部署
3. 检查部署日志是否有错误

## 📝 当前文件结构

```
douyin-treasure/
├── vercel.json          # 根目录配置（Root Directory = . 时使用）
├── server/
│   ├── vercel.json      # Server目录配置（Root Directory = server 时使用）
│   ├── index.js         # Express应用入口
│   └── package.json
└── api/
    ├── server.js        # Serverless函数入口
    └── test.js          # 测试端点
```

## 🔧 快速修复

如果Root Directory是`server`，执行以下操作：

1. 确保使用 `server/vercel.json`
2. 修改 `api/server.js` 中的路径引用
3. 重新部署

如果Root Directory是`.`（根目录），执行以下操作：

1. 确保使用根目录的 `vercel.json`
2. 删除 `server/vercel.json`（避免冲突）
3. 重新部署

## ⚠️ 重要提示

- Vercel项目只能有一个Root Directory设置
- vercel.json必须与Root Directory设置匹配
- 路径引用必须相对于Root Directory
- 重新部署后需要等待1-2分钟才能生效

