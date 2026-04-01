<template>
  <div class="map-page">
    <LocationBar :status="locationStatus" />
    <div class="map-wrap">
      <AMapContainer
        :calibrating="calibrating"
        @map-ready="onMapReady"
        @treasure-click="onTreasureClick"
        @map-click="onMapClick"
      />
    </div>

    <div class="map-controls">
      <button class="ctrl-btn" @click="relocate" title="重新定位">📍</button>
      <button class="ctrl-btn" :class="{ active: mapStore.tracking }" @click="toggleTracking" title="实时追踪">🚶</button>
      <button class="ctrl-btn" :class="{ active: calibrating }" @click="toggleCalibration" title="手动校准位置">✏️</button>
      <button class="ctrl-btn" @click="showPublish = true" title="发布宝藏">📤</button>
      <button class="ctrl-btn" @click="refreshTreasures" title="刷新宝藏">🔄</button>
    </div>

    <TreasureDetail
      v-if="selectedTreasure"
      :treasure="selectedTreasure"
      @close="selectedTreasure = null"
      @discovered="onDiscovered"
    />

    <TreasurePublish
      v-if="showPublish"
      @close="showPublish = false"
      @published="onPublished"
    />
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useMapStore } from '../stores/map.js'
import { useTreasureStore } from '../stores/treasure.js'
import { getCurrentPosition, startTracking, stopTracking, isMobileDevice } from '../services/amap.js'
import AMapContainer from '../components/map/AMapContainer.vue'
import LocationBar from '../components/map/LocationBar.vue'
import TreasureDetail from '../components/treasure/TreasureDetail.vue'
import TreasurePublish from '../components/treasure/TreasurePublish.vue'

const mapStore = useMapStore()
const treasureStore = useTreasureStore()

const selectedTreasure = ref(null)
const showPublish = ref(false)
const calibrating = ref(false)
const locationStatus = ref('')
let watchId = null

function onMapReady() {
  mapStore.mapReady = true
  relocate()
}

async function relocate() {
  locationStatus.value = '定位中...'
  try {
    const pos = await getCurrentPosition()
    mapStore.setLocation(pos)
    mapStore.setCenter(pos)

    const accText = pos.accuracy ? `${Math.round(pos.accuracy)}m` : ''
    const srcText = pos.locationType || ''
    locationStatus.value = `定位成功 ${accText} ${srcText}`

    if (!isMobileDevice() && pos.accuracy > 200) {
      locationStatus.value = `PC定位精度较低（${Math.round(pos.accuracy)}m），建议手动校准`
    }

    // 加载宝藏
    treasureStore.loadNearby(pos.lat, pos.lng).catch(() => {})

    // 5秒后清除状态
    setTimeout(() => { locationStatus.value = '' }, 5000)
  } catch (err) {
    console.error('定位失败:', err)
    locationStatus.value = '定位失败，请点击 ✏️ 手动校准'
  }
}

function toggleTracking() {
  if (mapStore.tracking) {
    if (watchId !== null) stopTracking(watchId)
    watchId = null
    mapStore.tracking = false
    locationStatus.value = '追踪已关闭'
    setTimeout(() => { locationStatus.value = '' }, 2000)
    return
  }

  mapStore.tracking = true
  locationStatus.value = '🚶 实时追踪中...'

  watchId = startTracking(pos => {
    mapStore.setLocation(pos)
    // 不自动移动地图中心，让用户自由移动
  })

  if (!watchId) {
    mapStore.tracking = false
    locationStatus.value = '追踪启动失败'
  }
}

function toggleCalibration() {
  calibrating.value = !calibrating.value
  if (calibrating.value) {
    locationStatus.value = '📍 请在地图上点击您的真实位置'
    // 30秒后自动关闭
    setTimeout(() => {
      if (calibrating.value) {
        calibrating.value = false
        locationStatus.value = '校准模式已超时关闭'
        setTimeout(() => { locationStatus.value = '' }, 2000)
      }
    }, 30000)
  } else {
    locationStatus.value = ''
  }
}

function onMapClick(lnglat) {
  if (!calibrating.value) return

  // 手动校准 → 直接使用 GCJ-02 坐标（地图上点的就是 GCJ-02）
  const pos = { lng: lnglat.lng, lat: lnglat.lat, accuracy: 1 }
  mapStore.setLocation(pos)
  mapStore.setCenter(pos)
  calibrating.value = false
  locationStatus.value = '✅ 位置已手动校准'
  setTimeout(() => { locationStatus.value = '' }, 3000)

  treasureStore.loadNearby(pos.lat, pos.lng).catch(() => {})
}

function onTreasureClick(treasure) {
  selectedTreasure.value = treasure
}

async function refreshTreasures() {
  if (!mapStore.userLocation) return
  const { lat, lng } = mapStore.userLocation
  await treasureStore.loadNearby(lat, lng)
}

function onDiscovered() {
  selectedTreasure.value = null
  refreshTreasures()
}

function onPublished() {
  showPublish.value = false
  refreshTreasures()
}

onUnmounted(() => {
  if (watchId !== null) stopTracking(watchId)
})
</script>

<style scoped>
.map-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.map-wrap {
  flex: 1;
  position: relative;
  min-height: 0;
}

.map-controls {
  position: absolute;
  right: 12px;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
}

.ctrl-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0,0,0,.15);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .15s, background .2s;
}

.ctrl-btn:active { transform: scale(.9); }
.ctrl-btn.active { background: #00d4aa; color: #fff; }
</style>
