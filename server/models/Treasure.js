const mongoose = require('mongoose');

const treasureSchema = new mongoose.Schema({
    // 基本信息
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 视频信息
    video: {
        url: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // 秒
            required: true,
            min: 5,
            max: 300 // 5分钟
        },
        size: {
            type: Number, // 字节
            required: true
        },
        resolution: {
            width: Number,
            height: Number
        },
        format: {
            type: String,
            enum: ['mp4', 'mov', 'avi'],
            default: 'mp4'
        }
    },
    
    // 地理位置
    location: {
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            index: '2dsphere'
        },
        address: {
            type: String,
            required: true
        },
        city: String,
        district: String,
        landmark: String, // 地标
        discoveryRadius: {
            type: Number,
            default: 50, // 米
            min: 5,
            max: 200
        }
    },
    
    // 挑战任务
    challenge: {
        type: {
            type: String,
            enum: ['none', 'mimic', 'find', 'quiz', 'photo', 'checkin'],
            default: 'none'
        },
        instruction: {
            type: String,
            maxlength: 200
        },
        verification: {
            // 根据挑战类型存储验证数据
            // mimic: 需要拍摄类似视频
            // find: 需要找到特定物品并拍照
            // quiz: 问答题目和答案
            // photo: 需要拍摄特定角度照片
            type: mongoose.Schema.Types.Mixed
        },
        difficulty: {
            type: Number,
            min: 1,
            max: 5,
            default: 1
        },
        timeLimit: {
            type: Number, // 秒，0表示无限制
            default: 0
        }
    },
    
    // 奖励系统
    rewards: {
        experience: {
            type: Number,
            default: 10,
            min: 1,
            max: 100
        },
        coins: {
            type: Number,
            default: 5,
            min: 0,
            max: 50
        },
        badges: [{
            name: String,
            icon: String,
            description: String
        }],
        specialReward: {
            type: String, // 特殊奖励描述
            default: ''
        }
    },
    
    // 统计数据
    stats: {
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        },
        discoveries: {
            type: Number,
            default: 0
        },
        attempts: {
            type: Number,
            default: 0
        },
        successRate: {
            type: Number,
            default: 0 // 成功率百分比
        }
    },
    
    // 内容标签
    tags: [{
        type: String,
        maxlength: 20
    }],
    category: {
        type: String,
        enum: ['美食', '旅游', '摄影', '运动', '音乐', '艺术', '历史', '购物', '咖啡', '酒吧', '电影', '其他'],
        default: '其他'
    },
    
    // 设置选项
    settings: {
        isPublic: {
            type: Boolean,
            default: true
        },
        allowComments: {
            type: Boolean,
            default: true
        },
        allowSharing: {
            type: Boolean,
            default: true
        },
        maxDiscoverers: {
            type: Number,
            default: 0, // 0表示无限制
            min: 0,
            max: 1000
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
        },
        isHidden: {
            type: Boolean,
            default: false
        }
    },
    
    // 状态
    status: {
        type: String,
        enum: ['active', 'inactive', 'reported', 'banned', 'expired'],
        default: 'active'
    },
    
    // 内容审核
    moderation: {
        isApproved: {
            type: Boolean,
            default: false
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: Date,
        reviewNotes: String,
        reportCount: {
            type: Number,
            default: 0
        }
    },
    
    // 互动记录
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    discoveredBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        discoveredAt: {
            type: Date,
            default: Date.now
        },
        proof: {
            type: mongoose.Schema.Types.Mixed // 发现证明（照片、视频等）
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        }
    }],
    
    // 推广信息
    promotion: {
        isFeatured: {
            type: Boolean,
            default: false
        },
        featuredUntil: Date,
        sponsoredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business'
        },
        boost: {
            type: Number,
            default: 0 // 推广权重
        }
    }
}, {
    timestamps: true
});

// 索引
treasureSchema.index({ 'location.coordinates': '2dsphere' });
treasureSchema.index({ creator: 1, createdAt: -1 });
treasureSchema.index({ category: 1, status: 1 });
treasureSchema.index({ 'stats.views': -1 });
treasureSchema.index({ 'stats.likes': -1 });
treasureSchema.index({ 'stats.discoveries': -1 });
treasureSchema.index({ createdAt: -1 });
treasureSchema.index({ 'settings.expiresAt': 1 });
treasureSchema.index({ status: 1, 'moderation.isApproved': 1 });
treasureSchema.index({ tags: 1 });

// 虚拟字段
treasureSchema.virtual('isExpired').get(function() {
    return this.settings.expiresAt && new Date() > this.settings.expiresAt;
});

treasureSchema.virtual('discoveryCount').get(function() {
    return this.discoveredBy.length;
});

treasureSchema.virtual('isPopular').get(function() {
    return this.stats.likes > 50 || this.stats.discoveries > 20;
});

// 中间件：保存前更新成功率
treasureSchema.pre('save', function(next) {
    if (this.stats.attempts > 0) {
        this.stats.successRate = Math.round((this.stats.discoveries / this.stats.attempts) * 100);
    }
    next();
});

