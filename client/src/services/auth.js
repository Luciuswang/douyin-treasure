import api from './api.js'

export const authService = {
  async register(username, email, password) {
    return api.post('/auth/register', { username, email, password })
  },

  async login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    if (res.success) {
      localStorage.setItem('auth_token', res.token)
      if (res.refreshToken) localStorage.setItem('refresh_token', res.refreshToken)
      if (res.user) localStorage.setItem('auth_user', JSON.stringify(res.user))
    }
    return res
  },

  async logout() {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('auth_user')
  },

  async getMe() {
    return api.get('/auth/me')
  },

  isLoggedIn() {
    return !!localStorage.getItem('auth_token')
  }
}
