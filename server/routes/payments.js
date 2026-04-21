const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authSecure');
const { isFeatureEnabled } = require('../utils/runtime');

const router = express.Router();

function getPaymentCapabilities() {
    const enabled = isFeatureEnabled('PAYMENTS_ENABLED', false);

    return {
        enabled,
        mode: enabled ? 'internal_test' : 'disabled',
        provider: process.env.PAYMENT_PROVIDER || 'manual_review',
        supports: enabled
            ? ['offline_coupon', 'merchant_campaign', 'manual_order_review']
            : [],
        restrictions: [
            'Do not enable digital-goods charging before platform policy and local compliance review is complete.',
            'Real-name and merchant approval should be completed before enabling paid merchant features.',
            'Use this interface for internal testing only until production compliance is cleared.'
        ]
    };
}

router.get('/capabilities', (req, res) => {
    res.json({
        success: true,
        data: getPaymentCapabilities()
    });
});

router.use(authenticateToken);

router.get('/eligibility', async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const identityStatus = user.identityVerification?.status || 'unverified';
        const merchantStatus = user.commercial?.merchantApplication?.status || 'not_submitted';
        const paymentStatus = user.commercial?.paymentStatus || 'disabled';

        return res.json({
            success: true,
            data: {
                ...getPaymentCapabilities(),
                identityStatus,
                merchantStatus,
                paymentStatus,
                canCreateOrder: getPaymentCapabilities().enabled &&
                    identityStatus === 'verified' &&
                    merchantStatus === 'approved' &&
                    paymentStatus === 'enabled'
            }
        });
    } catch (error) {
        console.error('Payment eligibility error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

router.post('/intent', async (req, res) => {
    try {
        const capabilities = getPaymentCapabilities();
        if (!capabilities.enabled) {
            return res.status(503).json({
                success: false,
                message: 'Payments are not enabled for this project yet.',
                code: 'PAYMENTS_NOT_ENABLED',
                data: capabilities
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const identityStatus = user.identityVerification?.status || 'unverified';
        const merchantStatus = user.commercial?.merchantApplication?.status || 'not_submitted';
        const paymentStatus = user.commercial?.paymentStatus || 'disabled';

        if (identityStatus !== 'verified' || merchantStatus !== 'approved' || paymentStatus !== 'enabled') {
            return res.status(403).json({
                success: false,
                message: 'Merchant account is not cleared for payments.',
                code: 'PAYMENT_ELIGIBILITY_FAILED',
                data: {
                    identityStatus,
                    merchantStatus,
                    paymentStatus
                }
            });
        }

        const orderId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        return res.status(202).json({
            success: true,
            message: 'Payment intent placeholder created for internal testing.',
            data: {
                orderId,
                status: 'pending_manual_review',
                nextStep: 'Connect the real payment provider after compliance review.'
            }
        });
    } catch (error) {
        console.error('Payment intent error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

module.exports = router;
