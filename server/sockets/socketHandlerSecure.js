const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRequiredEnv } = require('../utils/runtime');
const { getLoginBlock } = require('../utils/accountStateSafe');

async function socketAuth(socket, next) {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
        return next(new Error('Authentication token is required.'));
    }

    try {
        const decoded = jwt.verify(token, getRequiredEnv('JWT_SECRET'));
        const user = await User.findById(decoded.userId).select('isActive registration');
        const block = getLoginBlock(user);
        if (block) {
            return next(new Error(block.message));
        }

        socket.userId = decoded.userId;
        next();
    } catch (error) {
        if (error.message === 'JWT_SECRET is not configured') {
            return next(new Error('Authentication service is not configured.'));
        }
        next(new Error('Invalid authentication token.'));
    }
}

function socketHandler(io, socket) {
    console.log(`Socket connected: ${socket.id} (userId: ${socket.userId})`);

    socket.join(`user:${socket.userId}`);

    socket.on('join', (room) => {
        socket.join(room);
    });

    socket.on('leave', (room) => {
        socket.leave(room);
    });

    socket.on('chat:message', (data) => {
        if (!data.room) {
            return;
        }

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
        console.log(`Socket disconnected: ${socket.id}`);
    });
}

module.exports = {
    socketAuth,
    socketHandler
};
