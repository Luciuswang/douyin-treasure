<template>
  <div ref="mapEl" class="amap-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { loadAMap } from '../../services/amap.js'
import { useMapStore } from '../../stores/map.js'
import { useTreasureStore } from '../../stores/treasure.js'

const emit = defineEmits(['map-ready', 'treasure-click'])
const mapEl = ref(null)
const mapStore = useMapStore()
const treasureStore = useTreasureStore()

let map = null
let userMarker = null
let treasureMarkers = []

const typeIcons = {
  note: '📝', coupon: '🎫', ticket: '🎬', job: '💼',
  event: '🎉', redpacket: '🧧', task: '📋', image: '🖼️', custom: '📦'
}

onMounted(async () => {
  try {
    const AMap = await loadAMap()
    map = new AMap.Map(mapEl.value, {
      zoom: 16,
      center: [116.397428, 39.90923],
      mapStyle: 'amap://styles/fresh',
      touchZoom: true,
      scrollWheel: true
    })
    emit('map-ready')
  } catch (err) {
    console.error('地图初始化失败:', err)
  }
})

watch(() => mapStore.mapCenter, center => {
  if (!map || !center) return
  map.setCenter([center.lng, center.lat])
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
  if (userMarker) {
    userMarker.setPosition([loc.lng, loc.lat])
  } else {
    userMarker = new window.AMap.Marker({
      position: [loc.lng, loc.lat],
      content: '<div style="width:16px;height:16px;background:#4285f4;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(66,133,244,.6)"></div>',
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
.amap-container {
  width: 100%;
  height: 100%;
}
</style>
