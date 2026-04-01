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
      if (res.success) {
        token.value = res.token
        user.value = res.user
      }
      return res
    } finally {
      loading.value = false
    }
  }

  async function register(username, email, password) {
    loading.value = true
    try {
      return await authService.register(username, email, password)
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const res = await authService.getMe()
      if (res.success) user.value = res.user || res.data
    } catch {
      token.value = ''
      user.value = null
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

  // 初始化：尝试恢复用户
  const savedUser = localStorage.getItem('auth_user')
  if (savedUser) {
    try { user.value = JSON.parse(savedUser) } catch { /* ignore */ }
  }

  window.addEventListener('auth:logout', handleForceLogout)

  return { user, token, loading, isLoggedIn, username, level, login, register, fetchMe, logout }
})
