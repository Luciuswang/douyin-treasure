@echo off
chcp 65001 >nul
echo =========================================
echo 推送聊天窗口修复到GitHub
echo =========================================
echo.

echo [1] 检查Git状态...
git status --short
echo.

echo [2] 添加修改的文件...
git add index.html
echo.

echo [3] 提交更改...
git commit -m "fix: 修复聊天窗口问题 - 默认隐藏，点击打开，支持移动端关闭"
echo.

echo [4] 推送到GitHub...
git push origin main
echo.

echo =========================================
echo 推送完成！
echo =========================================
echo.
echo 请在手机上访问GitHub Pages测试：
echo https://luciuswang.github.io/douyin-treasure/
echo.
pause

