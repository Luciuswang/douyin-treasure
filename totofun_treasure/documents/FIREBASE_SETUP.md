# 🔥 Firebase 配置指南

> 为 Totofun 突突翻配置 Firebase 聊天功能

---

## 📋 目录

1. [创建 Firebase 项目](#创建-firebase-项目)
2. [配置 Android 应用](#配置-android-应用)
3. [配置 iOS 应用](#配置-ios-应用)
4. [配置 Web 应用](#配置-web-应用)
5. [启用服务](#启用服务)
6. [测试验证](#测试验证)

---

## 1. 创建 Firebase 项目

### 步骤 1：访问 Firebase 控制台

1. 打开浏览器，访问：https://console.firebase.google.com/
2. 使用 Google 账号登录
3. 点击「添加项目」

### 步骤 2：创建项目

1. **项目名称**：输入 `totofun-treasure`
2. **Google Analytics**：建议启用（可选）
3. 点击「创建项目」
4. 等待项目创建完成（约 30 秒）

---

## 2. 配置 Android 应用

### 步骤 1：添加 Android 应用

1. 在 Firebase 控制台，点击「添加应用」
2. 选择 Android 图标
3. 填写信息：
   - **Android 包名**：`com.totofun.treasure`
   - **应用昵称**：`Totofun Treasure`
   - **调试签名证书 SHA-1**：（可选，用于 Google 登录）

### 步骤 2：下载配置文件

1. 下载 `google-services.json` 文件
2. 将文件放到：`totofun_treasure/android/app/` 目录下

### 步骤 3：修改 Android 配置

**文件：`android/build.gradle`**

```gradle
buildscript {
    dependencies {
        // 添加这一行
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

**文件：`android/app/build.gradle`**

```gradle
// 在文件最后添加
apply plugin: 'com.google.gms.google-services'
```

---

## 3. 配置 iOS 应用

### 步骤 1：添加 iOS 应用

1. 在 Firebase 控制台，点击「添加应用」
2. 选择 iOS 图标
3. 填写信息：
   - **iOS 捆绑包 ID**：`com.totofun.treasure`
   - **应用昵称**：`Totofun Treasure`

### 步骤 2：下载配置文件

1. 下载 `GoogleService-Info.plist` 文件
2. 使用 Xcode 打开项目：`totofun_treasure/ios/Runner.xcworkspace`
3. 将 `GoogleService-Info.plist` 拖到 Xcode 的 `Runner` 文件夹中
4. 确保勾选「Copy items if needed」

---

## 4. 配置 Web 应用

### 步骤 1：添加 Web 应用

1. 在 Firebase 控制台，点击「添加应用」
2. 选择 Web 图标（`</>`）
3. 填写信息：
   - **应用昵称**：`Totofun Treasure Web`
   - **Firebase Hosting**：不勾选（暂时）

### 步骤 2：获取配置信息

复制显示的配置信息，类似：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "totofun-treasure.firebaseapp.com",
  databaseURL: "https://totofun-treasure-default-rtdb.firebaseio.com",
  projectId: "totofun-treasure",
  storageBucket: "totofun-treasure.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### 步骤 3：更新 Flutter 配置

**文件：`lib/config/firebase_config.dart`**

```dart
static const FirebaseOptions development = FirebaseOptions(
  apiKey: 'YOUR_API_KEY',  // 替换为实际的 apiKey
  appId: 'YOUR_APP_ID',    // 替换为实际的 appId
  messagingSenderId: 'YOUR_SENDER_ID',  // 替换为实际的 messagingSenderId
  projectId: 'totofun-treasure',
  databaseURL: 'https://totofun-treasure-default-rtdb.firebaseio.com',
  storageBucket: 'totofun-treasure.appspot.com',
);
```

---

## 5. 启用服务

### 5.1 启用 Authentication（认证）

1. 在 Firebase 控制台，点击左侧菜单「Authentication」
2. 点击「开始使用」
3. 选择「登录方法」标签
4. 启用「匿名」登录方式
   - 点击「匿名」
   - 开启开关
   - 点击「保存」

### 5.2 启用 Realtime Database（实时数据库）

1. 在 Firebase 控制台，点击左侧菜单「Realtime Database」
2. 点击「创建数据库」
3. 选择数据库位置：
   - **推荐**：`asia-southeast1`（新加坡，延迟最低）
   - 或选择：`us-central1`（美国中部）
4. 选择安全规则：
   - 先选择「测试模式」（开发阶段）
   - 点击「启用」

### 5.3 配置数据库规则

**重要**：测试模式的规则会在 30 天后过期，需要配置正式规则。

点击「规则」标签，替换为以下规则：

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "friendships": {
      "$friendshipId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "messages": {
      "$chatId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "conversations": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid"
      }
    }
  }
}
```

点击「发布」保存规则。

### 5.4 启用 Storage（存储）

1. 在 Firebase 控制台，点击左侧菜单「Storage」
2. 点击「开始使用」
3. 选择「测试模式」
4. 选择存储位置（与 Realtime Database 相同）
5. 点击「完成」

---

## 6. 测试验证

### 6.1 运行应用

```bash
cd totofun_treasure
flutter pub get
flutter run
```

### 6.2 检查 Firebase 连接

应用启动后，查看控制台输出：

✅ **成功**：
```
Firebase 初始化成功
```

❌ **失败**：
```
Firebase 初始化失败: ...
聊天功能将不可用，但其他功能正常
```

如果失败，检查：
1. `google-services.json` 文件是否正确放置
2. `firebase_config.dart` 中的配置是否正确
3. 网络连接是否正常

### 6.3 测试聊天功能

1. 点击右下角的聊天按钮（💬）
2. 点击「添加好友」
3. 搜索用户ID或昵称
4. 发送好友请求
5. 在另一台设备上接受请求
6. 开始聊天！

---

## 🎯 快速配置（5分钟版本）

如果你只想快速测试，可以使用我们的测试项目：

### 测试配置

**文件：`lib/config/firebase_config.dart`**

```dart
// 使用测试项目（仅用于开发测试）
static const FirebaseOptions development = FirebaseOptions(
  apiKey: 'AIzaSyDemoKeyForTesting123456789',
  appId: '1:123456789:android:demo',
  messagingSenderId: '123456789',
  projectId: 'totofun-treasure-demo',
  databaseURL: 'https://totofun-treasure-demo-default-rtdb.firebaseio.com',
  storageBucket: 'totofun-treasure-demo.appspot.com',
);
```

**注意**：这只是示例配置，实际使用需要创建自己的 Firebase 项目。

---

## 🔧 常见问题

### Q1: 提示 "Firebase 初始化失败"

**解决方案**：
1. 检查网络连接
2. 确认配置文件正确放置
3. 重新运行 `flutter clean` 和 `flutter pub get`

### Q2: 无法发送消息

**解决方案**：
1. 检查 Realtime Database 是否已启用
2. 检查数据库规则是否正确
3. 确认用户已登录（匿名登录）

### Q3: Android 编译失败

**解决方案**：
1. 确认 `google-services.json` 在正确位置
2. 检查 `build.gradle` 配置
3. 运行 `flutter clean`

### Q4: iOS 编译失败

**解决方案**：
1. 确认 `GoogleService-Info.plist` 已添加到 Xcode
2. 清理 Xcode 缓存：Product → Clean Build Folder
3. 重新运行

---

## 📚 更多资源

- [Firebase 官方文档](https://firebase.google.com/docs)
- [FlutterFire 文档](https://firebase.flutter.dev/)
- [Firebase 控制台](https://console.firebase.google.com/)

---

## 💡 提示

1. **开发阶段**：使用测试模式的数据库规则
2. **生产环境**：务必配置严格的安全规则
3. **备份数据**：定期导出 Realtime Database 数据
4. **监控使用**：关注 Firebase 控制台的使用量统计

---

**配置完成后，就可以使用完整的好友聊天功能了！** 🎉



