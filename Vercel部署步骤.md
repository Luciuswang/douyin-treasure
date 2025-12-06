# 🚀 Vercel部署步骤（详细版）

## 📋 准备工作

### 1. 准备MongoDB Atlas（5分钟）

1. **注册账号**
   - 访问：https://www.mongodb.com/cloud/atlas/register
   - 使用Google账号或邮箱注册（完全免费）

2. **创建免费集群**
   - 登录后点击 "Build a Database"
   - 选择 **FREE (M0)** 套餐
   - 选择云服务商和地区（建议选择离你最近的，如：AWS - Asia Pacific (ap-southeast-1) Singapore）
   - 集群名称：`Cluster0`（默认即可）
   - 点击 "Create"

3. **创建数据库用户**
   - 等待集群创建完成（约3-5分钟）
   - 点击 "Database Access" → "Add New Database User"
   - Authentication Method: Password
   - 用户名：`totofun`（或自定义）
   - 密码：点击 "Autogenerate Secure Password" 或自己设置（**记住这个密码！**）
   - Database User Privileges: Read and write to any database
   - 点击 "Add User"

4. **配置网络访问**
   - 点击 "Network Access" → "Add IP Address"
   - 选择 "Allow Access from Anywhere"（添加 `0.0.0.0/0`）
   - 点击 "Confirm"
   - ⚠️ 注意：这会允许所有IP访问，仅用于开发。生产环境应该限制IP。

5. **获取连接字符串**
   - 点击 "Database" → 找到你的集群 → 点击 "Connect"
   - 选择 "Connect your application"
   - Driver: Node.js
   - Version: 5.5 or later
   - 复制连接字符串，格式如下：
     ```
     mongodb+srv://totofun:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **重要**：将 `<password>` 替换为你刚才设置的密码
   - 在连接字符串末尾添加数据库名：`/totofun-treasure`
   - 最终格式：
     ```
     mongodb+srv://totofun:你的密码@cluster0.xxxxx.mongodb.net/totofun-treasure?retryWrites=true&w=majority
     ```

### 2. 生成JWT密钥（1分钟）

访问：https://randomkeygen.com/
- 复制一个 "CodeIgniter Encryption Keys"（64字符）
- 用作 `JWT_SECRET`
- 再复制一个用作 `JWT_REFRESH_SECRET`

或者使用命令行：
```bash
# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})

# 或使用在线工具生成
```

## 🚀 部署到Vercel

### 方法1：通过Vercel网站（推荐，最简单）

1. **访问Vercel**
   - 打开：https://vercel.com
   - 点击 "Sign Up" 或 "Log In"
   - 选择 "Continue with GitHub"（推荐）

2. **导入项目**
   - 登录后，点击右上角 "Add New..." → "Project"
   - 在 "Import Git Repository" 中找到你的 `douyin-treasure` 仓库
   - 如果没有显示，点击 "Adjust GitHub App Permissions" 授权
   - 找到后点击 "Import"

3. **配置项目**
   - **Project Name**: `totofun-server`（或自定义）
   - **Framework Preset**: 选择 **Other** 或 **Other (no framework)**
   - **Root Directory**: 点击 "Edit" → 输入 `server`
   - **Build Command**: `npm install`（或留空，Vercel会自动检测）
   - **Output Directory**: （留空）
   - **Install Command**: `npm install`（或留空）

4. **设置环境变量**
   点击 "Environment Variables"，添加以下变量：

   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `MONGODB_URI` | `mongodb+srv://用户名:密码@cluster0.xxxxx.mongodb.net/totofun-treasure?retryWrites=true&w=majority` | MongoDB连接字符串 |
   | `JWT_SECRET` | `你的64字符随机密钥` | JWT签名密钥 |
   | `JWT_REFRESH_SECRET` | `另一个64字符随机密钥` | 刷新Token密钥 |
   | `JWT_EXPIRES_IN` | `7d` | Token过期时间 |
   | `NODE_ENV` | `production` | 环境变量 |
   | `CLIENT_URL` | `https://luciuswang.github.io` | 前端地址 |

   **重要提示**：
   - 每个变量都要选择应用到所有环境（Production, Preview, Development）
   - `MONGODB_URI` 中的密码要替换为实际密码
   - `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 要使用不同的随机字符串

5. **部署**
   - 点击 "Deploy"
   - 等待部署完成（约2-3分钟）
   - 部署过程中可以看到构建日志

6. **获取部署地址**
   - 部署成功后，会显示 "Congratulations!"
   - 复制显示的域名（例如：`https://totofun-server.vercel.app`）
   - 这个就是你的API地址！

