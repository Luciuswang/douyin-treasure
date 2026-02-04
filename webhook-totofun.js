/**
 * GitHub Webhook 自动部署服务 - Totofun 突突翻
 * 当 GitHub 收到 push 时自动拉取代码并重启服务
 */

const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');

// 配置
const WEBHOOK_PORT = 9001;  // 不同于麻将的 9000
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'totofun-auto-deploy-2024';
const PROJECT_PATH = '/root/totofun';
const PM2_APP_NAME = 'totofun';

// 验证 GitHub 签名
function verifySignature(payload, signature) {
    if (!signature) return false;
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
        return false;
    }
}

// 执行部署
function deploy() {
    console.log('🚀 开始部署 Totofun...');
    
    const commands = `
        cd ${PROJECT_PATH} && 
        git fetch origin main &&
        git reset --hard origin/main &&
        npm install &&
        cd server && npm install &&
        pm2 restart ${PM2_APP_NAME}
    `;
    
    exec(commands, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ 部署失败:', error.message);
            console.error(stderr);
            return;
        }
        console.log('✅ Totofun 部署成功！');
        console.log(stdout);
    });
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            // 验证签名（可选）
            const signature = req.headers['x-hub-signature-256'];
            
            if (WEBHOOK_SECRET && WEBHOOK_SECRET !== 'totofun-auto-deploy-2024') {
                if (!verifySignature(body, signature)) {
                    console.log('⚠️ 签名验证失败');
                    res.writeHead(401);
                    res.end('Unauthorized');
                    return;
                }
            }
            
            try {
                const payload = JSON.parse(body);
                
                // 只处理 main 分支的 push
                if (payload.ref === 'refs/heads/main') {
                    console.log(`📦 收到推送: ${payload.head_commit?.message || 'unknown'}`);
                    deploy();
                    res.writeHead(200);
                    res.end('OK - Deploying Totofun');
                } else {
                    console.log(`⏭️ 跳过非 main 分支: ${payload.ref}`);
                    res.writeHead(200);
                    res.end('OK - Skipped');
                }
            } catch (e) {
                console.error('❌ 解析失败:', e.message);
                res.writeHead(400);
                res.end('Bad Request');
            }
        });
    } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200);
        res.end('Totofun webhook server is running');
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(WEBHOOK_PORT, () => {
    console.log(`🎣 Totofun Webhook 服务已启动，监听端口 ${WEBHOOK_PORT}`);
    console.log(`📍 Webhook URL: http://YOUR_SERVER_IP:${WEBHOOK_PORT}/webhook`);
});
