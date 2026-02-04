/**
 * Totofun 突突翻 - 配置文件
 * Firebase 配置、API 配置、全局变量
 */

// ==================== Firebase 配置 ====================
const firebaseConfig = {
    apiKey: "AIzaSyAKsaHi4_VIRgCVR3_ZzkQdrkx91Iwq_u4",
    authDomain: "totofun-treasure.firebaseapp.com",
    databaseURL: "https://totofun-treasure-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "totofun-treasure",
    storageBucket: "totofun-treasure.firebasestorage.app",
    messagingSenderId: "453399218753",
    appId: "1:453399218753:web:b269ff4a436b98f011d4c0",
    measurementId: "G-LYVWQW487S"
};

// Firebase 初始化
let firebaseApp = null;
let database = null;
let firebaseEnabled = false;

try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        firebaseEnabled = true;
        console.log('✅ Firebase连接成功！实时通信已启用');
    } else {
        console.warn('⚠️ Firebase未配置，将使用本地存储模式');
    }
} catch (error) {
    console.error('❌ Firebase初始化失败:', error);
}

// ==================== 全局变量 ====================
let map = null;
let userMarker = null;
let treasureMarkers = [];
let userLocation = null;
let watchId = null;
let isLocationSet = false;
let userLocationLocked = false;

// ==================== 用户数据结构 ====================
let userData = {
    username: '',
    level: {
        currentLevel: 1,
        experience: 0,
        badges: []
    },
    stats: {
        treasuresCreated: 0,
        treasuresDiscovered: 0,
        totalLikes: 0,
        totalViews: 0
    },
    preferences: {
        interests: [],
        explorationRadius: 5000,
        language: 'zh-CN'
    },
    discoveredTreasures: [],
    createdTreasures: [],
    achievements: [],
    lastActiveAt: new Date()
};

// ==================== API 配置 ====================
const API_CONFIG = {
    // 腾讯云服务器地址（国内访问）
    TENCENT_API_URL: 'http://1.15.11.140:3001',
    // Railway 云服务地址（海外访问）
    CLOUD_API_URL: 'https://totofun-server-production.up.railway.app',
    
    // API 端点
    ENDPOINTS: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        REFRESH: '/api/auth/refresh',
        PROFILE: '/api/users/profile',
        FRIENDS: '/api/users/friends',
        CONVERSATIONS: '/api/users/conversations'
    },
    
    get BASE_URL() {
        // 1. 优先使用用户手动设置的地址
        const localStorageApiUrl = localStorage.getItem('API_BASE_URL');
        if (localStorageApiUrl && localStorageApiUrl !== 'your-api-domain.com') {
            return localStorageApiUrl;
        }
        
        // 2. 使用全局变量设置的地址
        if (window.API_BASE_URL && window.API_BASE_URL !== 'your-api-domain.com') {
            return window.API_BASE_URL;
        }
        
        // 3. 本地开发环境
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        
        // 4. 自动检测：国内用户优先使用腾讯云
        // 通过检测时区或语言判断
        const isChina = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Shanghai' ||
                        navigator.language.startsWith('zh');
        
        if (isChina && this.TENCENT_API_URL) {
            return this.TENCENT_API_URL;
        }
        
        // 5. 海外用户使用 Railway
        return this.CLOUD_API_URL || 'http://localhost:5000';
    }
};

// ==================== 高德地图 Key ====================
const DEFAULT_AMAP_KEY = 'a4fdcddda4024a6a4df12431a7e6c536';

// ==================== 宝藏类型配置 ====================
const treasureTypes = [
    { icon: '💎', name: '钻石', reward: 100, rarity: 'rare', probability: 0.1 },
    { icon: '👑', name: '皇冠', reward: 200, rarity: 'epic', probability: 0.05 },
    { icon: '💰', name: '金币', reward: 50, rarity: 'common', probability: 0.35 },
    { icon: '💍', name: '宝石', reward: 150, rarity: 'rare', probability: 0.1 },
    { icon: '🎁', name: '礼品', reward: 75, rarity: 'common', probability: 0.25 },
    { icon: '⚔️', name: '神器', reward: 300, rarity: 'legendary', probability: 0.03 },
    { icon: '🏆', name: '奖杯', reward: 250, rarity: 'epic', probability: 0.05 },
    { icon: '📿', name: '项链', reward: 120, rarity: 'rare', probability: 0.07 }
];

// ==================== 等级系统 ====================
const levelSystem = {
    getExpForLevel: (level) => Math.floor(100 * Math.pow(1.5, level - 1)),
    calculateLevel: (totalExp) => {
        let level = 1;
        let expNeeded = 100;
        while (totalExp >= expNeeded) {
            totalExp -= expNeeded;
            level++;
            expNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
        }
        return { level, currentExp: totalExp, nextLevelExp: expNeeded };
    }
};

// ==================== 徽章系统 ====================
const badgeSystem = [
    { id: 'first_treasure', name: '初次探险', icon: '🎯', description: '发现第一个宝藏', condition: (stats) => stats.treasuresDiscovered >= 1 },
    { id: 'treasure_hunter', name: '宝藏猎人', icon: '🏹', description: '发现10个宝藏', condition: (stats) => stats.treasuresDiscovered >= 10 },
    { id: 'treasure_master', name: '寻宝大师', icon: '👑', description: '发现50个宝藏', condition: (stats) => stats.treasuresDiscovered >= 50 },
    { id: 'creator', name: '创造者', icon: '✨', description: '创建第一个宝藏', condition: (stats) => stats.treasuresCreated >= 1 },
    { id: 'popular', name: '人气王', icon: '❤️', description: '获得100个赞', condition: (stats) => stats.totalLikes >= 100 }
];

console.log('✅ config.js 加载完成');

