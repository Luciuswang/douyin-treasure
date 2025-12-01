@echo off
chcp 65001 >nul
echo ========================================
echo 提交双聊天功能到 GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 检查 Git 状态...
git status

echo.
echo [2/4] 添加更改的文件...
git add totofun_treasure/lib/services/deepseek_service.dart
git add totofun_treasure/lib/providers/chat_provider.dart
git add totofun_treasure/lib/screens/chat/bot_chat_widget.dart
git add totofun_treasure/lib/screens/chat/friend_chat_widget.dart
git add totofun_treasure/lib/screens/chat/dual_chat_screen.dart
git add totofun_treasure/lib/screens/home_screen.dart
git add totofun_treasure/lib/screens/chat/friends_screen.dart
git add totofun_treasure/pubspec.yaml

echo.
echo [3/4] 提交更改...
git commit -m "feat: 添加双聊天界面 - 左下角机器人聊天，右下角好友聊天，集成DeepSeek API

- 创建 DeepSeek API 服务，支持 AI 聊天
- 扩展 ChatProvider，添加机器人聊天功能
- 创建机器人聊天组件（左下角，蓝色主题）
- 创建好友聊天组件（右下角，绿色主题）
- 创建双聊天界面，整合两个聊天组件
- 更新主界面和好友列表，集成双聊天功能"

echo.
echo [4/4] 检查远程仓库...
git remote -v

echo.
echo ========================================
echo 提交完成！
echo.
echo 如果已配置远程仓库，请运行以下命令推送：
echo   git push origin main
echo   或
echo   git push origin master
echo ========================================
pause

