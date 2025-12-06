# 🚀 5分钟快速部署到Railway

## 步骤1：设置MongoDB Atlas（2分钟）

1. 访问：https://www.mongodb.com/cloud/atlas/register
2. 注册账号（免费）
3. 创建免费集群（M0）
4. 点击 "Database Access" → 创建数据库用户
5. 点击 "Network Access" → 添加IP `0.0.0.0/0`（允许所有IP）
6. 点击 "Connect" → "Connect your application" → 复制连接字符串

连接字符串格式：
```
mongodb+srv://用户名:密码@cluster0.xxxxx.mongodb.net/totofun-treasure?retryWrites=true&w=majority
```

## 步骤2：部署到Railway（3分钟）

1. **访问Railway**
   - 打开：https://railway.app
   - 使用GitHub账号登录

2. **创建项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 授权并选择 `douyin-treasure` 仓库
   - Railway会自动检测到server目录

3. **设置环境变量**
   - 点击项目 → "Variables" 标签
   - 添加以下变量：
   
   ```
   MONGODB_URI = mongodb+srv://用户名:密码@cluster0.xxxxx.mongodb.net/totofun-treasure?retryWrites=true&w=majority
   JWT_SECRET = 你的随机密钥（至少32个字符，可以用这个生成：https://randomkeygen.com/）
   JWT_REFRESH_SECRET = 另一个随机密钥
   JWT_EXPIRES_IN = 7d
   NODE_ENV = production
   PORT = 5000
   CLIENT_URL = https://luciuswang.github.io
   ```

4. **获取域名**
   - 点击 "Settings" → "Generate Domain"
   - 复制生成的域名（例如：`totofun-server.up.railway.app`）

5. **等待部署**
   - Railway会自动开始部署
   - 等待2-3分钟，看到 "Deploy successful"

6. **测试**
   - 访问：`https://你的域名.railway.app/health`
   - 应该看到JSON响应

## 步骤3：更新前端（1分钟）

1. **打开 `index.html`**
   - 找到第723行左右的 `CLOUD_API_URL`
   - 设置为你的Railway域名：
   ```javascript
   CLOUD_API_URL: 'https://你的域名.railway.app',
   ```

2. **推送到GitHub**
   ```bash
   git add index.html
   git commit -m "配置云服务API地址"
   git push origin main
   ```

3. **完成！**
   - GitHub Pages会自动部署
   - 访问：https://luciuswang.github.io/douyin-treasure/
   - 现在可以注册/登录了！

## 🎉 完成！

现在你的应用已经完全部署到云端，不需要在公司电脑上运行任何服务器！

## 💡 提示

- Railway免费额度：$5/月，完全够用
- MongoDB Atlas免费：512MB存储，够用
- 更新代码：只需push到GitHub，Railway自动部署
- 查看日志：Railway项目页面 → "Deployments" → 点击部署 → "View Logs"

## 🆘 遇到问题？

1. **部署失败**：检查环境变量是否正确
2. **连接失败**：检查MongoDB Atlas的IP白名单
3. **API错误**：检查前端API地址是否正确

