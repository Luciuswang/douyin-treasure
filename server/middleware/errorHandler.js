/**
 * 全局错误处理中间件
 * 统一处理应用中的所有错误
 */

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // 记录错误日志
    console.error('🚨 错误详情:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
        timestamp: new Date().toISOString()
    });

    // Mongoose验证错误
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            statusCode: 400,
            message: `数据验证失败: ${message}`
        };
    }

    // Mongoose重复键错误
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        error = {
            statusCode: 409,
            message: `${field === 'email' ? '邮箱' : field === 'username' ? '用户名' : field} "${value}" 已存在`
        };
    }

    // Mongoose无效ObjectId错误
    if (err.name === 'CastError') {
        error = {
            statusCode: 404,
            message: '资源不存在'
        };
    }

    // JWT错误
    if (err.name === 'JsonWebTokenError') {
        error = {
            statusCode: 401,
            message: '无效的认证令牌'
        };
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            statusCode: 401,
            message: '认证令牌已过期',
            code: 'TOKEN_EXPIRED'
        };
    }

    // Multer文件上传错误
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = {
            statusCode: 413,
            message: '文件大小超出限制'
        };
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        error = {
            statusCode: 413,
            message: '文件数量超出限制'
        };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = {
            statusCode: 400,
            message: '不支持的文件字段'
        };
    }

    // MongoDB连接错误
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
        error = {
            statusCode: 503,
            message: '数据库连接失败，请稍后重试'
        };
    }

    // 权限错误
    if (err.message && err.message.includes('permission')) {
        error = {
            statusCode: 403,
            message: '权限不足'
        };
    }

    // 设置默认错误
    const statusCode = error.statusCode || 500;
    const message = error.message || '服务器内部错误';

    // 构建错误响应
    const errorResponse = {
        success: false,
        message: message,
        ...(error.code && { code: error.code }),
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err
        })
    };

    // 特殊状态码的额外信息
    if (statusCode === 401 && error.code === 'TOKEN_EXPIRED') {
        errorResponse.refreshRequired = true;
    }

    if (statusCode === 403 && error.code === 'PREMIUM_REQUIRED') {
        errorResponse.upgradeUrl = '/premium/upgrade';
    }

    if (statusCode === 403 && error.code === 'LEVEL_REQUIRED') {
        errorResponse.currentLevel = error.currentLevel;
        errorResponse.requiredLevel = error.requiredLevel;
    }

    // 发送错误响应
    res.status(statusCode).json(errorResponse);
};

/**
 * 404错误处理中间件
 * 处理未找到的路由
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`路由 ${req.originalUrl} 不存在`);
    error.statusCode = 404;
    next(error);
};

/**
 * 异步错误捕获包装器
 * 用于包装异步路由处理器，自动捕获Promise rejection
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 创建自定义错误
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 常用错误创建函数
 */
const createError = {
    badRequest: (message = '请求参数错误') => new AppError(message, 400),
    unauthorized: (message = '未授权访问') => new AppError(message, 401),
    forbidden: (message = '权限不足') => new AppError(message, 403),
    notFound: (message = '资源不存在') => new AppError(message, 404),
    conflict: (message = '资源冲突') => new AppError(message, 409),
    tooManyRequests: (message = '请求过于频繁') => new AppError(message, 429),
    internalServer: (message = '服务器内部错误') => new AppError(message, 500),
    serviceUnavailable: (message = '服务暂不可用') => new AppError(message, 503),
    
    // 业务特定错误
    tokenExpired: () => new AppError('认证令牌已过期', 401, 'TOKEN_EXPIRED'),
    premiumRequired: () => new AppError('此功能需要会员权限', 403, 'PREMIUM_REQUIRED'),
    levelRequired: (currentLevel, requiredLevel) => {
        const error = new AppError(`此功能需要${requiredLevel}级以上`, 403, 'LEVEL_REQUIRED');
        error.currentLevel = currentLevel;
        error.requiredLevel = requiredLevel;
        return error;
    },
    fileTooBig: (maxSize) => new AppError(`文件大小不能超过${maxSize}`, 413),
    invalidFileType: (allowedTypes) => new AppError(`只支持以下文件类型: ${allowedTypes.join(', ')}`, 400)
};

/**
 * 错误日志记录器
 * 可以扩展为写入文件或发送到日志服务
 */
const logError = (error, req = null) => {
    const logData = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
        code: error.code,
        ...(req && {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.userId
        })
    };

    // 根据错误级别选择不同的日志方法
    if (error.statusCode >= 500) {
        console.error('🚨 服务器错误:', logData);
    } else if (error.statusCode >= 400) {
        console.warn('⚠️ 客户端错误:', logData);
    } else {
        console.info('ℹ️ 信息:', logData);
    }

    // 在生产环境中，可以发送到外部日志服务
    if (process.env.NODE_ENV === 'production') {
        // 例如：发送到Sentry、LogRocket等
        // sentryClient.captureException(error);
    }
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    createError,
    logError
};

