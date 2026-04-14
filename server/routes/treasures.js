const express = require('express');
const router = express.Router();
const Treasure = require('../models/Treasure');
const { authenticateToken } = require('../middleware/auth');
const { checkLocationSafety } = require('../utils/locationSafety');

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

        // 信用分前置检查
        const User = require('../models/User');
        const publisher = await User.findById(req.user.userId);
        if (publisher) {
            const credit = publisher.credit || { score: 100 };
            if (credit.banUntil && credit.banUntil > new Date()) {
                const remain = Math.ceil((credit.banUntil - Date.now()) / 86400000);
                return res.status(403).json({
                    success: false,
                    message: `账号限制发布中，还剩 ${remain} 天`,
                    code: 'CREDIT_BAN'
                });
            }
            if (credit.score < 40) {
                return res.status(403).json({
                    success: false,
                    message: '信用分过低（当前 ' + credit.score + ' 分），暂时无法发布宝藏',
                    code: 'CREDIT_LOW'
                });
            }
        }

        // 服务端位置安全校验（兜底）
        const [lng, lat] = location.coordinates;
        const safety = await checkLocationSafety(lng, lat);
        if (!safety.safe) {
            return res.status(400).json({
                success: false,
                message: safety.detail || '该位置可能存在安全风险，请换个位置发布',
                code: 'UNSAFE_LOCATION'
            });
        }

        const needsReview = publisher && (publisher.credit?.score || 100) < 80;

        const treasure = new Treasure({
            title,
            description: description || '',
            type: type || 'note',
            content: content || {},
            password: password || '',
            location: {
                coordinates: location.coordinates,
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
            status: needsReview ? 'under_review' : 'active',
            creator: req.user.userId
        });

        await treasure.save();

        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { 'stats.treasuresCreated': 1 }
        });

        res.status(201).json({
            success: true,
            data: treasure,
            message: needsReview ? '发布成功，因信用分不足需等待审核' : undefined
        });
    } catch (error) {
        console.error('创建宝藏错误:', error.message, error.stack);
        res.status(500).json({ success: false, message: '服务器错误: ' + error.message });
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

        if (['under_review', 'banned'].includes(treasure.status)) {
            return res.status(403).json({ success: false, message: '该宝藏正在审核或已被封禁，无法编辑' });
        }

        const hasDiscoveries = (treasure.stats?.discoveries || 0) > 0;

        let allowed = [
            'title', 'description', 'content', 'password',
            'challenge', 'rewards', 'tags', 'category', 'settings'
        ];

        if (!hasDiscoveries) {
            allowed.push('type', 'status');
        } else if (req.body.type && req.body.type !== treasure.type) {
            return res.status(403).json({ success: false, message: '已有人发现的宝藏不能修改类型' });
        }

        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                treasure[key] = req.body[key];
            }
        }

        if (req.body.location) {
            if (hasDiscoveries) {
                return res.status(403).json({ success: false, message: '已有人发现的宝藏不能修改位置' });
            }
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
 * POST /api/treasures/:id/report
 * 举报宝藏（需登录，同一用户对同一宝藏只能举报一次）
 */
router.post('/:id/report', authenticateToken, async (req, res) => {
    try {
        const { reason, detail } = req.body;
        const validReasons = ['dangerous_location', 'inappropriate_content', 'spam', 'fraud', 'misleading_info', 'expired_invalid', 'other'];

        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的举报原因',
                validReasons
            });
        }

        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }

        if (treasure.creator.toString() === req.user.userId) {
            return res.status(400).json({ success: false, message: '不能举报自己的宝藏' });
        }

        const result = await treasure.addReport(req.user.userId, reason, detail || '');

        if (!result.added) {
            return res.status(400).json({ success: false, message: '你已经举报过这个宝藏了' });
        }

        res.json({
            success: true,
            message: result.statusChanged ? '举报已收到，该宝藏已进入审核' : '举报已收到，感谢反馈',
            data: { reportCount: result.reportCount }
        });
    } catch (error) {
        console.error('举报宝藏错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/treasures/:id/interest
 * 表达"想认识"（社交宝藏）
 */
router.post('/:id/interest', authenticateToken, async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }
        if (treasure.type !== 'social') {
            return res.status(400).json({ success: false, message: '仅社交宝藏支持此操作' });
        }
        if (treasure.creator.toString() === req.user.userId) {
            return res.status(400).json({ success: false, message: '不能对自己的宝藏操作' });
        }

        const already = treasure.interestedBy.some(
            i => i.user.toString() === req.user.userId
        );
        if (already) {
            return res.status(400).json({ success: false, message: '你已经表达过兴趣了' });
        }

        treasure.interestedBy.push({ user: req.user.userId, createdAt: new Date() });
        await treasure.save();

        // Socket 通知创建者
        const io = req.app.get('io');
        if (io) {
            const User = require('../models/User');
            const interestUser = await User.findById(req.user.userId, 'username avatar');
            io.to(`user:${treasure.creator}`).emit('social:interest', {
                treasureId: treasure._id,
                treasureTitle: treasure.title,
                user: { id: req.user.userId, username: interestUser?.username || '某人' },
                message: `${interestUser?.username || '有人'}对你的缘分宝藏感兴趣！`
            });
        }

        res.json({ success: true, message: '已发送，等待对方回应' });
    } catch (error) {
        console.error('表达兴趣错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/treasures/:id/interest/:userId/accept
 * 创建者接受匹配（双向达成）
 */
router.post('/:id/interest/:userId/accept', authenticateToken, async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }
        if (treasure.type !== 'social') {
            return res.status(400).json({ success: false, message: '仅社交宝藏支持此操作' });
        }
        if (treasure.creator.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: '仅创建者可接受匹配' });
        }

        const targetUserId = req.params.userId;
        const hasInterest = treasure.interestedBy.some(
            i => i.user.toString() === targetUserId
        );
        if (!hasInterest) {
            return res.status(400).json({ success: false, message: '该用户未表达兴趣' });
        }

        const alreadyMatched = treasure.matches.some(
            m => m.users.some(u => u.toString() === targetUserId)
        );
        if (alreadyMatched) {
            return res.status(400).json({ success: false, message: '已经匹配过了' });
        }

        treasure.matches.push({
            users: [req.user.userId, targetUserId],
            matchedAt: new Date()
        });
        await treasure.save();

        // Socket 通知双方匹配成功
        const io = req.app.get('io');
        if (io) {
            const User = require('../models/User');
            const [creator, target] = await Promise.all([
                User.findById(req.user.userId, 'username avatar'),
                User.findById(targetUserId, 'username avatar')
            ]);

            const contact = treasure.content?.contact || '';

            io.to(`user:${targetUserId}`).emit('social:match', {
                treasureId: treasure._id,
                matchedUser: { id: req.user.userId, username: creator?.username },
                contact,
                message: `恭喜！你和 ${creator?.username} 双向匹配成功！`
            });

            io.to(`user:${req.user.userId}`).emit('social:match', {
                treasureId: treasure._id,
                matchedUser: { id: targetUserId, username: target?.username },
                message: `恭喜！你和 ${target?.username} 双向匹配成功！`
            });
        }

        res.json({ success: true, message: '匹配成功！双方可以查看联系方式了' });
    } catch (error) {
        console.error('接受匹配错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/treasures/:id/interests
 * 创建者查看谁对自己的宝藏感兴趣
 */
router.get('/:id/interests', authenticateToken, async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id)
            .populate('interestedBy.user', 'username avatar bio preferences.interests level.currentLevel');

        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }
        if (treasure.creator.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: '仅创建者可查看' });
        }

        const matchedUserIds = new Set(
            treasure.matches.flatMap(m => m.users.map(u => u.toString()))
        );

        const interests = treasure.interestedBy.map(i => {
            const u = i.user;
            return {
                userId: u._id,
                username: u.username,
                avatar: u.avatar,
                bio: u.bio,
                interests: u.preferences?.interests || [],
                level: u.level?.currentLevel || 1,
                interestedAt: i.createdAt,
                isMatched: matchedUserIds.has(u._id.toString())
            };
        });

        res.json({ success: true, data: interests });
    } catch (error) {
        console.error('查看兴趣列表错误:', error);
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
