const jwt = require('jsonwebtoken');

/**
 * Socket.IO 认证中间件（在 server/index.js 中挂载到 io.use）
 */
function socketAuth(socket, next) {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
        return next(new Error('缺少认证令牌'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
        socket.userId = decoded.userId;
        next();
    } catch (err) {
        next(new Error('认证令牌无效'));
    }
}

/**
 * Socket 事件处理器
 */
function socketHandler(io, socket) {
    console.log(`🔌 用户连接: ${socket.id} (userId: ${socket.userId})`);

    socket.join(`user:${socket.userId}`);

    socket.on('join', (room) => {
        socket.join(room);
    });

    socket.on('leave', (room) => {
        socket.leave(room);
    });

    socket.on('chat:message', (data) => {
        if (!data.room) return;
        io.to(data.room).emit('chat:message', {
            ...data,
            sender: socket.userId,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('treasure:found', (data) => {
        io.emit('treasure:found', {
            ...data,
            userId: socket.userId,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('disconnect', () => {
        console.log(`🔌 用户断开: ${socket.id}`);
    });
}

module.exports = { socketAuth, socketHandler };