// 静态方法：获取附近的宝藏
treasureSchema.statics.findNearby = function(lat, lng, radius = 5000, options = {}) {
    const query = {
        'location.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: radius
            }
        },
        status: 'active',
        'moderation.isApproved': true,
        'settings.isHidden': false,
        'settings.expiresAt': { $gt: new Date() }
    };
    
    // 可选过滤条件
    if (options.category) {
        query.category = options.category;
    }
    
    if (options.excludeUser) {
        query.creator = { $ne: options.excludeUser };
    }
    
    if (options.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
    }
    
    return this.find(query)
        .populate('creator', 'username avatar level.currentLevel')
        .sort(options.sortBy || { 'stats.views': -1, createdAt: -1 })
        .limit(options.limit || 20);
};

// 静态方法：获取热门宝藏
treasureSchema.statics.getTrending = function(timeframe = '24h', limit = 20) {
    const timeMap = {
        '1h': 1,
        '24h': 24,
        '7d': 168,
        '30d': 720
    };
    
    const hoursAgo = timeMap[timeframe] || 24;
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    return this.aggregate([
        {
            $match: {
                status: 'active',
                'moderation.isApproved': true,
                createdAt: { $gte: since }
            }
        },
        {
            $addFields: {
                trendScore: {
                    $add: [
                        { $multiply: ['$stats.likes', 3] },
                        { $multiply: ['$stats.shares', 5] },
                        { $multiply: ['$stats.discoveries', 10] },
                        '$stats.views'
                    ]
                }
            }
        },
        {
            $sort: { trendScore: -1 }
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: 'users',
                localField: 'creator',
                foreignField: '_id',
                as: 'creator',
                pipeline: [{
                    $project: {
                        username: 1,
                        avatar: 1,
                        'level.currentLevel': 1
                    }
                }]
            }
        }
    ]);
};

// 实例方法：用户是否可以发现此宝藏
treasureSchema.methods.canBeDiscoveredBy = function(userId, userLocation) {
    // 检查用户是否已经发现过
    const alreadyDiscovered = this.discoveredBy.some(
        discovery => discovery.user.toString() === userId.toString()
    );
    
    if (alreadyDiscovered) {
        return { canDiscover: false, reason: 'already_discovered' };
    }
    
    // 检查是否过期
    if (this.isExpired) {
        return { canDiscover: false, reason: 'expired' };
    }
    
    // 检查发现人数限制
    if (this.settings.maxDiscoverers > 0 && 
        this.discoveredBy.length >= this.settings.maxDiscoverers) {
        return { canDiscover: false, reason: 'max_discoverers_reached' };
    }
    
    // 检查位置距离
    if (userLocation) {
        const distance = this.getDistanceFrom(userLocation.lat, userLocation.lng);
        if (distance > this.location.discoveryRadius) {
            return { 
                canDiscover: false, 
                reason: 'too_far',
                distance: distance,
                requiredDistance: this.location.discoveryRadius
            };
        }
    }
    
    return { canDiscover: true };
};

// 实例方法：计算距离
treasureSchema.methods.getDistanceFrom = function(lat, lng) {
    const R = 6371000; // 地球半径(米)
    const dLat = (lat - this.location.coordinates[1]) * Math.PI / 180;
    const dLng = (lng - this.location.coordinates[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.location.coordinates[1] * Math.PI / 180) *
            Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// 实例方法：记录用户发现
treasureSchema.methods.recordDiscovery = async function(userId, proof = null, rating = null) {
    const discoveryRecord = {
        user: userId,
        discoveredAt: new Date(),
        proof: proof,
        rating: rating
    };
    
    this.discoveredBy.push(discoveryRecord);
    this.stats.discoveries += 1;
    
    // 更新创建者统计
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.creator, {
        $inc: { 'stats.totalViews': 1 }
    });
    
    return this.save();
};

// 实例方法：点赞/取消点赞
treasureSchema.methods.toggleLike = function(userId) {
    const index = this.likedBy.indexOf(userId);
    
    if (index === -1) {
        // 点赞
        this.likedBy.push(userId);
        this.stats.likes += 1;
        return { action: 'liked', likes: this.stats.likes };
    } else {
        // 取消点赞
        this.likedBy.splice(index, 1);
        this.stats.likes -= 1;
        return { action: 'unliked', likes: this.stats.likes };
    }
};

// 实例方法：获取安全的宝藏数据
treasureSchema.methods.toSafeObject = function(userId = null) {
    const obj = this.toObject();
    
    // 添加用户相关的状态
    if (userId) {
        obj.isLiked = this.likedBy.includes(userId);
        obj.isDiscovered = this.discoveredBy.some(
            discovery => discovery.user.toString() === userId.toString()
        );
    }
    
    // 移除敏感信息
    delete obj.likedBy;
    delete obj.moderation;
    
    return obj;
};

module.exports = mongoose.model('Treasure', treasureSchema);
