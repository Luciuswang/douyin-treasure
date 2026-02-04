#!/bin/bash

# 🎯 Totofun 突突翻 - 腾讯云一键部署脚本
# 适用于 Ubuntu 22.04 / 20.04

set -e

echo "🎯 Totofun 突突翻 - 开始部署..."
echo "================================"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 配置变量
PROJECT_NAME="totofun"
PROJECT_PATH="/root/totofun"
PORT=3001
MONGO_DB="totofun-treasure"

# 1. 更新系统
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
apt update && apt upgrade -y

# 2. 安装 Node.js 20
echo -e "${YELLOW}[2/8] 安装 Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 3. 安装 MongoDB
echo -e "${YELLOW}[3/8] 安装 MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    # 导入 MongoDB GPG 密钥
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
        gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    
    # 添加 MongoDB 源
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    apt update
    apt install -y mongodb-org
    
    # 启动 MongoDB
    systemctl start mongod
    systemctl enable mongod
fi
echo "MongoDB 状态: $(systemctl is-active mongod)"

# 4. 安装 PM2
echo -e "${YELLOW}[4/8] 安装 PM2...${NC}"
npm install -g pm2

# 5. 克隆或更新项目
echo -e "${YELLOW}[5/8] 下载项目代码...${NC}"
if [ -d "$PROJECT_PATH" ]; then
    echo "更新已有代码..."
    cd $PROJECT_PATH
    git pull origin main
else
    echo "克隆代码..."
    git clone https://github.com/Luciuswang/douyin-treasure.git $PROJECT_PATH
    cd $PROJECT_PATH
fi

# 6. 安装依赖
echo -e "${YELLOW}[6/8] 安装项目依赖...${NC}"
cd $PROJECT_PATH
npm install

cd $PROJECT_PATH/server
npm install

# 7. 创建环境变量文件
echo -e "${YELLOW}[7/8] 配置环境变量...${NC}"
cat > $PROJECT_PATH/server/.env << EOF
# 环境配置
NODE_ENV=production
PORT=$PORT

# 数据库配置（本地 MongoDB）
MONGODB_URI=mongodb://localhost:27017/$MONGO_DB

# JWT密钥（自动生成）
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# 客户端地址
CLIENT_URL=http://1.15.11.140:$PORT

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=100MB
EOF

echo "✅ 环境变量已配置"

# 创建上传目录
mkdir -p $PROJECT_PATH/server/uploads

# 8. 启动服务
echo -e "${YELLOW}[8/8] 启动服务...${NC}"
cd $PROJECT_PATH/server
pm2 delete $PROJECT_NAME 2>/dev/null || true
pm2 start index.js --name $PROJECT_NAME
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 9. 配置防火墙
echo -e "${YELLOW}配置防火墙...${NC}"
ufw allow 22
ufw allow $PORT
ufw allow 27017  # MongoDB（仅本地访问）
echo "y" | ufw enable 2>/dev/null || true

# 获取公网IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "1.15.11.140")

echo ""
echo "================================"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "================================"
echo ""
echo "🎯 突突翻访问地址: http://${PUBLIC_IP}:${PORT}"
echo ""
echo "📱 把这个地址发给朋友，一起寻宝！"
echo ""
echo "当前服务状态："
echo "----------------------------------------"
pm2 status
echo "----------------------------------------"
echo ""
echo "常用命令："
echo "  pm2 status          - 查看所有服务状态"
echo "  pm2 logs $PROJECT_NAME  - 查看日志"
echo "  pm2 restart $PROJECT_NAME - 重启服务"
echo "  mongosh             - 连接 MongoDB"
echo ""
echo "🎯 祝你寻宝愉快！"
