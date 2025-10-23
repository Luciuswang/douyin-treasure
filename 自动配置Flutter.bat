@echo off
chcp 65001 >nul
cls

echo.
echo ════════════════════════════════════════════════════
echo    🤖 Flutter 自动配置助手
echo ════════════════════════════════════════════════════
echo.
echo 这个脚本会帮你检查和安装Flutter环境
echo.

:: 检查是否有管理员权限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 已获取管理员权限
) else (
    echo ⚠️  建议以管理员身份运行此脚本
    echo    右键点击脚本，选择"以管理员身份运行"
    echo.
)

:: 第1步：检查Flutter
echo ═══════════════════════════════════════════════════
echo [1/5] 检查Flutter SDK
echo ═══════════════════════════════════════════════════
flutter --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Flutter已安装
    flutter --version
) else (
    echo ❌ Flutter未安装
    echo.
    echo 🔧 自动下载Flutter中...
    echo.
    echo 正在下载Flutter SDK到 C:\src\flutter ...
    echo （约1GB，可能需要10-20分钟）
    echo.
    
    :: 创建目录
    if not exist C:\src mkdir C:\src
    
    :: 使用curl下载（Windows 10自带）
    echo 开始下载...
    curl -L https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.16.0-stable.zip -o C:\src\flutter.zip
    
    if %errorLevel% == 0 (
        echo ✅ 下载完成
        echo 正在解压...
        powershell -command "Expand-Archive -Path C:\src\flutter.zip -DestinationPath C:\src\ -Force"
        
        echo 正在设置环境变量...
        setx PATH "%PATH%;C:\src\flutter\bin" /M
        
        echo ✅ Flutter安装完成！
        echo.
        echo ⚠️  请关闭并重新打开此窗口，然后再次运行此脚本
        pause
        exit /b 0
    ) else (
        echo ❌ 下载失败
        echo.
        echo 请手动下载：
        echo https://docs.flutter.dev/get-started/install/windows
        echo 然后解压到 C:\src\flutter
        pause
        exit /b 1
    )
)

echo.
:: 第2步：检查Android Studio
echo ═══════════════════════════════════════════════════
echo [2/5] 检查Android Studio
echo ═══════════════════════════════════════════════════

if exist "C:\Program Files\Android\Android Studio" (
    echo ✅ Android Studio已安装
) else (
    echo ❌ Android Studio未安装
    echo.
    echo 请手动安装Android Studio：
    echo 1. 访问 https://developer.android.com/studio
    echo 2. 下载并安装
    echo 3. 安装Flutter和Dart插件
    echo.
)

echo.
:: 第3步：运行Flutter Doctor
echo ═══════════════════════════════════════════════════
echo [3/5] 运行Flutter Doctor
echo ═══════════════════════════════════════════════════
flutter doctor

echo.
:: 第4步：接受Android许可
echo ═══════════════════════════════════════════════════
echo [4/5] 接受Android许可
echo ═══════════════════════════════════════════════════
echo.
choice /C YN /M "是否自动接受Android许可"
if errorlevel 2 goto skip_licenses
if errorlevel 1 goto accept_licenses

:accept_licenses
flutter doctor --android-licenses
echo ✅ 许可已接受
goto check_devices

:skip_licenses
echo ⏭️  已跳过

:check_devices
echo.
:: 第5步：检查设备
echo ═══════════════════════════════════════════════════
echo [5/5] 检查连接的设备
echo ═══════════════════════════════════════════════════
flutter devices

echo.
echo ════════════════════════════════════════════════════
echo 📊 配置总结
echo ════════════════════════════════════════════════════
echo.
flutter doctor
echo.

echo ════════════════════════════════════════════════════
echo 🎯 下一步
echo ════════════════════════════════════════════════════
echo.
echo 如果所有检查都通过，你可以：
echo 1. 连接Android手机或启动模拟器
echo 2. 双击运行 "运行Flutter-APP.bat"
echo.
echo 如果有错误：
echo 1. 安装Android Studio（如果未安装）
echo 2. 在Android Studio中安装Flutter插件
echo 3. 运行 flutter doctor --android-licenses
echo.

pause

