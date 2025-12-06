@echo off
chcp 65001 >nul
cls

echo.
echo ════════════════════════════════════════════════════
echo    📤 推送AI聊天认证功能到GitHub
echo ════════════════════════════════════════════════════
echo.

echo [1] 检查Git状态...
git status --short
echo.

echo [2] 添加修改的文件...
git add server/routes/ai.js server/index.js index.html
echo.

echo [3] 提交更改...
git commit -m "feat: 添加AI聊天登录认证和监控功能

- 要求用户登录后才能使用AI聊天功能
- 添加聊天日志记录便于监控和管理
- 优化错误处理和用户提示
- 自动弹出登录模态框当用户未登录时"
echo.

echo [4] 推送到GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo 尝试推送到master分支...
    git push origin master
)

echo.
echo ════════════════════════════════════════════════════
echo    ✅ 推送完成！
echo ════════════════════════════════════════════════════
echo.
echo 📝 修改内容：
echo   - server/routes/ai.js: 添加认证中间件和聊天日志
echo   - server/index.js: 更新路由注释
echo   - index.html: 添加登录检查和错误处理
echo.
pause

