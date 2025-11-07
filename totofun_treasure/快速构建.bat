@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   TotoFun 宝藏猎人 - 快速构建工具
echo ========================================
echo.

REM 检查Flutter是否在PATH中
where flutter >nul 2>&1
if %errorlevel% neq 0 (
    echo [信息] Flutter未在PATH中，尝试常见安装位置...
    
    if exist "C:\flutter\bin\flutter.bat" (
        set "FLUTTER_CMD=C:\flutter\bin\flutter.bat"
        echo [成功] 找到Flutter: C:\flutter\bin\
    ) else if exist "C:\src\flutter\bin\flutter.bat" (
        set "FLUTTER_CMD=C:\src\flutter\bin\flutter.bat"
        echo [成功] 找到Flutter: C:\src\flutter\bin\
    ) else if exist "%USERPROFILE%\flutter\bin\flutter.bat" (
        set "FLUTTER_CMD=%USERPROFILE%\flutter\bin\flutter.bat"
        echo [成功] 找到Flutter: %USERPROFILE%\flutter\bin\
    ) else (
        echo [错误] 未找到Flutter安装
        echo.
        echo 请确保Flutter已安装，或手动设置PATH
        pause
        exit /b 1
    )
) else (
    set "FLUTTER_CMD=flutter"
    echo [成功] Flutter已在PATH中
)

echo.
echo 请选择构建类型：
echo.
echo 1) 构建Android APK（发布版）
echo 2) 构建Android APK（调试版，更快）
echo 3) 检测连接的设备
echo 4) 直接运行到连接的设备
echo 5) 清理构建缓存
echo 0) 退出
echo.

set /p choice="请输入选项 (0-5): "

if "%choice%"=="1" goto build_release
if "%choice%"=="2" goto build_debug
if "%choice%"=="3" goto check_devices
if "%choice%"=="4" goto run_device
if "%choice%"=="5" goto clean_build
if "%choice%"=="0" goto end

echo [错误] 无效选项
pause
exit /b 1

:build_release
echo.
echo ========================================
echo   构建发布版APK
echo ========================================
echo.
echo [1/3] 清理旧构建...
call %FLUTTER_CMD% clean

echo.
echo [2/3] 获取依赖...
call %FLUTTER_CMD% pub get

echo.
echo [3/3] 构建APK（这可能需要几分钟）...
call %FLUTTER_CMD% build apk --release

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   构建成功！
    echo ========================================
    echo.
    echo APK位置：
    echo %CD%\build\app\outputs\flutter-apk\app-release.apk
    echo.
    echo 文件大小：
    for %%A in (build\app\outputs\flutter-apk\app-release.apk) do echo %%~zA 字节
    echo.
    echo 你可以将此APK传到手机安装
    echo.
    
    REM 询问是否打开文件夹
    set /p open_folder="是否打开APK所在文件夹？(Y/N): "
    if /i "!open_folder!"=="Y" (
        explorer build\app\outputs\flutter-apk\
    )
) else (
    echo.
    echo [错误] 构建失败
)
pause
goto end

:build_debug
echo.
echo ========================================
echo   构建调试版APK
echo ========================================
echo.
echo [1/2] 获取依赖...
call %FLUTTER_CMD% pub get

echo.
echo [2/2] 构建调试版APK...
call %FLUTTER_CMD% build apk --debug

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   构建成功！
    echo ========================================
    echo.
    echo APK位置：
    echo %CD%\build\app\outputs\flutter-apk\app-debug.apk
    echo.
    explorer build\app\outputs\flutter-apk\
) else (
    echo.
    echo [错误] 构建失败
)
pause
goto end

:check_devices
echo.
echo ========================================
echo   检测设备
echo ========================================
echo.
call %FLUTTER_CMD% devices
echo.
pause
goto end

:run_device
echo.
echo ========================================
echo   运行到设备
echo ========================================
echo.
echo 正在检测设备...
call %FLUTTER_CMD% devices
echo.
echo 正在启动应用...
call %FLUTTER_CMD% run
pause
goto end

:clean_build
echo.
echo ========================================
echo   清理构建缓存
echo ========================================
echo.
call %FLUTTER_CMD% clean
echo.
echo 清理完成！
pause
goto end

:end
echo.
echo 再见！
timeout /t 2 >nul
exit /b 0

