const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || 'a4fdcddda4024a6a4df12431a7e6c536'
const AMAP_VERSION = '2.0'
let loadPromise = null

// ==================== 定位偏移修正配置 ====================
// 基于实测数据计算的偏移量（上海地区）
// GPS定位: (121.399377, 31.165466) → 真实位置: (121.404100, 31.163571)
const LOCATION_OFFSET = {
  enabled: true,
  lng: 0.004723,       // 经度修正值（向东偏移约400米）
  lat: -0.001895,      // 纬度修正值（向南偏移约210米）
  onlyForMobile: true, // 仅对移动设备应用
  minAccuracy: 100     // 仅在精度低于此值时应用（米）
}

// 网络定位偏移修正（针对精度 > 1km 的网络定位）
const NETWORK_LOCATION_OFFSET = {
  lng: 0.0151,  // 向东偏移约 1.51km
  lat: 0.0012   // 向北偏移约 133m
}

export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 加载高德地图 SDK
 */
export function loadAMap() {
  if (loadPromise) return loadPromise
  if (window.AMap) return Promise.resolve(window.AMap)

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_KEY}&plugin=AMap.Geocoder,AMap.Geolocation,AMap.ConvertFrom,AMap.MarkerCluster`
    script.onload = () => {
      if (window.AMap) resolve(window.AMap)
      else reject(new Error('AMap SDK 加载失败'))
    }
    script.onerror = () => reject(new Error('AMap SDK 网络加载失败'))
    document.head.appendChild(script)
  })

  return loadPromise
}

/**
 * 对 GCJ-02 坐标应用偏移修正
 */
function applyOffset(lng, lat, accuracy) {
  const mobile = isMobileDevice()
  if (!LOCATION_OFFSET.enabled) return { lng, lat }
  const shouldApply = (!LOCATION_OFFSET.onlyForMobile || mobile) &&
                      (accuracy <= LOCATION_OFFSET.minAccuracy)
  if (shouldApply) {
    console.log('🔧 应用定位偏移修正', { before: { lng, lat } })
    lng += LOCATION_OFFSET.lng
    lat += LOCATION_OFFSET.lat
    console.log('📍 修正后:', { lng, lat })
  }
  return { lng, lat }
}

/**
 * WGS84 → GCJ-02 坐标转换（通过 AMap.convertFrom）
 */
function convertWGS84toGCJ02(wgsLng, wgsLat) {
  return new Promise(resolve => {
    if (!window.AMap || !window.AMap.convertFrom) {
      resolve({ lng: wgsLng, lat: wgsLat, converted: false })
      return
    }
    window.AMap.convertFrom([wgsLng, wgsLat], 'gps', (status, result) => {
      if (status === 'complete' && result.locations?.length) {
        const loc = result.locations[0]
        resolve({ lng: loc.lng, lat: loc.lat, converted: true })
      } else {
        resolve({ lng: wgsLng, lat: wgsLat, converted: false })
      }
    })
  })
}

/**
 * 高德融合定位
 * 移动端：GPS 优先 + IP 兜底
 * PC 端：跳过浏览器 GPS（PC 没有 GPS 芯片），直接用 IP/网络定位
 */
function getAmapGeolocation() {
  return new Promise((resolve, reject) => {
    if (!window.AMap) return reject(new Error('AMap 未加载'))

    const mobile = isMobileDevice()

    window.AMap.plugin('AMap.Geolocation', () => {
      const geolocation = new window.AMap.Geolocation({
        enableHighAccuracy: mobile,
        timeout: mobile ? 20000 : 10000,
        maximumAge: 30000,
        convert: true,
        showButton: false,
        showMarker: false,
        showCircle: false,
        panToLocation: false,
        zoomToAccuracy: false,
        GeoLocationFirst: mobile,    // 移动端优先 GPS
        noIpLocate: 0,               // 允许 IP 定位
        noGeoLocation: mobile ? 0 : 3, // PC 端跳过浏览器定位（会被拒绝）
        useNative: mobile,
        needAddress: true,
        extensions: 'base'
      })

      geolocation.getCurrentPosition((status, result) => {
        if (status === 'complete') {
          const locationType = result.location_type || '未知'
          const accuracy = result.accuracy || 999
          const lng = result.position.lng
          const lat = result.position.lat

          console.log('📍 高德定位:', { locationType, accuracy, lng, lat, device: mobile ? '移动' : 'PC' })

          // IP/网络定位 — 接受但标记为粗略
          if (locationType.includes('IP') || accuracy > 1000) {
            console.warn('⚠️ IP/网络定位，精度低，建议手动校准')
            const corrLng = lng + NETWORK_LOCATION_OFFSET.lng
            const corrLat = lat + NETWORK_LOCATION_OFFSET.lat
            resolve({
              lng: corrLng, lat: corrLat,
              accuracy,
              locationType: locationType + '（粗略）',
              source: 'amap-ip',
              rough: true
            })
            return
          }

          // GPS/WiFi/基站 — 高精度
          const corrected = applyOffset(lng, lat, accuracy)
          resolve({
            lng: corrected.lng,
            lat: corrected.lat,
            accuracy,
            locationType,
            source: 'amap-geolocation',
            rough: false
          })
        } else {
          reject(new Error('高德定位失败: ' + (result?.message || '未知错误')))
        }
      })
    })
  })
}

/**
 * 浏览器原生 GPS（WGS84 → GCJ-02 + 偏移修正）
 */
function getBrowserGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('浏览器不支持GPS'))
    }

    let bestPosition = null
    let watchId = null
    let settled = false

    const settle = async (position) => {
      if (settled) return
      settled = true
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
      }

      const wgsLng = position.coords.longitude
      const wgsLat = position.coords.latitude
      const accuracy = position.coords.accuracy

      console.log('📍 GPS (WGS84):', { lng: wgsLng, lat: wgsLat, accuracy })

      // 网络定位偏移修正（精度 > 1km）
      if (accuracy > 1000) {
        const gcj02 = await convertWGS84toGCJ02(
          wgsLng + NETWORK_LOCATION_OFFSET.lng,
          wgsLat + NETWORK_LOCATION_OFFSET.lat
        )
        const final = applyOffset(gcj02.lng, gcj02.lat, accuracy)
        resolve({ ...final, accuracy, locationType: '网络定位（已修正）', source: 'browser-gps', rough: true })
        return
      }

      const gcj02 = await convertWGS84toGCJ02(wgsLng, wgsLat)
      const final = applyOffset(gcj02.lng, gcj02.lat, accuracy)
      resolve({
        ...final, accuracy,
        locationType: gcj02.converted ? 'GPS卫星定位' : 'GPS原始',
        source: 'browser-gps',
        rough: accuracy > 200
      })
    }

    watchId = navigator.geolocation.watchPosition(
      pos => {
        const acc = pos.coords.accuracy
        if (!bestPosition || acc < bestPosition.coords.accuracy) {
          bestPosition = pos
          console.log(`📍 GPS 精度: ${acc.toFixed(0)}m`)
        }
        if (acc < 50) settle(pos)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )

    // 8 秒后用最佳结果
    setTimeout(() => {
      if (!settled && bestPosition) settle(bestPosition)
    }, 8000)

    // 15 秒超时
    setTimeout(() => {
      if (!settled) {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId)
        if (bestPosition) settle(bestPosition)
        else reject(new Error('GPS定位超时'))
      }
    }, 15000)
  })
}

/**
 * 获取当前位置 — 完整定位流程
 * 高德融合 → 浏览器GPS → 默认位置（上海）
 * 永远不会抛出错误，至少返回一个粗略位置
 */
export async function getCurrentPosition() {
  // 1. 高德融合定位
  try {
    const pos = await getAmapGeolocation()
    console.log('✅ 高德定位成功:', pos)
    return pos
  } catch (e) {
    console.warn('⚠️ 高德定位失败，尝试浏览器GPS:', e.message)
  }

  // 2. 浏览器 GPS（仅移动端尝试，PC 没有 GPS 芯片）
  if (isMobileDevice()) {
    try {
      const pos = await getBrowserGPS()
      console.log('✅ 浏览器GPS成功:', pos)
      return pos
    } catch (e) {
      console.warn('⚠️ 浏览器GPS也失败:', e.message)
    }
  } else {
    console.log('ℹ️ PC端跳过浏览器GPS')
  }

  // 3. 默认位置（上海），提示用户手动校准
  console.warn('⚠️ 所有定位失败，使用默认位置')
  return {
    lng: 121.473701,
    lat: 31.230416,
    accuracy: 10000,
    locationType: '默认位置（上海）',
    source: 'default',
    rough: true
  }
}

/**
 * 实时追踪位置
 */
export function startTracking(onUpdate) {
  if (!navigator.geolocation) return null

  let lastUpdate = 0
  const MIN_INTERVAL = 2000

  const watchId = navigator.geolocation.watchPosition(
    async pos => {
      const now = Date.now()
      if (now - lastUpdate < MIN_INTERVAL) return

      const wgsLng = pos.coords.longitude
      const wgsLat = pos.coords.latitude
      const accuracy = pos.coords.accuracy

      const gcj02 = await convertWGS84toGCJ02(wgsLng, wgsLat)
      const final = applyOffset(gcj02.lng, gcj02.lat, accuracy)

      lastUpdate = now
      onUpdate({ lng: final.lng, lat: final.lat, accuracy })
    },
    err => console.error('📍 追踪错误:', err.message),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
  )

  return watchId
}

export function stopTracking(watchId) {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
}

/**
 * 位置安全检测 — 通过逆地理编码判断是否为危险区域
 * 返回 { safe: boolean, reason?: string, detail?: string }
 */
export async function checkLocationSafety(lng, lat) {
  const DANGEROUS_POIS = [
    '河流', '湖泊', '水库', '海域', '池塘', '水渠', '运河',
    '高速公路', '铁路', '高架', '立交桥', '隧道', '收费站',
    '施工', '工地', '军事', '靶场', '禁区', '变电站', '核电'
  ]

  try {
    await loadAMap()

    const result = await new Promise((resolve, reject) => {
      const geocoder = new window.AMap.Geocoder({ extensions: 'all' })
      geocoder.getAddress([lng, lat], (status, res) => {
        if (status === 'complete') resolve(res)
        else reject(new Error('逆地理编码失败'))
      })
    })

    const component = result.regeocode?.addressComponent || {}
    const desc = result.regeocode?.formattedAddress || ''
    const pois = result.regeocode?.pois || []
    const roads = result.regeocode?.roads || []

    // 检查最近的 POI 名称和类型
    for (const poi of pois.slice(0, 10)) {
      const name = poi.name || ''
      const poiType = poi.type || ''
      for (const keyword of DANGEROUS_POIS) {
        if (name.includes(keyword) || poiType.includes(keyword)) {
          return { safe: false, reason: 'dangerous_poi', detail: `附近有危险区域：${name}` }
        }
      }
    }

    // 检查道路类型（高速公路、匝道）
    for (const road of roads.slice(0, 5)) {
      const name = road.name || ''
      if (name.includes('高速') || name.includes('快速路')) {
        return { safe: false, reason: 'highway', detail: `附近为高速公路：${name}` }
      }
    }

    // 检查地址描述中的危险关键词
    const allText = desc + ' ' + (component.township || '')
    for (const keyword of DANGEROUS_POIS) {
      if (allText.includes(keyword)) {
        return { safe: false, reason: 'dangerous_area', detail: `该区域可能存在危险：${keyword}` }
      }
    }

    return { safe: true }
  } catch (e) {
    console.warn('安全检测失败，放行:', e.message)
    return { safe: true }
  }
}

/**
 * 计算两点之间距离（米），Haversine
 */
export function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
