const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// DeepSeek API配置（从环境变量读取，不暴露给前端）
// 如果环境变量未设置，使用默认API key（仅用于开发/测试）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-d16822cef3994518bdd4977401edd3ec';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// AI API限流（防止滥用）
const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1分钟
    max: 10, // 每分钟最多10次请求
    message: 'AI请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * POST /api/ai/chat
 * DeepSeek AI聊天接口（代理）
 * 安全：API Key在后端，不暴露给前端
 * 需要用户登录认证
 */
router.post('/chat', authenticateToken, aiLimiter, async (req, res) => {
    try {
        // 检查是否配置了API Key
        if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === '') {
            return res.status(503).json({
                success: false,
                message: 'AI服务未配置，请联系管理员',
                error: 'DEEPSEEK_API_KEY not configured'
            });
        }

        // 从认证中间件获取用户信息
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        // 使用认证用户的信息，如果没有则使用请求体中的信息
        const { message, context = [], username: reqUsername, userLevel: reqUserLevel } = req.body;
        const username = user?.username || reqUsername || '用户';
        const userLevel = user?.level?.currentLevel || reqUserLevel || 1;

        // 验证输入
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '消息内容不能为空'
            });
        }

        // 构建上下文消息
        const contextMessages = Array.isArray(context) ? context : [];
        
        // 构建系统提示词
        const systemMessage = {
            role: 'system',
            content: `你是Totofun寻宝游戏的AI伙伴"小突"，性格活泼可爱，说话简洁幽默，喜欢用emoji。

你的能力：
- 帮助用户解答游戏相关问题（寻宝、好友、成就等）
- 提供日常生活咨询（学习、健康、生活技巧等）
- 提供学习辅导（作业、知识点、学习方法等）
- 提供健康建议（注意：不能替代专业医疗诊断，只能提供一般性建议）
- 陪伴聊天，做用户的好朋友

用户信息：
- 昵称：${username}
- 等级：Lv${userLevel}

回复要求：
- 简短（50-100字以内）
- 活泼有趣，使用emoji
- 如果是医疗问题，要提醒用户咨询专业医生
- 如果是学习问题，要给出具体建议
- 保持友好和鼓励的语气`
        };

        // 构建消息数组
        const messages = [
            systemMessage,
            ...contextMessages,
            {
                role: 'user',
                content: message.trim()
            }
        ];

        console.log('🤖 [AI代理] 调用DeepSeek API:', {
            userId: userId,
            username: username,
            userLevel: userLevel,
            messageLength: message.length,
            contextLength: contextMessages.length
        });

        // 调用DeepSeek API
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                max_tokens: 200,
                temperature: 0.8,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ [AI代理] DeepSeek API调用失败:', response.status, errorData);
            
            return res.status(response.status).json({
                success: false,
                message: 'AI服务暂时不可用，请稍后再试',
                error: response.status === 401 ? 'API Key无效' : 'API调用失败'
            });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || null;

        if (!reply) {
            return res.status(500).json({
                success: false,
                message: 'AI回复为空，请重试'
            });
        }

        console.log('✅ [AI代理] DeepSeek API回复成功:', reply.substring(0, 50) + '...');

        // 记录聊天日志（便于监控）
        console.log('💬 [聊天日志]', {
            userId: userId,
            username: username,
            userLevel: userLevel,
            userMessage: message.substring(0, 100), // 只记录前100个字符
            botReply: reply.substring(0, 100), // 只记录前100个字符
            timestamp: new Date().toISOString(),
            usage: data.usage || {}
        });

        // 更新用户最后活跃时间
        if (user) {
            user.lastActiveAt = new Date();
            await user.save().catch(err => console.error('更新用户活跃时间失败:', err));
        }

        res.json({
            success: true,
            reply: reply,
            usage: data.usage || {}
        });

    } catch (error) {
        console.error('❌ [AI代理] 处理异常:', error);
        res.status(500).json({
            success: false,
            message: 'AI服务处理异常，请稍后再试',
            error: error.message
        });
    }
});

/**
 * GET /api/ai/status
 * 检查AI服务状态
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        available: !!DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== '',
        message: DEEPSEEK_API_KEY ? 'AI服务已配置' : 'AI服务未配置'
    });
});

module.exports = router;

