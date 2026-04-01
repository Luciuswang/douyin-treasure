const express = require('express');
const router = express.Router();
const Treasure = require('../models/Treasure');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/treasures/nearby?lat=&lng=&radius=&type=&category=
 * 查询附近宝藏
 */
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5000, type, category, limit = 50 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: '缺少经纬度参数 lat / lng' });
        }

        const treasures = await Treasure.findNearby(
            parseFloat(lat), parseFloat(lng), parseInt(radius),
            { type, category, limit: parseInt(limit) }
        );

        const safe = treasures.map(t => t.toSafeObject(req.user?.userId));
        res.json({ success: true, data: safe, count: safe.length });
    } catch (error) {
        console.error('查询附近宝藏错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/treasures/my
 * 我发布的宝藏
 */
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const treasures = await Treasure.find({ creator: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ success: true, data: treasures });
    } catch (error) {
        console.error('查询我的宝藏错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/treasures/discovered
 * 我发现的宝藏
 */
router.get('/discovered', authenticateToken, async (req, res) => {
    try {
        const treasures = await Treasure.find({
            'discoveredBy.user': req.user.userId
        })
            .populate('creator', 'username avatar')
            .sort({ 'discoveredBy.discoveredAt': -1 })
            .limit(100);

        res.json({ success: true, data: treasures });
    } catch (error) {
        console.error('查询已发现宝藏错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/treasures/:id
 * 获取单个宝藏详情
 */
router.get('/:id', async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id)
            .populate('creator', 'username avatar level.currentLevel');

        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }

        treasure.stats.views += 1;
        await treasure.save();

        res.json({ success: true, data: treasure.toSafeObject(req.user?.userId) });
    } catch (error) {
        console.error('获取宝藏详情错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/treasures
 * 创建宝藏
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            title, description, type, content, password,
            location, challenge, rewards, tags, category, settings
        } = req.body;

        if (!title || !location?.coordinates) {
            return res.status(400).json({
                success: false,
                message: '标题和位置坐标是必填项'
            });
        }

        const treasure = new Treasure({
            title,
            description: description || '',
            type: type || 'note',
            content: content || {},
            password: password || '',
            location: {
                coordinates: location.coordinates, // [lng, lat]
                address: location.address || '',
                city: location.city || '',
                district: location.district || '',
                landmark: location.landmark || '',
                discoveryRadius: location.discoveryRadius || 50
            },
            challenge: challenge || {},
            rewards: rewards || {},
            tags: tags || [],
            category: category || '其他',
            settings: settings || {},
            creator: req.user.userId
        });

        await treasure.save();

        // 更新用户的宝藏创建计数
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { 'stats.treasuresCreated': 1 }
        });

        res.status(201).json({ success: true, data: treasure });
    } catch (error) {
        console.error('创建宝藏错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * PUT /api/treasures/:id
 * 编辑宝藏（仅创建者）
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }
        if (treasure.creator.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: '无权编辑此宝藏' });
        }

        const allowed = [
            'title', 'description', 'type', 'content', 'password',
            'challenge', 'rewards', 'tags', 'category', 'settings', 'status'
        ];
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                treasure[key] = req.body[key];
            }
        }
        if (req.body.location) {
            Object.assign(treasure.location, req.body.location);
        }

        await treasure.save();
        res.json({ success: true, data: treasure });
    } catch (error) {
        console.error('编辑宝藏错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * DELETE /api/treasures/:id
 * 删除宝藏（仅创建者）
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }
        if (treasure.creator.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: '无权删除此宝藏' });
        }

        await Treasure.findByIdAndDelete(req.params.id);

        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { 'stats.treasuresCreated': -1 }
        });

        res.json({ success: true, message: '宝藏已删除' });
    } catch (error) {
        console.error('删除宝藏错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/treasures/:id/discover
 * 发现/领取宝藏（需要位置验证）
 */
router.post('/:id/discover', authenticateToken, async (req, res) => {
    try {
        const { lat, lng, password } = req.body;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: '缺少位置信息' });
        }

        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }

        // 密码校验
        if (treasure.password && treasure.password !== password) {
            return res.status(403).json({ success: false, message: '密码错误' });
        }

        // 距离 + 状态校验
        const check = treasure.canBeDiscoveredBy(req.user.userId, { lat: parseFloat(lat), lng: parseFloat(lng) });
        if (!check.canDiscover) {
            const messages = {
                already_discovered: '你已经发现过这个宝藏了',
                expired: '宝藏已过期',
                max_discoverers_reached: '发现人数已达上限',
                too_far: `距离太远（当前 ${Math.round(check.distance)}m，需要 ${check.requiredDistance}m 以内）`
            };
            return res.status(400).json({
                success: false,
                message: messages[check.reason] || '无法发现此宝藏',
                reason: check.reason
            });
        }

        await treasure.recordDiscovery(req.user.userId, req.body.rating);

        // 给发现者加经验
        const User = require('../models/User');
        const discoverer = await User.findById(req.user.userId);
        if (discoverer) {
            const levelResult = discoverer.addExperience(treasure.rewards.experience || 10);
            discoverer.stats.treasuresDiscovered += 1;
            await discoverer.save();

            return res.json({
                success: true,
                message: '恭喜发现宝藏！',
                data: {
                    treasure: treasure.toSafeObject(req.user.userId),
                    rewards: treasure.rewards,
                    levelUp: levelResult.levelUp || false,
                    newLevel: levelResult.newLevel
                }
            });
        }

        res.json({ success: true, message: '恭喜发现宝藏！', data: { treasure: treasure.toSafeObject(req.user.userId) } });
    } catch (error) {
        console.error('发现宝藏错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/treasures/:id/like
 * 点赞/取消点赞
 */
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }

        const result = treasure.toggleLike(req.user.userId);
        await treasure.save();

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('点赞错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;
