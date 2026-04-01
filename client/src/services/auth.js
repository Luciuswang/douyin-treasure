import api from './api.js'

export const authService = {
  async register(username, email, password) {
    const res = await api.post('/auth/register', { username, email, password })
    if (res.success && res.data?.tokens) {
      localStorage.setItem('auth_token', res.data.tokens.accessToken)
      localStorage.setItem('refresh_token', res.data.tokens.refreshToken)
      if (res.data.user) localStorage.setItem('auth_user', JSON.stringify(res.data.user))
    }
    return {
      success: res.success,
      message: res.message,
      token: res.data?.tokens?.accessToken,
      user: res.data?.user
    }
  },

  async login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    if (res.success && res.data?.tokens) {
      localStorage.setItem('auth_token', res.data.tokens.accessToken)
      localStorage.setItem('refresh_token', res.data.tokens.refreshToken)
      if (res.data.user) localStorage.setItem('auth_user', JSON.stringify(res.data.user))
    }
    return {
      success: res.success,
      message: res.message,
      token: res.data?.tokens?.accessToken,
      user: res.data?.user
    }
  },

  async logout() {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('auth_user')
  },

  async getMe() {
    const res = await api.get('/auth/me')
    return {
      success: res.success,
      user: res.data?.user
    }
  },

  isLoggedIn() {
    return !!localStorage.getItem('auth_token')
  }
}
