const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/users/profile
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        res.json({
            success: true,
            data: user.toSafeObject()
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * @route   GET /api/users/friends
 * @desc    获取用户好友列表
 * @access  Private
 */
router.get('/friends', async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await User.findById(userId).populate('friends.user', 'username avatar level');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        res.json({
            success: true,
            data: user.friends || []
        });
    } catch (error) {
        console.error('获取好友列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * @route   GET /api/users/conversations
 * @desc    获取用户会话列表
 * @access  Private
 */
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        res.json({
            success: true,
            data: user.conversations || []
        });
    } catch (error) {
        console.error('获取会话列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * @route   GET /api/users/all
 * @desc    获取所有用户列表（管理员专用）
 * @access  Private/Admin
 */
router.get('/all', requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        // 搜索条件
        const searchQuery = req.query.search || '';
        const query = {};
        
        if (searchQuery) {
            query.$or = [
                { username: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } }
            ];
        }
        
        // 获取总数
        const total = await User.countDocuments(query);
        
        // 获取用户列表（不包含密码）
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        // 转换为安全对象格式
        const safeUsers = users.map(user => {
            const userObj = user;
            // 确保密码字段不存在
            delete userObj.password;
            return {
                _id: userObj._id,
                id: userObj._id,
                username: userObj.username,
                email: userObj.email,
                avatar: userObj.avatar || '',
                bio: userObj.bio || '',
                role: userObj.role || 'user',
                level: userObj.level || { currentLevel: 1, experience: 0 },
                stats: userObj.stats || {},
                isActive: userObj.isActive !== false,
                isVerified: userObj.isVerified || false,
                isPremium: userObj.isPremium || false,
                createdAt: userObj.createdAt,
                lastLoginAt: userObj.lastLoginAt,
                lastActiveAt: userObj.lastActiveAt,
                loginCount: userObj.loginCount || 0
            };
        });
        
        res.json({
            success: true,
            data: {
                users: safeUsers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;

