const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * @route   GET /api/users/profile
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
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
        const user = await User.findById(req.user.id).populate('friends.user', 'username avatar level');
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
        const user = await User.findById(req.user.id);
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

module.exports = router;

