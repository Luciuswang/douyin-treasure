const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authSecure');
const { getRequiredEnv, isFeatureEnabled, maskName } = require('../utils/runtime');
const { getLoginBlock } = require('../utils/accountStateSafe');

const router = express.Router();
const USERNAME_PATTERN = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;

const registerSchema = Joi.object({
    username: Joi.string().pattern(USERNAME_PATTERN).min(3).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    bio: Joi.string().max(200).allow('').optional(),
    interests: Joi.array().items(Joi.string()).max(10).optional(),
    applicationNote: Joi.string().max(300).allow('').optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
    username: Joi.string().pattern(USERNAME_PATTERN).min(3).max(20).optional(),
    bio: Joi.string().max(200).allow('').optional(),
    avatar: Joi.string().uri().allow('').optional(),
    interests: Joi.array().items(Joi.string()).max(10).optional(),
    location: Joi.object({
        city: Joi.string().allow('').optional(),
        district: Joi.string().allow('').optional()
    }).optional(),
    preferences: Joi.object({
        explorationRadius: Joi.number().min(500).max(50000).optional(),
        activeHours: Joi.array().items(
            Joi.string().valid('morning', 'afternoon', 'evening', 'night')
        ).optional(),
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

const identitySubmissionSchema = Joi.object({
    legalName: Joi.string().trim().min(2).max(50).required(),
    documentType: Joi.string().valid('id_card', 'passport', 'other').required(),
    idNumberLast4: Joi.string().trim().alphanum().min(4).max(8).required()
});

function isConfigError(error) {
    return / is not configured$/.test(error.message || '');
}

function sendConfigError(res, error) {
    return res.status(503).json({
        success: false,
        message: error.message,
        code: 'AUTH_CONFIG_MISSING'
    });
}

async function ensureMongoConnection() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    const mongoUri = (process.env.MONGODB_URI || '').trim();
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not configured');
    }

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000
        });
    }
}

