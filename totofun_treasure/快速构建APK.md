# 📦 快速构建 Android APK

## 🚀 最快方式：一键构建

### 方法1：构建Debug版本（推荐测试用）

```bash
cd H:\WEB\douyin-treasure\totofun_treasure
flutter build apk --debug
```

**生成文件**：`build/app/outputs/flutter-apk/app-debug.apk`

**特点**：
- ✅ 构建速度快（2-3分钟）
- ✅ 包含调试信息
- ✅ 文件较大（约40-60MB）
- ⚠️ 性能略低于Release版

---

### 方法2：构建Release版本（推荐正式使用）

```bash
cd H:\WEB\douyin-treasure\totofun_treasure
flutter build apk --release
```

**生成文件**：`build/app/outputs/flutter-apk/app-release.apk`

**特点**：
- ✅ 性能最优
- ✅ 包体积较小（约20-30MB）
- ✅ 代码混淆保护
- ⚠️ 构建时间较长（5-10分钟）

---

## 📱 安装到手机

### 方式1：通过USB直接安装

```bash
# 构建并安装
flutter install

# 或者手动安装
adb install build/app/outputs/flutter-apk/app-release.apk
```

### 方式2：传输APK文件

1. **找到APK文件**
   - 路径：`H:\WEB\douyin-treasure\totofun_treasure\build\app\outputs\flutter-apk\`
   - 文件：`app-debug.apk` 或 `app-release.apk`

2. **传输到手机**
   - USB传输：将APK复制到手机
   - 微信/QQ：发送给自己
   - 云盘：上传后手机下载

3. **安装**
   - 在手机上找到APK文件
   - 点击安装
   - 允许"安装未知来源应用"（如果提示）

---

## 🛠️ 构建前检查

### 确认Flutter环境

```bash
flutter doctor
```

应该看到：
```
[✓] Flutter (Channel stable, 3.x.x)
[✓] Android toolchain - develop for Android devices
[✓] Chrome - develop for the web
[✓] Android Studio
```

### 确认依赖已安装

```bash
cd H:\WEB\douyin-treasure\totofun_treasure
flutter pub get
```

---

## 🔧 高级选项

### 构建分架构APK（体积更小）

```bash
# 构建arm64-v8a（大部分手机）
flutter build apk --target-platform android-arm64 --release

# 构建所有架构的独立APK
flutter build apk --split-per-abi --release
```

生成文件：
- `app-armeabi-v7a-release.apk` （32位，约15MB）
- `app-arm64-v8a-release.apk` （64位，约18MB）
- `app-x86_64-release.apk` （模拟器用）

### 构建App Bundle（上架Google Play）

```bash
flutter build appbundle --release
```

生成文件：`build/app/outputs/bundle/release/app-release.aab`

---

## 📊 构建时间参考

| 构建类型 | 首次构建 | 增量构建 |
|---------|---------|---------|
| Debug   | 3-5分钟 | 30-60秒 |
| Release | 8-12分钟| 2-3分钟 |

---

## 🐛 常见问题

### 问题1：构建失败 - Gradle错误

```
FAILURE: Build failed with an exception.
```

**解决方案**：
```bash
# 清理构建缓存
cd android
./gradlew clean
cd ..

# 重新构建
flutter clean
flutter pub get
flutter build apk
```

### 问题2：签名错误

```
Execution failed for task ':app:validateSigningRelease'.
```

**解决方案**：
这是正常的，因为没有配置签名。Debug版本不需要签名。

如果要配置签名（上架用）：
```bash
# 生成密钥
keytool -genkey -v -keystore ~/key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias key

# 在 android/app/build.gradle 中配置签名
```

### 问题3：内存不足

```
Out of memory error
```

**解决方案**：
```bash
# 修改 android/gradle.properties
org.gradle.jvmargs=-Xmx2048m
```

---

## ✅ 验证APK

### 检查APK信息

```bash
# 查看APK信息
aapt dump badging app-release.apk

# 查看APK大小
dir build\app\outputs\flutter-apk
```

### 测试APK

```bash
# 安装到手机
adb install -r app-release.apk

# 启动应用
adb shell am start -n com.totofun.treasure/.MainActivity

# 查看日志
adb logcat | findstr flutter
```

---

## 🎯 推荐工作流

### 日常测试
```bash
flutter run  # 直接运行，支持热重载
```

### 晚上测试（发送给测试人员）
```bash
flutter build apk --debug  # 快速构建
# 然后传输 app-debug.apk
```

### 正式发布
```bash
flutter build apk --release --split-per-abi  # 构建优化版本
# 或
flutter build appbundle --release  # Google Play
```

---

## 📤 分发APK

### 测试分发（内部）
1. 微信/QQ群分享
2. 企业内网
3. 蒲公英/TestFlight

### 正式发布（外部）
1. Google Play Store
2. 华为应用市场
3. 小米应用商店
4. 官网下载

---

**构建成功后，APK文件路径**：
```
H:\WEB\douyin-treasure\totofun_treasure\build\app\outputs\flutter-apk\app-release.apk
```

**复制这个文件到手机就可以安装了！** 📱

