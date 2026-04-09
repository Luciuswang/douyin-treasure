#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "📦 拉取最新代码..."
# 先尝试直连，失败则用代理
git pull origin main 2>/dev/null || {
    echo "⚠️ 直连 GitHub 失败，尝试代理..."
    ORIG_URL=$(git remote get-url origin)
    git remote set-url origin "https://ghfast.top/${ORIG_URL}"
    git pull origin main
    git remote set-url origin "${ORIG_URL}"
}

echo "📦 安装后端依赖..."
cd server
npm install --omit=dev
cd ..

echo "📦 安装前端依赖并构建..."
cd client
npm install
npm run build
cd ..

echo "🔄 重启服务..."
pm2 restart totofun

echo "✅ 部署完成 $(date)"
