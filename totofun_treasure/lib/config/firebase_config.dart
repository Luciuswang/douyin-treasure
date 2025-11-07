import 'package:firebase_core/firebase_core.dart';

/// Firebase 配置
/// 
/// 使用说明：
/// 1. 访问 https://console.firebase.google.com/
/// 2. 创建新项目或选择现有项目
/// 3. 添加 Android/iOS 应用
/// 4. 下载配置文件并替换下面的配置
class FirebaseConfig {
  // 开发环境配置（测试用）
  static const FirebaseOptions development = FirebaseOptions(
    apiKey: 'YOUR_API_KEY',
    appId: '1:YOUR_PROJECT_NUMBER:android:YOUR_APP_ID',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'totofun-treasure-dev',
    databaseURL: 'https://totofun-treasure-dev-default-rtdb.firebaseio.com',
    storageBucket: 'totofun-treasure-dev.appspot.com',
  );

  // 生产环境配置
  static const FirebaseOptions production = FirebaseOptions(
    apiKey: 'YOUR_API_KEY',
    appId: '1:YOUR_PROJECT_NUMBER:android:YOUR_APP_ID',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'totofun-treasure',
    databaseURL: 'https://totofun-treasure-default-rtdb.firebaseio.com',
    storageBucket: 'totofun-treasure.appspot.com',
  );

  // 当前使用的配置
  static FirebaseOptions get current {
    // 可以根据环境变量或构建配置切换
    return development;
  }
}



