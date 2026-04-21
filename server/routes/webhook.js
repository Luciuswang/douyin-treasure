const express = require('express');
const crypto = require('crypto');
const { execFile } = require('child_process');
const path = require('path');
const router = express.Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

router.use(express.json({
    limit: '1mb',
    verify: (req, _res, buffer) => {
        req.rawBody = buffer.toString('utf8');
    }
}));

function verifySignature(req) {
    if (!WEBHOOK_SECRET) return false;
    const sig = req.headers['x-hub-signature-256'];
    if (!sig || !req.rawBody) return false;
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(req.rawBody);
    const expected = Buffer.from(`sha256=${hmac.digest('hex')}`);
    const provided = Buffer.from(String(sig));
    if (expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(provided, expected);
}

router.post('/deploy', (req, res) => {
    if (!WEBHOOK_SECRET) {
        return res.status(503).json({ ok: false, error: 'Webhook secret not configured' });
    }
    if (!verifySignature(req)) {
        console.warn('⚠️ Webhook 签名验证失败');
        return res.status(403).json({ error: 'Invalid signature' });
    }

    const event = req.headers['x-github-event'];
    if (event !== 'push') {
        return res.json({ ok: true, skipped: true, reason: `event=${event}` });
    }

    const branch = (req.body.ref || '').replace('refs/heads/', '');
    if (branch !== 'main') {
        return res.json({ ok: true, skipped: true, reason: `branch=${branch}` });
    }

    console.log(`🚀 Webhook: 收到 push → main, 开始自动部署...`);
    res.json({ ok: true, message: 'Deploy started' });

    const projectRoot = path.resolve(__dirname, '..', '..');
    const script = path.join(projectRoot, 'deploy.sh');

    execFile('bash', [script], {
        cwd: projectRoot,
        timeout: 120000,
        env: { ...process.env, HOME: process.env.HOME || '/root' }
    }, (err, stdout, stderr) => {
        if (err) {
            console.error('❌ 部署失败:', err.message);
            console.error('stderr:', stderr);
        } else {
            console.log('✅ 自动部署完成');
            console.log(stdout);
        }
    });
});

router.get('/status', (req, res) => {
    res.json({
        ok: true,
        configured: !!WEBHOOK_SECRET,
        webhook: WEBHOOK_SECRET ? 'active' : 'disabled',
        version: '1.1',
        time: new Date().toISOString()
    });
});

module.exports = router;
