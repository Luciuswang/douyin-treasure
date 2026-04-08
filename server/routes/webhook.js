const express = require('express');
const crypto = require('crypto');
const { execFile } = require('child_process');
const path = require('path');
const router = express.Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

function verifySignature(req) {
    if (!WEBHOOK_SECRET) return true;
    const sig = req.headers['x-hub-signature-256'];
    if (!sig) return false;
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(JSON.stringify(req.body));
    const expected = 'sha256=' + hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

router.post('/deploy', (req, res) => {
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
        webhook: 'active',
        time: new Date().toISOString()
    });
});

module.exports = router;
