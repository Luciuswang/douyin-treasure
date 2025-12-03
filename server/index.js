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
const errorHandler = require('./middleware/errorHandler');

// 导入WebSocket处理器
const socketHandler = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/totofun-treasure', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 连接成功'))
.catch(err => {
    console.error('❌ MongoDB 连接失败:', err.message);
    console.log('⚠️  服务器将继续运行，但某些功能可能不可用');
    console.log('💡 提示：请确保MongoDB正在运行，或使用MongoDB Atlas云端数据库');
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
            "http://localhost:3000",
            "http://localhost:5000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5000",
            "http://localhost",
            "http://127.0.0.1",
            // 允许所有本地开发环境
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0\.0\.1(:\d+)?$/
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
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true
}));

// 限流
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: '请求过于频繁，请稍后再试'
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
app.use('/api/ai', require('./routes/ai')); // AI代理路由（不需要认证，但有限流保护）

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// WebSocket处理
io.on('connection', (socket) => {
    console.log(`🔌 用户连接: ${socket.id}`);
    socketHandler(io, socket);
});

// 错误处理中间件
app.use(errorHandler);

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Totofun 突突翻服务器运行在端口 ${PORT}`);
    console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 客户端地址: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

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

module.exports = { app, server, io };
