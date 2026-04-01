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
    script.src = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_KEY}&plugin=AMap.Geocoder,AMap.Geolocation,AMap.ConvertFrom`
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
      console.warn('⚠️ AMap.convertFrom 不可用，使用原始坐标')
      resolve({ lng: wgsLng, lat: wgsLat, converted: false })
      return
    }
    window.AMap.convertFrom([wgsLng, wgsLat], 'gps', (status, result) => {
      if (status === 'complete' && result.locations?.length) {
        const loc = result.locations[0]
        console.log('✅ WGS84→GCJ-02 转换成功')
        resolve({ lng: loc.lng, lat: loc.lat, converted: true })
      } else {
        console.warn('⚠️ 坐标转换失败，使用原始坐标')
        resolve({ lng: wgsLng, lat: wgsLat, converted: false })
      }
    })
  })
}

/**
 * 使用高德融合定位获取当前位置（更准确）
 */
function getAmapGeolocation() {
  return new Promise((resolve, reject) => {
    if (!window.AMap) return reject(new Error('AMap 未加载'))

    window.AMap.plugin('AMap.Geolocation', () => {
      const geolocation = new window.AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        convert: true,            // 自动转换为 GCJ-02
        showButton: false,
        showMarker: false,
        showCircle: false,
        panToLocation: false,
        zoomToAccuracy: false,
        GeoLocationFirst: true,   // 优先 GPS
        noIpLocate: 3,            // 禁用 IP 定位
        noGeoLocation: 0,
        useNative: true,
        needAddress: false,
        extensions: 'base'
      })

      geolocation.getCurrentPosition((status, result) => {
        if (status === 'complete') {
          const locationType = result.location_type || '未知'
          const accuracy = result.accuracy || 999

          // 拒绝 IP 定位
          if (locationType.includes('IP')) {
            console.warn('⚠️ 拒绝IP定位，精度太低')
            reject(new Error('IP定位精度太低，请开启GPS'))
            return
          }

          const lng = result.position.lng
          const lat = result.position.lat

          // 高德融合定位返回的已经是 GCJ-02，直接应用偏移修正
          const corrected = applyOffset(lng, lat, accuracy)

          resolve({
            lng: corrected.lng,
            lat: corrected.lat,
            accuracy,
            locationType,
            source: 'amap-geolocation'
          })
        } else {
          reject(new Error('高德定位失败: ' + (result?.message || '未知错误')))
        }
      })
    })
  })
}

/**
 * 使用浏览器原生 GPS 获取位置，然后转换坐标
 */
function getBrowserGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('浏览器不支持GPS定位'))
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

      console.log('📍 GPS 原始坐标 (WGS84):', { lng: wgsLng, lat: wgsLat, accuracy })

      // 网络定位偏移修正（精度 > 1km）
      if (accuracy > 1000) {
        const correctedLng = wgsLng + NETWORK_LOCATION_OFFSET.lng
        const correctedLat = wgsLat + NETWORK_LOCATION_OFFSET.lat
        console.log('🔧 应用网络定位偏移修正')
        const gcj02 = await convertWGS84toGCJ02(correctedLng, correctedLat)
        const final = applyOffset(gcj02.lng, gcj02.lat, accuracy)
        resolve({ ...final, accuracy, locationType: '网络定位（已修正）', source: 'browser-gps' })
        return
      }

      // WGS84 → GCJ-02
      const gcj02 = await convertWGS84toGCJ02(wgsLng, wgsLat)
      // 应用偏移修正
      const final = applyOffset(gcj02.lng, gcj02.lat, accuracy)

      resolve({
        ...final,
        accuracy,
        locationType: gcj02.converted ? 'GPS卫星定位' : 'GPS原始',
        source: 'browser-gps'
      })
    }

    // 先用 watchPosition 获取渐进精度
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const acc = pos.coords.accuracy
        if (!bestPosition || acc < bestPosition.coords.accuracy) {
          bestPosition = pos
          console.log(`📍 GPS 精度更新: ${acc.toFixed(1)}m`)
        }
        // 精度 < 50m 立即使用
        if (acc < 50) {
          settle(pos)
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )

    // 5 秒后用最佳结果
    setTimeout(() => {
      if (!settled && bestPosition) {
        settle(bestPosition)
      }
    }, 5000)

    // 10 秒超时
    setTimeout(() => {
      if (!settled) {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId)
        if (bestPosition) {
          settle(bestPosition)
        } else {
          reject(new Error('GPS定位超时'))
        }
      }
    }, 10000)
  })
}

/**
 * 获取当前位置（完整定位流程，移植自原项目）
 * 优先高德融合定位 → 回退浏览器 GPS → 失败抛出
 */
export async function getCurrentPosition() {
  // 优先尝试高德融合定位
  try {
    const pos = await getAmapGeolocation()
    console.log('✅ 高德融合定位成功:', pos)
    return pos
  } catch (e) {
    console.warn('⚠️ 高德融合定位失败，回退浏览器GPS:', e.message)
  }

  // 回退到浏览器 GPS + 坐标转换
  try {
    const pos = await getBrowserGPS()
    console.log('✅ 浏览器GPS定位成功:', pos)
    return pos
  } catch (e) {
    console.error('❌ 所有定位方式均失败:', e.message)
    throw new Error('定位失败，请使用手动校准')
  }
}

/**
 * 实时追踪位置（watchPosition + 坐标转换 + 偏移修正）
 * 返回 watchId，调用 stopTracking(watchId) 停止
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
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )

  return watchId
}

export function stopTracking(watchId) {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
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
