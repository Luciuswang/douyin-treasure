# 🎮 Totofun 突突翻 - GPS寻宝游戏

基于GPS定位的真实世界寻宝游戏，包含Web演示版和Flutter原生APP。

## 📱 项目组成

### 1. Web演示版（当前目录）
- ✅ 快速演示和概念验证
- ✅ 高德地图Web API
- ⚠️ 定位精度受浏览器限制（100-500米）
- 访问：https://luciuswang.github.io/douyin-treasure/

### 2. Flutter原生APP（`flutter-app/`）⭐推荐
- ✅ 精确GPS定位（5-10米）
- ✅ 流畅原生体验
- ✅ 跨平台（iOS + Android）
- ✅ 可发布到应用商店

## 🚀 快速开始

### Web版（5分钟）

1. 克隆项目
   ```bash
   git clone https://github.com/Luciuswang/douyin-treasure.git
   cd douyin-treasure
   ```

2. 启动本地服务器
   ```bash
   npm run dev
   # 或双击 "启动服务器.bat"
   ```

3. 访问
   ```
   http://localhost:3000/index.html
   ```

### Flutter APP（1-2小时首次配置）

1. **安装Flutter**
   - 查看详细步骤：`flutter-app/INSTALL_AND_RUN.md`
   - 或参考：`FLUTTER_INSTALL_GUIDE.md`

2. **配置高德Key**
   - 在 `flutter-app/android/app/src/main/AndroidManifest.xml` 配置Android Key
   - 在 `flutter-app/ios/Runner/Info.plist` 配置iOS Key
   - 获取Key：https://console.amap.com/

3. **运行APP**
   ```bash
   cd flutter-app
   flutter pub get
   flutter run
   # 或双击 "运行Flutter-APP.bat"
   ```

## 🎯 功能特性

- 📍 精确GPS定位
- 🗺️ 高德地图显示
- 🎁 随机生成宝藏
- 🏆 等级和经验系统
- 💰 金币系统
- 📊 数据持久化
- 🎮 寻宝发现机制

## 📁 项目结构

```
douyin-treasure/
├── index.html              # Web版主页面
├── location-diagnosis.html # 定位诊断工具
├── start.html             # 启动页面
├── flutter-app/           # Flutter原生APP
│   ├── lib/              # Dart代码
│   ├── android/          # Android配置
│   ├── ios/              # iOS配置
│   └── INSTALL_AND_RUN.md # 详细安装指南
├── 启动服务器.bat         # Web版启动脚本
└── 运行Flutter-APP.bat   # Flutter启动脚本
```

## 🔑 配置说明

### 获取高德地图Key

1. 注册：https://console.amap.com/
2. 创建应用
3. 添加Key：
   - Android平台：需要PackageName (`com.totofun.treasure`) 和 SHA1
   - iOS平台：需要BundleID (`com.totofun.treasure`)
   - Web平台：直接创建即可

## 📊 版本对比

| 特性 | Web版 | Flutter APP |
|------|-------|-------------|
| GPS精度 | 100-500米 | 5-10米 ✅ |
| 安装 | 无需安装 ✅ | 需要安装 |
| 配置难度 | 简单 ✅ | 中等 |
| 用户体验 | 一般 | 优秀 ✅ |
| 适用场景 | 演示/测试 | 生产环境 ✅ |

## 🐛 常见问题

### Web版定位不准？
- 这是浏览器API的限制
- 建议使用Flutter APP获得精确定位

### Flutter编译失败？
```bash
flutter clean
flutter pub get
flutter run
```

### 定位权限被拒绝？
- 到手机设置中手动授予位置权限

## 📱 测试建议

1. **到室外测试** - GPS需要看到天空
2. **允许精确定位** - 选择"精确位置"选项
3. **等待GPS锁定** - 首次定位需要30秒-2分钟

## 🎁 开发路线图

- [x] Web演示版
- [x] Flutter原生APP基础功能
- [ ] 后端服务器
- [ ] 用户账号系统
- [ ] 多人互动功能
- [ ] 排行榜系统
- [ ] 更多宝藏类型
- [ ] 成就系统扩展

## 📞 技术支持

- 📧 GitHub Issues: https://github.com/Luciuswang/douyin-treasure/issues
- 📚 详细文档：查看各个 `.md` 文件

## 📄 License

MIT License

## 🙏 致谢

- 高德地图开放平台
- Flutter框架
- 所有贡献者

---

**现在开始你的寻宝之旅吧！🎮**

推荐使用Flutter APP获得最佳体验！

