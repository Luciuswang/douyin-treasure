# 禁用 Firebase 以支持国内访问

## 问题
Firebase 是 Google 服务，在国内无法访问，导致：
- 无痕模式无法打开页面
- 页面加载缓慢
- 需要 VPN 才能访问

## 解决方案
完全禁用 Firebase，使用纯本地存储模式

## 修改步骤

### 1. 修改 Firebase 配置
将 `firebaseEnabled` 默认设为 `false`

### 2. 跳过 Firebase 初始化
不加载 Firebase SDK

### 3. 使用本地存储
所有数据存储在 localStorage

## 影响
- ✅ 国内无需 VPN 即可访问
- ✅ 页面加载速度更快
- ❌ 失去实时聊天功能
- ❌ 失去跨设备同步功能

## 替代方案
后续可以使用国内云服务替代 Firebase：
- 腾讯云开发
- 阿里云 Serverless
- LeanCloud

