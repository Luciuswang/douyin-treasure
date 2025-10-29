# 🚀 Totofun 突突翻 - 快速启动指南

> 5分钟快速了解并运行项目

---

## 📱 这是什么？

**Totofun 突突翻** 是一个基于LBS的本地生活游戏化平台，让用户在现实世界中寻找宝藏、完成任务、结交朋友。

### 核心玩法
- 🎁 **寻宝**：在附近发现虚拟宝藏，获得真实优惠券
- 📋 **任务**：完成商家任务，赚取经验和金币
- 👥 **社交**：组队寻宝，参加活动，认识新朋友
- 🏆 **成长**：升级、收集、排行榜

---

## 🎯 快速体验（3步）

### 方法1：在线体验（最快）
1. 打开浏览器访问：https://luciuswang.github.io/douyin-treasure/
2. 允许浏览器获取位置权限
3. 开始寻宝！

### 方法2：本地运行
```bash
# 1. 克隆项目
git clone https://github.com/Luciuswang/douyin-treasure.git
cd douyin-treasure

# 2. 启动Web版
npx serve

# 3. 打开浏览器访问 http://localhost:3000
```

### 方法3：运行Flutter APP（推荐）
```bash
# 1. 进入Flutter项目目录
cd totofun_treasure

# 2. 安装依赖
flutter pub get

# 3. 运行（需要连接手机或启动模拟器）
flutter run
```

---

## 📱 APP功能一览

### 🗺️ 寻宝页
- **实时定位**：精确显示你的位置
- **附近宝藏**：自动生成周围100-500米的宝藏
- **稀有度系统**：普通→少见→稀有→史诗→传说
- **自动发现**：走到30米内自动触发
- **真实奖励**：经验、金币、优惠券

### 📋 任务页
- **可接取任务**：查看附近商家发布的任务
- **进行中任务**：追踪你正在做的任务
- **已完成任务**：查看历史记录
- **任务类型**：
  - 打卡任务：到店打卡
  - 消费任务：消费满额
  - 拍照任务：拍照分享
  - 评价任务：写好评
  - 分享任务：分享给好友

### 🎉 活动页（开发中）
- 约会活动：单身派对、观影交友
- 兴趣活动：骑行、摩旅、钓鱼
- 俱乐部：加入或创建兴趣俱乐部

### 👤 我的页（开发中）
- 个人信息：等级、经验、金币
- 宝藏收藏：查看找到的所有宝藏
- 成就系统：解锁各种成就
- 好友列表：查看和管理好友

---

## 🎮 玩法示例

### 场景1：周末逛街
```
你：打开APP，发现附近有3个宝藏
↓
走到星巴克门口（200米）
↓
自动发现"稀有咖啡券"宝藏
↓
获得：50经验 + 10金币 + 满30减10优惠券
↓
顺便喝杯咖啡，使用优惠券 ☕
```

### 场景2：完成任务
```
你：在任务页看到"肯德基打卡任务"
↓
接取任务
↓
导航到肯德基（500米）
↓
到达后点击"完成任务"
↓
扫描店内二维码验证
↓
获得：100经验 + 20金币 + 满50减15券 🍗
```

### 场景3：组队寻宝
```
你：发起组队邀请
↓
2个朋友加入队伍
↓
队伍Buff：发现半径+30%，稀有概率+20%
↓
一起逛商场，1小时找到8个宝藏
↓
奖励平分，还认识了新朋友 👥
```

---

## 💡 为什么要用它？

### 对用户
- ✅ **有趣**：逛街不再无聊，每次外出都是冒险
- ✅ **有利**：真金白银的优惠券，省钱
- ✅ **有社交**：认识志同道合的朋友
- ✅ **有成就感**：升级、收集、排行榜

### 对商家
- ✅ **引流**：游戏化吸引客流
- ✅ **转化**：优惠券促进消费
- ✅ **复购**：任务系统提升复购率
- ✅ **数据**：精准的用户画像

---

## 🛠️ 开发环境搭建

### 前置要求
- **Flutter SDK** 3.0+
- **Android Studio** 或 **VS Code**
- **Android SDK** 或 **Xcode**（iOS）
- **Git**

### 详细步骤

#### 1. 安装Flutter
```bash
# Windows（使用PowerShell）
# 下载Flutter SDK：https://flutter.dev/docs/get-started/install/windows
# 解压到 C:\flutter
# 添加到环境变量：C:\flutter\bin

# 验证安装
flutter doctor
```

