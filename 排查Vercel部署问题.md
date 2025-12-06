# 🔍 排查Vercel部署问题

## 问题：ERR_CONNECTION_TIMED_OUT

### 可能的原因

1. **Serverless函数冷启动**
   - Vercel的Serverless函数首次访问需要几秒钟启动
   - 等待30-60秒后重试

2. **MongoDB连接失败**
   - MongoDB Atlas网络访问未配置
   - 连接字符串错误

3. **部署未完成**
   - 检查Vercel Dashboard的部署状态

## 排查步骤

### 步骤1：检查Vercel部署状态

1. 回到Vercel Dashboard
2. 点击 "Deployments" 标签
3. 查看最新部署的状态：
   - ✅ Ready（绿色）= 部署成功
   - ⏳ Building = 正在构建
   - ❌ Error = 部署失败

### 步骤2：查看部署日志

1. 在Deployments页面，点击最新的部署
2. 查看 "Build Logs" 和 "Runtime Logs"
3. 检查是否有错误信息

### 步骤3：检查MongoDB网络访问

1. 回到MongoDB Atlas
2. 点击左侧 "Network Access"（网络访问）
3. 确认是否有IP地址：
   - 应该有 `0.0.0.0/0`（允许所有IP）
   - 或者有你的IP地址

如果没有，需要添加：
- 点击 "Add IP Address"
- 选择 "Allow Access from Anywhere"（`0.0.0.0/0`）
- 点击 "Confirm"

### 步骤4：检查环境变量

1. 在Vercel Dashboard
2. 点击 "Settings" → "Environment Variables"
3. 确认所有变量都已设置：
   - MONGODB_URI
   - JWT_SECRET
   - JWT_REFRESH_SECRET
   - JWT_EXPIRES_IN
   - NODE_ENV
   - CLIENT_URL

### 步骤5：等待并重试

1. 等待1-2分钟（Serverless冷启动）
2. 再次访问：`https://totofun-server007.vercel.app/health`
3. 如果还是超时，查看Runtime Logs

## 常见错误和解决方案

### 错误1：MongoDB连接超时

**症状**：Runtime Logs显示MongoDB连接错误

**解决**：
1. 检查MongoDB Atlas网络访问
2. 确认连接字符串格式正确
3. 确认数据库用户名密码正确

### 错误2：函数启动失败

**症状**：Build Logs显示错误

**解决**：
1. 检查server/package.json是否存在
2. 确认所有依赖都已安装
3. 查看具体错误信息

### 错误3：国内访问超时

**症状**：国内访问Vercel超时

**解决**：
1. 使用VPN或代理
2. 或考虑使用LeanCloud等国内服务

## 快速检查清单

- [ ] Vercel部署状态是 "Ready"
- [ ] MongoDB Atlas网络访问已配置（`0.0.0.0/0`）
- [ ] 所有环境变量都已设置
- [ ] 等待1-2分钟后重试
- [ ] 查看Runtime Logs确认错误

## 下一步

如果问题持续：
1. 告诉我Vercel Dashboard显示的部署状态
2. 告诉我Runtime Logs中的错误信息
3. 确认MongoDB网络访问是否配置

