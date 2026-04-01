<template>
  <div id="totofun-app">
    <AppHeader />
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <AuthModal v-if="showAuth" @close="showAuth = false" />
    <BotChat />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from './stores/user.js'
import AppHeader from './components/common/AppHeader.vue'
import AuthModal from './components/auth/AuthModal.vue'
import BotChat from './components/chat/BotChat.vue'

const route = useRoute()
const userStore = useUserStore()
const showAuth = ref(false)

watch(() => route.query.login, val => {
  if (val === '1') showAuth.value = true
})

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetchMe()
  }
})

// 全局方法供子组件调用
function openAuth() { showAuth.value = true }
window.__totofun_openAuth = openAuth
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