#### 2. 克隆项目
```bash
git clone https://github.com/Luciuswang/douyin-treasure.git
cd douyin-treasure/totofun_treasure
```

#### 3. 安装依赖
```bash
flutter pub get
```

#### 4. 配置高德地图Key（可选）
```bash
# 编辑 android/app/src/main/AndroidManifest.xml
# 替换 YOUR_AMAP_KEY_HERE 为你的高德Key
```

#### 5. 运行
```bash
# 连接手机或启动模拟器
flutter devices

# 运行APP
flutter run

# 或者构建APK
flutter build apk
```

---

## 📂 项目结构

```
douyin-treasure/
├── index.html              # Web版主页面
├── totofun_treasure/       # Flutter APP
│   ├── lib/
│   │   ├── main.dart       # 入口文件
│   │   ├── models/         # 数据模型
│   │   │   ├── user.dart
│   │   │   ├── treasure.dart
│   │   │   └── task.dart
│   │   ├── providers/      # 状态管理
│   │   │   ├── user_provider.dart
│   │   │   ├── treasure_provider.dart
│   │   │   └── task_provider.dart
│   │   ├── screens/        # 页面
│   │   │   ├── home_screen.dart
│   │   │   ├── map_screen.dart
│   │   │   └── task_screen.dart
│   │   └── services/       # 服务
│   │       ├── location_service.dart
│   │       └── storage_service.dart
│   └── pubspec.yaml        # 依赖配置
├── PROJECT_SUMMARY.md      # 项目总结
├── QUICK_START.md          # 快速启动指南（本文件）
├── DEMO_PRESENTATION.md    # 功能演示PPT
└── BUSINESS_PLAN.md        # 商业计划书
```

---

## 🐛 常见问题

### Q1: Flutter命令找不到？
```bash
# Windows：添加环境变量
# 系统属性 → 环境变量 → Path → 新建 → C:\flutter\bin
# 重启PowerShell
```

### Q2: 模拟器启动失败？
```bash
# 检查Android SDK
flutter doctor

# 手动启动模拟器
flutter emulators
flutter emulators --launch <emulator_id>
```

### Q3: 定位不准确？
```
- 确保GPS已开启
- 在室外测试（室内GPS信号弱）
- 等待GPS卫星定位（可能需要1-2分钟）
- 避免使用"网络辅助定位"
```

### Q4: 任务找不到？
```
- 任务在2公里范围内显示
- 切换到"任务"Tab查看
- 点击刷新按钮重新生成
```

### Q5: 如何在手机上测试？
```bash
# Android
1. 开启开发者模式
2. 开启USB调试
3. 连接电脑
4. 运行 flutter devices
5. 运行 flutter run

# iOS
1. 注册Apple开发者账号
2. 在Xcode中配置签名
3. 连接iPhone
4. 运行 flutter run
```

---

## 🎯 下一步

### 新手推荐
1. ✅ 先体验Web版，了解基本玩法
2. ✅ 安装Flutter环境
3. ✅ 运行APP，体验完整功能
4. ✅ 查看代码，学习实现原理

### 开发者推荐
1. ✅ 阅读 `PROJECT_SUMMARY.md` 了解完整规划
2. ✅ 查看 `lib/` 目录下的代码结构
3. ✅ 尝试添加新功能
4. ✅ 提交PR贡献代码

### 商家/投资人推荐
1. ✅ 体验APP完整流程
2. ✅ 阅读 `BUSINESS_PLAN.md` 商业计划书
3. ✅ 查看 `DEMO_PRESENTATION.md` 功能演示
4. ✅ 联系我们洽谈合作

---

## 📞 联系我们

- **GitHub**: https://github.com/Luciuswang/douyin-treasure
- **在线演示**: https://luciuswang.github.io/douyin-treasure/
- **问题反馈**: 提交GitHub Issue

---

## 📄 相关文档

- [项目总结](PROJECT_SUMMARY.md) - 完整的功能规划和商业模式
- [功能演示](DEMO_PRESENTATION.md) - PPT格式的功能展示
- [商业计划书](BUSINESS_PLAN.md) - 投资人版本的BP
- [部署指南](DEPLOY.md) - 详细的部署说明

---

**开始你的寻宝之旅吧！** 🎉

*最后更新：2025-10-27*

