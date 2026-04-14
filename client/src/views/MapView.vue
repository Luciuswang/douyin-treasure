<template>
  <div class="map-page">
    <LocationBar :status="locationStatus" />

    <!-- 搜索栏 + 类型筛选 -->
    <div class="search-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索附近宝藏..."
          @focus="showList = true"
        />
        <button v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''">×</button>
      </div>
      <div class="type-filters">
        <button
          class="filter-chip"
          :class="{ active: activeTypes.size === 0 }"
          @click="clearFilters"
        >全部</button>
        <button
          v-for="ft in filterTypes" :key="ft.value"
          class="filter-chip"
          :class="{ active: activeTypes.has(ft.value) }"
          :style="activeTypes.has(ft.value)
            ? { background: ft.color, borderColor: ft.color, color: '#fff' }
            : { borderColor: ft.color + '50', color: ft.color }"
          @click="toggleFilter(ft.value)"
        >{{ ft.icon }} {{ ft.label }}
          <span v-if="typeCounts[ft.value]" class="filter-count">{{ typeCounts[ft.value] }}</span>
        </button>
      </div>
    </div>

    <div class="map-wrap">
      <AMapContainer
        :calibrating="calibrating"
        :filter-types="activeTypes"
        :search-keyword="searchKeyword"
        @map-ready="onMapReady"
        @treasure-click="onTreasureClick"
        @map-click="onMapClick"
        @filtered-update="onFilteredUpdate"
      />
    </div>

    <!-- 宝藏列表视图 -->
    <transition name="list-slide">
      <div v-if="showList" class="treasure-list-panel">
        <div class="list-header">
          <span>📋 附近宝藏 ({{ filteredTreasures.length }})</span>
          <button @click="showList = false">×</button>
        </div>
        <div v-if="!filteredTreasures.length" class="list-empty">
          {{ searchKeyword ? '没有匹配的宝藏' : '附近暂无宝藏' }}
        </div>
        <div v-else class="list-items">
          <div
            v-for="t in filteredTreasures" :key="t._id"
            class="list-item"
            @click="focusTreasure(t)"
          >
            <span class="li-color" :style="{ background: typeColorMap[t.type] || '#636e72' }"></span>
            <span class="li-icon">{{ typeIconMap[t.type] || '📦' }}</span>
            <div class="li-info">
              <strong>{{ t.title }}</strong>
              <span class="li-meta">
                {{ typeLabelMap[t.type] || t.type }}
                <template v-if="t.type === 'house' && t.content?.extra">
                  · {{ t.content.extra.mode === 'rent' ? '租' : '售' }}
                  {{ t.content.extra.price }}{{ t.content.extra.mode === 'rent' ? '元/月' : '万' }}
                  <template v-if="t.content.extra.layout"> · {{ t.content.extra.layout }}</template>
                </template>
                <template v-if="t._distance"> · {{ formatDist(t._distance) }}</template>
                <template v-if="t.type !== 'house'"> · {{ t.stats?.discoveries || 0 }}人发现</template>
              </span>
            </div>
            <span v-if="t.isDiscovered" class="li-badge li-done">已发现</span>
            <span v-else class="li-badge li-go">前往</span>
          </div>
        </div>
      </div>
    </transition>

    <div class="map-controls">
      <button class="ctrl-btn" @click="relocate" title="重新定位">📍</button>
      <button class="ctrl-btn" :class="{ active: mapStore.tracking }" @click="toggleTracking" title="实时追踪">🚶</button>
      <button class="ctrl-btn" :class="{ active: calibrating }" @click="toggleCalibration" title="手动校准位置">✏️</button>
      <button class="ctrl-btn" @click="showPublish = true" title="发布宝藏">📤</button>
      <button class="ctrl-btn" @click="refreshTreasures" title="刷新宝藏">🔄</button>
      <button class="ctrl-btn" :class="{ active: showList }" @click="showList = !showList" title="列表视图">📋</button>
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
import { ref, computed, onUnmounted } from 'vue'
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
const showList = ref(false)
const searchKeyword = ref('')
const activeTypes = ref(new Set())
const filteredTreasures = ref([])
let watchId = null

const filterTypes = [
  { value: 'social', icon: '💕', label: '交友', color: '#ff6b9d' },
  { value: 'house', icon: '🏠', label: '房屋', color: '#e67e22' },
  { value: 'coupon', icon: '🎫', label: '优惠券', color: '#f0932b' },
  { value: 'redpacket', icon: '🧧', label: '红包', color: '#d63031' },
  { value: 'job', icon: '💼', label: '招聘', color: '#0984e3' },
  { value: 'event', icon: '🎉', label: '活动', color: '#6c5ce7' },
  { value: 'task', icon: '📋', label: '任务', color: '#00b894' },
  { value: 'note', icon: '📝', label: '笔记', color: '#74b9ff' },
  { value: 'ticket', icon: '🎬', label: '门票', color: '#e17055' },
  { value: 'custom', icon: '📦', label: '其他', color: '#636e72' }
]

