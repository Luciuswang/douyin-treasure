/**
 * Totofun 突突翻 - 聊天模块
 * AI机器人对话、好友聊天、消息管理
 */

// ==================== 常量 ====================
const BOT_ID = 'totofun_bot';
const BOT_NAME = '小突';
const BOT_AVATAR = 'assets/images/xiaotu-bot01.png';

// ==================== AI配置 ====================
const AI_CONFIG = {
    // API Key (base64编码)
    ENCODED_KEY: 'c2stZDE2ODIyY2VmMzk5NDUxOGJkZDQ5Nzc0MDFlZGQzZWM=',
    API_URL: 'https://api.deepseek.com/v1/chat/completions',
    MODEL: 'deepseek-chat',
    MAX_TOKENS: 200,
    TEMPERATURE: 0.8
};

// ==================== 规则回复 ====================
const ruleReplies = {
    // 问候语
    greetings: {
        patterns: [/^(你好|hello|hi|嗨|早上好|下午好|晚上好|在吗|在不在)/i],
        reply: '你好！我是小突，你的寻宝伙伴！😊 有什么问题都可以问我哦~'
    },
    
    // 游戏引导
    guide: {
        patterns: [/^(怎么|如何|怎样|不会|不懂|教我|引导|新手|第一次)/i],
        reply: '让我来帮你！🎮\n\n1️⃣ 点击"启动寻宝之旅"开始游戏\n2️⃣ 允许GPS定位权限\n3️⃣ 在地图上找到附近的宝藏\n4️⃣ 点击宝藏查看详情\n5️⃣ 到达宝藏位置后点击"发现宝藏"\n\n有什么不懂的随时问我！'
    },
    
    // 寻宝相关
    treasure: {
        patterns: [/^(宝藏|寻宝|找到|发现|位置|在哪里|在哪)/i],
        reply: '宝藏就在你身边！🗺️\n\n• 打开地图可以看到附近的宝藏\n• 绿色标记是普通宝藏\n• 金色标记是稀有宝藏\n• 点击标记可以查看详情\n• 到达位置后就能发现宝藏啦！\n\n加油，寻宝者！💪'
    },
    
    // 好友相关
    friends: {
        patterns: [/^(好友|朋友|添加|加好友|怎么加)/i],
        getReply: (userId) => `添加好友很简单！👥\n\n1️⃣ 点击聊天按钮💬\n2️⃣ 点击"添加好友"\n3️⃣ 输入好友的ID（10位数字）\n4️⃣ 或者让好友添加你的ID\n\n你的ID是：${userId || '未知'}\n\n分享给朋友，一起寻宝吧！`
    },
    
    // 成就/等级相关
    achievement: {
        patterns: [/^(等级|经验|升级|成就|徽章|奖励)/i],
        reply: '升级和成就系统！🏆\n\n• 发现宝藏可以获得经验值\n• 经验值满了就会升级\n• 完成特殊任务可以获得徽章\n• 等级越高，能发现的宝藏越多\n\n继续寻宝，成为寻宝大师吧！⭐'
    },
    
    // 情感支持 - 累
    tired: {
        patterns: [/^(累|疲惫|困|想休息|不想玩了)/i],
        reply: '累了就休息一下吧！😴\n\n寻宝虽然有趣，但也要注意休息哦~ 我会一直在这里等你，随时可以来找我聊天！💙'
    },
    
    // 情感支持 - 开心
    happy: {
        patterns: [/^(开心|高兴|快乐|兴奋|太棒了)/i],
        reply: '太好了！看到你开心我也很开心！😄\n\n继续加油，发现更多宝藏吧！💪'
    },
    
    // 情感支持 - 难过
    sad: {
        patterns: [/^(难过|伤心|不开心|沮丧|失望)/i],
        reply: '别难过~ 每个人都会遇到挫折的！💙\n\n寻宝的路上总会有惊喜，说不定下一个宝藏就在不远处等着你呢！加油！✨'
    },
    
    // 感谢
    thanks: {
        patterns: [/^(谢谢|感谢|多谢|thx|thanks)/i],
        reply: '不客气！能帮到你我很开心！😊\n\n有什么问题随时问我，我会一直陪着你的！'
    },
    
    // 再见
    goodbye: {
        patterns: [/^(再见|拜拜|bye|goodbye|下次见)/i],
        reply: '再见！期待下次和你聊天！👋\n\n记得常来找我哦，我会想你的！💙'
    }
};

