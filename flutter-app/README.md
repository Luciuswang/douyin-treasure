# Totofun 突突翻 - Flutter原生APP开发指南

## 🎯 项目概述

基于Flutter开发的跨平台寻宝游戏APP，使用高德地图和精确GPS定位。

## 📦 技术栈

- **Flutter** 3.x
- **高德地图** (amap_flutter_map)
- **定位** (amap_flutter_location)
- **状态管理** (Provider)
- **本地存储** (shared_preferences)

## 🛠️ 环境准备

### 1. 安装Flutter

```bash
# 下载Flutter SDK
# https://flutter.dev/docs/get-started/install

# 验证安装
flutter doctor
```

### 2. 创建项目

```bash
flutter create totofun_treasure
cd totofun_treasure
```

### 3. 添加依赖

在 `pubspec.yaml` 中添加：

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # 高德地图
  amap_flutter_map: ^3.0.0
  amap_flutter_location: ^3.0.0
  
  # 定位权限
  permission_handler: ^11.0.0
  
  # GPS定位
  geolocator: ^10.0.0
  
  # 状态管理
  provider: ^6.0.0
  
  # 本地存储
  shared_preferences: ^2.2.0
  
  # UI组件
  flutter_svg: ^2.0.0
```

## 📁 项目结构

```
lib/
├── main.dart                 # 入口文件
├── models/                   # 数据模型
│   ├── treasure.dart
│   ├── user.dart
│   └── achievement.dart
├── screens/                  # 页面
│   ├── map_screen.dart      # 地图主页
│   ├── profile_screen.dart  # 个人中心
│   └── treasure_detail.dart # 宝藏详情
├── widgets/                  # 组件
│   ├── treasure_marker.dart
│   └── user_marker.dart
├── services/                 # 服务
│   ├── location_service.dart # 定位服务
│   ├── map_service.dart      # 地图服务
│   └── storage_service.dart  # 存储服务
└── providers/               # 状态管理
    ├── user_provider.dart
    └── treasure_provider.dart
```

## 🔑 高德地图配置

### Android配置

1. 在 `android/app/src/main/AndroidManifest.xml` 添加：

```xml
<manifest>
    <application>
        <!-- 高德地图Key -->
        <meta-data
            android:name="com.amap.api.v2.apikey"
            android:value="你的高德AndroidKey"/>
    </application>
    
    <!-- 权限 -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

### iOS配置

1. 在 `ios/Runner/Info.plist` 添加：

```xml
<key>AMapApiKey</key>
<string>你的高德iOSKey</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>需要访问您的位置以显示附近的宝藏</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>需要访问您的位置以持续更新宝藏信息</string>
```

## 🚀 开始开发

接下来我会帮你创建：

1. ✅ 核心代码文件
2. ✅ 精确GPS定位服务
3. ✅ 高德地图集成
4. ✅ 宝藏生成和管理
5. ✅ UI界面

准备好了吗？我现在开始创建代码文件。

## 📞 需要帮助？

我会一步步帮你：
1. 创建所有代码文件
2. 配置项目
3. 测试和调试
4. 打包发布

让我们开始吧！🎮

