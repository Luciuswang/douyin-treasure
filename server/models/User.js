const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // 基本信息
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    avatar: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        maxlength: 200,
        default: ''
    },
    
    // 位置信息
    location: {
        city: {
            type: String,
            default: ''
        },
        district: {
            type: String,
            default: ''
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    
    // 统计数据
    stats: {
        treasuresCreated: {
            type: Number,
            default: 0
        },
        treasuresDiscovered: {
            type: Number,
            default: 0
        },
        followers: {
            type: Number,
            default: 0
        },
        following: {
            type: Number,
            default: 0
        },
        totalLikes: {
            type: Number,
            default: 0
        },
        totalViews: {
            type: Number,
            default: 0
        }
    },
    
    // 用户偏好
    preferences: {
        interests: [{
            type: String,
            enum: ['美食', '旅游', '摄影', '运动', '音乐', '艺术', '历史', '购物', '咖啡', '酒吧', '电影', '读书']
        }],
        explorationRadius: {
            type: Number,
            default: 5000, // 5公里
            min: 500,
            max: 50000
        },
        activeHours: [{
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'night']
        }],
        language: {
            type: String,
            default: 'zh-CN'
        }
    },
    
    // 等级系统
    level: {
        currentLevel: {
            type: Number,
            default: 1,
            min: 1,
            max: 100
        },
        experience: {
            type: Number,
            default: 0,
            min: 0
        },
        badges: [{
            name: String,
            icon: String,
            description: String,
            unlockedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    
    // 社交关系
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // 账户状态
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumExpiresAt: Date,
    
    // 登录信息
    lastLoginAt: Date,
    lastActiveAt: {
        type: Date,
        default: Date.now
    },
    loginCount: {
        type: Number,
        default: 0
    },
    
    // 设备信息
    deviceInfo: {
        platform: String, // ios, android, web
        version: String,
        deviceId: String
    },
    
    // 隐私设置
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'friends', 'private'],
            default: 'public'
        },
        locationSharing: {
            type: Boolean,
            default: true
        },
        allowMessages: {
            type: String,
            enum: ['everyone', 'friends', 'none'],
            default: 'everyone'
        }
    },
    
    // 推送设置
    notifications: {
        push: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        },
        types: {
            newFollower: {
                type: Boolean,
                default: true
            },
            treasureNearby: {
                type: Boolean,
                default: true
            },
            treasureDiscovered: {
                type: Boolean,
                default: true
            },
            systemUpdates: {
                type: Boolean,
                default: true
            }
        }
    }
}, {
    timestamps: true
});

// 索引
// 注意：username和email已经有unique:true，会自动创建索引
// location.coordinates已经有index: '2dsphere'，会自动创建索引
// 只添加其他需要的索引
userSchema.index({ 'stats.treasuresCreated': -1 });
userSchema.index({ 'stats.treasuresDiscovered': -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

// 虚拟字段
userSchema.virtual('followerCount').get(function() {
    return this.followers.length;
});

userSchema.virtual('followingCount').get(function() {
    return this.following.length;
});

// 密码加密
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 密码验证
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// 更新活跃时间
userSchema.methods.updateActivity = function() {
    this.lastActiveAt = new Date();
    return this.save();
};

// 增加经验值
userSchema.methods.addExperience = function(points) {
    this.level.experience += points;
    
    // 计算等级提升
    const newLevel = Math.floor(Math.sqrt(this.level.experience / 100)) + 1;
    if (newLevel > this.level.currentLevel) {
        this.level.currentLevel = Math.min(newLevel, 100);
        
        // 等级提升奖励
        return {
            levelUp: true,
            oldLevel: this.level.currentLevel - 1,
            newLevel: this.level.currentLevel,
            reward: {
                coins: newLevel * 10,
                badge: newLevel % 10 === 0 ? `level_${newLevel}` : null
            }
        };
    }
    
    return { levelUp: false };
};

// 添加徽章
userSchema.methods.addBadge = function(badgeName, icon, description) {
    const existingBadge = this.level.badges.find(badge => badge.name === badgeName);
    if (!existingBadge) {
        this.level.badges.push({
            name: badgeName,
            icon: icon,
            description: description,
            unlockedAt: new Date()
        });
        return true;
    }
    return false;
};

// 关注用户
userSchema.methods.followUser = async function(targetUserId) {
    if (this.following.includes(targetUserId)) {
        return { success: false, message: '已经关注过该用户' };
    }
    
    this.following.push(targetUserId);
    await this.save();
    
    // 更新目标用户的粉丝列表
    await mongoose.model('User').findByIdAndUpdate(
        targetUserId,
        { $push: { followers: this._id } }
    );
    
    return { success: true, message: '关注成功' };
};

// 取消关注
userSchema.methods.unfollowUser = async function(targetUserId) {
    const index = this.following.indexOf(targetUserId);
    if (index === -1) {
        return { success: false, message: '未关注该用户' };
    }
    
    this.following.splice(index, 1);
    await this.save();
    
    // 更新目标用户的粉丝列表
    await mongoose.model('User').findByIdAndUpdate(
        targetUserId,
        { $pull: { followers: this._id } }
    );
    
    return { success: true, message: '取消关注成功' };
};

// 获取推荐用户
userSchema.statics.getRecommendedUsers = async function(userId, limit = 10) {
    const user = await this.findById(userId);
    if (!user) return [];
    
    // 基于兴趣和位置推荐用户
    const pipeline = [
        {
            $match: {
                _id: { $ne: mongoose.Types.ObjectId(userId) },
                _id: { $nin: user.following },
                isActive: true
            }
        },
        {
            $addFields: {
                interestScore: {
                    $size: {
                        $setIntersection: ['$preferences.interests', user.preferences.interests]
                    }
                }
            }
        },
        {
            $sort: {
                interestScore: -1,
                'stats.followers': -1,
                lastActiveAt: -1
            }
        },
        {
            $limit: limit
        },
        {
            $project: {
                password: 0,
                email: 0,
                deviceInfo: 0
            }
        }
    ];
    
    return this.aggregate(pipeline);
};

// 输出安全的用户信息
userSchema.methods.toSafeObject = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.email;
    delete obj.deviceInfo;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
