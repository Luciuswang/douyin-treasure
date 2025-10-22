const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 验证schemas
const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    bio: Joi.string().max(200).optional(),
    interests: Joi.array().items(Joi.string()).max(10).optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(20).optional(),
    bio: Joi.string().max(200).optional(),
    avatar: Joi.string().uri().optional(),
    interests: Joi.array().items(Joi.string()).max(10).optional(),
    location: Joi.object({
        city: Joi.string().optional(),
        district: Joi.string().optional()
    }).optional(),
    preferences: Joi.object({
        explorationRadius: Joi.number().min(500).max(50000).optional(),
        activeHours: Joi.array().items(Joi.string().valid('morning', 'afternoon', 'evening', 'night')).optional(),
        language: Joi.string().valid('zh-CN', 'en-US').optional()
    }).optional(),
    privacy: Joi.object({
        profileVisibility: Joi.string().valid('public', 'friends', 'private').optional(),
        locationSharing: Joi.boolean().optional(),
        allowMessages: Joi.string().valid('everyone', 'friends', 'none').optional()
    }).optional(),
    notifications: Joi.object({
        push: Joi.boolean().optional(),
        email: Joi.boolean().optional(),
        types: Joi.object({
            newFollower: Joi.boolean().optional(),
            treasureNearby: Joi.boolean().optional(),
            treasureDiscovered: Joi.boolean().optional(),
            systemUpdates: Joi.boolean().optional()
        }).optional()
    }).optional()
});

// 生成JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { userId: userId },
        process.env.JWT_SECRET || 'your_default_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// 生成刷新Token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId: userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key',
        { expiresIn: '30d' }
    );
};

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        // 验证输入数据
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: '输入数据验证失败',
                errors: error.details.map(detail => detail.message)
            });
        }

        const { username, email, password, bio, interests } = value;

        // 检查用户是否已存在
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用'
            });
        }

        // 创建新用户
        const newUser = new User({
            username,
            email,
            password, // 密码会在User模型的pre-save中间件中自动加密
            bio: bio || '',
            'preferences.interests': interests || [],
            'level.currentLevel': 1,
            'level.experience': 0,
            loginCount: 0
        });

        await newUser.save();

        // 生成tokens
        const accessToken = generateToken(newUser._id);
        const refreshToken = generateRefreshToken(newUser._id);

        // 添加新手徽章
        newUser.addBadge('新手探险者', '🎯', '欢迎加入 Totofun 突突翻探险之旅！');
        await newUser.save();

        // 返回用户信息（不包含密码）
        const userResponse = newUser.toSafeObject();

        res.status(201).json({
            success: true,
            message: '注册成功！欢迎加入 Totofun 突突翻！',
            data: {
                user: userResponse,
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
                }
            }
        });

        console.log(`🎉 新用户注册: ${username} (${email})`);

    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        // 验证输入数据
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: '输入数据验证失败',
                errors: error.details.map(detail => detail.message)
            });
        }

        const { email, password } = value;

        // 查找用户
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 检查账户状态
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: '账户已被禁用，请联系客服'
            });
        }

        // 验证密码
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 更新登录信息
        user.lastLoginAt = new Date();
        user.loginCount += 1;
        user.lastActiveAt = new Date();

        // 记录设备信息
        const userAgent = req.get('User-Agent') || '';
        if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
            user.deviceInfo.platform = userAgent.includes('iPhone') ? 'ios' : 'android';
        } else {
            user.deviceInfo.platform = 'web';
        }

        await user.save();

        // 生成tokens
        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // 返回用户信息
        const userResponse = user.toSafeObject();

        res.json({
            success: true,
            message: '登录成功！',
            data: {
                user: userResponse,
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
                }
            }
        });

        console.log(`🔐 用户登录: ${user.username} (${email})`);

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新访问令牌
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: '缺少刷新令牌'
            });
        }

        // 验证刷新令牌
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key');
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: '无效的刷新令牌'
            });
        }

        // 查找用户
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
        }

        // 生成新的访问令牌
        const newAccessToken = generateToken(user._id);

        res.json({
            success: true,
            message: '令牌刷新成功',
            data: {
                accessToken: newAccessToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '7d'
            }
        });

    } catch (error) {
        console.error('令牌刷新错误:', error);
        res.status(401).json({
            success: false,
            message: '刷新令牌无效或已过期'
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // 更新最后活跃时间
        await User.findByIdAndUpdate(req.user.userId, {
            lastActiveAt: new Date()
        });

        res.json({
            success: true,
            message: '登出成功'
        });

        console.log(`👋 用户登出: ${req.user.userId}`);

    } catch (error) {
        console.error('登出错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate('following', 'username avatar level.currentLevel')
            .populate('followers', 'username avatar level.currentLevel');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 更新最后活跃时间
        user.lastActiveAt = new Date();
        await user.save();

        const userResponse = user.toSafeObject();

        res.json({
            success: true,
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    更新用户资料
 * @access  Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        // 验证输入数据
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: '输入数据验证失败',
                errors: error.details.map(detail => detail.message)
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 检查用户名是否已被使用
        if (value.username && value.username !== user.username) {
            const existingUser = await User.findOne({ username: value.username });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '用户名已被使用'
                });
            }
        }

        // 更新用户信息
        Object.keys(value).forEach(key => {
            if (key === 'location' || key === 'preferences' || key === 'privacy' || key === 'notifications') {
                // 深度合并对象
                user[key] = { ...user[key], ...value[key] };
            } else {
                user[key] = value[key];
            }
        });

        user.lastActiveAt = new Date();
        await user.save();

        const userResponse = user.toSafeObject();

        res.json({
            success: true,
            message: '资料更新成功',
            data: {
                user: userResponse
            }
        });

        console.log(`📝 用户更新资料: ${user.username}`);

    } catch (error) {
        console.error('更新资料错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '请提供当前密码和新密码'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度至少6位'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证当前密码
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '当前密码错误'
            });
        }

        // 更新密码
        user.password = newPassword; // 会在pre-save中间件中自动加密
        await user.save();

        res.json({
            success: true,
            message: '密码修改成功'
        });

        console.log(`🔒 用户修改密码: ${user.username}`);

    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * @route   DELETE /api/auth/account
 * @desc    删除账户
 * @access  Private
 */
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: '请提供密码以确认删除账户'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证密码
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '密码错误'
            });
        }

        // 软删除：设置为非活跃状态
        user.isActive = false;
        user.email = `deleted_${Date.now()}_${user.email}`;
        user.username = `deleted_${Date.now()}_${user.username}`;
        await user.save();

        res.json({
            success: true,
            message: '账户已删除'
        });

        console.log(`🗑️ 用户删除账户: ${user.username}`);

    } catch (error) {
        console.error('删除账户错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router;

