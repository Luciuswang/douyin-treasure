@echo off
chcp 65001 >nul
echo =========================================
echo 查看本地更改备份
echo =========================================
echo.
echo 已保存的本地更改：
git stash list
echo.
echo.
echo 如果需要恢复某个备份，使用：
echo   git stash pop stash@{0}    （恢复最新的备份）
echo   git stash show stash@{0}    （查看备份内容）
echo.
pause

