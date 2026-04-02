<template>
  <div class="amap-wrapper">
    <div ref="mapEl" class="amap-container"></div>
    <div v-if="loading" class="map-overlay">
      <span>🗺️ 地图加载中...</span>
    </div>
    <div v-if="error" class="map-overlay map-error">
      <span>{{ error }}</span>
      <button @click="initMap">重试</button>
    </div>
    <div v-if="calibrating" class="calibration-banner">
      📍 手动校准模式：请在地图上点击您的真实位置
    </div>

    <!-- 重叠宝藏选择列表 -->
    <div v-if="clusterList.length" class="cluster-picker" @click.self="clusterList = []">
      <div class="cluster-sheet">
        <div class="cluster-header">
          <span>📍 此处有 {{ clusterList.length }} 个宝藏</span>
          <button @click="clusterList = []">×</button>
        </div>
        <div class="cluster-items">
          <div
            v-for="t in clusterList" :key="t._id"
            class="cluster-item"
            @click="pickFromCluster(t)"
          >
            <span class="ci-icon">{{ typeIcons[t.type] || '📦' }}</span>
            <div class="ci-info">
              <strong>{{ t.title }}</strong>
              <span class="ci-meta">{{ typeLabels[t.type] || t.type }} · {{ t.stats?.discoveries || 0 }}人发现</span>
            </div>
            <span v-if="t.isDiscovered" class="ci-badge ci-done">已发现</span>
            <span v-else class="ci-badge ci-go">前往</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { loadAMap } from '../../services/amap.js'
import { useMapStore } from '../../stores/map.js'
import { useTreasureStore } from '../../stores/treasure.js'

const props = defineProps({
  calibrating: { type: Boolean, default: false }
})

const emit = defineEmits(['map-ready', 'treasure-click', 'map-click'])
const mapEl = ref(null)
const mapStore = useMapStore()
const treasureStore = useTreasureStore()
const loading = ref(true)
const error = ref('')
const clusterList = ref([])

let map = null
let userMarker = null
let allMarkers = []

const typeIcons = {
  note: '📝', coupon: '🎫', ticket: '🎬', job: '💼',
  event: '🎉', redpacket: '🧧', task: '📋', image: '🖼️', custom: '📦', social: '💕'
}
const typeLabels = {
  note: '笔记', coupon: '优惠券', ticket: '票券', job: '招聘',
  event: '活动', redpacket: '红包', task: '任务', image: '图片', custom: '自定义', social: '缘分'
}

async function initMap() {
  loading.value = true
  error.value = ''
  try {
    const AMap = await loadAMap()
    await nextTick()

    if (!mapEl.value) {
      error.value = '地图容器未就绪'
      return
    }

    map = new AMap.Map(mapEl.value, {
      zoom: 16,
      center: [121.4737, 31.2304],
      viewMode: '2D',
      showLabel: true,
      mapStyle: 'amap://styles/normal',
      resizeEnable: true,
      touchZoom: true,
      scrollWheel: true,
      dragEnable: true,
      zoomEnable: true,
      doubleClickZoom: true
    })

    map.on('click', e => {
      emit('map-click', { lng: e.lnglat.lng, lat: e.lnglat.lat })
    })

    map.on('touchend', e => {
      if (props.calibrating && e.lnglat) {
        emit('map-click', { lng: e.lnglat.lng, lat: e.lnglat.lat })
      }
    })

    map.on('complete', () => {
      loading.value = false
      emit('map-ready')
    })

    // 3秒兜底
    setTimeout(() => {
      if (loading.value) {
        loading.value = false
        emit('map-ready')
      }
    }, 3000)
  } catch (err) {
    console.error('地图初始化失败:', err)
    loading.value = false
    error.value = '地图加载失败，请检查网络后重试'
  }
}

onMounted(() => { initMap() })

watch(() => mapStore.mapCenter, center => {
  if (!map || !center) return
  map.setZoomAndCenter(18, [center.lng, center.lat])
  // 多次确认中心位置，对抗可能的重置
  ;[100, 300, 800].forEach(delay => {
    setTimeout(() => {
      if (map) map.setCenter([center.lng, center.lat])
    }, delay)
  })
})

watch(() => mapStore.userLocation, loc => {
  if (!map || !loc) return
  updateUserMarker(loc)
}, { deep: true })

watch(() => treasureStore.nearbyTreasures, list => {
  if (!map) return
  renderTreasureMarkers(list)
}, { deep: true })

function updateUserMarker(loc) {
  if (!window.AMap) return
  const pos = [loc.lng, loc.lat]
  if (userMarker) {
    userMarker.setPosition(pos)
  } else {
    userMarker = new window.AMap.Marker({
      position: pos,
      content: `<div style="width:16px;height:16px;background:#4285f4;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(66,133,244,.6)"></div>`,
      offset: new window.AMap.Pixel(-11, -11),
      zIndex: 200
    })
    map.add(userMarker)
  }
}

function distMeters(lng1, lat1, lng2, lat2) {
  const R = 6378137
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function groupByProximity(items, threshold = 40) {
  const used = new Set()
  const groups = []

  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue
    const g = [items[i]]
    used.add(i)
    const ci = items[i].location.coordinates

    for (let j = i + 1; j < items.length; j++) {
      if (used.has(j)) continue
      const cj = items[j].location.coordinates
      if (distMeters(ci[0], ci[1], cj[0], cj[1]) < threshold) {
        g.push(items[j])
        used.add(j)
      }
    }
    groups.push(g)
  }
  return groups
}

