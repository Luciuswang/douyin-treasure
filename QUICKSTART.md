# 🚀 抖宝项目快速启动指南

## 📋 开发环境要求

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0  
- **MongoDB**: >= 5.0 (本地或云端)
- **Redis**: >= 6.0 (可选，用于缓存)
- **FFmpeg**: 用于视频处理

## ⚡ 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/你的用户名/douyin-treasure.git
cd douyin-treasure
```

### 2. 安装依赖
```bash
# 安装服务端依赖
npm install

# 安装客户端依赖
cd client && npm install
cd ..
```

### 3. 环境配置
```bash
# 复制环境配置文件
cp env.example .env

# 编辑配置文件
# 必须配置项：
# - MONGODB_URI: MongoDB连接地址
# - JWT_SECRET: JWT密钥
# - AMAP_API_KEY: 高德地图API密钥
```

### 4. 启动数据库
```bash
# 启动MongoDB (如果是本地安装)
mongod

# 启动Redis (可选)
redis-server
```

### 5. 启动开发服务器
```bash
# 同时启动前后端开发服务器
npm run dev

# 或者分别启动
npm run server:dev  # 后端服务器 (端口5000)
npm run client:dev  # 前端服务器 (端口3000)
```

### 6. 访问应用
- 🌐 **前端应用**: http://localhost:3000
- 🔧 **API接口**: http://localhost:5000
- 📊 **健康检查**: http://localhost:5000/health

## 🛠️ 开发工具

### 数据库管理
```bash
# 安装MongoDB Compass (图形界面)
# 或使用命令行
mongo douyin-treasure
```

### API测试
```bash
# 使用Postman或curl测试API
curl http://localhost:5000/health
```

### 代码质量
```bash
# 代码检查
npm run lint

# 运行测试
npm run test
```

## 📱 移动端开发

### React Native (推荐)
```bash
# 安装React Native CLI
npm install -g @react-native-community/cli

# 创建移动端项目
npx react-native init DouyinTreasureApp

# 开发iOS (需要Xcode)
npx react-native run-ios

# 开发Android (需要Android Studio)
npx react-native run-android
```

### 微信小程序
```bash
# 创建小程序项目
# 使用微信开发者工具创建项目
# AppID: 申请微信小程序AppID
```

## 🗺️ 高德地图API配置

### 1. 注册高德开发者账号
- 访问: https://lbs.amap.com/
- 注册并实名认证

### 2. 创建应用
- 应用类型: Web端(JS API)
- 服务平台: Web端

### 3. 获取API Key
- 复制API Key到 `.env` 文件
- 配置域名白名单

### 4. 启用服务
- 定位服务
- 地图显示
- 地理编码
- 逆地理编码

## 🎥 视频处理配置

### 安装FFmpeg
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt update
sudo apt install ffmpeg

# Windows
# 下载并安装: https://ffmpeg.org/download.html
```

### 视频处理参数
- **分辨率**: 720p/1080p
- **格式**: MP4 (H.264)
- **最大时长**: 5分钟
- **最大文件**: 100MB

## 📁 项目结构

```
douyin-treasure/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── hooks/         # 自定义Hook
│   │   ├── utils/         # 工具函数
│   │   └── services/      # API服务
│   └── public/
├── server/                # 后端项目
│   ├── models/           # 数据模型
│   ├── routes/           # 路由
│   ├── middleware/       # 中间件
│   ├── services/         # 业务服务
│   ├── utils/            # 工具函数
│   └── sockets/          # WebSocket处理
├── uploads/              # 上传文件
├── logs/                 # 日志文件
├── docs/                 # 文档
└── scripts/              # 脚本文件
```

## 🔑 关键API接口

### 用户认证
```bash
# 注册
POST /api/auth/register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}

# 登录
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}
```

### 宝藏操作
```bash
# 创建宝藏
POST /api/treasures
Content-Type: multipart/form-data
{
  "title": "神秘咖啡厅",
  "description": "找到隐藏在胡同里的咖啡厅",
  "video": [视频文件],
  "latitude": 39.9042,
  "longitude": 116.4074,
  "address": "北京市东城区南锣鼓巷"
}

# 搜索附近宝藏
GET /api/treasures/nearby?lat=39.9042&lng=116.4074&radius=5000

# 发现宝藏
POST /api/treasures/:id/discover
{
  "latitude": 39.9042,
  "longitude": 116.4074,
  "proof": "发现证明"
}
```

## 🚀 部署指南

### 开发环境
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

### 生产环境

#### Docker部署
```bash
# 构建镜像
docker build -t douyin-treasure .

# 运行容器
docker run -p 5000:5000 -e NODE_ENV=production douyin-treasure
```

#### 云服务器部署
```bash
# 使用PM2管理进程
npm install -g pm2
pm2 start server/index.js --name douyin-treasure

# 配置Nginx反向代理
# 配置SSL证书
# 配置域名
```

## 🔧 常见问题

### Q: MongoDB连接失败
```bash
# 检查MongoDB是否启动
sudo systemctl status mongod

# 检查连接字符串
MONGODB_URI=mongodb://localhost:27017/douyin-treasure
```

### Q: 视频上传失败
```bash
# 检查FFmpeg安装
ffmpeg -version

# 检查文件大小限制
MAX_FILE_SIZE=100MB
```

### Q: 地图无法显示
```bash
# 检查API Key配置
AMAP_API_KEY=your_actual_api_key

# 检查域名白名单配置
# 在高德控制台添加localhost:3000
```

### Q: 端口占用
```bash
# 查看端口占用
lsof -i :5000
lsof -i :3000

# 修改端口
PORT=5001 npm start
```

## 📞 技术支持

### 开发团队联系方式
- 📧 **邮箱**: dev@douyintreasure.com
- 💬 **微信群**: 扫码加入开发者交流群
- 🐛 **Bug反馈**: GitHub Issues
- 📚 **文档**: https://docs.douyintreasure.com

### 学习资源
- **Node.js**: https://nodejs.org/docs/
- **React**: https://reactjs.org/docs/
- **MongoDB**: https://docs.mongodb.com/
- **高德地图**: https://lbs.amap.com/api/

---

**🎉 开始你的抖宝开发之旅吧！如有问题随时联系我们！**