const typeColorMap = Object.fromEntries(filterTypes.map(f => [f.value, f.color]))
const typeIconMap = {
  note: '📝', coupon: '🎫', ticket: '🎬', job: '💼',
  event: '🎉', redpacket: '🧧', task: '📋', image: '🖼️', custom: '📦', social: '💕', house: '🏠'
}
const typeLabelMap = {
  note: '笔记', coupon: '优惠券', ticket: '票券', job: '招聘',
  event: '活动', redpacket: '红包', task: '任务', image: '图片', custom: '自定义', social: '交友', house: '房屋'
}

const typeCounts = computed(() => {
  const counts = {}
  ;(treasureStore.nearbyTreasures || []).forEach(t => {
    const type = t.type || 'custom'
    counts[type] = (counts[type] || 0) + 1
  })
  return counts
})

function toggleFilter(type) {
  const s = new Set(activeTypes.value)
  if (s.has(type)) s.delete(type)
  else s.add(type)
  activeTypes.value = s
}

function clearFilters() {
  activeTypes.value = new Set()
  searchKeyword.value = ''
}

function onFilteredUpdate(items) {
  if (!mapStore.userLocation) {
    filteredTreasures.value = items
    return
  }
  const { lat: uLat, lng: uLng } = mapStore.userLocation
  filteredTreasures.value = items.map(t => {
    const [lng, lat] = t.location.coordinates
    const dist = haversine(uLat, uLng, lat, lng)
    return { ...t, _distance: dist }
  }).sort((a, b) => a._distance - b._distance)
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDist(m) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`
}

function focusTreasure(t) {
  showList.value = false
  mapStore.setCenter({ lng: t.location.coordinates[0], lat: t.location.coordinates[1] })
  setTimeout(() => { selectedTreasure.value = t }, 300)
}

function onMapReady() {
  mapStore.mapReady = true
  relocate()
}

async function relocate() {
  locationStatus.value = '定位中...'

  const pos = await getCurrentPosition()
  mapStore.setLocation(pos)
  mapStore.setCenter(pos)

  // 加载附近宝藏
  treasureStore.loadNearby(pos.lat, pos.lng).catch(() => {})

  const accText = pos.accuracy ? `${Math.round(pos.accuracy)}m` : ''

  if (pos.rough) {
    // 粗略定位 → 提示手动校准
    locationStatus.value = `⚠️ ${pos.locationType || '粗略定位'}，建议点击 ✏️ 手动校准`
  } else {
    locationStatus.value = `✅ ${pos.locationType || '定位成功'} 精度${accText}`
    setTimeout(() => { locationStatus.value = '' }, 5000)
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

/* 搜索栏 */
.search-bar {
  position: absolute;
  top: 42px;
  left: 0; right: 0;
  z-index: 200;
  padding: 8px 12px 0;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,.95);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  padding: 0 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,.12);
  height: 40px;
}

.search-icon { font-size: .9rem; margin-right: 6px; flex-shrink: 0; }

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: .88rem;
  outline: none;
  height: 100%;
  min-width: 0;
}

.search-clear {
  background: #ccc;
  border: none;
  color: #fff;
  width: 20px; height: 20px;
  border-radius: 50%;
  font-size: .8rem;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-filters {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 8px 0 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.type-filters::-webkit-scrollbar { display: none; }

.filter-chip {
  flex-shrink: 0;
  padding: 4px 10px;
  border: 1.5px solid #ddd;
  border-radius: 16px;
  background: rgba(255,255,255,.9);
  font-size: .75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s;
  display: flex;
  align-items: center;
  gap: 3px;
  backdrop-filter: blur(8px);
}

.filter-chip.active {
  box-shadow: 0 1px 6px rgba(0,0,0,.12);
  transform: scale(1.03);
}

.filter-count {
  background: rgba(255,255,255,.4);
  padding: 0 5px;
  border-radius: 8px;
  font-size: .68rem;
  min-width: 16px;
  text-align: center;
}

.map-wrap {
  flex: 1;
  position: relative;
  min-height: 0;
}

/* 宝藏列表面板 */
.treasure-list-panel {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  z-index: 180;
  background: #fff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,.15);
  max-height: 50vh;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  font-size: .95rem;
  flex-shrink: 0;
}

.list-header button {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #999;
  cursor: pointer;
}

.list-empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: .9rem;
}

.list-items {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  gap: 10px;
  -webkit-tap-highlight-color: transparent;
}
.list-item:active { background: #f8fffe; }

.li-color {
  width: 4px;
  min-height: 28px;
  border-radius: 2px;
  flex-shrink: 0;
}

.li-icon { font-size: 1.4rem; flex-shrink: 0; }

.li-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.li-info strong {
  font-size: .9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.li-meta {
  font-size: .75rem;
  color: #999;
}

.li-badge {
  font-size: .72rem;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
}
.li-done { background: #eee; color: #999; }
.li-go { background: #e8faf5; color: #00d4aa; }

/* 列表过渡动画 */
.list-slide-enter-active, .list-slide-leave-active {
  transition: transform .25s ease-out, opacity .2s;
}
.list-slide-enter-from, .list-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* 控制按钮 */
.map-controls {
  position: absolute;
  right: 12px;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 190;
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
