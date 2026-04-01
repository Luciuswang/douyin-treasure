<template>
  <div class="map-page">
    <LocationBar />
    <div class="map-wrap">
      <AMapContainer
        @map-ready="onMapReady"
        @treasure-click="onTreasureClick"
      />
    </div>

    <div class="map-controls">
      <button class="ctrl-btn" @click="relocate" title="重新定位">📍</button>
      <button class="ctrl-btn" :class="{ active: mapStore.tracking }" @click="toggleTracking" title="实时追踪">🚶</button>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useMapStore } from '../stores/map.js'
import { useTreasureStore } from '../stores/treasure.js'
import { getCurrentPosition } from '../services/amap.js'
import AMapContainer from '../components/map/AMapContainer.vue'
import LocationBar from '../components/map/LocationBar.vue'
import TreasureDetail from '../components/treasure/TreasureDetail.vue'
import TreasurePublish from '../components/treasure/TreasurePublish.vue'

const mapStore = useMapStore()
const treasureStore = useTreasureStore()

const selectedTreasure = ref(null)
const showPublish = ref(false)
let watchId = null

function onMapReady() {
  mapStore.mapReady = true
  relocate()
}

async function relocate() {
  try {
    const pos = await getCurrentPosition()
    mapStore.setLocation(pos)
    mapStore.setCenter(pos)
    // 加载宝藏（失败不影响地图显示）
    treasureStore.loadNearby(pos.lat, pos.lng).catch(() => {})
  } catch (err) {
    console.error('定位失败:', err)
  }
}

function toggleTracking() {
  if (mapStore.tracking) {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    watchId = null
    mapStore.tracking = false
    return
  }

  mapStore.tracking = true
  watchId = navigator.geolocation.watchPosition(
    pos => {
      const { longitude, latitude, accuracy } = pos.coords
      if (window.AMap) {
        window.AMap.convertFrom([longitude, latitude], 'gps', (status, result) => {
          if (status === 'complete' && result.locations?.length) {
            const loc = result.locations[0]
            mapStore.setLocation({ lng: loc.lng, lat: loc.lat, accuracy })
          }
        })
      } else {
        mapStore.setLocation({ lng: longitude, lat: latitude, accuracy })
      }
    },
    null,
    { enableHighAccuracy: true, maximumAge: 3000 }
  )
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
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
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
  transition: transform .15s;
}

.ctrl-btn:active { transform: scale(.9); }
.ctrl-btn.active { background: #00d4aa; color: #fff; }
</style>
