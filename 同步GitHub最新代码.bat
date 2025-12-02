@echo off
chcp 65001 >nul
echo =========================================
echo 同步GitHub最新代码（以GitHub为准）
echo =========================================
echo.
echo ⚠️  警告：此操作会放弃本地未提交的更改！
echo.
echo 当前状态：
git status --short
echo.
echo.
set /p confirm="确定要以GitHub上的代码为准吗？(Y/N): "
if /i not "%confirm%"=="Y" (
    echo 操作已取消
    pause
    exit /b
)

echo.
echo [1] 获取GitHub最新信息...
git fetch origin
echo.

echo [2] 保存本地更改到临时位置（备份）...
git stash push -m "本地更改备份_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
echo.

echo [3] 重置到GitHub最新版本...
git reset --hard origin/main
echo.

echo [4] 清理未跟踪的文件...
git clean -fd
echo.

echo =========================================
echo ✅ 同步完成！
echo =========================================
echo.
echo 本地代码已与GitHub完全一致
echo.
echo 如果需要恢复之前的本地更改，可以运行：
echo   git stash list
echo   git stash pop
echo.
pause

