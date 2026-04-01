<template>
  <header class="app-header" v-if="showHeader">
    <router-link to="/" class="brand">
      <span class="brand-name">Totofun</span>
    </router-link>
    <nav class="nav">
      <router-link to="/map" class="nav-link">🗺️ 地图</router-link>
      <router-link v-if="userStore.isLoggedIn" to="/profile" class="nav-link">👤</router-link>
      <button v-else class="nav-link login-btn" @click="openAuth">登录</button>
    </nav>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../../stores/user.js'

const route = useRoute()
const userStore = useUserStore()

const showHeader = computed(() => route.name !== 'Map')

function openAuth() {
  window.__totofun_openAuth?.()
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255,255,255,.1);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  text-decoration: none;
  color: #fff;
}

.brand-name {
  font-size: 1.2rem;
  font-weight: 700;
}

.nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-size: .9rem;
  padding: 4px 10px;
  border-radius: 8px;
  transition: background .15s;
}

.nav-link:hover { background: rgba(255,255,255,.15); }
.nav-link.router-link-active { background: rgba(255,255,255,.2); }

.login-btn {
  background: rgba(255,255,255,.2);
  border: 1px solid rgba(255,255,255,.3);
  cursor: pointer;
  border-radius: 20px;
  padding: 6px 16px;
}
</style>
