@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Firebase配置检查工具
echo ========================================
echo.

set "error_count=0"
set "warning_count=0"

echo [检查1] google-services.json 文件...
if exist "android\app\google-services.json" (
    echo ✅ 找到 google-services.json
    
    REM 检查文件大小
    for %%A in (android\app\google-services.json) do set size=%%~zA
    if !size! LSS 100 (
        echo ⚠️  警告：文件太小，可能不完整
        set /a warning_count+=1
    ) else (
        echo    文件大小：!size! 字节
    )
) else (
    echo ❌ 未找到 google-services.json
    echo    应该在：android\app\google-services.json
    echo    请从Firebase控制台下载此文件
    set /a error_count+=1
)
echo.

echo [检查2] firebase_config.dart 配置文件...
if exist "lib\config\firebase_config.dart" (
    echo ✅ 找到 firebase_config.dart
    
    REM 检查是否包含必要的配置
    findstr /C:"apiKey" lib\config\firebase_config.dart >nul 2>&1
    if !errorlevel! EQU 0 (
        echo    包含 apiKey 配置
        
        REM 检查是否还是默认值
        findstr /C:"YOUR_API_KEY" lib\config\firebase_config.dart >nul 2>&1
        if !errorlevel! EQU 0 (
            echo ⚠️  警告：配置可能未更新（包含默认值）
            set /a warning_count+=1
        )
    ) else (
        echo ❌ 配置文件格式错误
        set /a error_count+=1
    )
) else (
    echo ❌ 未找到 firebase_config.dart
    echo    应该在：lib\config\firebase_config.dart
    set /a error_count+=1
)
echo.

echo [检查3] pubspec.yaml 依赖...
if exist "pubspec.yaml" (
    findstr /C:"firebase_core" pubspec.yaml >nul 2>&1
    if !errorlevel! EQU 0 (
        echo ✅ firebase_core 依赖已添加
    ) else (
        echo ❌ 缺少 firebase_core 依赖
        set /a error_count+=1
    )
    
    findstr /C:"firebase_auth" pubspec.yaml >nul 2>&1
    if !errorlevel! EQU 0 (
        echo ✅ firebase_auth 依赖已添加
    ) else (
        echo ❌ 缺少 firebase_auth 依赖
        set /a error_count+=1
    )
    
    findstr /C:"firebase_database" pubspec.yaml >nul 2>&1
    if !errorlevel! EQU 0 (
        echo ✅ firebase_database 依赖已添加
    ) else (
        echo ❌ 缺少 firebase_database 依赖
        set /a error_count+=1
    )
) else (
    echo ❌ 未找到 pubspec.yaml
    set /a error_count+=1
)
echo.

echo [检查4] Android配置文件...
if exist "android\build.gradle" (
    findstr /C:"google-services" android\build.gradle >nul 2>&1
    if !errorlevel! EQU 0 (
        echo ✅ google-services 插件已配置
    ) else (
        echo ⚠️  警告：可能缺少 google-services 插件
        set /a warning_count+=1
    )
) else (
    echo ❌ 未找到 android\build.gradle
    set /a error_count+=1
)

if exist "android\app\build.gradle" (
    findstr /C:"com.google.gms.google-services" android\app\build.gradle >nul 2>&1
    if !errorlevel! EQU 0 (
        echo ✅ google-services 插件已应用
    ) else (
        echo ⚠️  警告：app级build.gradle可能未应用插件
        set /a warning_count+=1
    )
) else (
    echo ❌ 未找到 android\app\build.gradle
    set /a error_count+=1
)
echo.

echo [检查5] 网络连接...
ping -n 1 firebase.google.com >nul 2>&1
if !errorlevel! EQU 0 (
    echo ✅ 可以访问 Firebase 服务器
) else (
    echo ⚠️  警告：无法访问 Firebase 服务器
    echo    请检查网络连接
    set /a warning_count+=1
)
echo.

echo ========================================
echo   检查结果汇总
echo ========================================
echo.

if !error_count! EQU 0 (
    if !warning_count! EQU 0 (
        echo ✅ 所有检查通过！配置完成！
        echo.
        echo 下一步：
        echo 1. 运行 flutter pub get 安装依赖
        echo 2. 使用"快速构建.bat"构建应用
        echo 3. 在手机上测试聊天功能
    ) else (
        echo ⚠️  配置基本完成，但有 !warning_count! 个警告
        echo    建议检查上述警告项
    )
) else (
    echo ❌ 发现 !error_count! 个错误，配置未完成
    echo.
    echo 请按照以下步骤修复：
    echo.
    
    if not exist "android\app\google-services.json" (
        echo 1. 下载 google-services.json
        echo    - 访问 https://console.firebase.google.com/
        echo    - 进入你的项目
        echo    - 项目设置 → 你的应用 → 下载 google-services.json
        echo    - 放到 android\app\ 目录
        echo.
    )
    
    if not exist "lib\config\firebase_config.dart" (
        echo 2. 配置 firebase_config.dart
        echo    - 查看 Firebase配置-5分钟快速版.md
        echo    - 按照步骤4更新配置信息
        echo.
    )
)

echo.
echo ========================================
echo 详细配置指南：
echo - Firebase配置-5分钟快速版.md （推荐）
echo - Firebase手机端配置指南.md （完整版）
echo ========================================
echo.

pause