7. **测试部署**
   - 访问：`https://你的域名.vercel.app/health`
   - 应该看到JSON响应：
     ```json
     {
       "status": "ok",
       "timestamp": "...",
       "uptime": ...,
       "environment": "production"
     }
     ```

### 方法2：通过Vercel CLI（可选）

如果你喜欢命令行：

```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 进入server目录
cd server

# 4. 部署
vercel

# 5. 按照提示操作：
# - Set up and deploy? Y
# - Which scope? 选择你的账号
# - Link to existing project? N
# - Project name? totofun-server
# - Directory? ./
# - Override settings? N

# 6. 设置环境变量
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add JWT_REFRESH_SECRET
vercel env add JWT_EXPIRES_IN
vercel env add NODE_ENV
vercel env add CLIENT_URL

# 7. 重新部署
vercel --prod
```

## 🔧 更新前端配置

1. **打开 `index.html`**
   - 找到第723行左右的 `API_CONFIG`
   - 找到 `CLOUD_API_URL` 配置

2. **设置API地址**
   ```javascript
   const API_CONFIG = {
       // 设置你的Vercel域名
       CLOUD_API_URL: 'https://totofun-server.vercel.app',  // 替换为你的实际域名
       
       // ... 其他配置保持不变
   };
   ```

3. **保存并推送**
   ```bash
   git add index.html
   git commit -m "配置Vercel API地址"
   git push origin main
   ```

4. **等待GitHub Pages部署**
   - 约1-2分钟后，访问：https://luciuswang.github.io/douyin-treasure/
   - 现在可以测试注册/登录功能了！

## ✅ 验证部署

1. **测试健康检查**
   - 访问：`https://你的域名.vercel.app/health`
   - 应该返回JSON响应

2. **测试注册功能**
   - 打开前端页面
   - 点击"登录/注册"
   - 尝试注册一个新账号
   - 检查浏览器控制台（F12）→ Network标签
   - 确认请求发送到Vercel地址

3. **测试登录功能**
   - 使用刚才注册的账号登录
   - 确认登录成功

## 🎉 完成！

现在你的应用已经完全部署到云端：
- ✅ 后端：Vercel（免费，国内可访问）
- ✅ 数据库：MongoDB Atlas（免费）
- ✅ 前端：GitHub Pages（免费）

## 📝 后续操作

### 更新代码
每次push到GitHub，Vercel会自动重新部署！

### 查看日志
- Vercel项目页面 → "Deployments" → 点击部署 → "View Function Logs"

### 自定义域名（可选）
- Vercel项目页面 → "Settings" → "Domains"
- 添加你的自定义域名

## 🆘 常见问题

**Q: 部署失败怎么办？**
A: 
1. 检查环境变量是否正确
2. 查看Vercel部署日志
3. 确认MongoDB连接字符串格式正确

**Q: 健康检查返回500错误？**
A: 
1. 检查MongoDB Atlas的IP白名单
2. 确认数据库用户名密码正确
3. 检查环境变量是否设置

**Q: 前端无法连接？**
A: 
1. 确认前端API地址配置正确
2. 检查浏览器控制台的错误信息
3. 确认CORS设置正确

**Q: 如何查看实时日志？**
A: Vercel项目页面 → "Deployments" → 点击最新部署 → "View Function Logs"

需要帮助？告诉我你遇到的问题！

