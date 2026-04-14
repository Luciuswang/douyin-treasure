const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const treasureRoutes = require('./routes/treasures');
const uploadRoutes = require('./routes/upload');
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { socketAuth, socketHandler } = require('./sockets/socketHandler');

const app = express();
app.set('trust proxy', true);

// HTTP + WebSocket
let server, io;
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    server = http.createServer(app);
    io = socketIo(server, {
        cors: {
            origin: [
                process.env.CLIENT_URL,
                'https://youkongwa.com',
                'http://youkongwa.com',
                'http://localhost:3000',
                'http://localhost:5173'
            ].filter(Boolean),
            methods: ['GET', 'POST']
        }
    });
}

// MongoDB
let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/totofun-treasure';
mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxPoolSize: 10,
    minPoolSize: 1
})
.then(async () => {
    console.log('✅ MongoDB 连接成功');
    // 清理所有旧的 2dsphere 索引（彻底移除地理索引，改用普通查询）
    try {
        const Treasure = require('./models/Treasure');
        const indexes = await Treasure.collection.indexes();
        for (const idx of indexes) {
            const keyStr = JSON.stringify(idx.key);
            if (keyStr.includes('2dsphere') || keyStr.includes('location')) {
                if (idx.name === '_id_') continue;
                console.log('🔧 清理旧索引:', idx.name, keyStr);
                try { await Treasure.collection.dropIndex(idx.name); } catch (e) { /* ignore */ }
            }
        }
        await Treasure.syncIndexes();
        console.log('✅ 索引同步完成');
    } catch (e) {
        console.warn('⚠️ 索引维护:', e.message);
    }
})
.catch(err => {
    console.error('❌ MongoDB 连接失败:', err.message);
    console.log('⚠️  服务器继续运行，数据库相关功能不可用');
});

// 中间件
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const allowed = [
            process.env.CLIENT_URL,
            'https://youkongwa.com',
            'http://youkongwa.com',
            'http://localhost:3000',
            'http://localhost:5173',
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0\.0\.1(:\d+)?$/
        ].filter(Boolean);
        const ok = allowed.some(a =>
            typeof a === 'string' ? origin === a : a.test(origin)
        );
        callback(ok || process.env.NODE_ENV !== 'production' ? null : new Error('CORS'), ok || process.env.NODE_ENV !== 'production');
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Webhook（不受 rate limiter 限制）
app.use('/api/webhook', require('./routes/webhook'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, ip: false }
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

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/treasures', optionalAuth, treasureRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 生产环境：托管 Vue 前端（client/dist）
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '..', 'client', 'dist');
    const fs = require('fs');
    if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('{*path}', (req, res, next) => {
            if (req.path.startsWith('/api/')) return next();
            const indexFile = path.join(distPath, 'index.html');
            if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
            next();
        });
        console.log('📂 前端静态文件已挂载:', distPath);
    } else {
        console.warn('⚠️ client/dist 不存在，前端未部署。请先运行 cd client && npm run build');
    }
}

// WebSocket（带认证）
if (io) {
    app.set('io', io);
    io.use(socketAuth);
    io.on('connection', (socket) => socketHandler(io, socket));
}

// 错误处理
app.use(errorHandler);

// 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: '接口不存在', path: req.originalUrl });
});

// 启动
if (!process.env.VERCEL && !process.env.VERCEL_ENV && server) {
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`🚀 Totofun 服务器运行在端口 ${PORT}`);
        console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
    });
}

if (server) {
    process.on('SIGTERM', () => {
        console.log('🛑 收到 SIGTERM，正在关闭...');
        server.close(() => {
            mongoose.connection.close(false).then(() => process.exit(0));
        });
    });
}

module.exports = app;
