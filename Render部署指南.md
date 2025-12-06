# 🚀 Render 部署指南

## ✅ Render 优势

- ✅ **已有配置文件**：项目中有 `render.yaml`，部署简单
- ✅ **免费额度**：免费套餐可用，适合个人项目
- ✅ **自动部署**：连接 GitHub 自动部署
- ✅ **HTTPS 自动**：自动配置 SSL 证书
- ✅ **健康检查**：自动监控服务状态
- ✅ **日志查看**：实时查看部署和运行日志

## ⚠️ Render 免费套餐限制

- ⚠️ **休眠机制**：15分钟无请求后会自动休眠
- ⚠️ **冷启动**：休眠后首次请求需要等待约30秒唤醒
- ⚠️ **国内访问**：速度一般，可能比 Railway 稍慢
- ✅ **免费额度**：完全够用，适合个人项目

## 📋 部署步骤

### 步骤1：注册 Render 账号（1分钟）

1. 访问：https://render.com
2. 点击 "Get Started for Free"
3. 选择 "Sign up with GitHub"
4. 授权 GitHub 访问

### 步骤2：创建 Web Service（2分钟）

**方法A：使用 render.yaml 配置文件（推荐）**

1. **创建 Blueprint**
   - 在 Render Dashboard 点击 "New +"
   - 选择 "Blueprint"
   - 连接你的 `douyin-treasure` GitHub 仓库
   - Render 会自动检测 `render.yaml` 文件
   - 点击 "Apply"

2. **自动配置**
   - Render 会根据 `render.yaml` 自动创建服务
   - 服务名称：`totofun-server`
   - Root Directory：`server`
   - Build Command：`npm install`
   - Start Command：`node index.js`
   - Health Check Path：`/health`

**方法B：手动创建 Web Service**

1. 点击 "New +" → "Web Service"
2. 连接 GitHub 仓库 `douyin-treasure`
3. 配置服务：
   - **Name**: `totofun-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: `Free`（免费套餐）
   - **Health Check Path**: `/health`

### 步骤3：设置环境变量（2分钟）

在 Render 服务页面：

1. 点击 "Environment" 标签
2. 添加以下环境变量：

```
MONGODB_URI = mongodb+srv://用户名:密码@cluster0.xxxxx.mongodb.net/totofun-treasure?retryWrites=true&w=majority
JWT_SECRET = 你的随机密钥（至少32个字符）
JWT_REFRESH_SECRET = 另一个随机密钥
JWT_EXPIRES_IN = 7d
NODE_ENV = production
PORT = 10000
CLIENT_URL = https://luciuswang.github.io
```

**注意**：Render 免费套餐使用端口 `10000`，已在 `render.yaml` 中配置。

**获取 JWT 密钥**：
- 访问：https://randomkeygen.com/
- 复制 "Fort Knox Password" 或 "CodeIgniter Encryption Keys"
- 使用两个不同的密钥

### 步骤4：等待部署（2-3分钟）

1. Render 会自动开始部署
2. 查看 "Events" 标签查看部署进度
3. 等待状态变为 "Live"
4. 复制服务 URL（例如：`totofun-server.onrender.com`）

### 步骤5：测试部署（1分钟）

1. **测试健康检查**
   - 访问：`https://你的域名.onrender.com/health`
   - 如果服务已休眠，首次访问需要等待约30秒唤醒
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
   - 查看 "Logs" 标签中的错误信息
   - 确认 MongoDB Atlas 的 IP 白名单包含 `0.0.0.0/0`

### 步骤6：更新前端配置（1分钟）

1. **打开 `index.html`**
   - 找到第 723 行左右的 `API_CONFIG`
   - 找到 `CLOUD_API_URL`

2. **设置 Render 域名**
   ```javascript
   const API_CONFIG = {
       CLOUD_API_URL: 'https://你的域名.onrender.com', // 替换为你的Render域名
       // ... 其他配置保持不变
   };
   ```

3. **推送到 GitHub**
   ```bash
   git add index.html
   git commit -m "配置Render API地址"
   git push origin main
   ```

### 步骤7：完成测试

