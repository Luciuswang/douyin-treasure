const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
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
 */
router.post('/chat', aiLimiter, async (req, res) => {
    try {
        // 检查是否配置了API Key
        if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === '') {
            return res.status(503).json({
                success: false,
                message: 'AI服务未配置，请联系管理员',
                error: 'DEEPSEEK_API_KEY not configured'
            });
        }

        const { message, context = [], username = '用户', userLevel = 1 } = req.body;

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
            content: `你是Totofun（突突翻）GPS寻宝游戏的AI伙伴"小突"。你聪明、幽默、有洞察力，像一个见多识广的朋友。

关于Totofun：
- 基于GPS的实时寻宝游戏，玩家在真实地点藏/找宝藏
- 宝藏类型：笔记(蓝)、交友(粉)、优惠券(橙)、红包(红)、招聘(蓝)、活动(紫)、任务(青)、门票(珊瑚)
- 玩家到达宝藏地点才能解锁内容
- 有社交匹配功能（双向"想认识"才能交换联系方式）

用户：${username}（Lv${userLevel}）

回复风格：
- 自然对话，不要套路化的客服语气
- 可长可短，视问题复杂度而定（简单问题简答，复杂问题详答）
- 适度用emoji，不要过多
- 如果用户问的问题你不确定，坦诚说不知道，不要编造
- 可以给出有深度的建议和独到见解
- 涉及医疗/法律/投资等专业领域要提醒咨询专业人士`
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
            messageLength: message.length,
            contextLength: contextMessages.length,
            username
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
                max_tokens: 500,
                temperature: 0.7,
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

