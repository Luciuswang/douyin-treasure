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

    type: {
        type: String,
        enum: ['note', 'coupon', 'ticket', 'job', 'event', 'redpacket', 'task', 'image', 'custom', 'social', 'house'],
        default: 'note'
    },

    content: {
        text: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        link: { type: String, default: '' },
        couponCode: { type: String, default: '' },
        amount: { type: Number, default: 0 },
        // 社交宝藏专用
        intro: { type: String, maxlength: 200, default: '' },
        interests: [{ type: String }],
        contact: { type: String, default: '' },
        extra: { type: mongoose.Schema.Types.Mixed }
    },

    password: {
        type: String,
        default: ''
    },

    // 地理位置（纯数据，无地理索引）
    location: {
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: { type: String, default: '' },
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
        enum: ['active', 'inactive', 'under_review', 'reported', 'banned', 'expired'],
        default: 'active'
    },

    publishMethod: {
        type: String,
        enum: ['onsite', 'remote'],
        default: 'onsite'
    },

    reports: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: {
            type: String,
            enum: ['dangerous_location', 'inappropriate_content', 'spam', 'other']
        },
        detail: { type: String, maxlength: 200 },
        createdAt: { type: Date, default: Date.now }
    }],
    reportCount: { type: Number, default: 0 },

    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    discoveredBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        discoveredAt: { type: Date, default: Date.now },
        rating: { type: Number, min: 1, max: 5 }
    }],

    // 社交宝藏：谁表达了"想认识"
    interestedBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }],

    // 社交宝藏：双向匹配记录
    matches: [{
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        matchedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// 普通索引（不使用 2dsphere，避免 GeoJSON 格式限制）
treasureSchema.index({ 'location.coordinates': 1 });
treasureSchema.index({ creator: 1, createdAt: -1 });
treasureSchema.index({ type: 1, status: 1 });
treasureSchema.index({ status: 1, 'settings.expiresAt': 1 });
treasureSchema.index({ createdAt: -1 });

treasureSchema.virtual('isExpired').get(function () {
    return this.settings.expiresAt && new Date() > this.settings.expiresAt;
});

treasureSchema.virtual('discoveryCount').get(function () {
    return this.discoveredBy.length;
});

treasureSchema.pre('save', function () {
    if (this.stats.attempts > 0) {
        this.stats.successRate = Math.round((this.stats.discoveries / this.stats.attempts) * 100);
    }
});

// 附近宝藏查询（经纬度范围 + Haversine 精确过滤）
treasureSchema.statics.findNearby = function (lat, lng, radius = 5000, options = {}) {
    // 经纬度范围粗筛（矩形框）
    const latDelta = radius / 111000;
    const lngDelta = radius / (111000 * Math.cos(lat * Math.PI / 180));

    const query = {
        'location.coordinates.0': { $gte: lng - lngDelta, $lte: lng + lngDelta },
        'location.coordinates.1': { $gte: lat - latDelta, $lte: lat + latDelta },
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

treasureSchema.methods.recordDiscovery = async function (userId, rating) {
    this.discoveredBy.push({ user: userId, discoveredAt: new Date(), rating });
    this.stats.discoveries += 1;
    this.stats.attempts += 1;
    return this.save();
};

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

treasureSchema.methods.addReport = async function (userId, reason, detail) {
    const alreadyReported = this.reports.some(
        r => r.user.toString() === userId.toString()
    );
    if (alreadyReported) {
        return { added: false, reason: 'already_reported' };
    }

    this.reports.push({ user: userId, reason, detail, createdAt: new Date() });
    this.reportCount = this.reports.length;

    if (this.reportCount >= 3 && this.status === 'active') {
        this.status = 'under_review';
    }

    await this.save();
    return { added: true, reportCount: this.reportCount, statusChanged: this.status === 'under_review' };
};

treasureSchema.methods.toSafeObject = function (userId) {
    const obj = this.toObject();
    const uid = userId?.toString();

    if (uid) {
        obj.isLiked = this.likedBy.some(id => id.toString() === uid);
        obj.isDiscovered = this.discoveredBy.some(d => d.user.toString() === uid);
        obj.isReported = this.reports.some(r => r.user.toString() === uid);
    }

    // 社交宝藏隐私处理
    if (this.type === 'social') {
        const isCreator = uid && this.creator.toString() === uid;
        const isMatched = uid && this.matches.some(
            m => m.users.some(u => u.toString() === uid)
        );

        if (uid) {
            obj.isInterested = this.interestedBy.some(i => i.user.toString() === uid);
            obj.isMatched = isMatched;
        }

        // 联系方式仅匹配后或创建者自己可见
        if (!isMatched && !isCreator) {
            if (obj.content) obj.content.contact = '';
        }

        // interestedBy 详情仅创建者可见，其他人只看到数量
        if (!isCreator) {
            obj.interestCount = this.interestedBy.length;
            delete obj.interestedBy;
        }

        // matches 详情仅参与者可见
        if (!isCreator && !isMatched) {
            obj.matchCount = this.matches.length;
            delete obj.matches;
        }
    } else {
        delete obj.interestedBy;
        delete obj.matches;
    }

    delete obj.likedBy;
    delete obj.password;
    delete obj.reports;
    return obj;
};

module.exports = mongoose.model('Treasure', treasureSchema);
