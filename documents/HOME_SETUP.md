# 🏠 在家开发环境配置指南

## 📋 开发环境检查清单

### 必需软件安装
- [ ] **Node.js** >= 16.0.0 [下载地址](https://nodejs.org/)
- [ ] **Git** [下载地址](https://git-scm.com/)
- [ ] **MongoDB** [下载地址](https://www.mongodb.com/try/download/community)
- [ ] **VS Code** 或其他代码编辑器
- [ ] **GitHub Desktop** [下载地址](https://desktop.github.com/)

### 可选软件
- [ ] **MongoDB Compass** (数据库可视化工具)
- [ ] **Postman** (API测试工具)
- [ ] **Redis** (缓存数据库，可选)

## 🚀 项目启动步骤

### 1. 克隆项目到家里电脑
```bash
# 使用GitHub Desktop或命令行
git clone https://github.com/Luciuswang/totofun-treasure.git
cd totofun-treasure
```

### 2. 安装项目依赖
```bash
# 安装后端依赖
npm install

# 如果后续创建了前端项目
cd client && npm install
cd ../mobile && npm install  # React Native
```

### 3. 环境变量配置
```bash
# 复制环境配置文件
cp env.example .env

# 编辑 .env 文件，配置以下关键信息：
```

### 4. 必需的API密钥配置

#### 🗺️ 高德地图API (必需)
```env
# 访问 https://lbs.amap.com/ 注册开发者账号
AMAP_API_KEY=你的高德地图API密钥
AMAP_SECRET=你的高德地图密钥
```

#### 🔐 JWT密钥 (必需)
```env
# 生成一个随机字符串作为JWT密钥
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_random
```

#### 🗄️ 数据库连接 (必需)
```env
# 本地MongoDB
MONGODB_URI=mongodb://localhost:27017/totofun-treasure

# 或使用云数据库 (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/totofun-treasure
```

### 5. 启动本地数据库
```bash
# Windows
# 1. 启动MongoDB服务
net start MongoDB

# 2. 或者手动启动
mongod --dbpath C:\data\db

# macOS (如果家里用Mac)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 6. 启动开发服务器
```bash
# 启动后端开发服务器
npm run server:dev

# 或同时启动前后端 (后续有前端时)
npm run dev
```

### 7. 验证环境
访问以下地址确认环境正常：
- 🔧 **API健康检查**: http://localhost:5000/health
- 🌐 **前端应用**: http://localhost:3000 (后续)

## 📱 移动端开发环境 (可选)

如果要开发React Native移动端：

### Android开发
- [ ] **Android Studio** [下载地址](https://developer.android.com/studio)
- [ ] **Java JDK** 11或更高版本
- [ ] 配置Android SDK和环境变量

### iOS开发 (仅Mac)
- [ ] **Xcode** (从Mac App Store安装)
- [ ] **CocoaPods** (`sudo gem install cocoapods`)

## 🔧 开发工具配置

### VS Code插件推荐
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-node-azure-pack"
  ]
}
```

### Git配置
```bash
# 配置Git用户信息（如果家里电脑没配置过）
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱"

# 配置GitHub认证
# 使用GitHub Desktop会自动处理认证
```

## 📊 开发进度同步

### 分支管理策略
```bash
# 创建功能分支进行开发
git checkout -b feature/user-auth
git checkout -b feature/video-upload
git checkout -b feature/map-integration

# 开发完成后合并到主分支
git checkout main
git merge feature/user-auth
git push origin main
```

### 每日开发流程
1. **拉取最新代码**: `git pull origin main`
2. **创建功能分支**: `git checkout -b feature/new-feature`
3. **编写代码和测试**
4. **提交更改**: `git commit -m "feat: add new feature"`
5. **推送分支**: `git push origin feature/new-feature`
6. **创建Pull Request** (在GitHub网站上)

## 🎯 当前开发优先级

根据我们的规划，建议按以下顺序开发：

### Phase 1: 核心后端 (第1-2周)
- [ ] **用户认证系统** - 注册、登录、JWT
- [ ] **文件上传系统** - 视频、图片上传
- [ ] **基础API接口** - 用户、宝藏CRUD操作

### Phase 2: 地图集成 (第3周)
- [ ] **高德地图集成** - 位置服务API
- [ ] **地理位置功能** - 附近宝藏搜索
- [ ] **位置验证系统** - 发现半径检测

### Phase 3: 前端界面 (第4-5周)
- [ ] **React Web应用** - 基础界面
- [ ] **移动端适配** - 响应式设计
- [ ] **地图界面** - 宝藏展示

### Phase 4: 高级功能 (第6-8周)
- [ ] **社交功能** - 关注、评论、分享
- [ ] **AI推荐** - 个性化内容推荐
- [ ] **React Native应用** - 原生移动端

## 📞 远程协作

### 如果需要协作开发
1. **GitHub Issues** - 用于任务管理和bug追踪
2. **GitHub Projects** - 项目看板和进度管理
3. **Discord/微信** - 实时沟通
4. **定期同步** - 每周代码review和进度同步

## 🔍 故障排除

### 常见问题解决

#### 1. npm install 失败
```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 2. MongoDB连接失败
```bash
# 检查MongoDB是否启动
# Windows: 任务管理器查看MongoDB服务
# Mac/Linux: ps aux | grep mongod

# 检查端口是否被占用
netstat -an | findstr 27017
```

#### 3. Git同步问题
```bash
# 强制同步远程代码
git fetch origin
git reset --hard origin/main

# 解决合并冲突
git pull origin main
# 手动解决冲突后
git add .
git commit -m "resolve merge conflicts"
```

## 📚 学习资源

开发过程中的参考资料：
- **Node.js文档**: https://nodejs.org/docs/
- **MongoDB文档**: https://docs.mongodb.com/
- **React文档**: https://reactjs.org/docs/
- **React Native文档**: https://reactnative.dev/docs/
- **高德地图API**: https://lbs.amap.com/api/

---

**🎯 准备好在家继续这个精彩的 Totofun 突突翻项目了吗？按照这个指南，你就能在任何地方无缝继续开发！**

