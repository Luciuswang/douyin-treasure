@echo off
chcp 65001 >nul
echo ========================================
echo 提交并推送机器人聊天功能
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] 检查 Git 状态...
git status
echo.

echo [2/5] 添加 index.html 文件...
git add index.html
echo.

echo [3/5] 检查暂存区文件...
git diff --cached --name-only
echo.

echo [4/5] 提交更改...
git commit -m "feat: 将AI机器人从好友列表分离，添加左下角独立机器人聊天窗口

- 从好友列表中排除机器人（filter friend.isBot）
- 在页面左下角添加独立的机器人聊天窗口
- 添加机器人聊天相关功能函数（toggleBotChat, sendBotMessage, updateBotChatMessages）
- 添加移动端响应式适配
- 机器人聊天窗口默认显示，蓝色主题，易于识别"
echo.

echo [5/5] 检查远程仓库和分支...
git remote -v
git branch --show-current
echo.

echo ========================================
echo 提交完成！
echo.
echo 如果使用 GitHub Desktop：
echo   1. 打开 GitHub Desktop
echo   2. 查看 Changes 标签，确认 index.html 已提交
echo   3. 点击 "Push origin" 按钮推送到 GitHub
echo.
echo 如果使用命令行推送：
echo   git push origin main
echo   或
echo   git push origin master
echo ========================================
pause


