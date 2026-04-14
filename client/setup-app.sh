#!/bin/bash
# Totofun App 初始化脚本
# 在 client 目录下执行：bash setup-app.sh

set -e
echo "📱 Totofun App 初始化开始..."

echo "📦 安装依赖..."
npm install

echo "📦 安装 Capacitor..."
npm install @capacitor/core @capacitor/cli
npm install @capacitor/app @capacitor/geolocation @capacitor/push-notifications
npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/haptics @capacitor/keyboard

echo "🔨 构建前端..."
npm run build

echo "📱 初始化 Android 平台..."
npx cap add android

echo "🔄 同步代码到 Android..."
npx cap sync android

echo ""
echo "✅ 初始化完成！"
echo ""
echo "接下来："
echo "  1. 安装 Android Studio: https://developer.android.com/studio"
echo "  2. 运行: npx cap open android"
echo "  3. 在 Android Studio 中点 Run 即可在模拟器或真机上运行"
echo ""
echo "打包 APK："
echo "  Android Studio → Build → Build Bundle(s) / APK(s) → Build APK(s)"
