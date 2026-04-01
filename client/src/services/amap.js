const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || '4a8a0168d872e89fbc6b4d8a27a85e42'
const AMAP_VERSION = '2.0'
let loadPromise = null

export function loadAMap() {
  if (loadPromise) return loadPromise
  if (window.AMap) return Promise.resolve(window.AMap)

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_KEY}&plugin=AMap.Geocoder,AMap.Geolocation`
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
 * 获取浏览器 GPS 定位（WGS84），然后通过 AMap.convertFrom 转为 GCJ-02
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('浏览器不支持定位'))
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { longitude, latitude, accuracy } = pos.coords
        if (!window.AMap) {
          resolve({ lng: longitude, lat: latitude, accuracy })
          return
        }
        window.AMap.convertFrom([longitude, latitude], 'gps', (status, result) => {
          if (status === 'complete' && result.locations?.length) {
            const loc = result.locations[0]
            resolve({ lng: loc.lng, lat: loc.lat, accuracy })
          } else {
            resolve({ lng: longitude, lat: latitude, accuracy })
          }
        })
      },
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
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
