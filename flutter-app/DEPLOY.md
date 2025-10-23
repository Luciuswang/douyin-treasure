# 🚀 Totofun 突突翻 Flutter APP 部署指南

## 📱 已完成的功能

✅ 精确GPS定位（使用Geolocator）
✅ 高德地图显示
✅ 宝藏生成和发现
✅ 用户等级系统
✅ 本地数据持久化
✅ 实时位置更新

## 🛠️ 开发步骤

### 1. 安装Flutter

```bash
# 访问 https://flutter.dev 下载SDK
# 或使用包管理器
# Windows: choco install flutter
# macOS: brew install --cask flutter

# 验证安装
flutter doctor
```

### 2. 创建项目并配置

```bash
# 创建项目目录
mkdir totofun-app
cd totofun-app

# 复制 flutter-app 文件夹中的所有文件到当前目录

# 安装依赖
flutter pub get
```

### 3. 配置高德地图Key

#### Android配置

编辑 `android/app/src/main/AndroidManifest.xml`：

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
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
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

#### iOS配置

编辑 `ios/Runner/Info.plist`：

```xml
<dict>
    <!-- 高德地图Key -->
    <key>AMapApiKey</key>
    <string>你的高德iOSKey</string>
    
    <!-- 定位权限说明 -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>需要访问您的位置以显示附近的宝藏</string>
    
    <key>NSLocationAlwaysUsageDescription</key>
    <string>需要访问您的位置以持续更新宝藏信息</string>
    
    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>需要访问您的位置</string>
</dict>
```

### 4. 运行应用

```bash
# 连接Android设备或启动模拟器
flutter devices

# 运行应用
flutter run

# 或指定设备
flutter run -d <device-id>
```

### 5. 构建发布版本

#### Android APK

```bash
# 构建APK
flutter build apk --release

# APK位置：build/app/outputs/flutter-apk/app-release.apk
```

#### Android App Bundle (用于Google Play)

```bash
flutter build appbundle --release

# AAB位置：build/app/outputs/bundle/release/app-release.aab
```

#### iOS

```bash
# 打开Xcode项目
open ios/Runner.xcworkspace

# 在Xcode中配置签名和构建
```

## 🔑 获取高德地图Key

1. 访问 https://console.amap.com/
2. 注册/登录账号
3. 进入"应用管理" → "我的应用"
4. 创建新应用
5. 添加Key：
   - Android平台：需要PackageName和SHA1
   - iOS平台：需要BundleID

### 获取Android SHA1

```bash
# Debug版本
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release版本（使用你的keystore）
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

## 📝 注意事项

1. **测试定位**：
   - Android模拟器需要启用GPS
   - iOS模拟器支持位置模拟
   - 真机测试效果最好

2. **权限请求**：
   - 首次运行会请求定位权限
   - 必须允许才能使用

3. **性能优化**：
   - 使用 `--release` 模式构建
   - 代码已优化，避免频繁重建

## 🐛 常见问题

### Q: 定位失败？
A: 
- 检查权限是否允许
- 确保GPS已开启
- 到室外测试

### Q: 地图不显示？
A: 
- 检查高德Key是否正确配置
- 检查网络连接
- 查看控制台日志

### Q: 编译失败？
A:
```bash
# 清理并重新构建
flutter clean
flutter pub get
flutter run
```

## 📦 完整文件结构

```
totofun-app/
├── lib/
│   ├── main.dart
│   ├── models/
│   │   ├── treasure.dart
│   │   └── user.dart
│   ├── screens/
│   │   └── map_screen.dart
│   ├── services/
│   │   ├── location_service.dart
│   │   └── storage_service.dart
│   └── providers/
│       ├── user_provider.dart
│       └── treasure_provider.dart
├── android/
├── ios/
└── pubspec.yaml
```

## 🎉 下一步

1. 运行 `flutter run` 看效果
2. 到室外测试GPS定位
3. 根据需求添加更多功能：
   - 好友系统
   - 宝藏交易
   - 排行榜
   - 更多宝藏类型

## 💬 需要帮助？

如果遇到问题：
1. 查看控制台日志
2. 运行 `flutter doctor` 检查环境
3. 确认高德Key配置正确

祝开发顺利！🚀

