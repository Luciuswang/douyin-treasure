const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken, createUserRateLimit } = require('../middleware/authSecure');

const router = express.Router();
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || '').trim();
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many AI requests. Please try again later.'
    }
});

const aiUserLimiter = createUserRateLimit(60 * 1000, 6);

function buildSystemPrompt(user) {
    return [
        'You are the in-app AI companion for Totofun, a real-world GPS treasure hunt game.',
        'Be friendly, concise, and practical.',
        'Help with gameplay, safety, onboarding, and general light conversation.',
        'Do not claim to see the real-time world unless the user explicitly provides that context.',
        'If the topic is medical, legal, or financial, encourage professional help.',
        `Current user: ${user.username || 'player'} (level ${user.level || 1}).`
    ].join('\n');
}

function normalizeContext(context) {
    if (!Array.isArray(context)) {
        return [];
    }

    return context
        .slice(-8)
        .filter((item) => item && typeof item.content === 'string')
        .map((item) => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: item.content.slice(0, 1000)
        }));
}

router.post('/chat', authenticateToken, aiLimiter, aiUserLimiter, async (req, res) => {
    try {
        if (!DEEPSEEK_API_KEY) {
            return res.status(503).json({
                success: false,
                message: 'AI service is not configured.',
                code: 'AI_NOT_CONFIGURED'
            });
        }

        const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required.'
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Message content is too long.'
            });
        }

        const contextMessages = normalizeContext(req.body.context);
        const messages = [
            {
                role: 'system',
                content: buildSystemPrompt(req.user)
            },
            ...contextMessages,
            {
                role: 'user',
                content: message
            }
        ];

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                max_tokens: 500,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('DeepSeek API request failed:', response.status, errorData);

            return res.status(response.status === 401 ? 502 : response.status).json({
                success: false,
                message: 'AI service is temporarily unavailable.',
                error: response.status === 401 ? 'Upstream credentials rejected.' : 'Upstream request failed.'
            });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return res.status(502).json({
                success: false,
                message: 'AI reply was empty.'
            });
        }

        return res.json({
            success: true,
            reply,
            usage: data.usage || {}
        });
    } catch (error) {
        console.error('AI route error:', error);
        return res.status(500).json({
            success: false,
            message: 'AI service failed to process the request.'
        });
    }
});

router.get('/status', (req, res) => {
    res.json({
        success: true,
        available: !!DEEPSEEK_API_KEY,
        message: DEEPSEEK_API_KEY ? 'AI service is configured.' : 'AI service is not configured.'
    });
});

module.exports = router;
