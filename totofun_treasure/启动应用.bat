@echo off
chcp 65001 >nul

REM 切换到脚本所在目录
cd /d "%~dp0"

echo ========================================
echo    Totofun 突突翻 - 应用启动器
echo ========================================
echo.
echo 请选择运行平台：
echo.
echo [1] Windows 桌面版（需要开发者模式）
echo [2] Chrome 浏览器（推荐，适合UI测试）
echo [3] Android 模拟器（完整功能测试）
echo [4] 启动 Android 模拟器
echo [5] 查看可用设备
echo [6] 启用开发者模式
echo [0] 退出
echo.
set /p choice=请输入选项 (0-6): 

if "%choice%"=="1" goto windows
if "%choice%"=="2" goto chrome
if "%choice%"=="3" goto android
if "%choice%"=="4" goto emulator
if "%choice%"=="5" goto devices
if "%choice%"=="6" goto devmode
if "%choice%"=="0" goto end
goto invalid

:windows
echo.
echo 正在启动 Windows 桌面版...
echo 注意：如果提示需要开发者模式，请选择选项6启用
echo.
flutter run -d windows
goto end

:chrome
echo.
echo 正在启动 Chrome 浏览器版...
echo 首次启动需要编译，请稍等3-5分钟...
echo 编译完成后会自动在浏览器打开 http://localhost:8080
echo.
flutter run -d chrome --web-port=8080
goto end

:android
echo.
echo 正在启动 Android 版本...
echo 请确保模拟器已启动！
echo.
flutter devices
echo.
flutter run
goto end

:emulator
echo.
echo 正在启动 Android 模拟器...
echo 请稍等 1-2 分钟...
echo.
start cmd /c "flutter emulators --launch Medium_Phone_API_36.0 && pause"
echo.
echo 模拟器正在启动...
echo 请等待模拟器窗口完全启动后，再次运行此脚本选择选项3
echo.
pause
goto end

:devices
echo.
echo 正在检查可用设备...
echo.
flutter devices
echo.
pause
goto end

:devmode
echo.
echo 正在打开开发者模式设置...
echo.
start ms-settings:developers
echo.
echo 请在打开的设置窗口中：
echo 1. 找到"开发者模式"选项
echo 2. 将开关切换到"开启"状态
echo 3. 等待系统应用设置
echo 4. 关闭设置窗口后，选择选项1运行Windows版本
echo.
pause
goto end

:invalid
echo.
echo 无效的选项！
echo.
pause
goto end

:end

