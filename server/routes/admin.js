const express = require('express');
const router = express.Router();
const Treasure = require('../models/Treasure');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

/**
 * GET /api/admin/review?page=1&limit=20
 */
router.get('/review', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [treasures, total] = await Promise.all([
            Treasure.find({ status: 'under_review' })
                .populate('creator', 'username email credit.score')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            Treasure.countDocuments({ status: 'under_review' })
        ]);

        res.json({
            success: true,
            data: treasures,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('获取审核列表错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/admin/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, totalTreasures, pendingReview, bannedTreasures] = await Promise.all([
            User.countDocuments(),
            Treasure.countDocuments(),
            Treasure.countDocuments({ status: 'under_review' }),
            Treasure.countDocuments({ status: 'banned' })
        ]);

        res.json({
            success: true,
            data: { totalUsers, totalTreasures, pendingReview, bannedTreasures }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/admin/review/:id/approve
 */
router.post('/review/:id/approve', async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }

        treasure.status = 'active';
        treasure.reportCount = 0;
        treasure.reports = [];
        await treasure.save();

        // 恢复发布者被预扣的 5 分
        await User.findByIdAndUpdate(treasure.creator, {
            $inc: { 'credit.score': 5 }
        });

        // 信用分上限校正
        await User.updateOne(
            { _id: treasure.creator, 'credit.score': { $gt: 100 } },
            { $set: { 'credit.score': 100 } }
        );

        res.json({ success: true, message: '已通过审核，宝藏恢复展示' });
    } catch (error) {
        console.error('审核通过错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/admin/review/:id/reject
 */
router.post('/review/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body;
        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({ success: false, message: '宝藏不存在' });
        }

        treasure.status = 'banned';
        await treasure.save();

        const isFraud = treasure.reports.some(r => ['fraud', 'misleading_info'].includes(r.reason));
        const penalty = isFraud ? -30 : -20;

        const user = await User.findById(treasure.creator);
        if (user) {
            user.credit.score = Math.max(0, (user.credit.score || 100) + penalty);
            user.credit.warnings.push({
                reason: reason || (isFraud ? '发布虚假/误导信息' : '宝藏审核未通过'),
                treasureId: treasure._id,
                at: new Date()
            });

            // 惩罚阶梯
            if (user.credit.score < 60 && user.credit.score >= 40) {
                user.credit.banUntil = new Date(Date.now() + 7 * 86400000);
                user.credit.banCount += 1;
            } else if (user.credit.score < 40) {
                user.credit.banUntil = new Date(Date.now() + 365 * 86400000);
                user.credit.banCount += 1;
            }

            await user.save();
        }

        res.json({
            success: true,
            message: `已驳回并封禁，发布者扣除 ${Math.abs(penalty)} 信用分`,
            data: { newScore: user?.credit.score }
        });
    } catch (error) {
        console.error('审核驳回错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/admin/users?page=1&limit=20&sort=credit
 */
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const sortField = req.query.sort === 'credit' ? { 'credit.score': 1 } : { createdAt: -1 };

        const [users, total] = await Promise.all([
            User.find({}, 'username email role credit stats level.currentLevel isActive createdAt')
                .sort(sortField)
                .skip(skip)
                .limit(limit),
            User.countDocuments()
        ]);

        res.json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/admin/users/:id/warn
 */
router.post('/users/:id/warn', async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        user.credit.score = Math.max(0, (user.credit.score || 100) - 10);
        user.credit.warnings.push({
            reason: reason || '管理员警告',
            at: new Date()
        });
        await user.save();

        res.json({
            success: true,
            message: `已警告，信用分 -10（当前 ${user.credit.score}）`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/admin/users/:id/ban
 */
router.post('/users/:id/ban', async (req, res) => {
    try {
        const { days, reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        const banDays = parseInt(days) || 7;
        user.credit.banUntil = new Date(Date.now() + banDays * 86400000);
        user.credit.banCount += 1;
        user.credit.score = Math.max(0, (user.credit.score || 100) - 30);
        user.credit.warnings.push({
            reason: reason || `管理员封禁 ${banDays} 天`,
            at: new Date()
        });
        await user.save();

        res.json({
            success: true,
            message: `已封禁 ${banDays} 天，信用分 -30（当前 ${user.credit.score}）`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/admin/users/:id/restore
 */
router.post('/users/:id/restore', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        user.credit.banUntil = null;
        user.credit.score = Math.min(100, (user.credit.score || 0) + 20);
        await user.save();

        res.json({
            success: true,
            message: `已解除封禁，信用分恢复到 ${user.credit.score}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;
