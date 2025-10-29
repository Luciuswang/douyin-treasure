# 🚀 Flutter 安装和运行指南（Windows）

## ⚠️ 当前状态

Flutter尚未安装。需要先安装Flutter SDK。

## 📦 安装步骤

### 方法1：使用官方安装包（推荐）

1. **下载Flutter SDK**
   - 访问：https://docs.flutter.dev/get-started/install/windows
   - 下载 Flutter SDK (约 1GB)
   - 或直接下载：https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.16.0-stable.zip

2. **解压到目录**
   ```
   推荐路径：C:\src\flutter
   ```
   - 解压ZIP文件
   - 确保路径中没有空格

3. **添加到环境变量**
   - 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
   - 在"系统变量"中找到 Path
   - 添加：`C:\src\flutter\bin`
   - 确定并关闭所有窗口

4. **重启PowerShell或CMD**
   ```powershell
   # 验证安装
   flutter --version
   ```

5. **运行Flutter Doctor**
   ```powershell
   flutter doctor
   ```
   这会检查缺少的依赖

### 方法2：使用Chocolatey（自动化）

如果你有Chocolatey包管理器：

```powershell
# 以管理员身份运行
choco install flutter
```

## 🛠️ 安装Android开发环境

### 1. 安装Android Studio

1. **下载Android Studio**
   - 访问：https://developer.android.com/studio
   - 下载并安装

2. **安装SDK**
   - 打开Android Studio
   - Tools → SDK Manager
   - 安装：
     - Android SDK Platform (最新版本)
     - Android SDK Build-Tools
     - Android SDK Command-line Tools

3. **配置Flutter**
   ```powershell
   flutter config --android-studio-dir="C:\Program Files\Android\Android Studio"
   ```

### 2. 接受Android许可

```powershell
flutter doctor --android-licenses
# 输入 y 接受所有许可
```

## 📱 运行项目

### 1. 进入项目目录

```powershell
cd H:\WEB\douyin-treasure\flutter-app
```

### 2. 安装依赖

```powershell
flutter pub get
```

### 3. 创建Android配置文件

需要手动创建一些配置文件。

#### 创建 android/app/src/main/AndroidManifest.xml

我会帮你创建这个文件。

### 4. 配置高德地图Key

你需要：
1. 注册高德开放平台账号：https://console.amap.com/
2. 创建应用并获取Key
3. 在AndroidManifest.xml中配置

### 5. 运行应用

```powershell
# 查看可用设备
flutter devices

# 运行应用
flutter run
```

## ⚡ 快速测试方案

如果你想快速测试，我建议：

### 方案A：使用Android模拟器

1. 安装Android Studio
2. 创建虚拟设备（AVD Manager）
3. 启动模拟器
4. 运行 `flutter run`

### 方案B：使用真机调试（推荐）

1. 打开手机的开发者选项
2. 启用USB调试
3. 连接手机到电脑
4. 运行 `flutter run`

## 📝 快速命令清单

```powershell
# 1. 安装Flutter（手动安装后）
flutter --version

# 2. 检查环境
flutter doctor

# 3. 进入项目
cd H:\WEB\douyin-treasure\flutter-app

# 4. 获取依赖
flutter pub get

# 5. 查看设备
flutter devices

# 6. 运行应用
flutter run
```

## 💡 推荐流程

如果你是第一次接触Flutter，我建议：

1. **先安装Flutter SDK**（约20分钟）
2. **安装Android Studio**（约30分钟）
3. **运行flutter doctor**检查环境
4. **创建虚拟设备或连接真机**
5. **运行项目**

或者...

## 🎯 更简单的方案

如果觉得Flutter配置复杂，我可以：

1. **改进Web版本**
   - 增加手动调整位置功能
   - 加大宝藏发现半径
   - 添加"修正位置"功能

2. **或者等我帮你完成Flutter完整配置**
   - 我会创建所有必需的Android配置文件
   - 提供详细的步骤指导

你想：
A. 继续配置Flutter（需要1-2小时）
B. 改进Web版本（10分钟）

选哪个？

