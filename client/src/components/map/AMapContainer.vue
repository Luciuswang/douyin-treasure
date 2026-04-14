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
    <div v-if="clusterList.length" class="cluster-picker" @click.self="dismissCluster">
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
            <span class="ci-color" :style="{ background: typeColors[t.type] || '#636e72' }"></span>
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
  calibrating: { type: Boolean, default: false },
  filterTypes: { type: Set, default: () => new Set() },
  searchKeyword: { type: String, default: '' }
})

const emit = defineEmits(['map-ready', 'treasure-click', 'map-click', 'filtered-update'])
const mapEl = ref(null)
const mapStore = useMapStore()
const treasureStore = useTreasureStore()
const loading = ref(true)
const error = ref('')
const clusterList = ref([])

let map = null
let userMarker = null
let allMarkers = []
let cachedValidItems = []
const MARKER_SIZE = 44

const typeIcons = {
  note: '📝', coupon: '🎫', ticket: '🎬', job: '💼',
  event: '🎉', redpacket: '🧧', task: '📋', image: '🖼️', custom: '📦', social: '💕', house: '🏠'
}
const typeLabels = {
  note: '笔记', coupon: '优惠券', ticket: '票券', job: '招聘',
  event: '活动', redpacket: '红包', task: '任务', image: '图片', custom: '自定义', social: '缘分', house: '房屋'
}
const typeColors = {
  social: '#ff6b9d',
  coupon: '#f0932b',
  job: '#0984e3',
  event: '#6c5ce7',
  redpacket: '#d63031',
  ticket: '#e17055',
  task: '#00b894',
  note: '#74b9ff',
  image: '#fdcb6e',
  custom: '#636e72',
  house: '#e67e22'
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

    map.on('zoomend', () => {
      if (cachedValidItems.length) rebuildMarkers()
    })

    map.on('complete', () => {
      loading.value = false
      emit('map-ready')
    })

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
  cachedValidItems = (list || []).filter(t => {
    const coords = t.location?.coordinates
    if (!coords || coords.length < 2) return false
    const maxed = t.settings?.maxDiscoverers > 0 &&
                  (t.stats?.discoveries || 0) >= t.settings.maxDiscoverers
    if (maxed && !t.isDiscovered) return false
    return true
  })
  rebuildMarkers()
}, { deep: true })

watch(() => [props.filterTypes, props.searchKeyword], () => {
  if (map && cachedValidItems.length) rebuildMarkers()
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

function lngLatToWorldPx(lng, lat, zoom) {
  const scale = 256 * Math.pow(2, zoom)
  const x = ((lng + 180) / 360) * scale
  const latRad = lat * Math.PI / 180
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale
  return { x, y }
}

function groupByPixel(items, zoom) {
  const entries = items.map(t => {
    const [lng, lat] = t.location.coordinates
    const px = lngLatToWorldPx(lng, lat, zoom)
    return { t, x: px.x, y: px.y }
  })

  const threshold = MARKER_SIZE * MARKER_SIZE
  const used = new Set()
  const groups = []

  for (let i = 0; i < entries.length; i++) {
    if (used.has(i)) continue
    const g = [entries[i].t]
    used.add(i)

    for (let j = i + 1; j < entries.length; j++) {
      if (used.has(j)) continue
      const dx = entries[i].x - entries[j].x
      const dy = entries[i].y - entries[j].y
      if (dx * dx + dy * dy < threshold) {
        g.push(entries[j].t)
        used.add(j)
      }
    }
    groups.push(g)
  }
  return groups
}

function applyFilters(items) {
  let result = items
  if (props.filterTypes.size > 0) {
    result = result.filter(t => props.filterTypes.has(t.type || 'custom'))
  }
  if (props.searchKeyword.trim()) {
    const kw = props.searchKeyword.trim().toLowerCase()
    result = result.filter(t =>
      (t.title || '').toLowerCase().includes(kw) ||
      (t.description || '').toLowerCase().includes(kw) ||
      (typeLabels[t.type] || '').includes(kw)
    )
  }
  return result
}

function rebuildMarkers() {
  allMarkers.forEach(m => map.remove(m))
  allMarkers = []
  if (!window.AMap || !cachedValidItems.length) {
    emit('filtered-update', [])
    return
  }

  const visible = applyFilters(cachedValidItems)
  emit('filtered-update', visible)

  const zoom = map.getZoom()
  const groups = groupByPixel(visible, zoom)

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
  map.add(marker)
  allMarkers.push(marker)
}

function buildPieGradient(group) {
  const counts = {}
  group.forEach(t => {
    const type = t.type || 'custom'
    counts[type] = (counts[type] || 0) + 1
  })

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const total = group.length
  const stops = []
  let angle = 0

  sorted.forEach(([type, cnt]) => {
    const color = typeColors[type] || '#636e72'
    const slice = (cnt / total) * 360
    stops.push(`${color} ${angle}deg ${angle + slice}deg`)
    angle += slice
  })

  return { gradient: `conic-gradient(${stops.join(', ')})`, counts: sorted }
}

function addClusterMarker(group) {
  const avgLng = group.reduce((s, t) => s + t.location.coordinates[0], 0) / group.length
  const avgLat = group.reduce((s, t) => s + t.location.coordinates[1], 0) / group.length
  const count = group.length
  const size = Math.max(52, Math.min(36 + count * 3, 68))
  const innerSize = Math.round(size * 0.6)

  const { gradient } = buildPieGradient(group)

  const html = `<div class="t-cluster-pie" style="width:${size}px;height:${size}px;background:${gradient}" data-cluster="1">` +
    `<span class="t-cluster-num" style="width:${innerSize}px;height:${innerSize}px;line-height:${innerSize}px">${count}</span>` +
    `</div>`

  const marker = new window.AMap.Marker({
    position: [avgLng, avgLat],
    content: html,
    offset: new window.AMap.Pixel(-size / 2, -size / 2),
    zIndex: 120,
    clickable: true
  })

  const handler = () => {
    clusterOpenedAt = Date.now()
    clusterList.value = group
  }

  marker.on('click', (e) => {
    e.originEvent?.stopPropagation?.()
    handler()
  })

  map.add(marker)
  allMarkers.push(marker)

  nextTick(() => {
    try {
      const dom = marker.dom || marker.getContentDom?.()
      const el = dom?.querySelector?.('[data-cluster]') || dom
      if (el) {
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
          handler()
        })
      }
    } catch {}
  })
}

let clusterOpenedAt = 0

function dismissCluster() {
  if (Date.now() - clusterOpenedAt > 400) {
    clusterList.value = []
  }
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

.ci-color {
  width: 4px;
  min-height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
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

.t-cluster-pie {
  border-radius: 50%;
  box-shadow: 0 2px 12px rgba(0,0,0,.25);
  border: 2.5px solid #fff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.t-cluster-num {
  background: #fff;
  border-radius: 50%;
  display: block;
  text-align: center;
  font-weight: 800;
  font-size: 13px;
  color: #333;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}
</style>
