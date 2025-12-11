/**
 * Totofun 突突翻 - 地图管理模块
 * 高德地图初始化、GPS定位、坐标转换
 */

// ==================== 地图状态 ====================
let map = null;
let userMarker = null;
let treasureMarkers = [];
let userLocation = null;
let watchId = null;
let isLocationSet = false;
let userLocationLocked = false;

// ==================== 设备检测 ====================
/**
 * 检测是否为移动设备
 * @returns {boolean}
 */
function isMobileDevice() {
    const ua = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

// ==================== 距离计算 ====================
/**
 * 计算两点之间的距离（米）
 * @param {Array|Object} pos1 - 位置1 [lng, lat] 或 {lat, lng}
 * @param {Array|Object} pos2 - 位置2 [lng, lat] 或 {lat, lng}
 * @returns {number} 距离（米）
 */
function calculateDistance(pos1, pos2) {
    const R = 6371000; // 地球半径(米)
    
    // 处理不同的坐标格式
    let lat1, lng1, lat2, lng2;
    if (Array.isArray(pos1)) {
        lng1 = pos1[0];
        lat1 = pos1[1];
    } else {
        lat1 = pos1.lat;
        lng1 = pos1.lng;
    }
    if (Array.isArray(pos2)) {
        lng2 = pos2[0];
        lat2 = pos2[1];
    } else {
        lat2 = pos2.lat;
        lng2 = pos2.lng;
    }
    
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
}

// ==================== 状态更新 ====================
/**
 * 更新状态显示
 * @param {string} message - 状态消息
 * @param {string} type - 状态类型 ('info', 'success', 'warning', 'error')
 * @param {boolean} showSpinner - 是否显示加载动画
 */
function updateStatus(message, type = 'info', showSpinner = false) {
    const statusBar = document.getElementById('status-bar');
    if (!statusBar) return;
    
    // 移除所有状态类
    statusBar.className = 'status-bar';
    
    // 添加对应的状态类
    statusBar.classList.add(`status-${type}`);
    
    // 构建消息HTML
    let html = message;
    if (showSpinner) {
        html = `<span class="loading"></span> ${message}`;
    }
    
    statusBar.innerHTML = html;
    
    // 控制台输出
    const icon = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    }[type] || 'ℹ️';
    
    console.log(`${icon} ${message}`);
}

// ==================== 地图管理器 ====================
const mapManager = {
    /**
     * 获取地图实例
     * @returns {Object|null}
     */
    getMap: () => map,
    
    /**
     * 获取用户位置
     * @returns {Array|null}
     */
    getUserLocation: () => userLocation,
    
    /**
     * 设置用户位置
     * @param {Array} location - [lng, lat]
     */
    setUserLocation: (location) => {
        userLocation = location;
        isLocationSet = true;
    },
    
    /**
     * 检查地图是否已初始化
     * @returns {boolean}
     */
    isMapInitialized: () => map !== null,
    
    /**
     * 检查位置是否已设置
     * @returns {boolean}
     */
    isLocationReady: () => isLocationSet,
    
    /**
     * 设置地图中心
     * @param {Array} center - [lng, lat]
     * @param {number} zoom - 缩放级别
     */
    setCenter: (center, zoom = 18) => {
        if (map) {
            map.setZoomAndCenter(zoom, center);
        }
    },
    
    /**
     * 添加标记
     * @param {Object} options - 标记选项
     * @returns {Object|null} 标记对象
     */
    addMarker: (options) => {
        if (!map || typeof AMap === 'undefined') return null;
        
        const marker = new AMap.Marker({
            position: options.position,
            content: options.content || null,
            icon: options.icon || null,
            offset: options.offset || new AMap.Pixel(-16, -32),
            zIndex: options.zIndex || 100
        });
        
        marker.setMap(map);
        return marker;
    },
    
    /**
     * 移除所有宝藏标记
     */
    clearTreasureMarkers: () => {
        treasureMarkers.forEach(marker => {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }
        });
        treasureMarkers = [];
    }
};

// ==================== 坐标转换工具 ====================
const coordinateUtils = {
    /**
     * WGS84 转 GCJ-02（使用高德API）
     * @param {number} lng - WGS84经度
     * @param {number} lat - WGS84纬度
     * @param {Function} callback - 回调函数(gcj02Lng, gcj02Lat)
     */
    wgs84ToGcj02: (lng, lat, callback) => {
        if (typeof AMap !== 'undefined' && AMap.convertFrom) {
            AMap.convertFrom([lng, lat], 'gps', function(status, result) {
                if (status === 'complete' && result.info === 'ok' && result.locations && result.locations.length > 0) {
                    const converted = result.locations[0];
                    callback(converted.lng, converted.lat);
                } else {
                    console.warn('坐标转换失败，使用原始坐标');
                    callback(lng, lat);
                }
            });
        } else {
            console.warn('AMap.convertFrom不可用，使用原始坐标');
            callback(lng, lat);
        }
    },
    
    /**
     * 格式化坐标显示
     * @param {number} coord - 坐标值
     * @param {number} decimals - 小数位数
     * @returns {string}
     */
    formatCoord: (coord, decimals = 6) => {
        return coord.toFixed(decimals);
    }
};

// ==================== 逆地理编码 ====================
/**
 * 获取地址
 * @param {Array} position - [lng, lat]
 * @param {Function} callback - 回调函数(address)
 */
function getAddress(position, callback) {
    if (typeof AMap === 'undefined') {
        callback('地址获取失败');
        return;
    }
    
    AMap.plugin('AMap.Geocoder', function() {
        const geocoder = new AMap.Geocoder({ timeout: 3000 });
        geocoder.getAddress(position, function(status, result) {
            if (status === 'complete' && result.info === 'OK') {
                callback(result.regeocode.formattedAddress);
            } else {
                callback('地址获取失败');
            }
        });
    });
}

console.log('✅ map.js 加载完成');

