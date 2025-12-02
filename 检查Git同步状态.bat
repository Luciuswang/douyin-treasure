@echo off
chcp 65001 >nul
echo =========================================
echo Git本地与GitHub同步状态检查
echo =========================================
echo.

REM 检查Git仓库是否存在
if not exist .git (
    echo [错误] Git仓库未初始化！
    echo 请先运行: git init
    pause
    exit /b 1
)

echo [1] 检查远程仓库配置...
echo.
git remote -v
if errorlevel 1 (
    echo [警告] 未配置远程仓库
    echo 预期仓库: https://github.com/Luciuswang/douyin-treasure.git
    echo.
    echo 如需配置，运行:
    echo   git remote add origin https://github.com/Luciuswang/douyin-treasure.git
    echo.
)

echo.
echo [2] 当前分支信息...
echo.
git branch --show-current
echo.

echo [3] 本地提交历史（最近5条）...
echo.
git log --oneline -5
echo.

echo [4] 工作区状态...
echo.
git status --short
echo.

echo [5] 获取远程更新信息...
echo.
git fetch origin 2>&1
echo.

echo [6] 本地与远程分支对比...
echo.
git status -sb
echo.

echo [7] 检查本地是否有未推送的提交...
echo.
git log origin/main..HEAD --oneline 2>nul
if errorlevel 1 (
    git log origin/master..HEAD --oneline 2>nul
    if errorlevel 1 (
        echo 无法比较（可能远程分支不存在或未配置）
    )
)
echo.

echo [8] 检查远程是否有未拉取的提交...
echo.
git log HEAD..origin/main --oneline 2>nul
if errorlevel 1 (
    git log HEAD..origin/master --oneline 2>nul
    if errorlevel 1 (
        echo 无法比较（可能远程分支不存在或未配置）
    )
)
echo.

echo =========================================
echo 检查完成！
echo =========================================
echo.
echo 提示:
echo - 如果有未推送的提交，运行: 提交代码.bat
echo - 如果有未拉取的提交，运行: 更新代码.bat
echo.
pause

