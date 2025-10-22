const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// 中间件
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '🚀 Totofun 突突翻服务器运行正常！',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// 测试认证接口（模拟数据）
app.post('/api/auth/test-register', (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: '请提供用户名、邮箱和密码'
        });
    }
    
    // 模拟成功注册
    res.status(201).json({
        success: true,
        message: '🎉 模拟注册成功！',
        data: {
            user: {
                id: 'test_user_' + Date.now(),
                username: username,
                email: email,
                level: 1,
                experience: 0,
                badges: ['🎯 新手探险者']
            },
            token: 'mock_jwt_token_' + Date.now()
        }
    });
});

app.post('/api/auth/test-login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: '请提供邮箱和密码'
        });
    }
    
    // 模拟成功登录
    res.json({
        success: true,
        message: '🔐 模拟登录成功！',
        data: {
            user: {
                id: 'test_user_123',
                username: '测试用户',
                email: email,
                level: 5,
                experience: 450,
                badges: ['🎯 新手探险者', '🗺️ 城市探索家']
            },
            token: 'mock_jwt_token_' + Date.now()
        }
    });
});

// 测试宝藏接口
app.get('/api/treasures/nearby', (req, res) => {
    const { lat, lng } = req.query;
    
    // 模拟附近宝藏数据
    const mockTreasures = [
        {
            id: 'treasure_1',
            title: '神秘咖啡厅',
            description: '在胡同深处发现一家隐藏的咖啡厅',
            creator: '探险达人',
            location: {
                lat: parseFloat(lat) + 0.001,
                lng: parseFloat(lng) + 0.001,
                address: '北京市东城区南锣鼓巷8号'
            },
            distance: 120,
            difficulty: 2,
            reward: 15,
            discoveredCount: 8
        },
        {
            id: 'treasure_2', 
            title: '屋顶花园',
            description: '商场顶楼的秘密花园',
            creator: '花园爱好者',
            location: {
                lat: parseFloat(lat) - 0.002,
                lng: parseFloat(lng) + 0.002,
                address: '北京市朝阳区三里屯SOHO'
            },
            distance: 340,
            difficulty: 3,
            reward: 25,
            discoveredCount: 3
        }
    ];
    
    res.json({
        success: true,
        message: '🗺️ 发现附近宝藏！',
        data: {
            treasures: mockTreasures,
            total: mockTreasures.length
        }
    });
});

// API文档
app.get('/api/docs', (req, res) => {
    res.json({
        title: '🎬 Totofun 突突翻 API 文档',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health - 健康检查',
            auth: {
                register: 'POST /api/auth/test-register - 模拟用户注册',
                login: 'POST /api/auth/test-login - 模拟用户登录'
            },
            treasures: {
                nearby: 'GET /api/treasures/nearby?lat=39.9&lng=116.4 - 获取附近宝藏'
            }
        },
        examples: {
            register: {
                method: 'POST',
                url: '/api/auth/test-register',
                body: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                }
            },
            login: {
                method: 'POST',
                url: '/api/auth/test-login',
                body: {
                    email: 'test@example.com',
                    password: 'password123'
                }
            }
        }
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '🔍 API接口不存在',
        suggestion: '访问 /api/docs 查看可用接口'
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Totofun 突突翻测试服务器启动成功！`);
    console.log(`🌐 服务器地址: http://localhost:${PORT}`);
    console.log(`📚 API文档: http://localhost:${PORT}/api/docs`);
    console.log(`🔧 健康检查: http://localhost:${PORT}/health`);
    console.log(`\n🎯 可以测试的接口:`);
    console.log(`   POST http://localhost:${PORT}/api/auth/test-register`);
    console.log(`   POST http://localhost:${PORT}/api/auth/test-login`);
    console.log(`   GET  http://localhost:${PORT}/api/treasures/nearby?lat=39.9&lng=116.4`);
});

module.exports = app;

