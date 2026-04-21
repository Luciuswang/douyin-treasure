const express = require('express');
const Treasure = require('../models/Treasure');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/authSecure');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

function jsonError(res, error, label) {
    console.error(label, error);
    return res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
}

async function findUserOr404(id, res) {
    const user = await User.findById(id);
    if (!user) {
        res.status(404).json({
            success: false,
            message: 'User not found.'
        });
        return null;
    }
    return user;
}

router.get('/review', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
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
        jsonError(res, error, 'Load review list failed:');
    }
});

router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            totalTreasures,
            pendingReview,
            bannedTreasures,
            pendingRegistrations,
            pendingIdentityVerifications,
            pendingMerchantApplications
        ] = await Promise.all([
            User.countDocuments(),
            Treasure.countDocuments(),
            Treasure.countDocuments({ status: 'under_review' }),
            Treasure.countDocuments({ status: 'banned' }),
            User.countDocuments({ 'registration.status': 'pending' }),
            User.countDocuments({ 'identityVerification.status': 'pending' }),
            User.countDocuments({ 'commercial.merchantApplication.status': 'pending' })
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalTreasures,
                pendingReview,
                bannedTreasures,
                pendingRegistrations,
                pendingIdentityVerifications,
                pendingMerchantApplications
            }
        });
    } catch (error) {
        jsonError(res, error, 'Load admin stats failed:');
    }
});

router.post('/review/:id/approve', async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({
                success: false,
                message: 'Treasure not found.'
            });
        }

        treasure.status = 'active';
        treasure.reportCount = 0;
        treasure.reports = [];
        await treasure.save();

        await User.findByIdAndUpdate(treasure.creator, {
            $inc: { 'credit.score': 5 }
        });

        await User.updateOne(
            { _id: treasure.creator, 'credit.score': { $gt: 100 } },
            { $set: { 'credit.score': 100 } }
        );

        res.json({
            success: true,
            message: 'Treasure review approved.'
        });
    } catch (error) {
        jsonError(res, error, 'Approve review failed:');
    }
});

router.post('/review/:id/reject', async (req, res) => {
    try {
        const treasure = await Treasure.findById(req.params.id);
        if (!treasure) {
            return res.status(404).json({
                success: false,
                message: 'Treasure not found.'
            });
        }

        treasure.status = 'banned';
        await treasure.save();

        const user = await User.findById(treasure.creator);
        if (user) {
            const isFraud = treasure.reports.some((report) =>
                ['fraud', 'misleading_info'].includes(report.reason)
            );
            const penalty = isFraud ? -30 : -20;

            user.credit.score = Math.max(0, (user.credit.score || 100) + penalty);
            user.credit.warnings.push({
                reason: req.body.reason || (isFraud ? 'Fraud or misleading content.' : 'Content review rejected.'),
                treasureId: treasure._id,
                at: new Date()
            });
            await user.save();
        }

        res.json({
            success: true,
            message: 'Treasure review rejected.'
        });
    } catch (error) {
        jsonError(res, error, 'Reject review failed:');
    }
});

router.get('/users', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
        const skip = (page - 1) * limit;
        const sortField = req.query.sort === 'credit'
            ? { 'credit.score': 1, createdAt: -1 }
            : { createdAt: -1 };

        const [users, total] = await Promise.all([
            User.find({}, 'username email role credit stats level.currentLevel isActive createdAt registration identityVerification commercial')
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
        jsonError(res, error, 'Load users failed:');
    }
});

router.post('/users/:id/warn', async (req, res) => {
    try {
        const user = await findUserOr404(req.params.id, res);
        if (!user) return;

        user.credit.score = Math.max(0, (user.credit.score || 100) - 10);
        user.credit.warnings.push({
            reason: req.body.reason || 'Admin warning',
            at: new Date()
        });
        await user.save();

        res.json({
            success: true,
            message: 'User warned successfully.'
        });
    } catch (error) {
        jsonError(res, error, 'Warn user failed:');
    }
});

router.post('/users/:id/ban', async (req, res) => {
    try {
        const user = await findUserOr404(req.params.id, res);
        if (!user) return;

        const banDays = parseInt(req.body.days, 10) || 7;
        user.credit.banUntil = new Date(Date.now() + banDays * 86400000);
        user.credit.banCount += 1;
        user.credit.score = Math.max(0, (user.credit.score || 100) - 30);
        user.credit.warnings.push({
            reason: req.body.reason || `Admin ban for ${banDays} days`,
            at: new Date()
        });
        await user.save();

        res.json({
            success: true,
            message: 'User banned successfully.'
        });
    } catch (error) {
        jsonError(res, error, 'Ban user failed:');
    }
});

router.post('/users/:id/restore', async (req, res) => {
    try {
        const user = await findUserOr404(req.params.id, res);
        if (!user) return;

        user.credit.banUntil = null;
        user.credit.score = Math.min(100, (user.credit.score || 0) + 20);
        await user.save();

        res.json({
            success: true,
            message: 'User restored successfully.'
        });
    } catch (error) {
        jsonError(res, error, 'Restore user failed:');
    }
});

