# Firebase 实时通信设置指南

## 📋 步骤1：创建Firebase项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击"添加项目"或"创建项目"
3. 输入项目名称（例如：`totofun-treasure`）
4. 可以选择启用Google Analytics（可选）
5. 点击"创建项目"

## 📋 步骤2：启用Realtime Database

1. 在Firebase控制台中，点击左侧菜单的"Realtime Database"
2. 点击"创建数据库"
3. 选择位置（建议选择离你最近的区域，如`asia-east1`）
4. 选择"以测试模式启动"（开发阶段）
5. 点击"启用"

## 📋 步骤3：配置数据库规则

1. 在Realtime Database页面，点击"规则"标签
2. 将规则修改为以下内容（允许所有用户读写，适合开发阶段）：

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": true,
        ".write": true
      }
    },
    "messages": {
      "$messageId": {
        ".read": true,
        ".write": true
      }
    },
    "friendships": {
      "$friendshipId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

⚠️ **注意**：这是开发阶段的宽松规则。生产环境应该添加身份验证和更严格的权限控制。

## 📋 步骤4：获取Web应用配置

1. 在Firebase控制台，点击左侧的"项目设置"（齿轮图标）
2. 滚动到"你的应用"部分
3. 点击"</>"（Web应用）图标
4. 注册应用（可以命名为"Totofun Web"）
5. **复制配置信息**（apiKey, authDomain, databaseURL, projectId等）

## 📋 步骤5：配置index.html

1. 打开 `index.html` 文件
2. 找到 `<!-- Firebase配置 -->` 部分
3. 将你从Firebase控制台复制的配置信息填入：

```javascript
const firebaseConfig = {
    apiKey: "你的API密钥",
    authDomain: "你的项目ID.firebaseapp.com",
    databaseURL: "https://你的项目ID-default-rtdb.asia-east1.firebasedatabase.app",
    projectId: "你的项目ID",
    storageBucket: "你的项目ID.appspot.com",
    messagingSenderId: "你的发送者ID",
    appId: "你的应用ID"
};
```

## 📋 步骤6：测试连接

1. 保存文件并刷新页面
2. 打开浏览器控制台（F12）
3. 应该看到 "Firebase连接成功！" 的消息
4. 在Firebase控制台的Realtime Database中，应该能看到数据结构

## 🔒 安全建议（生产环境）

### 1. 添加身份验证

在生产环境中，建议启用Firebase Authentication：
- 在Firebase控制台启用"Authentication"
- 选择"匿名登录"或"邮箱/密码登录"
- 修改数据库规则，要求用户认证

### 2. 更严格的数据库规则

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid"
      }
    },
    "messages": {
      "$messageId": {
        ".read": "auth != null && (data.child('from').val() === auth.uid || data.child('to').val() === auth.uid)",
        ".write": "auth != null && newData.child('from').val() === auth.uid"
      }
    }
  }
}
```

## 💰 Firebase免费额度

Firebase Realtime Database免费额度：
- **存储**：1 GB
- **下载**：10 GB/月
- **上传**：10 GB/月
- **同时连接**：100个

对于个人项目和小型应用，免费额度通常足够使用。

## 🆘 常见问题

### Q: 数据库规则在哪里修改？
A: Firebase控制台 → Realtime Database → 规则标签

### Q: 如何查看实时数据？
A: Firebase控制台 → Realtime Database → 数据标签，可以看到实时更新的数据

### Q: 如何备份数据？
A: Firebase控制台 → Realtime Database → 数据标签 → 导出JSON

### Q: 如何限制访问？
A: 修改数据库规则，添加身份验证要求

## 📚 更多资源

- [Firebase文档](https://firebase.google.com/docs)
- [Realtime Database文档](https://firebase.google.com/docs/database)
- [Firebase定价](https://firebase.google.com/pricing)

