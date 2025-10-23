@echo off
chcp 65001 >nul
cls

echo.
echo ════════════════════════════════════════════════════
echo    🚀 Totofun 突突翻 Flutter APP - 快速启动
echo ════════════════════════════════════════════════════
echo.

cd flutter-app

echo [1/4] 检查Flutter环境...
flutter --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Flutter未安装！
    echo.
    echo 请先安装Flutter：
    echo 1. 访问 https://docs.flutter.dev/get-started/install/windows
    echo 2. 下载Flutter SDK
    echo 3. 解压到 C:\src\flutter
    echo 4. 添加到环境变量 Path: C:\src\flutter\bin
    echo.
    echo 详细步骤请查看: INSTALL_AND_RUN.md
    pause
    exit /b 1
)
echo ✅ Flutter已安装

echo.
echo [2/4] 检查设备连接...
flutter devices
echo.

echo [3/4] 安装依赖...
flutter pub get

echo.
echo [4/4] 启动应用...
echo.
echo ⚠️  首次运行需要5-10分钟编译，请耐心等待
echo ⚠️  确保已在AndroidManifest.xml和Info.plist中配置高德Key
echo.

flutter run

pause

