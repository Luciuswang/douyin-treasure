@echo off
chcp 65001 >nul
echo =========================================
echo 恢复本地更改
echo =========================================
echo.
echo 可用的备份：
git stash list
echo.
echo.
set /p stash_index="请输入要恢复的备份编号（如0表示最新的，直接回车恢复最新的）: "
if "%stash_index%"=="" set stash_index=0

echo.
echo 正在恢复备份 stash@{%stash_index%}...
git stash pop stash@{%stash_index%}
echo.
echo =========================================
echo 恢复完成！
echo =========================================
echo.
pause

