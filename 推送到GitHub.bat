@echo off
chcp 65001 >nul
echo ========================================
echo 推送到 GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo 检查当前分支...
git branch

echo.
echo 检查远程仓库...
git remote -v

echo.
echo 推送代码到 GitHub...
echo 请选择分支：
echo   1. main
echo   2. master
echo   3. 自定义分支名
echo.
set /p choice="请输入选项 (1/2/3): "

if "%choice%"=="1" (
    git push origin main
) else if "%choice%"=="2" (
    git push origin master
) else if "%choice%"=="3" (
    set /p branch="请输入分支名: "
    git push origin %branch%
) else (
    echo 无效选项，使用默认分支 main
    git push origin main
)

echo.
echo ========================================
echo 推送完成！
echo ========================================
pause