function renderTreasureMarkers(list) {
  allMarkers.forEach(m => map.remove(m))
  allMarkers = []
  if (!window.AMap || !list.length) return

  const validItems = list.filter(t => {
    const coords = t.location?.coordinates
    if (!coords || coords.length < 2) return false
    const maxed = t.settings?.maxDiscoverers > 0 &&
                  (t.stats?.discoveries || 0) >= t.settings.maxDiscoverers
    if (maxed && !t.isDiscovered) return false
    return true
  })

  const groups = groupByProximity(validItems)

  groups.forEach(group => {
    if (group.length === 1) {
      addSingleMarker(group[0])
    } else {
      addClusterMarker(group)
    }
  })
}

function addSingleMarker(t) {
  const coords = t.location.coordinates
  const discovered = t.isDiscovered
  const icon = typeIcons[t.type] || '📦'

  let markerHTML
  if (discovered) {
    markerHTML = `<div class="t-marker t-found">${icon}</div>`
  } else {
    markerHTML = `<div class="t-marker t-active"><span class="t-pulse"></span>${icon}</div>`
  }

  const marker = new window.AMap.Marker({
    position: [coords[0], coords[1]],
    content: markerHTML,
    offset: new window.AMap.Pixel(-22, -22),
    zIndex: discovered ? 80 : 100
  })

  marker.on('click', () => emit('treasure-click', t))
  marker.on('touchend', e => {
    e.originEvent?.stopPropagation?.()
    emit('treasure-click', t)
  })
  map.add(marker)
  allMarkers.push(marker)
}

function addClusterMarker(group) {
  const avgLng = group.reduce((s, t) => s + t.location.coordinates[0], 0) / group.length
  const avgLat = group.reduce((s, t) => s + t.location.coordinates[1], 0) / group.length
  const size = Math.min(28 + group.length * 4, 56)

  const marker = new window.AMap.Marker({
    position: [avgLng, avgLat],
    content: `<div class="t-cluster" style="width:${size}px;height:${size}px;line-height:${size}px">${group.length}</div>`,
    offset: new window.AMap.Pixel(-size / 2, -size / 2),
    zIndex: 120
  })

  const handler = () => { clusterList.value = group }
  marker.on('click', handler)
  marker.on('touchend', e => {
    e.originEvent?.stopPropagation?.()
    handler()
  })
  map.add(marker)
  allMarkers.push(marker)
}

function pickFromCluster(t) {
  clusterList.value = []
  emit('treasure-click', t)
}

onUnmounted(() => {
  if (map) map.destroy()
})
</script>

<style scoped>
.amap-wrapper {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
}

.amap-container {
  width: 100%;
  height: 100%;
}

.map-overlay {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255,255,255,.9);
  padding: 16px 24px;
  border-radius: 12px;
  font-size: .9rem;
  color: #333;
  z-index: 10;
  text-align: center;
}

.map-error button {
  display: block;
  margin: 10px auto 0;
  padding: 8px 20px;
  background: #00d4aa;
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.calibration-banner {
  position: absolute;
  top: 0; left: 0; right: 0;
  background: rgba(255, 107, 107, .9);
  color: #fff;
  text-align: center;
  padding: 8px;
  font-size: .85rem;
  font-weight: 600;
  z-index: 20;
  animation: pulse-bg 1.5s infinite;
}

@keyframes pulse-bg {
  0%, 100% { opacity: 1; }
  50% { opacity: .7; }
}

.cluster-picker {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,.4);
  z-index: 500;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.cluster-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 420px;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  animation: sheet-up .25s ease-out;
}

@keyframes sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.cluster-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  font-size: .95rem;
}

.cluster-header button {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #999;
  cursor: pointer;
  padding: 0 4px;
}

.cluster-items {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.cluster-item {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  gap: 12px;
  -webkit-tap-highlight-color: transparent;
}

.cluster-item:active {
  background: #f0faf7;
}

.ci-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
}

.ci-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ci-info strong {
  font-size: .95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ci-meta {
  font-size: .78rem;
  color: #999;
}

.ci-badge {
  font-size: .75rem;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.ci-done {
  background: #eee;
  color: #999;
}

.ci-go {
  background: #e8faf5;
  color: #00d4aa;
}
</style>

<style>
/* 宝藏标记样式（非 scoped，因为 AMap Marker content 在 DOM 外） */
.t-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.t-marker.t-active {
  width: 44px;
  height: 44px;
  font-size: 1.8rem;
  background: rgba(255,255,255,.85);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,.2);
}

.t-marker.t-found {
  width: 30px;
  height: 30px;
  font-size: 1.1rem;
  opacity: .45;
  filter: grayscale(1);
}

.t-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 212, 170, .3);
  animation: t-breathe 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes t-breathe {
  0%, 100% { transform: scale(1); opacity: .3; }
  50% { transform: scale(1.6); opacity: 0; }
}

.t-cluster {
  background: linear-gradient(135deg, #00d4aa, #00b894);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(0, 212, 170, .5);
  border: 2px solid #fff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
