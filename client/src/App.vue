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

    <div class="build-ver">v0409</div>

    <!-- 全局 Toast 通知 -->
    <transition name="toast-slide">
      <div v-if="toast.visible" class="global-toast" :class="toast.type" @click="toast.visible = false">
        <span>{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from './stores/user.js'
import { connectSocket, disconnectSocket, getSocket } from './services/socket.js'
import AppHeader from './components/common/AppHeader.vue'
import AuthModal from './components/auth/AuthModal.vue'
import BotChat from './components/chat/BotChat.vue'

const route = useRoute()
const userStore = useUserStore()
const showAuth = ref(false)

const toast = reactive({ visible: false, message: '', type: 'info' })
let toastTimer = null

function showToast(message, type = 'info', duration = 5000) {
  toast.message = message
  toast.type = type
  toast.visible = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.visible = false }, duration)
}

watch(() => route.query.login, val => {
  if (val === '1') showAuth.value = true
})

function setupSocket() {
  if (!userStore.isLoggedIn) return
  const socket = connectSocket()
  if (!socket) return

  socket.off('social:interest')
  socket.off('social:match')

  socket.on('social:interest', data => {
    showToast(`💌 ${data.message}`, 'social', 6000)
  })

  socket.on('social:match', data => {
    showToast(`💕 ${data.message}`, 'match', 8000)
  })
}

watch(() => userStore.isLoggedIn, loggedIn => {
  if (loggedIn) setupSocket()
  else disconnectSocket()
})

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetchMe()
    setupSocket()
  }
})

onUnmounted(() => {
  disconnectSocket()
  clearTimeout(toastTimer)
})

function openAuth() { showAuth.value = true }
window.__totofun_openAuth = openAuth
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.global-toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  font-size: .9rem;
  font-weight: 600;
  z-index: 9999;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
  max-width: 90vw;
  text-align: center;
}

.global-toast.info { background: #e3f2fd; color: #1565c0; }
.global-toast.social { background: #f3e8ff; color: #7b1fa2; }
.global-toast.match { background: linear-gradient(135deg, #ff6b9d, #c084fc); color: #fff; }

.toast-slide-enter-active { transition: all .3s ease; }
.toast-slide-leave-active { transition: all .3s ease; }
.toast-slide-enter-from { transform: translateX(-50%) translateY(-30px); opacity: 0; }
.toast-slide-leave-to { transform: translateX(-50%) translateY(-30px); opacity: 0; }

.build-ver {
  position: fixed;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  color: rgba(0,0,0,.15);
  z-index: 1;
  pointer-events: none;
}
</style>
