const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authSecure');

const router = express.Router();

const merchantApplicationSchema = Joi.object({
    businessName: Joi.string().trim().min(2).max(80).required(),
    contactName: Joi.string().trim().min(2).max(50).required(),
    contactPhone: Joi.string().trim().min(6).max(30).required(),
    city: Joi.string().trim().min(2).max(50).required(),
    category: Joi.string().trim().min(2).max(50).required(),
    summary: Joi.string().trim().min(10).max(500).required()
});

function buildEligibility(user) {
    const identityStatus = user.identityVerification?.status || 'unverified';
    const merchantStatus = user.commercial?.merchantApplication?.status || 'not_submitted';
    const paymentStatus = user.commercial?.paymentStatus || 'disabled';

    return {
        identityVerified: identityStatus === 'verified',
        identityStatus,
        merchantStatus,
        paymentStatus,
        canReceivePayments: paymentStatus === 'enabled' && identityStatus === 'verified',
        needsIdentityVerification: identityStatus !== 'verified',
        needsMerchantApproval: merchantStatus !== 'approved'
    };
}

router.use(authenticateToken);

router.get('/status', async (req, res) => {
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
                commercial: user.toSafeObject().commercial,
                eligibility: buildEligibility(user)
            }
        });
    } catch (error) {
        console.error('Commercial status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.post('/apply', async (req, res) => {
    try {
        const { error, value } = merchantApplicationSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid merchant application data.',
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

        user.commercial = user.commercial || {};
        user.commercial.merchantApplication = {
            ...(user.commercial.merchantApplication || {}),
            ...value,
            status: 'pending',
            submittedAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            reviewNote: ''
        };

        if ((user.commercial.paymentStatus || 'disabled') === 'disabled') {
            user.commercial.paymentStatus = 'pending_review';
        }

        await user.save();

        return res.json({
            success: true,
            message: 'Merchant application submitted.',
            data: {
                commercial: user.toSafeObject().commercial,
                eligibility: buildEligibility(user)
            }
        });
    } catch (error) {
        console.error('Merchant application error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

module.exports = router;
