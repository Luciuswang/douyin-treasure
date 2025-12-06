@echo off
chcp 65001 >nul
cls

echo.
echo ════════════════════════════════════════════════════
echo    🔧 Totofun 后端服务器启动
echo ════════════════════════════════════════════════════
echo.
echo 📋 请确保已安装以下依赖：
echo    - express
echo    - mongoose
echo    - jsonwebtoken
echo    - bcryptjs
echo    - joi
echo    - cors
echo    - helmet
echo    - compression
echo    - express-rate-limit
echo    - socket.io
echo    - dotenv
echo.
echo 💡 如果未安装，请运行: npm install
echo.
echo 🚀 正在启动后端服务器（端口5000）...
echo.

cd server
node index.js

pause

