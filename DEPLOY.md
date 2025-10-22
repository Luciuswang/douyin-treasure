# 🚀 GitHub Pages 部署指南

## 📋 部署步骤

### 1. 创建GitHub仓库
1. 登录GitHub
2. 创建新仓库，命名为 `totofun-treasure`
3. 设置为公开（Public）

### 2. 上传文件
将以下文件上传到仓库：
- `index.html` - 主游戏文件
- `amap-treasure.html` - 完整版地图
- `simple-amap.html` - 简化版地图
- `README.md` - 项目说明
- `package.json` - 项目配置
- `.gitignore` - Git忽略文件

### 3. 启用GitHub Pages
1. 进入仓库设置（Settings）
2. 找到 Pages 部分
3. Source 选择 "Deploy from a branch"
4. Branch 选择 `main`
5. 文件夹选择 `/ (root)`
6. 点击 Save

### 4. 访问游戏
- 等待几分钟部署完成
- 访问：`https://你的用户名.github.io/totofun-treasure/`

## 📱 手机测试建议

### 测试环境
- ✅ 户外开阔地带（GPS信号好）
- ✅ 允许浏览器位置权限
- ✅ 使用手机的Chrome或Safari

### 测试步骤
1. 用手机打开游戏链接
2. 输入高德地图API Key
3. 点击"初始化地图"
4. 允许位置权限
5. 点击"获取GPS位置"
6. 开始寻宝！

## 🔧 常见问题

### GPS定位失败
- 检查是否允许位置权限
- 尝试在户外或窗边
- 确保使用HTTPS访问

### API Key错误
- 检查Key是否正确
- 确认选择了"Web端(JS API)"
- 检查白名单设置

### 地图不显示
- 刷新页面重试
- 检查网络连接
- 尝试不同浏览器

## 📞 技术支持

如有问题请创建Issue或联系开发者。

祝你寻宝愉快！🎯
