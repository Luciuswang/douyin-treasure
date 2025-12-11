/**
 * Totofun 突突翻 - 工具函数
 * 通用工具函数集合
 */

// ==================== UI 工具函数 ====================

/**
 * 更新状态显示
 * @param {string} message - 状态消息
 * @param {string} type - 类型: 'info', 'success', 'error', 'warning'
 * @param {boolean} showLoading - 是否显示加载动画
 */
function updateStatus(message, type = 'info', showLoading = false) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.className = `status ${type}`;
        statusEl.innerHTML = `
            ${showLoading ? '<span class="loading"></span>' : ''}
            ${message}
        `;
    }
}

/**
 * 更新 GPS 数据显示
 * @param {Object} data - GPS 数据对象
 */
function updateGPSData(data) {
    const gpsEl = document.getElementById('gps-data');
    if (gpsEl) {
        gpsEl.innerHTML = data;
    }
}

/**
 * 更新统计数据显示
 * @param {number} accuracy - 定位精度（米）
 */
function updateStats(accuracy = 0) {
    const treasuresEl = document.getElementById('total-treasures');
    const accuracyEl = document.getElementById('accuracy');
    const userNameEl = document.getElementById('user-name');
    const userLevelEl = document.getElementById('user-level');
    
    if (treasuresEl) {
        treasuresEl.textContent = userData.stats.treasuresDiscovered || 0;
    }
    if (accuracyEl) {
        accuracyEl.textContent = `${Math.round(accuracy)}m`;
    }
    if (userNameEl) {
        userNameEl.textContent = userData.username || '游客';
    }
    if (userLevelEl) {
        userLevelEl.textContent = `LV.${userData.level.currentLevel}`;
    }
}

// ==================== 距离计算 ====================

/**
 * 计算两点之间的距离（米）
 * 使用 Haversine 公式
 * @param {Object} pos1 - 位置1 {lat, lng}
 * @param {Object} pos2 - 位置2 {lat, lng}
 * @returns {number} 距离（米）
 */
function calculateDistance(pos1, pos2) {
    const R = 6371000; // 地球半径（米）
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ==================== 设备检测 ====================

/**
 * 检测是否为移动设备
 * @returns {boolean}
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 检测是否为 iOS 设备
 * @returns {boolean}
 */
function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * 检测是否为华为设备
 * @returns {boolean}
 */
function isHuaweiDevice() {
    return /HUAWEI|HONOR/i.test(navigator.userAgent);
}

// ==================== 随机数工具 ====================

/**
 * 生成指定范围内的随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number}
 */
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * 生成随机 ID
 * @param {number} length - ID 长度
 * @returns {string}
 */
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ==================== 时间格式化 ====================

/**
 * 格式化时间为相对时间
 * @param {Date|string|number} timestamp - 时间戳
 * @returns {string}
 */
function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// ==================== HTML 转义 ====================

/**
 * HTML 转义，防止 XSS
 * @param {string} text - 原始文本
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('✅ utils.js 加载完成');

