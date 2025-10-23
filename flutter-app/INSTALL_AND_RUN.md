# 🚀 Totofun 突突翻 - 完整安装和运行指南

## ✅ 已完成配置

我已经为你创建了所有必需的配置文件：

- ✅ Android完整配置
- ✅ iOS完整配置  
- ✅ 所有Dart代码
- ✅ 依赖配置

## 📦 第1步：安装Flutter SDK

### Windows安装步骤

1. **下载Flutter SDK**
   ```
   访问：https://docs.flutter.dev/get-started/install/windows
   或直接下载：https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.16.0-stable.zip
   ```

2. **解压到目录**
   ```
   推荐解压到：C:\src\flutter
   （确保路径中没有中文和空格）
   ```

3. **添加到环境变量**
   - 按 `Win + R`，输入 `sysdm.cpl`，回车
   - 点击"高级" → "环境变量"
   - 在"系统变量"中找到 `Path`
   - 点击"编辑" → "新建"
   - 添加：`C:\src\flutter\bin`
   - 点击"确定"保存

4. **验证安装**
   - 打开新的PowerShell窗口
   ```powershell
   flutter --version
   ```
   应该显示Flutter版本信息

5. **运行Flutter Doctor**
   ```powershell
   flutter doctor
   ```
   这会检查环境并告诉你还需要安装什么

## 🔧 第2步：安装Android Studio

1. **下载并安装**
   ```
   访问：https://developer.android.com/studio
   下载并安装Android Studio（约1GB）
   ```

2. **首次打开Android Studio**
   - 选择"Standard"安装
   - 等待下载SDK和工具（约2GB）

3. **安装Flutter和Dart插件**
   - 打开Android Studio
   - File → Settings → Plugins
   - 搜索"Flutter"并安装
   - 搜索"Dart"并安装
   - 重启Android Studio

4. **配置SDK**
   - Tools → SDK Manager
   - 确保已安装：
     - ✅ Android SDK Platform 34
     - ✅ Android SDK Build-Tools
     - ✅ Android SDK Command-line Tools
     - ✅ Android Emulator

5. **接受许可**
   ```powershell
   flutter doctor --android-licenses
   # 输入 y 接受所有许可
   ```

## 📱 第3步：准备测试设备

### 方式A：使用Android模拟器（推荐新手）

1. 打开Android Studio
2. Tools → Device Manager
3. Create Device
4. 选择 Pixel 4 或任何设备
5. 选择系统镜像（推荐 API 34）
6. 创建并启动模拟器

### 方式B：使用真机（推荐）

1. 打开手机的"开发者选项"
   - 设置 → 关于手机 → 连续点击"版本号"7次
   - 返回设置 → 系统 → 开发者选项

2. 启用"USB调试"

3. 连接手机到电脑

4. 在PowerShell中检查：
   ```powershell
   flutter devices
   ```
   应该能看到你的设备

## 🔑 第4步：配置高德地图Key

### 获取高德Key

1. 访问：https://console.amap.com/
2. 注册/登录账号
3. 进入"应用管理" → "我的应用"
4. 创建应用
5. 添加Key：

**Android Key配置：**
- 平台：Android
- PackageName: `com.totofun.treasure`
- 获取SHA1：
  ```powershell
  cd H:\WEB\douyin-treasure\flutter-app\android
  keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```
  复制SHA1值

**iOS Key配置：**
- 平台：iOS
- BundleID: `com.totofun.treasure`

### 配置Key到项目

1. **Android配置**
   编辑：`flutter-app/android/app/src/main/AndroidManifest.xml`
   找到这一行：
   ```xml
   android:value="你的高德AndroidKey"/>
   ```
   替换为你的Key

2. **iOS配置**
   编辑：`flutter-app/ios/Runner/Info.plist`
   找到这一行：
   ```xml
   <string>你的高德iOSKey</string>
   ```
   替换为你的Key

## 🎮 第5步：运行项目

1. **进入项目目录**
   ```powershell
   cd H:\WEB\douyin-treasure\flutter-app
   ```

2. **安装依赖**
   ```powershell
   flutter pub get
   ```

3. **查看可用设备**
   ```powershell
   flutter devices
   ```

4. **运行应用**
   ```powershell
   flutter run
   ```
   
   或指定设备：
   ```powershell
   flutter run -d <device-id>
   ```

5. **等待编译**
   - 首次运行需要5-10分钟编译
   - 之后的运行只需要几秒钟

## ✅ 成功标志

如果一切正常，你会看到：

1. APP在设备上启动
2. 请求定位权限 → 点击"允许"
3. 显示地图和你的位置
4. 周围自动生成宝藏
5. 走到宝藏附近会自动发现

## 🐛 常见问题

### Q1: flutter command not found
A: 重启PowerShell，确保环境变量已设置

### Q2: Android licenses not accepted
A: 运行 `flutter doctor --android-licenses`

### Q3: No devices found
A: 
- 模拟器：启动Android模拟器
- 真机：检查USB调试是否启用

### Q4: 编译错误
A:
```powershell
flutter clean
flutter pub get
flutter run
```

### Q5: 定位权限被拒绝
A: 到手机设置中手动授予位置权限

## 📊 检查清单

安装前检查：
- [ ] Flutter SDK已安装
- [ ] Android Studio已安装
- [ ] 已安装Flutter插件
- [ ] 已接受Android许可
- [ ] 设备已连接或模拟器已启动
- [ ] 高德Key已配置
- [ ] 依赖已安装 (`flutter pub get`)

## 🎯 运行命令总结

```powershell
# 1. 检查环境
flutter doctor

# 2. 进入项目
cd H:\WEB\douyin-treasure\flutter-app

# 3. 安装依赖
flutter pub get

# 4. 查看设备
flutter devices

# 5. 运行
flutter run

# 6. 如果有问题，清理后重试
flutter clean
flutter pub get
flutter run
```

## 📱 测试建议

1. **到室外测试**
   - GPS需要看到天空
   - 室内信号弱

2. **允许精确定位**
   - iOS: 选择"使用App时允许"和"精确位置"
   - Android: 选择"始终允许"或"仅在使用应用时允许"

3. **等待GPS锁定**
   - 首次定位可能需要30秒-2分钟
   - 看到精度小于20米说明GPS已锁定

## 🎉 下一步

APP运行成功后：
1. 测试GPS精度
2. 收集宝藏
3. 体验完整功能
4. 提出改进建议

需要帮助随时问我！

