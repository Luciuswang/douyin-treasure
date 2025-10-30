@echo off
chcp 65001 >nul
echo ========================================
echo    启用 Windows 开发者模式
echo ========================================
echo.
echo Flutter Windows开发需要启用开发者模式以支持符号链接。
echo.
echo 正在打开Windows设置...
echo.
start ms-settings:developers
echo.
echo 请在打开的设置窗口中：
echo 1. 找到"开发者模式"选项
echo 2. 将开关切换到"开启"状态
echo 3. 等待系统应用设置
echo 4. 关闭设置窗口
echo 5. 重新运行 启动应用.bat
echo.
pause

