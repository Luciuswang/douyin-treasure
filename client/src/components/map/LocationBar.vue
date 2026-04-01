<template>
  <div class="location-bar">
    <router-link to="/" class="back-btn">←</router-link>
    <div class="loc-info">
      <span v-if="props.status" class="accuracy status-msg">{{ props.status }}</span>
      <span v-else-if="mapStore.userLocation" class="accuracy">
        📍 精度 {{ mapStore.gpsAccuracy }}m
      </span>
      <span v-else class="accuracy">📍 定位中...</span>
    </div>
    <div class="user-info" @click="goProfile">
      <span class="username">{{ userStore.username }}</span>
      <span class="lv">Lv.{{ userStore.level }}</span>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useMapStore } from '../../stores/map.js'
import { useUserStore } from '../../stores/user.js'

const props = defineProps({
  status: { type: String, default: '' }
})

const router = useRouter()
const mapStore = useMapStore()
const userStore = useUserStore()

function goProfile() {
  if (userStore.isLoggedIn) {
    router.push('/profile')
  } else {
    window.__totofun_openAuth?.()
  }
}
</script>

<style scoped>
.location-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(10px);
  color: #fff;
  z-index: 200;
  position: relative;
}

.back-btn {
  color: #fff;
  text-decoration: none;
  font-size: 1.3rem;
  padding: 4px 8px;
}

.accuracy { font-size: .8rem; opacity: .8; }
.status-msg { color: #00d4aa; opacity: 1; }

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.username { font-size: .85rem; font-weight: 600; }

.lv {
  font-size: .7rem;
  background: rgba(255,255,255,.2);
  padding: 1px 8px;
  border-radius: 10px;
}
</style>
