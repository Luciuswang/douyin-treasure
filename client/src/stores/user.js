import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/auth.js'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token') || '')
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => user.value?.username || '游客')
  const level = computed(() => user.value?.level?.currentLevel || 1)

  async function login(email, password) {
    loading.value = true
    try {
      const res = await authService.login(email, password)
      if (res.success && res.token) {
        token.value = res.token
        user.value = res.user
      }
      return res
    } finally {
      loading.value = false
    }
  }

  async function register(usernameVal, email, password) {
    loading.value = true
    try {
      const res = await authService.register(usernameVal, email, password)
      if (res.success && res.token) {
        token.value = res.token
        user.value = res.user
      }
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const res = await authService.getMe()
      if (res.success && res.user) {
        user.value = res.user
        localStorage.setItem('auth_user', JSON.stringify(res.user))
      }
    } catch {
      // 网络失败时保留本地缓存的用户信息，不清 token
      // 只有 api 拦截器确认 refresh 也失败后才会通过 auth:logout 事件登出
    }
  }

  async function logout() {
    await authService.logout()
    token.value = ''
    user.value = null
  }

  function handleForceLogout() {
    token.value = ''
    user.value = null
  }

  // 初始化：从 localStorage 恢复用户
  const savedUser = localStorage.getItem('auth_user')
  if (savedUser) {
    try { user.value = JSON.parse(savedUser) } catch { /* ignore */ }
  }

  window.addEventListener('auth:logout', handleForceLogout)

  return { user, token, loading, isLoggedIn, username, level, login, register, fetchMe, logout }
})
