const mongoose = require('mongoose');

const treasureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // 宝藏类型
    type: {
        type: String,
        enum: ['note', 'coupon', 'ticket', 'job', 'event', 'redpacket', 'task', 'image', 'custom'],
        default: 'note'
    },

    // 通用内容（根据 type 存储不同结构的数据）
    content: {
        text: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        link: { type: String, default: '' },
        couponCode: { type: String, default: '' },
        amount: { type: Number, default: 0 },
        extra: { type: mongoose.Schema.Types.Mixed }
    },

    // 密码保护（可选）
    password: {
        type: String,
        default: ''
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
            default: ''
        },
        city: String,
        district: String,
        landmark: String,
        discoveryRadius: {
            type: Number,
            default: 50,
            min: 5,
            max: 500
        }
    },

    // 挑战任务（可选）
    challenge: {
        type: {
            type: String,
            enum: ['none', 'quiz', 'photo', 'checkin'],
            default: 'none'
        },
        instruction: { type: String, maxlength: 200 },
        verification: { type: mongoose.Schema.Types.Mixed },
        difficulty: { type: Number, min: 1, max: 5, default: 1 },
        timeLimit: { type: Number, default: 0 }
    },

    // 奖励
    rewards: {
        experience: { type: Number, default: 10, min: 1, max: 100 },
        coins: { type: Number, default: 5, min: 0, max: 50 },
        badges: [{
            name: String,
            icon: String,
            description: String
        }],
        specialReward: { type: String, default: '' }
    },

    // 统计
    stats: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        discoveries: { type: Number, default: 0 },
        attempts: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 }
    },

    tags: [{ type: String, maxlength: 20 }],
    category: {
        type: String,
        enum: ['美食', '旅游', '摄影', '运动', '音乐', '艺术', '历史', '购物', '咖啡', '酒吧', '电影', '其他'],
        default: '其他'
    },

    settings: {
        isPublic: { type: Boolean, default: true },
        allowComments: { type: Boolean, default: true },
        maxDiscoverers: { type: Number, default: 0, min: 0, max: 10000 },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        isHidden: { type: Boolean, default: false }
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'reported', 'banned', 'expired'],
        default: 'active'
    },

    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    discoveredBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        discoveredAt: { type: Date, default: Date.now },
        rating: { type: Number, min: 1, max: 5 }
    }]
}, {
    timestamps: true
});

// 索引
treasureSchema.index({ 'location.coordinates': '2dsphere' });
treasureSchema.index({ creator: 1, createdAt: -1 });
treasureSchema.index({ type: 1, status: 1 });
treasureSchema.index({ status: 1, 'settings.expiresAt': 1 });
treasureSchema.index({ createdAt: -1 });

// 虚拟字段
treasureSchema.virtual('isExpired').get(function () {
    return this.settings.expiresAt && new Date() > this.settings.expiresAt;
});

treasureSchema.virtual('discoveryCount').get(function () {
    return this.discoveredBy.length;
});

// 保存前更新成功率
treasureSchema.pre('save', function (next) {
    if (this.stats.attempts > 0) {
        this.stats.successRate = Math.round((this.stats.discoveries / this.stats.attempts) * 100);
    }
    next();
});

// 附近宝藏查询
treasureSchema.statics.findNearby = function (lat, lng, radius = 5000, options = {}) {
    const query = {
        'location.coordinates': {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: radius
            }
        },
        status: 'active',
        'settings.isHidden': false,
        'settings.expiresAt': { $gt: new Date() }
    };

    if (options.type) query.type = options.type;
    if (options.category) query.category = options.category;
    if (options.excludeUser) query.creator = { $ne: options.excludeUser };

    return this.find(query)
        .populate('creator', 'username avatar level.currentLevel')
        .sort(options.sortBy || { createdAt: -1 })
        .limit(options.limit || 50);
};

// Haversine 距离计算（米）
treasureSchema.methods.getDistanceFrom = function (lat, lng) {
    const R = 6371000;
    const dLat = (lat - this.location.coordinates[1]) * Math.PI / 180;
    const dLng = (lng - this.location.coordinates[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(this.location.coordinates[1] * Math.PI / 180) *
        Math.cos(lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// 检查用户是否可以发现
treasureSchema.methods.canBeDiscoveredBy = function (userId, userLocation) {
    const already = this.discoveredBy.some(
        d => d.user.toString() === userId.toString()
    );
    if (already) return { canDiscover: false, reason: 'already_discovered' };
    if (this.isExpired) return { canDiscover: false, reason: 'expired' };
    if (this.settings.maxDiscoverers > 0 && this.discoveredBy.length >= this.settings.maxDiscoverers) {
        return { canDiscover: false, reason: 'max_discoverers_reached' };
    }
    if (userLocation) {
        const distance = this.getDistanceFrom(userLocation.lat, userLocation.lng);
        if (distance > this.location.discoveryRadius) {
            return { canDiscover: false, reason: 'too_far', distance, requiredDistance: this.location.discoveryRadius };
        }
    }
    return { canDiscover: true };
};

// 记录发现
treasureSchema.methods.recordDiscovery = async function (userId, rating) {
    this.discoveredBy.push({ user: userId, discoveredAt: new Date(), rating });
    this.stats.discoveries += 1;
    this.stats.attempts += 1;
    return this.save();
};

// 点赞/取消
treasureSchema.methods.toggleLike = function (userId) {
    const idx = this.likedBy.indexOf(userId);
    if (idx === -1) {
        this.likedBy.push(userId);
        this.stats.likes += 1;
        return { action: 'liked', likes: this.stats.likes };
    }
    this.likedBy.splice(idx, 1);
    this.stats.likes -= 1;
    return { action: 'unliked', likes: this.stats.likes };
};

// 安全输出（隐藏内部字段）
treasureSchema.methods.toSafeObject = function (userId) {
    const obj = this.toObject();
    if (userId) {
        obj.isLiked = this.likedBy.some(id => id.toString() === userId.toString());
        obj.isDiscovered = this.discoveredBy.some(d => d.user.toString() === userId.toString());
    }
    delete obj.likedBy;
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('Treasure', treasureSchema);
