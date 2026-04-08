#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "📦 拉取最新代码..."
git pull origin main

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
