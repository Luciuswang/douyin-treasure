const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入路由和中间件
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const treasureRoutes = require('./routes/treasures');
const uploadRoutes = require('./routes/upload');
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// 导入WebSocket处理器
const socketHandler = require('./sockets/socketHandler');

const app = express();

// 在 Vercel 等 Serverless 环境中，需要信任代理以正确获取客户端 IP
// 这对于 express-rate-limit 等中间件很重要
// 直接启用 trust proxy，因为 Vercel 总是使用代理
app.set('trust proxy', true);

// 在Serverless环境中，不需要HTTP服务器和WebSocket
let server, io;
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    server = http.createServer(app);
    io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });
}

// 数据库连接
// 注意：Mongoose 6+ 不再需要 useNewUrlParser 和 useUnifiedTopology
// Serverless环境需要更长的超时时间
const mongooseOptions = {
    serverSelectionTimeoutMS: 30000, // 30秒超时（Serverless环境需要更长时间）
    socketTimeoutMS: 45000, // 45秒socket超时
    connectTimeoutMS: 30000, // 30秒连接超时
    maxPoolSize: 10, // 连接池大小
    minPoolSize: 1, // 最小连接数
    // 注意：Mongoose 9+ 已移除 bufferMaxEntries 和 bufferCommands 选项
};

// 在连接字符串中添加超时参数（确保生效）
let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/totofun-treasure';

// 调试：检查连接字符串格式
if (mongoUri) {
    console.log('📋 MongoDB URI 长度:', mongoUri.length);
    console.log('📋 MongoDB URI 开头:', mongoUri.substring(0, 20));
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
        console.error('❌ MongoDB URI 格式错误:', mongoUri.substring(0, 50));
    }
}

if (mongoUri && !mongoUri.includes('serverSelectionTimeoutMS')) {
    // 如果URI中没有超时参数，添加它们
    const separator = mongoUri.includes('?') ? '&' : '?';
    mongoUri = `${mongoUri}${separator}serverSelectionTimeoutMS=30000&socketTimeoutMS=45000&connectTimeoutMS=30000`;
}

mongoose.connect(mongoUri, mongooseOptions)
.then(() => {
    console.log('✅ MongoDB 连接成功');
    console.log('📊 MongoDB连接状态:', mongoose.connection.readyState);
})
.catch(err => {
    console.error('❌ MongoDB 连接失败:', err.message);
    console.error('❌ 连接错误详情:', err);
    console.log('⚠️  服务器将继续运行，但某些功能可能不可用');
    console.log('💡 提示：请确保MongoDB正在运行，或使用MongoDB Atlas云端数据库');
    console.log('💡 检查：MongoDB Atlas的IP白名单是否包含 0.0.0.0/0');
});

// 中间件
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:", "wss:"],
        },
    },
}));

app.use(compression());

app.use(cors({
    origin: function (origin, callback) {
        // 允许的源列表
        const allowedOrigins = [
            process.env.CLIENT_URL,
            "https://luciuswang.github.io",
            "http://localhost:3000",
            "http://localhost:5000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5000",
            "http://localhost",
            "http://127.0.0.1",
            // 允许所有本地开发环境
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0\.0\.1(:\d+)?$/,
            // 允许GitHub Pages域名（包括子路径）
            /^https:\/\/.*\.github\.io$/
        ].filter(Boolean);
        
        // 如果没有origin（比如Postman或移动应用），允许
        if (!origin) {
            return callback(null, true);
        }
        
        // 检查是否在允许列表中
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return origin === allowed;
            } else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            // 开发环境允许所有来源
            if (process.env.NODE_ENV !== 'production') {
                callback(null, true);
            } else {
                // 生产环境也允许GitHub Pages（更宽松的策略）
                if (/^https:\/\/.*\.github\.io/.test(origin)) {
                    callback(null, true);
                } else {
                    console.warn(`⚠️  CORS blocked origin: ${origin}`);
                    callback(new Error('Not allowed by CORS'));
                }
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 限流
// 在 Vercel 环境中，使用标准化的 keyGenerator 来处理代理头
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: '请求过于频繁，请稍后再试',
    // 在 Serverless 环境中正确处理代理头
    standardHeaders: true,
    legacyHeaders: false,
    // 使用自定义 keyGenerator 来处理 Forwarded 头
    keyGenerator: (req) => {
        // 优先使用 X-Forwarded-For（Vercel 会设置）
        return req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.ip || 
               req.socket.remoteAddress || 
               'unknown';
    }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/treasures', authenticateToken, treasureRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/ai', require('./routes/ai')); // AI代理路由（需要登录认证，有限流保护）

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// WebSocket处理（仅在非Serverless环境中）
if (io) {
    io.on('connection', (socket) => {
        console.log(`🔌 用户连接: ${socket.id}`);
        socketHandler(io, socket);
    });
}

// 错误处理中间件
app.use(errorHandler);

// 404处理（必须在所有路由之后）
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在',
        path: req.originalUrl
    });
});

// 仅在非Serverless环境中启动HTTP服务器
if (!process.env.VERCEL && !process.env.VERCEL_ENV && server) {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🚀 Totofun 突突翻服务器运行在端口 ${PORT}`);
        console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📱 客户端地址: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
}

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🛑 收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB连接已关闭');
            process.exit(0);
        });
    });
});

// 导出app供Serverless函数使用
// Vercel Serverless环境 - 直接导出app
module.exports = app;
