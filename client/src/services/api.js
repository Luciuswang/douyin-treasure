import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res.data,
  async error => {
    if (error.response?.status === 401) {
      const code = error.response.data?.code
      if (code === 'TOKEN_EXPIRED') {
        const refreshed = await tryRefreshToken()
        if (refreshed) {
          error.config.headers.Authorization = `Bearer ${localStorage.getItem('auth_token')}`
          return api(error.config)
        }
      }
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('auth_user')
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error.response?.data || error)
  }
)

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return false
  try {
    const { data } = await axios.post('/api/auth/refresh', { refreshToken })
    if (data.success && data.data?.accessToken) {
      localStorage.setItem('auth_token', data.data.accessToken)
      return true
    }
  } catch { /* ignore */ }
  return false
}

export default api
