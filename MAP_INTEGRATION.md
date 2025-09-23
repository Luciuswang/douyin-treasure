# 🗺️ 抖宝地图集成指南

## 📋 当前状态

目前我们有以下地图版本：

1. **基础模拟地图**: `treasure-map.html` - 简单的CSS模拟地图
2. **高德地图版本**: `amap-treasure.html` - 集成高德地图API（需要API Key）

## 🔑 获取高德地图API Key

### 步骤1：注册高德开发者账号
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 点击"注册/登录"
3. 完成开发者认证

### 步骤2：创建应用
1. 登录后进入控制台
2. 点击"创建新应用"
3. 填写应用信息：
   - 应用名称：抖宝寻宝游戏
   - 应用类型：Web端(JS API)

### 步骤3：获取Key
1. 在应用管理中添加Key
2. 服务平台选择：Web端(JS API)
3. 复制生成的Key

## 🔧 配置高德地图

### 修改API Key
在 `amap-treasure.html` 文件中找到这一行：
```html
<script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_AMAP_KEY&plugin=AMap.Geolocation,AMap.Marker,AMap.InfoWindow"></script>
```

将 `YOUR_AMAP_KEY` 替换为你的实际API Key：
```html
<script src="https://webapi.amap.com/maps?v=2.0&key=你的实际Key&plugin=AMap.Geolocation,AMap.Marker,AMap.InfoWindow"></script>
```

### 真实高德地图初始化代码
```javascript
// 替换 createSimulatedMap() 函数为真实地图
function initRealAmapMap() {
    // 创建地图实例
    map = new AMap.Map('map-container', {
        zoom: 15,
        center: [116.397428, 39.90923], // 北京坐标
        mapStyle: 'amap://styles/normal'
    });
    
    // 添加地图控件
    map.addControl(new AMap.Scale());
    map.addControl(new AMap.ToolBar());
    
    // 地图加载完成事件
    map.on('complete', function() {
        showNotification('🗺️ 高德地图加载完成！', 'success');
    });
}

// 真实的获取位置函数
function getRealLocation() {
    const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
    
    geolocation.getCurrentPosition(function(status, result) {
        if (status === 'complete') {
            const lat = result.position.lat;
            const lng = result.position.lng;
            
            // 设置地图中心
            map.setCenter([lng, lat]);
            
            // 添加用户标记
            addUserMarkerOnMap(lat, lng);
            
            showNotification(`📍 位置获取成功！\n${result.formattedAddress}`, 'success');
        } else {
            showNotification('📍 定位失败：' + result.message, 'error');
        }
    });
}

// 在真实地图上添加用户标记
function addUserMarkerOnMap(lat, lng) {
    if (userMarker) {
        map.remove(userMarker);
    }
    
    userMarker = new AMap.Marker({
        position: [lng, lat],
        icon: new AMap.Icon({
            image: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                    <circle cx="16" cy="16" r="12" fill="#4CAF50" stroke="white" stroke-width="3"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">📍</text>
                </svg>
            `),
            size: new AMap.Size(32, 32)
        }),
        title: '我的位置'
    });
    
    map.add(userMarker);
}

// 在真实地图上添加宝藏标记
function addTreasureMarkerOnMap(treasureType, lat, lng) {
    const marker = new AMap.Marker({
        position: [lng, lat],
        icon: new AMap.Icon({
            image: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                    <circle cx="20" cy="20" r="18" fill="${treasureType.color}" stroke="white" stroke-width="2"/>
                    <text x="20" y="26" text-anchor="middle" fill="white" font-size="20">${treasureType.icon}</text>
                </svg>
            `),
            size: new AMap.Size(40, 40)
        }),
        title: treasureType.name
    });
    
    // 添加信息窗口
    const infoWindow = new AMap.InfoWindow({
        content: `
            <div class="treasure-info">
                <h4>${treasureType.name}</h4>
                <div>奖励: ${treasureType.reward} 抖币</div>
                <button onclick="discoverTreasure('${marker.getExtData().id}', '${treasureType.name}', ${treasureType.reward})" 
                        style="margin-top: 10px; padding: 5px 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    发现宝藏
                </button>
            </div>
        `
    });
    
    // 点击标记显示信息窗口
    marker.on('click', function() {
        infoWindow.open(map, marker.getPosition());
    });
    
    map.add(marker);
    treasureMarkers.push(marker);
    
    return marker;
}
```

## 🌐 其他地图选择

### 1. 百度地图
- API地址：https://lbsyun.baidu.com/
- 适合：国内用户，功能丰富

### 2. 腾讯地图
- API地址：https://lbs.qq.com/
- 适合：微信生态，社交功能

### 3. Google Maps（需要翻墙）
- API地址：https://developers.google.com/maps
- 适合：国际用户

### 4. OpenStreetMap (免费)
- 使用Leaflet.js：https://leafletjs.com/
- 完全免费，无需API Key

## 📱 移动端优化

### 触摸手势支持
```javascript
// 添加触摸事件支持
map.on('touchstart', function(e) {
    // 处理触摸开始
});

map.on('touchend', function(e) {
    // 处理触摸结束，可能是点击宝藏
});
```

### 设备方向支持
```javascript
// 监听设备方向
window.addEventListener('deviceorientation', function(event) {
    const alpha = event.alpha; // 指南针方向
    // 可以用来实现AR效果
});
```

## 🔒 安全配置

### 域名白名单
在高德控制台中设置允许的域名：
- 开发环境：`localhost`、`127.0.0.1`
- 生产环境：你的实际域名

### Key保护
```javascript
// 不要在前端暴露敏感Key，可以通过后端代理
const PROXY_API = '/api/map-proxy';

async function getMapData() {
    const response = await fetch(PROXY_API + '/nearby-treasures');
    return response.json();
}
```

## 🚀 部署建议

1. **开发阶段**：使用模拟地图快速开发
2. **测试阶段**：集成真实地图API
3. **生产阶段**：配置CDN和缓存

## 📞 技术支持

如果遇到问题：
1. 查看浏览器控制台错误
2. 检查API Key配置
3. 确认网络连接
4. 参考高德官方文档

---

**当前可以直接使用的文件：**
- `treasure-map.html` - 模拟地图（无需API Key）
- `amap-treasure.html` - 高德地图版本（需要配置API Key）

