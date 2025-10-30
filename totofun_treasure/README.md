# 🎮 Totofun 突突翻 - LBS寻宝游戏

> 一款结合LBS定位、任务系统和商家营销的创新互动游戏应用

[![Flutter](https://img.shields.io/badge/Flutter-3.x-blue.svg)](https://flutter.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-lightgrey.svg)](https://flutter.dev/)

---

## 📱 项目简介

Totofun突突翻是一款基于LBS（Location Based Service）的互动寻宝游戏，将线下商家营销与游戏化玩法相结合，为用户提供有趣的探索体验，同时帮助商家精准获客。

### 核心特色

- 🗺️ **实时地图寻宝** - 基于GPS定位的真实世界探索
- 📋 **多样化任务系统** - 打卡、拍照、二维码等多种验证方式
- 🏪 **商家后台** - 商家可自主发布任务，精准营销
- 🎁 **奖励机制** - 经验、金币、优惠券等多元化奖励
- 👥 **社交互动** - 分享、邀请、团队协作（规划中）

---

## 🚀 快速开始

### 方式1：手机直接安装APK（推荐）

1. 下载APK文件（见Releases）
2. 在手机上安装
3. 允许定位权限
4. 开始游戏！

**详细教程**：[📱 手机测试指南](手机测试指南.md)

### 方式2：通过USB连接运行

```bash
# 克隆项目
git clone https://github.com/yourusername/totofun-treasure.git
cd totofun-treasure/totofun_treasure

# 安装依赖
flutter pub get

# 连接手机并运行
flutter run
```

### 方式3：构建APK

```bash
# Debug版本（快速）
flutter build apk --debug

# Release版本（优化）
flutter build apk --release
```

**详细教程**：[📦 快速构建APK](快速构建APK.md)

---

## 📋 功能列表

### ✅ 已实现功能

#### 玩家端
- [x] GPS定位和地图显示
- [x] 宝藏生成和发现
- [x] 任务列表（可接取/进行中/已完成）
- [x] 任务接取和完成
- [x] GPS定位验证
- [x] 二维码扫描验证
- [x] 拍照上传验证
- [x] 经验和金币系统
- [x] 等级系统
- [x] 用户信息展示

#### 商家端
- [x] 商家后台入口
- [x] 数据概览（任务数/用户数/营收）
- [x] 任务发布功能
- [x] 任务管理列表
- [x] 多种任务类型（打卡/消费/拍照/评价/分享/连锁）
- [x] 多种验证方式（GPS/二维码/拍照/小票/人工）
- [x] 任务难度设置
- [x] 奖励配置（经验/金币/优惠券）

### 🚧 规划中功能

#### 第一阶段（MVP优化）
- [ ] 任务分享功能
- [ ] 邀请好友系统
- [ ] 用户等级权益
- [ ] 每日签到
- [ ] 成就系统

#### 第二阶段（社交增强）
- [ ] 社区广场
- [ ] 动态发布
- [ ] 好友系统
- [ ] 战队/工会
- [ ] PvP对战

#### 第三阶段（商业化）
- [ ] 会员系统
- [ ] 增值服务
- [ ] 商家认证
- [ ] 广告系统
- [ ] 数据分析

---

## 🛠️ 技术栈

### 前端
- **Flutter 3.x** - 跨平台UI框架
- **Dart** - 编程语言
- **Provider** - 状态管理
- **高德地图SDK** - 地图和定位服务

### 核心依赖
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # 地图和定位
  amap_flutter_map: ^3.0.0
  amap_flutter_location: ^3.0.0
  geolocator: ^10.1.0
  
  # 权限管理
  permission_handler: ^11.0.0
  
  # 状态管理
  provider: ^6.1.1
  
  # 本地存储
  shared_preferences: ^2.2.2
  
  # 二维码
  qr_code_scanner: ^1.0.1
  qr_flutter: ^4.1.0
  
  # 图片处理
  image_picker: ^1.0.5
  flutter_image_compress: ^2.3.0
  
  # 工具
  uuid: ^4.2.1
```

### 后端（规划中）
- **Node.js** + **Express** - API服务
- **MongoDB** - 数据存储
- **Redis** - 缓存
- **阿里云OSS** - 图片存储

---

## 📂 项目结构

```
totofun_treasure/
├── lib/
│   ├── main.dart                 # 应用入口
│   ├── models/                   # 数据模型
│   │   ├── user.dart            # 用户模型
│   │   ├── task.dart            # 任务模型
│   │   ├── treasure.dart        # 宝藏模型
│   │   └── merchant.dart        # 商家模型
│   ├── providers/                # 状态管理
│   │   ├── user_provider.dart
│   │   ├── task_provider.dart
│   │   ├── treasure_provider.dart
│   │   └── merchant_provider.dart
│   ├── screens/                  # 页面
│   │   ├── home_screen.dart     # 主页面
│   │   ├── map_screen.dart      # 地图页面
│   │   ├── task_screen.dart     # 任务页面
│   │   ├── profile_screen.dart  # 个人中心
│   │   ├── qr_scan_screen.dart  # 扫码页面
│   │   ├── photo_verification_screen.dart  # 拍照验证
│   │   └── merchant/            # 商家页面
│   │       ├── merchant_dashboard_screen.dart
│   │       └── create_task_screen.dart
│   └── services/                 # 服务层
│       ├── location_service.dart      # 定位服务
│       ├── storage_service.dart       # 存储服务
│       └── verification_service.dart  # 验证服务
├── android/                      # Android配置
├── ios/                          # iOS配置
├── documents/                    # 项目文档
│   ├── 游戏玩法设计.md
│   ├── 商业计划书.md
│   ├── 分享功能设计.md
│   └── AI智能陪伴功能文档.md
├── 手机测试指南.md
├── 快速构建APK.md
└── README.md
```

---

## 🎮 游戏玩法

### 玩家视角

1. **探索地图**
   - 打开应用查看附近的宝藏和任务
   - 宝藏显示在地图上，标注距离

2. **接取任务**
   - 浏览任务列表
   - 选择感兴趣的任务
   - 点击"接取任务"

3. **完成任务**
   - 前往任务地点
   - 根据验证方式完成：
     - GPS验证：到达指定位置
     - 二维码：扫描商家二维码
     - 拍照：拍摄指定照片并上传

4. **领取奖励**
   - 获得经验值提升等级
   - 获得金币购买道具
   - 获得优惠券线下消费

### 商家视角

1. **发布任务**
   - 设置任务类型和奖励
   - 配置验证方式
   - 设定任务范围和有效期

2. **获取曝光**
   - 玩家看到并接取任务
   - 玩家到店完成任务
   - 自然获得精准客流

3. **数据分析**
   - 查看任务参与人数
   - 分析用户画像
   - 优化营销策略

---

## 🔧 开发指南

### 环境要求

- Flutter SDK 3.0+
- Dart 2.19+
- Android Studio / VS Code
- Android SDK 21+ (Android 5.0+)
- iOS 12.0+ (规划中)

### 配置高德地图

1. 注册高德开放平台账号
2. 创建应用并获取API Key
3. 配置Android Key：
   - 在 `android/app/src/main/AndroidManifest.xml` 中配置
   ```xml
   <meta-data
       android:name="com.amap.api.v2.apikey"
       android:value="你的高德Key" />
   ```

### 运行项目

```bash
# 安装依赖
flutter pub get

# 运行在模拟器/真机
flutter run

# 运行在Chrome（调试UI）
flutter run -d chrome
```

### 热重载

在应用运行时：
- 按 `r` - 热重载（保留状态）
- 按 `R` - 热重启（重置状态）
- 按 `q` - 退出

---

## 📖 文档

### 产品文档
- [游戏玩法设计](documents/游戏玩法设计.md)
- [商业计划书](documents/商业计划书.md)
- [分享功能设计](documents/分享功能设计.md)
- [AI智能陪伴功能](documents/AI智能陪伴功能文档.md)

### 开发文档
- [手机测试指南](手机测试指南.md)
- [快速构建APK](快速构建APK.md)
- [测试功能清单](测试指南.md)

---

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- 项目主页：https://github.com/yourusername/totofun-treasure
- 问题反馈：https://github.com/yourusername/totofun-treasure/issues
- 邮箱：your.email@example.com

---

## 🙏 致谢

- [Flutter](https://flutter.dev/) - 优秀的跨平台框架
- [高德地图](https://lbs.amap.com/) - 强大的地图服务
- [Flutter Community](https://flutter.dev/community) - 活跃的开发社区

---

## 📊 项目进度

- [x] MVP开发完成
- [x] 基础功能实现
- [x] 任务验证系统
- [ ] 内测阶段
- [ ] 公测阶段
- [ ] 正式发布

---

**⭐ 如果这个项目对你有帮助，请给个Star！**

Made with ❤️ by Totofun Team
