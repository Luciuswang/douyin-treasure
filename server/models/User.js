const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isFeatureEnabled, maskName } = require('../utils/runtime');

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
    role: {
        type: String,
        enum: ['user', 'admin', 'merchant'],
        default: 'user'
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
    
    // 信用系统
    credit: {
        score: { type: Number, default: 100, min: 0, max: 100 },
        warnings: [{
            reason: { type: String },
            treasureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Treasure' },
            at: { type: Date, default: Date.now }
        }],
        banUntil: { type: Date, default: null },
        banCount: { type: Number, default: 0 }
    },

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
    },

    registration: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: () => isFeatureEnabled('REQUIRE_REGISTRATION_APPROVAL', true) ? 'pending' : 'approved'
        },
        note: {
            type: String,
            maxlength: 300,
            default: ''
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        reviewedAt: {
            type: Date,
            default: null
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },

    identityVerification: {
        status: {
            type: String,
            enum: ['unverified', 'pending', 'verified', 'rejected'],
            default: 'unverified'
        },
        legalName: {
            type: String,
            default: '',
            maxlength: 50
        },
        maskedName: {
            type: String,
            default: ''
        },
        documentType: {
            type: String,
            enum: ['', 'id_card', 'passport', 'other'],
            default: ''
        },
        idNumberLast4: {
            type: String,
            default: '',
            match: /^[A-Za-z0-9]{0,8}$/
        },
        submittedAt: {
            type: Date,
            default: null
        },
        reviewedAt: {
            type: Date,
            default: null
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        reviewNote: {
            type: String,
            maxlength: 200,
            default: ''
        },
        provider: {
            type: String,
            default: 'manual_review'
        }
    },

    commercial: {
        paymentStatus: {
            type: String,
            enum: ['disabled', 'pending_review', 'enabled'],
            default: 'disabled'
        },
        promotionEligible: {
            type: Boolean,
            default: false
        },
        merchantApplication: {
            status: {
                type: String,
                enum: ['not_submitted', 'pending', 'approved', 'rejected'],
                default: 'not_submitted'
            },
            businessName: {
                type: String,
                default: '',
                maxlength: 80
            },
            contactName: {
                type: String,
                default: '',
                maxlength: 50
            },
            contactPhone: {
                type: String,
                default: '',
                maxlength: 30
            },
            city: {
                type: String,
                default: '',
                maxlength: 50
            },
            category: {
                type: String,
                default: '',
                maxlength: 50
            },
            summary: {
                type: String,
                default: '',
                maxlength: 500
            },
            submittedAt: {
                type: Date,
                default: null
            },
            reviewedAt: {
                type: Date,
                default: null
            },
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null
            },
            reviewNote: {
                type: String,
                default: '',
                maxlength: 300
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
userSchema.index({ 'registration.status': 1, createdAt: -1 });
userSchema.index({ 'identityVerification.status': 1, createdAt: -1 });
userSchema.index({ 'commercial.merchantApplication.status': 1, createdAt: -1 });

// 虚拟字段
userSchema.virtual('followerCount').get(function() {
    return this.followers.length;
});

userSchema.virtual('followingCount').get(function() {
    return this.following.length;
});

// 密码加密
// Mongoose 6+ 支持 async/await，不需要 next 参数
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
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
    const registrationStatus = obj.registration?.status || 'approved';
    const identityStatus = obj.identityVerification?.status || 'unverified';

    obj.registration = {
        status: registrationStatus,
        note: registrationStatus === 'rejected' ? (obj.registration?.note || '') : '',
        requestedAt: obj.registration?.requestedAt || obj.createdAt,
        reviewedAt: obj.registration?.reviewedAt || null
    };

    obj.identityVerification = {
        status: identityStatus,
        maskedName: obj.identityVerification?.maskedName || maskName(obj.identityVerification?.legalName || ''),
        documentType: obj.identityVerification?.documentType || '',
        idNumberLast4: obj.identityVerification?.idNumberLast4 || '',
        submittedAt: obj.identityVerification?.submittedAt || null,
        reviewedAt: obj.identityVerification?.reviewedAt || null,
        reviewNote: identityStatus === 'rejected' ? (obj.identityVerification?.reviewNote || '') : ''
    };

    obj.commercial = {
        paymentStatus: obj.commercial?.paymentStatus || 'disabled',
        promotionEligible: !!obj.commercial?.promotionEligible,
        merchantApplication: {
            status: obj.commercial?.merchantApplication?.status || 'not_submitted',
            businessName: obj.commercial?.merchantApplication?.businessName || '',
            contactName: obj.commercial?.merchantApplication?.contactName || '',
            contactPhone: obj.commercial?.merchantApplication?.contactPhone || '',
            city: obj.commercial?.merchantApplication?.city || '',
            category: obj.commercial?.merchantApplication?.category || '',
            summary: obj.commercial?.merchantApplication?.summary || '',
            submittedAt: obj.commercial?.merchantApplication?.submittedAt || null,
            reviewedAt: obj.commercial?.merchantApplication?.reviewedAt || null,
            reviewNote: obj.commercial?.merchantApplication?.reviewNote || ''
        }
    };

    delete obj.password;
    delete obj.email;
    delete obj.deviceInfo;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
