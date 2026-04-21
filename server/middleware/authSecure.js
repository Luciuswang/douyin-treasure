const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRequiredEnv } = require('../utils/runtime');
const {
    getLoginBlock,
    getRegistrationStatus,
    getIdentityStatus
} = require('../utils/accountStateSafe');

function buildAuthUser(userId, user) {
    return {
        id: userId,
        userId,
        username: user.username,
        email: user.email,
        level: user.level?.currentLevel || 1,
        isPremium: !!user.isPremium,
        role: user.role || 'user',
        registrationStatus: getRegistrationStatus(user),
        identityStatus: getIdentityStatus(user)
    };
}

function sendAccountBlock(res, block) {
    return res.status(block.status).json({
        success: false,
        message: block.message,
        code: block.code
    });
}

function sendAuthConfigError(res) {
    return res.status(503).json({
        success: false,
        message: 'Authentication service is not configured.',
        code: 'AUTH_CONFIG_MISSING'
    });
}

function getBearerToken(req) {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return null;
    }
    return token;
}

async function resolveAuthenticatedUser(token) {
    const decoded = jwt.verify(token, getRequiredEnv('JWT_SECRET'));
    const user = await User.findById(decoded.userId);
    const block = getLoginBlock(user);
    if (block) {
        return { block };
    }

    return {
        decoded,
        user
    };
}

function touchLastActive(userId) {
    User.findByIdAndUpdate(userId, {
        lastActiveAt: new Date()
    }).catch((error) => {
        console.error('Failed to update last active time:', error);
    });
}

const authenticateToken = async (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token is required.'
        });
    }

    try {
        const result = await resolveAuthenticatedUser(token);
        if (result.block) {
            return sendAccountBlock(res, result.block);
        }

        req.user = buildAuthUser(result.decoded.userId, result.user);
        touchLastActive(result.decoded.userId);
        next();
    } catch (error) {
        if (error.message === 'JWT_SECRET is not configured') {
            return sendAuthConfigError(res);
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Authentication token has expired.',
                code: 'TOKEN_EXPIRED'
            });
        }

        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

const optionalAuth = async (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const result = await resolveAuthenticatedUser(token);
        if (result.block) {
            req.user = null;
            return next();
        }

        req.user = buildAuthUser(result.decoded.userId, result.user);
        touchLastActive(result.decoded.userId);
        next();
    } catch {
        req.user = null;
        next();
    }
};

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication is required.'
            });
        }

        const user = await User.findById(req.user.userId).select('role');
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access is required.'
            });
        }

        next();
    } catch (error) {
        console.error('Admin permission check failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

const requirePremium = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication is required.'
            });
        }

        const user = await User.findById(req.user.userId).select('isPremium premiumExpiresAt');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const isPremiumActive = user.isPremium &&
            (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

        if (!isPremiumActive) {
            return res.status(403).json({
                success: false,
                message: 'Premium membership is required.',
                code: 'PREMIUM_REQUIRED',
                upgradeUrl: '/premium/upgrade'
            });
        }

        next();
    } catch (error) {
        console.error('Premium permission check failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

const requireLevel = (minLevel) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication is required.'
                });
            }

            const user = await User.findById(req.user.userId).select('level.currentLevel');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found.'
                });
            }

            if ((user.level?.currentLevel || 0) < minLevel) {
                return res.status(403).json({
                    success: false,
                    message: `Level ${minLevel} or higher is required.`,
                    code: 'LEVEL_REQUIRED',
                    currentLevel: user.level?.currentLevel || 0,
                    requiredLevel: minLevel
                });
            }

            next();
        } catch (error) {
            console.error('Level permission check failed:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error.'
            });
        }
    };
};

const createUserRateLimit = (windowMs, maxRequests) => {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.userId;
        const now = Date.now();
        const windowStart = now - windowMs;
        const recentRequests = (requests.get(userId) || []).filter((time) => time > windowStart);

        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        recentRequests.push(now);
        requests.set(userId, recentRequests);
        next();
    };
};

const requireOwnership = (Model, resourceIdParam = 'id', ownerField = 'creator') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication is required.'
                });
            }

            const resource = await Model.findById(req.params[resourceIdParam]);
            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found.'
                });
            }

            if (String(resource[ownerField]) !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this resource.'
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            console.error('Ownership check failed:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error.'
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