// ==================== 默认回复 ====================
const defaultReplies = [
    '嗯嗯，我在听呢！有什么问题尽管问~ 😊',
    '哈哈，有趣！继续说说看~ 🎮',
    '我懂我懂！寻宝的路上总是充满惊喜！✨',
    '加油！我相信你一定能找到宝藏的！💪',
    '这个问题很好！让我想想... 🤔',
    '你真棒！继续保持！⭐',
    '嘻嘻，你真有趣！🌟',
    '有什么需要帮忙的吗？我随时在这里！💙'
];

// ==================== 聊天服务 ====================
const chatService = {
    /**
     * 获取规则回复
     * @param {string} message - 用户消息
     * @param {string} userId - 用户ID（用于好友回复）
     * @returns {string|null} 匹配的回复或null
     */
    getRuleBasedReply: (message, userId = null) => {
        const lowerMessage = message.toLowerCase().trim();
        
        for (const key of Object.keys(ruleReplies)) {
            const rule = ruleReplies[key];
            for (const pattern of rule.patterns) {
                if (pattern.test(lowerMessage)) {
                    if (rule.getReply) {
                        return rule.getReply(userId);
                    }
                    return rule.reply;
                }
            }
        }
        
        return null;
    },
    
    /**
     * 获取默认回复
     * @returns {string}
     */
    getDefaultReply: () => {
        const index = Math.floor(Math.random() * defaultReplies.length);
        return defaultReplies[index];
    },
    
    /**
     * 调用AI API获取回复
     * @param {string} message - 用户消息
     * @param {Array} context - 对话上下文
     * @param {string} username - 用户名
     * @param {number} userLevel - 用户等级
     * @returns {Promise<string|null>}
     */
    getAIReply: async (message, context = [], username = '用户', userLevel = 1) => {
        try {
            // 解码API Key
            const apiKey = atob(AI_CONFIG.ENCODED_KEY);
            
            // 构建系统提示
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
                ...context,
                { role: 'user', content: message.trim() }
            ];
            
            // 调用API
            const response = await fetch(AI_CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: AI_CONFIG.MODEL,
                    messages: messages,
                    max_tokens: AI_CONFIG.MAX_TOKENS,
                    temperature: AI_CONFIG.TEMPERATURE,
                    stream: false
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content;
                }
            }
            
            console.warn('AI API返回异常');
            return null;
        } catch (error) {
            console.error('AI API调用失败:', error);
            return null;
        }
    },
    
    /**
     * 获取机器人回复（综合处理）
     * @param {string} message - 用户消息
     * @param {Object} options - 选项
     * @returns {Promise<string>}
     */
    getBotReply: async (message, options = {}) => {
        const { userId, context = [], username = '用户', userLevel = 1 } = options;
        
        // 1. 先尝试规则回复
        const ruleReply = chatService.getRuleBasedReply(message, userId);
        if (ruleReply) {
            console.log('🤖 使用规则回复');
            return ruleReply;
        }
        
        // 2. 尝试AI回复
        try {
            const aiReply = await chatService.getAIReply(message, context, username, userLevel);
            if (aiReply && aiReply.trim()) {
                console.log('🤖 使用AI回复');
                return aiReply;
            }
        } catch (error) {
            console.error('AI回复失败:', error);
        }
        
        // 3. 使用默认回复
        console.log('🤖 使用默认回复');
        return chatService.getDefaultReply();
    }
};

// ==================== 消息工具 ====================
const messageUtils = {
    /**
     * 创建消息对象
     * @param {Object} options - 消息选项
     * @returns {Object}
     */
    createMessage: (options) => {
        return {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            from: options.from,
            to: options.to,
            content: options.content,
            type: options.type || 'text',
            timestamp: options.timestamp || new Date().toISOString(),
            read: options.read !== undefined ? options.read : false,
            status: options.status || 'sending'
        };
    },
    
    /**
     * 格式化时间显示
     * @param {string} timestamp - ISO时间戳
     * @returns {string}
     */
    formatTime: (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // 1分钟内
        if (diff < 60000) {
            return '刚刚';
        }
        
        // 1小时内
        if (diff < 3600000) {
            return Math.floor(diff / 60000) + '分钟前';
        }
        
        // 今天
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
        
        // 昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
        
        // 更早
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
};

console.log('✅ chat.js 加载完成');

