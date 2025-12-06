// WebSocket处理器
// 处理实时通信功能

module.exports = (io, socket) => {
    console.log(`🔌 用户连接: ${socket.id}`);
    
    // 用户加入房间
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`用户 ${socket.id} 加入房间: ${room}`);
    });
    
    // 用户离开房间
    socket.on('leave', (room) => {
        socket.leave(room);
        console.log(`用户 ${socket.id} 离开房间: ${room}`);
    });
    
    // 断开连接
    socket.on('disconnect', () => {
        console.log(`🔌 用户断开连接: ${socket.id}`);
    });
    
    // 聊天消息
    socket.on('chat:message', (data) => {
        io.to(data.room).emit('chat:message', {
            ...data,
            timestamp: new Date().toISOString()
        });
    });
    
    // 宝藏发现通知
    socket.on('treasure:found', (data) => {
        io.emit('treasure:found', {
            ...data,
            timestamp: new Date().toISOString()
        });
    });
};

