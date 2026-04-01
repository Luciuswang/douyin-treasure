const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * GET /api/users/profile
 * 获取当前用户信息
 */
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        res.json({ success: true, data: user.toSafeObject() });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * PUT /api/users/profile
 * 更新用户资料
 */
router.put('/profile', async (req, res) => {
    try {
        const { username, avatar, bio, preferences } = req.body;
        const update = {};
        if (username) update.username = username;
        if (avatar) update.avatar = avatar;
        if (bio !== undefined) update.bio = bio;
        if (preferences) update.preferences = preferences;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: update },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        res.json({ success: true, data: user.toSafeObject() });
    } catch (error) {
        console.error('更新用户资料错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/users/stats
 * 获取用户统计数据
 */
router.get('/stats', async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('stats level');
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        res.json({ success: true, data: { stats: user.stats, level: user.level } });
    } catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * PUT /api/users/location
 * 更新用户位置
 */
router.put('/location', async (req, res) => {
    try {
        const { coordinates, city, district } = req.body;
        const update = {};
        if (coordinates) update['location.coordinates'] = coordinates;
        if (city) update['location.city'] = city;
        if (district) update['location.district'] = district;

        await User.findByIdAndUpdate(req.user.userId, { $set: update });
        res.json({ success: true, message: '位置已更新' });
    } catch (error) {
        console.error('更新位置错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/users/:id/public
 * 查看其他用户的公开资料
 */
router.get('/:id/public', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('username avatar bio stats level.currentLevel level.badges privacy createdAt');

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        if (user.privacy?.profileVisibility === 'private') {
            return res.status(403).json({ success: false, message: '该用户资料不公开' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('查看用户资料错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;
