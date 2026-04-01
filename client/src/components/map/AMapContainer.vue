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

let map = null
let userMarker = null
let treasureMarkers = []

const typeIcons = {
  note: '📝', coupon: '🎫', ticket: '🎬', job: '💼',
  event: '🎉', redpacket: '🧧', task: '📋', image: '🖼️', custom: '📦'
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

function renderTreasureMarkers(list) {
  treasureMarkers.forEach(m => map.remove(m))
  treasureMarkers = []
  if (!window.AMap || !list.length) return

  list.forEach(t => {
    const coords = t.location?.coordinates
    if (!coords || coords.length < 2) return

    const icon = typeIcons[t.type] || '📦'
    const discovered = t.isDiscovered

    const marker = new window.AMap.Marker({
      position: [coords[0], coords[1]],
      content: `<div style="font-size:1.6rem;filter:${discovered ? 'grayscale(1) opacity(.5)' : 'none'};cursor:pointer">${icon}</div>`,
      offset: new window.AMap.Pixel(-14, -14),
      zIndex: 100,
      extData: t
    })

    marker.on('click', () => emit('treasure-click', t))
    map.add(marker)
    treasureMarkers.push(marker)
  })
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
</style>
