# 🚀 Railway 部署指南（国内可用）

## ✅ 优势
- ✅ 已有配置文件（railway.json）
- ✅ 免费额度：$5/月，完全够用
- ✅ 国内访问速度尚可
- ✅ 支持 GitHub 自动部署
- ✅ 无需备案

## 📋 部署步骤

### 步骤1：注册 Railway 账号（1分钟）

1. 访问：https://railway.app
2. 点击 "Login" → 选择 "Login with GitHub"
3. 授权 GitHub 访问

### 步骤2：创建项目并部署（2分钟）

1. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的 `douyin-treasure` 仓库
   - Railway 会自动检测到 `railway.json` 配置

2. **配置服务**
   - Railway 会自动识别 `server` 目录
   - 等待首次部署完成（约 2-3 分钟）

3. **生成域名**
   - 点击项目 → "Settings" → "Generate Domain"
   - 复制生成的域名（例如：`totofun-server.up.railway.app`）

### 步骤3：设置环境变量（2分钟）

在 Railway 项目页面：

1. 点击 "Variables" 标签
2. 添加以下环境变量：

```
MONGODB_URI = mongodb+srv://用户名:密码@cluster0.xxxxx.mongodb.net/totofun-treasure?retryWrites=true&w=majority
JWT_SECRET = 你的随机密钥（至少32个字符）
JWT_REFRESH_SECRET = 另一个随机密钥
JWT_EXPIRES_IN = 7d
NODE_ENV = production
PORT = 5000
CLIENT_URL = https://luciuswang.github.io
```

**获取 JWT 密钥**：
- 访问：https://randomkeygen.com/
- 复制 "Fort Knox Password" 或 "CodeIgniter Encryption Keys"
- 使用两个不同的密钥分别作为 JWT_SECRET 和 JWT_REFRESH_SECRET

### 步骤4：等待重新部署（1分钟）

- 添加环境变量后，Railway 会自动重新部署
- 等待部署状态变为 "Active"

### 步骤5：测试部署（1分钟）

1. **测试健康检查**
   - 访问：`https://你的域名.railway.app/health`
   - 应该看到 JSON 响应：
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "uptime": ...,
     "environment": "production"
   }
   ```

2. **如果返回错误**
   - 检查环境变量是否正确
   - 查看 Railway 日志：项目 → "Deployments" → 点击最新部署 → "View Logs"

### 步骤6：更新前端配置（1分钟）

1. **打开 `index.html`**
   - 找到第 723 行左右的 `API_CONFIG`
   - 找到 `CLOUD_API_URL`

2. **设置 Railway 域名**
   ```javascript
   const API_CONFIG = {
       CLOUD_API_URL: 'https://你的域名.railway.app', // 替换为你的Railway域名
       // ... 其他配置保持不变
   };
   ```

3. **推送到 GitHub**
   ```bash
   git add index.html
   git commit -m "配置Railway API地址"
   git push origin main
   ```

### 步骤7：完成测试

1. 等待 GitHub Pages 自动部署（约 1 分钟）
2. 访问：https://luciuswang.github.io/douyin-treasure/
3. 打开浏览器控制台（F12）
4. 尝试注册功能
5. 检查 Network 标签，确认请求发送到 Railway 地址

## 🎉 完成！

现在你的应用已经部署到 Railway，可以正常使用了！

## 📊 Railway 免费额度

- **$5/月免费额度**
- **500小时运行时间/月**（约 20 天 24 小时运行）
- **100GB 出站流量/月**
- **完全够用**：对于个人项目，这个额度非常充足

## 🔍 查看日志

1. 访问 Railway Dashboard
2. 点击项目
3. 点击 "Deployments"
4. 点击最新部署
5. 点击 "View Logs"

## 🆘 常见问题

### Q: 部署失败怎么办？
A: 
1. 检查环境变量是否正确
2. 查看部署日志中的错误信息
3. 确认 MongoDB Atlas 的 IP 白名单包含 `0.0.0.0/0`

### Q: 连接超时怎么办？
A:
1. 检查 MongoDB Atlas 网络访问设置
2. 确认连接字符串正确
3. 等待几分钟让配置生效

### Q: API 请求失败？
A:
1. 检查前端 `CLOUD_API_URL` 是否正确
2. 确认 Railway 服务状态为 "Active"
3. 查看 Railway 日志中的错误信息

### Q: 如何更新代码？
A:
- 只需 push 到 GitHub，Railway 会自动重新部署
- 或者在 Railway Dashboard 中点击 "Redeploy"

## 💡 提示

- Railway 会自动检测代码变更并重新部署
- 可以设置自定义域名（需要付费）
- 免费额度用完后会自动暂停服务（不会收费）

## 🔄 如果需要切换到其他服务

如果 Railway 访问速度不理想，可以考虑：
1. **Render**：已有 `render.yaml` 配置
2. **LeanCloud**：完全国内服务，速度最快（需要修改代码）

需要我帮你配置哪个方案？