1. 等待 GitHub Pages 自动部署（约 1 分钟）
2. 访问：https://luciuswang.github.io/douyin-treasure/
3. 打开浏览器控制台（F12）
4. 尝试注册功能
   - **注意**：如果服务已休眠，首次请求需要等待约30秒
5. 检查 Network 标签，确认请求发送到 Render 地址

## 🎉 完成！

现在你的应用已经部署到 Render，可以正常使用了！

## 📊 Render 免费套餐详情

### 免费额度
- ✅ **无限部署**
- ✅ **750小时运行时间/月**（约 31 天 24 小时运行）
- ✅ **100GB 出站流量/月**
- ✅ **完全够用**：对于个人项目，这个额度非常充足

### 限制
- ⚠️ **自动休眠**：15分钟无请求后休眠
- ⚠️ **冷启动**：休眠后首次请求需要等待约30秒
- ⚠️ **无自定义域名**：免费套餐只能使用 `.onrender.com` 域名

## 🔍 查看日志

1. 访问 Render Dashboard
2. 点击你的服务
3. 点击 "Logs" 标签
4. 可以实时查看：
   - 构建日志（Build Logs）
   - 运行时日志（Runtime Logs）

## 🆘 常见问题

### Q: 为什么首次请求很慢？
A: Render 免费套餐有休眠机制。15分钟无请求后会自动休眠，首次请求需要等待约30秒唤醒。这是正常的。

### Q: 如何防止服务休眠？
A: 
1. **使用付费套餐**（$7/月起）
2. **使用外部监控服务**定期ping你的服务（例如：UptimeRobot）
3. **接受休眠**：对于个人项目，休眠机制影响不大

### Q: 部署失败怎么办？
A:
1. 检查环境变量是否正确
2. 查看 "Logs" 标签中的错误信息
3. 确认 MongoDB Atlas 的 IP 白名单包含 `0.0.0.0/0`
4. 检查 `render.yaml` 配置是否正确

### Q: 连接超时怎么办？
A:
1. 检查 MongoDB Atlas 网络访问设置
2. 确认连接字符串正确
3. 等待几分钟让配置生效
4. 如果服务已休眠，等待首次请求唤醒

### Q: API 请求失败？
A:
1. 检查前端 `CLOUD_API_URL` 是否正确
2. 确认 Render 服务状态为 "Live"
3. 查看 Render 日志中的错误信息
4. 如果服务已休眠，等待首次请求唤醒

### Q: 如何更新代码？
A:
- 只需 push 到 GitHub，Render 会自动重新部署
- 或者在 Render Dashboard 中点击 "Manual Deploy" → "Deploy latest commit"

## 💡 优化建议

### 1. 防止休眠（可选）

如果不想服务休眠，可以使用外部监控服务定期ping：

**UptimeRobot（免费）**：
1. 访问：https://uptimerobot.com
2. 注册账号
3. 添加监控：
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Totofun Server`
   - URL: `https://你的域名.onrender.com/health`
   - Monitoring Interval: `5 minutes`
4. 这样每5分钟ping一次，服务就不会休眠

### 2. 使用自定义域名（需要付费）

如果需要自定义域名：
1. 升级到付费套餐（$7/月起）
2. 在服务设置中添加自定义域名
3. 配置 DNS 记录

## 📊 Render vs Railway 对比

| 特性 | Render | Railway |
|------|--------|---------|
| 免费额度 | 750小时/月 | $5/月 |
| 休眠机制 | ✅ 有（15分钟） | ❌ 无 |
| 冷启动 | ⚠️ 约30秒 | ❌ 无 |
| 国内速度 | ⭐⭐ | ⭐⭐ |
| 配置难度 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 推荐度 | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🎯 建议

**选择 Render 如果**：
- ✅ 预算有限，想用完全免费的服务
- ✅ 可以接受15分钟休眠机制
- ✅ 不需要24小时不间断运行

**选择 Railway 如果**：
- ✅ 需要24小时不间断运行
- ✅ 不想处理休眠和冷启动
- ✅ 愿意使用 $5/月免费额度

## 🔄 如果需要切换到其他服务

如果 Render 访问速度不理想，可以考虑：
1. **Railway**：已有 `railway.json` 配置，无休眠机制
2. **LeanCloud**：完全国内服务，速度最快（需要修改代码）

需要我帮你配置哪个方案？