function generateToken(userId) {
    return jwt.sign(
        { userId },
        getRequiredEnv('JWT_SECRET'),
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

function generateRefreshToken(userId) {
    return jwt.sign(
        { userId, type: 'refresh' },
        getRequiredEnv('JWT_REFRESH_SECRET'),
        { expiresIn: '30d' }
    );
}

function buildAuthPayload(user) {
    return {
        user: user.toSafeObject(),
        tokens: {
            accessToken: generateToken(user._id.toString()),
            refreshToken: generateRefreshToken(user._id.toString()),
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
    };
}

router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration data.',
                errors: error.details.map((detail) => detail.message)
            });
        }

        await ensureMongoConnection();

        const { username, email, password, bio, interests, applicationNote } = value;
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        }).maxTimeMS(25000);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email
                    ? 'Email is already registered.'
                    : 'Username is already in use.'
            });
        }

        const registrationRequiresApproval = isFeatureEnabled(
            'REQUIRE_REGISTRATION_APPROVAL',
            true
        );

        const user = new User({
            username,
            email,
            password,
            bio: bio || '',
            preferences: {
                interests: interests || []
            },
            level: {
                currentLevel: 1,
                experience: 0
            },
            loginCount: 0,
            registration: {
                status: registrationRequiresApproval ? 'pending' : 'approved',
                note: applicationNote || '',
                requestedAt: new Date()
            }
        });

        user.addBadge('Rookie Explorer', 'compass', 'Joined Totofun.');
        await user.save();

        if (registrationRequiresApproval) {
            return res.status(201).json({
                success: true,
                message: 'Registration request submitted. Login will be available after approval.',
                data: {
                    user: user.toSafeObject(),
                    requiresApproval: true,
                    registrationStatus: 'pending'
                }
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Registration successful.',
            data: buildAuthPayload(user)
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (isConfigError(error)) {
            return sendConfigError(res, error);
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid login data.',
                errors: error.details.map((detail) => detail.message)
            });
        }

        const { email, password } = value;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const loginBlock = getLoginBlock(user);
        if (loginBlock) {
            return res.status(loginBlock.status).json({
                success: false,
                message: loginBlock.message,
                code: loginBlock.code
            });
        }

        user.lastLoginAt = new Date();
        user.lastActiveAt = new Date();
        user.loginCount = (user.loginCount || 0) + 1;

        const userAgent = req.get('User-Agent') || '';
        user.deviceInfo = user.deviceInfo || {};
        if (/iPhone/i.test(userAgent)) {
            user.deviceInfo.platform = 'ios';
        } else if (/Mobile|Android/i.test(userAgent)) {
            user.deviceInfo.platform = 'android';
        } else {
            user.deviceInfo.platform = 'web';
        }

        await user.save();

        return res.json({
            success: true,
            message: 'Login successful.',
            data: buildAuthPayload(user)
        });
    } catch (error) {
        console.error('Login error:', error);
        if (isConfigError(error)) {
            return sendConfigError(res, error);
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = typeof req.body.refreshToken === 'string'
            ? req.body.refreshToken.trim()
            : '';

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required.'
            });
        }

        const decoded = jwt.verify(refreshToken, getRequiredEnv('JWT_REFRESH_SECRET'));
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token.'
            });
        }

        const user = await User.findById(decoded.userId);
        const loginBlock = getLoginBlock(user);
        if (loginBlock) {
            return res.status(loginBlock.status).json({
                success: false,
                message: loginBlock.message,
                code: loginBlock.code
            });
        }

        user.lastActiveAt = new Date();
        await user.save();

        return res.json({
            success: true,
            message: 'Token refreshed.',
            data: {
                accessToken: generateToken(user._id.toString()),
                expiresIn: process.env.JWT_EXPIRES_IN || '7d'
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        if (isConfigError(error)) {
            return sendConfigError(res, error);
        }

        return res.status(401).json({
            success: false,
            message: 'Refresh token is invalid or expired.'
        });
    }
});

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.userId, {
            lastActiveAt: new Date()
        });

        return res.json({
            success: true,
            message: 'Logout successful.'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate('following', 'username avatar level.currentLevel')
            .populate('followers', 'username avatar level.currentLevel');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        user.lastActiveAt = new Date();
        await user.save();

        return res.json({
            success: true,
            data: {
                user: user.toSafeObject()
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid profile data.',
                errors: error.details.map((detail) => detail.message)
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (value.username && value.username !== user.username) {
            const existingUser = await User.findOne({ username: value.username });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Username is already in use.'
                });
            }
        }

        Object.keys(value).forEach((key) => {
            if (['location', 'preferences', 'privacy', 'notifications'].includes(key)) {
                user[key] = { ...(user[key] || {}), ...value[key] };
            } else if (key === 'interests') {
                user.preferences = {
                    ...(user.preferences || {}),
                    interests: value.interests
                };
            } else {
                user[key] = value[key];
            }
        });

        user.lastActiveAt = new Date();
        await user.save();

        return res.json({
            success: true,
            message: 'Profile updated.',
            data: {
                user: user.toSafeObject()
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const currentPassword = typeof req.body.currentPassword === 'string'
            ? req.body.currentPassword
            : '';
        const newPassword = typeof req.body.newPassword === 'string'
            ? req.body.newPassword
            : '';

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required.'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long.'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect.'
            });
        }

        user.password = newPassword;
        await user.save();

        return res.json({
            success: true,
            message: 'Password changed successfully.'
        });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const password = typeof req.body.password === 'string' ? req.body.password : '';
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete the account.'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect.'
            });
        }

        const deletedAt = Date.now();
        user.isActive = false;
        user.email = `deleted_${deletedAt}_${user.email}`;
        user.username = `deleted_${deletedAt}_${user.username}`;
        await user.save();

        return res.json({
            success: true,
            message: 'Account deleted.'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.post('/identity/submit', authenticateToken, async (req, res) => {
    try {
        const { error, value } = identitySubmissionSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid identity verification data.',
                errors: error.details.map((detail) => detail.message)
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (user.identityVerification?.status === 'verified') {
            return res.status(400).json({
                success: false,
                message: 'Identity verification has already been completed.'
            });
        }

        const legalName = value.legalName.trim();
        const idNumberLast4 = value.idNumberLast4.trim().toUpperCase();

        user.identityVerification = {
            ...user.identityVerification,
            status: 'pending',
            legalName,
            maskedName: maskName(legalName),
            documentType: value.documentType,
            idNumberLast4,
            submittedAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            reviewNote: '',
            provider: 'manual_review'
        };

        user.commercial = user.commercial || {};
        if ((user.commercial.paymentStatus || 'disabled') === 'disabled') {
            user.commercial.paymentStatus = 'pending_review';
        }

        await user.save();

        return res.json({
            success: true,
            message: 'Identity verification request submitted.',
            data: {
                identityVerification: user.toSafeObject().identityVerification
            }
        });
    } catch (error) {
        console.error('Submit identity verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.get('/identity/status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.json({
            success: true,
            data: {
                identityVerification: user.toSafeObject().identityVerification
            }
        });
    } catch (error) {
        console.error('Get identity verification status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

module.exports = router;
