/**
 * Totofun 突突翻 - 宝藏管理模块
 * 宝藏创建、发现、奖励系统
 */

// ==================== 宝藏管理器 ====================
const treasureManager = {
    /**
     * 创建宝藏数据
     * @param {Object} position - 位置坐标 {lat, lng}
     * @param {Object} type - 宝藏类型
     * @param {string} creator - 创建者
     * @returns {Object} 宝藏对象
     */
    createTreasure: (position, type, creator = 'system') => {
        const treasure = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            title: type.name,
            description: `一个珍贵的${type.name}，等待着勇敢的探险者来发现！`,
            creator: creator,
            location: {
                coordinates: position,
                discoveryRadius: type.discoveryRadius || 50
            },
            category: type.category || '其他',
            rewards: type.rewards || { experience: 10, coins: 5 },
            rarity: type.rarity || 'common',
            icon: type.icon,
            color: type.color || '#4FC3F7',
            stats: {
                views: 0,
                likes: 0,
                discoveries: 0
            },
            createdAt: new Date(),
            status: 'active'
        };
        return treasure;
    },

    /**
     * 发现宝藏
     * @param {string} treasureId - 宝藏ID
     * @param {Object} userPosition - 用户位置
     * @returns {Object} 发现结果
     */
    discoverTreasure: (treasureId, userPosition) => {
        const treasureIndex = userData.createdTreasures.findIndex(t => t.id === treasureId);
        if (treasureIndex === -1) {
            return { success: false, reason: 'treasure_not_found' };
        }

        const treasure = userData.createdTreasures[treasureIndex];
        const distance = calculateDistance(userPosition, treasure.location.coordinates);

        if (distance > treasure.location.discoveryRadius) {
            return { 
                success: false, 
                reason: 'too_far',
                distance: distance,
                requiredDistance: treasure.location.discoveryRadius
            };
        }

        // 检查是否已经发现过
        if (userData.discoveredTreasures.includes(treasureId)) {
            return { success: false, reason: 'already_discovered' };
        }

        // 记录发现
        userData.discoveredTreasures.push(treasureId);
        userData.stats.treasuresDiscovered += 1;
        treasure.stats.discoveries += 1;

        // 奖励经验和金币
        const reward = userManager.addExperience(treasure.rewards.experience);
        userManager.addCoins(treasure.rewards.coins);

        // 检查成就
        achievementManager.checkAchievements();

        // 保存数据
        saveUserData();

        return {
            success: true,
            treasure: treasure,
            rewards: treasure.rewards,
            levelUp: reward.levelUp
        };
    },

    /**
     * 根据稀有度获取随机宝藏类型
     * @returns {Object} 宝藏类型
     */
    getRandomTreasureByRarity: () => {
        const random = Math.random();
        let cumulative = 0;
        
        for (const type of treasureTypes) {
            cumulative += type.probability;
            if (random <= cumulative) {
                return type;
            }
        }
        
        // 默认返回普通宝藏
        return treasureTypes.find(t => t.rarity === 'common') || treasureTypes[0];
    }
};

// ==================== 用户管理器 ====================
const userManager = {
    /**
     * 添加经验值
     * @param {number} points - 经验点数
     * @returns {Object} 结果（是否升级等）
     */
    addExperience: (points) => {
        const oldLevel = userData.level.currentLevel;
        userData.level.experience += points;
        
        const levelInfo = levelSystem.calculateLevel(userData.level.experience);
        const newLevel = levelInfo.level;
        
        if (newLevel > oldLevel) {
            userData.level.currentLevel = newLevel;
            
            const reward = {
                coins: newLevel * 10,
                badge: newLevel % 10 === 0 ? `level_${newLevel}` : null
            };

            if (reward.badge) {
                userManager.addBadge(reward.badge, '🏆', `达到第${newLevel}级`);
            }

            return {
                levelUp: true,
                oldLevel: oldLevel,
                newLevel: newLevel,
                reward: reward
            };
        }
        
        return { levelUp: false };
    },

    /**
     * 添加徽章
     * @param {string} badgeName - 徽章名称
     * @param {string} icon - 图标
     * @param {string} description - 描述
     * @returns {boolean} 是否成功添加
     */
    addBadge: (badgeName, icon, description) => {
        const existingBadge = userData.level.badges.find(badge => badge.name === badgeName);
        if (!existingBadge) {
            userData.level.badges.push({
                name: badgeName,
                icon: icon,
                description: description,
                unlockedAt: new Date()
            });
            return true;
        }
        return false;
    },

    /**
     * 添加金币
     * @param {number} amount - 金币数量
     */
    addCoins: (amount) => {
        if (!userData.coins) userData.coins = 0;
        userData.coins += amount;
    },

    /**
     * 获取用户等级信息
     * @returns {Object} 等级信息
     */
    getLevelInfo: () => {
        const currentExp = userData.level.experience;
        const currentLevel = userData.level.currentLevel;
        const expForCurrentLevel = levelSystem.getExpForLevel(currentLevel);
        const expForNextLevel = levelSystem.getExpForLevel(currentLevel + 1);
        const expToNext = expForNextLevel - currentExp;
        const progress = ((currentExp - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel)) * 100;

        return {
            currentLevel,
            currentExp,
            expToNext,
            progress: Math.max(0, Math.min(100, progress))
        };
    }
};

// ==================== 成就管理器 ====================
const achievementManager = {
    /**
     * 检查并解锁成就
     * @returns {Array} 新解锁的成就
     */
    checkAchievements: () => {
        const achievements = [];

        // 第一个宝藏
        if (userData.stats.treasuresDiscovered === 1) {
            achievements.push(userManager.addBadge('first_treasure', '🎯', '发现第一个宝藏'));
        }

        // 寻宝猎人
        if (userData.stats.treasuresDiscovered === 10) {
            achievements.push(userManager.addBadge('treasure_hunter', '🏃', '发现10个宝藏'));
        }

        // 寻宝大师
        if (userData.stats.treasuresDiscovered === 50) {
            achievements.push(userManager.addBadge('treasure_master', '👑', '发现50个宝藏'));
        }

        // 传奇发现者
        const legendaryFound = userData.createdTreasures.some(t => 
            userData.discoveredTreasures.includes(t.id) && t.rarity === 'legendary'
        );
        if (legendaryFound) {
            achievements.push(userManager.addBadge('legendary_finder', '💎', '发现传奇级宝藏'));
        }

        return achievements.filter(Boolean);
    }
};

console.log('✅ treasure.js 加载完成');

