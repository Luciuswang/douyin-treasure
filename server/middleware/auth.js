const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT认证中间件
 * 验证请求头中的Bearer token
 */
const authenticateToken = async (req, res, next) => {
    try {
        // 从请求头获取token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问被拒绝，缺少认证令牌'
            });
        }

        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
        
        // 检查用户是否存在且活跃
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: '无效的认证令牌或用户不存在'
            });
        }

        // 将用户信息添加到请求对象
        req.user = {
            userId: decoded.userId,
            username: user.username,
            email: user.email,
            level: user.level.currentLevel,
            isPremium: user.isPremium
        };

        // 更新用户最后活跃时间（异步，不阻塞请求）
        User.findByIdAndUpdate(decoded.userId, { 
            lastActiveAt: new Date() 
        }).catch(err => console.error('更新活跃时间失败:', err));

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的认证令牌'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '认证令牌已过期',
                code: 'TOKEN_EXPIRED'
            });
        }

        console.error('认证中间件错误:', error);
        return res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 可选认证中间件
 * 如果有token则验证，没有则继续执行
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
        const user = await User.findById(decoded.userId);

        if (user && user.isActive) {
            req.user = {
                userId: decoded.userId,
                username: user.username,
                email: user.email,
                level: user.level.currentLevel,
                isPremium: user.isPremium
            };

            // 更新活跃时间
            User.findByIdAndUpdate(decoded.userId, { 
                lastActiveAt: new Date() 
            }).catch(err => console.error('更新活跃时间失败:', err));
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        // 可选认证失败时不返回错误，继续执行
        req.user = null;
        next();
    }
};

/**
 * 管理员权限中间件
 * 需要先通过authenticateToken中间件
 */
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '需要认证'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '需要管理员权限'
            });
        }

        next();

    } catch (error) {
        console.error('管理员权限检查错误:', error);
        return res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 会员权限中间件
 * 检查用户是否为付费会员
 */
const requirePremium = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '需要认证'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 检查会员状态
        const isPremiumActive = user.isPremium && 
            (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

        if (!isPremiumActive) {
            return res.status(403).json({
                success: false,
                message: '此功能需要会员权限',
                code: 'PREMIUM_REQUIRED',
                upgradeUrl: '/premium/upgrade'
            });
        }

        next();

    } catch (error) {
        console.error('会员权限检查错误:', error);
        return res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 等级限制中间件
 * 检查用户等级是否满足要求
 */
const requireLevel = (minLevel) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '需要认证'
                });
            }

            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            if (user.level.currentLevel < minLevel) {
                return res.status(403).json({
                    success: false,
                    message: `此功能需要${minLevel}级以上`,
                    code: 'LEVEL_REQUIRED',
                    currentLevel: user.level.currentLevel,
                    requiredLevel: minLevel
                });
            }

            next();

        } catch (error) {
            console.error('等级检查错误:', error);
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
    };
};

/**
 * 频率限制中间件
 * 基于用户ID的请求频率限制
 */
const createUserRateLimit = (windowMs, maxRequests) => {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.userId;
        const now = Date.now();
        const windowStart = now - windowMs;

        // 清理过期记录
        if (requests.has(userId)) {
            const userRequests = requests.get(userId);
            const validRequests = userRequests.filter(time => time > windowStart);
            requests.set(userId, validRequests);
        }

        // 检查请求数量
        const userRequests = requests.get(userId) || [];
        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: '请求过于频繁，请稍后再试',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // 记录本次请求
        userRequests.push(now);
        requests.set(userId, userRequests);

        next();
    };
};

/**
 * 验证用户拥有资源的权限
 * 用于检查用户是否可以访问/修改特定资源
 */
const requireOwnership = (Model, resourceIdParam = 'id', ownerField = 'creator') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '需要认证'
                });
            }

            const resourceId = req.params[resourceIdParam];
            const resource = await Model.findById(resourceId);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: '资源不存在'
                });
            }

            // 检查所有权
            const ownerId = resource[ownerField];
            if (ownerId.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: '无权访问此资源'
                });
            }

            // 将资源添加到请求对象，避免重复查询
            req.resource = resource;
            next();

        } catch (error) {
            console.error('所有权检查错误:', error);
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireAdmin,
    requirePremium,
    requireLevel,
    createUserRateLimit,
    requireOwnership
};