router.get('/registrations', async (req, res) => {
    try {
        const status = req.query.status || 'pending';
        const users = await User.find(
            { 'registration.status': status },
            'username email createdAt registration identityVerification commercial level.currentLevel'
        )
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        jsonError(res, error, 'Load registration queue failed:');
    }
});

router.post('/registrations/:id/approve', async (req, res) => {
    try {
        const user = await findUserOr404(req.params.id, res);
        if (!user) return;

        user.set('registration.status', 'approved');
        user.set('registration.reviewedAt', new Date());
        user.set('registration.reviewedBy', req.user.userId);
        user.set('registration.note', req.body.note || user.registration?.note || '');
        await user.save();

        res.json({
            success: true,
            message: 'Registration approved.'
        });
    } catch (error) {
        jsonError(res, error, 'Approve registration failed:');
    }
});

router.post('/registrations/:id/reject', async (req, res) => {
    try {
        const user = await findUserOr404(req.params.id, res);
        if (!user) return;

        user.set('registration.status', 'rejected');
        user.set('registration.reviewedAt', new Date());
        user.set('registration.reviewedBy', req.user.userId);
        user.set('registration.note', req.body.note || 'Not approved for the current internal test scope.');
        await user.save();

        res.json({
            success: true,
            message: 'Registration rejected.'
        });
    } catch (error) {
        jsonError(res, error, 'Reject registration failed:');
    }
});

router.get('/identity', async (req, res) => {
    try {
        const status = req.query.status || 'pending';
        const users = await User.find(
            { 'identityVerification.status': status },
            'username email createdAt identityVerification registration commercial'
        )
            .sort({ 'identityVerification.submittedAt': -1, createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        jsonError(res, error, 'Load identity queue failed:');
    }
});

router.post('/identity/:id/approve', async (req, res) => {
    try {
        const user = await findUserOr404(req.params.id, res);
        if (!user) return;

        user.set('identityVerification.status', 'verified');
        user.set('identityVerification.reviewedAt', new Date());
        user.set('identityVerification.reviewedBy', req.user.userId);
        user.set('identityVerification.reviewNote', req.body.note || '');
        if ((user.commercial?.paymentStatus || 'disabled') === 'disabled') {
            user.set('commercial.paymentStatus', 'pending_review');
        }
        await user.save();

        res.json({
            success: true,
            message: 'Identity verification approved.'
        });
    } catch (error) {
        jsonError(res, error, 'Approve identity failed:');
    }
});

router.post('/identity/:id/reject', async (req, res) => {
    try {
        const user = await findUserOr404(req.params.id, res);
        if (!user) return;

        user.set('identityVerification.status', 'rejected');
        user.set('identityVerification.reviewedAt', new Date());
        user.set('identityVerification.reviewedBy', req.user.userId);
        user.set('identityVerification.reviewNote', req.body.note || 'Identity information does not pass review.');
        await user.save();

        res.json({
            success: true,
            message: 'Identity verification rejected.'
        });
    } catch (error) {
        jsonError(res, error, 'Reject identity failed:');
    }
});

router.get('/merchants', async (req, res) => {
    try {
        const status = req.query.status || 'pending';
        const users = await User.find(
            { 'commercial.merchantApplication.status': status },
            'username email createdAt identityVerification commercial registration'
        )
            .sort({ 'commercial.merchantApplication.submittedAt': -1, createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        jsonError(res, error, 'Load merchant queue failed:');
    }
});

router.post('/merchants/:id/approve', async (req, res) => {
    try {
        const user = await findUserOr404(req.params.id, res);
        if (!user) return;

        const identityStatus = user.identityVerification?.status || 'unverified';
        user.role = 'merchant';
        user.set('commercial.merchantApplication.status', 'approved');
        user.set('commercial.merchantApplication.reviewedAt', new Date());
        user.set('commercial.merchantApplication.reviewedBy', req.user.userId);
        user.set('commercial.merchantApplication.reviewNote', req.body.note || '');
        user.set('commercial.promotionEligible', true);
        user.set('commercial.paymentStatus', identityStatus === 'verified' ? 'enabled' : 'pending_review');
        await user.save();

        res.json({
            success: true,
            message: 'Merchant application approved.'
        });
    } catch (error) {
        jsonError(res, error, 'Approve merchant failed:');
    }
});

router.post('/merchants/:id/reject', async (req, res) => {
    try {
        const user = await findUserOr404(req.params.id, res);
        if (!user) return;

        if (user.role === 'merchant') {
            user.role = 'user';
        }
        user.set('commercial.merchantApplication.status', 'rejected');
        user.set('commercial.merchantApplication.reviewedAt', new Date());
        user.set('commercial.merchantApplication.reviewedBy', req.user.userId);
        user.set('commercial.merchantApplication.reviewNote', req.body.note || 'Merchant application not approved.');
        user.set('commercial.promotionEligible', false);
        user.set('commercial.paymentStatus', 'disabled');
        await user.save();

        res.json({
            success: true,
            message: 'Merchant application rejected.'
        });
    } catch (error) {
        jsonError(res, error, 'Reject merchant failed:');
    }
});

module.exports = router;
