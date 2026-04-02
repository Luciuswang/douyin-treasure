import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

let isRefreshing = false
let pendingRequests = []

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
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // 登录/注册接口 401 不需要刷新 token
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
        return Promise.reject(error.response?.data || error)
      }

      // 尝试刷新 token
      if (!isRefreshing) {
        isRefreshing = true
        const refreshed = await tryRefreshToken()
        isRefreshing = false

        if (refreshed) {
          const newToken = localStorage.getItem('auth_token')
          // 重放所有等待中的请求
          pendingRequests.forEach(cb => cb(newToken))
          pendingRequests = []
          // 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }

        // 刷新也失败了才真正登出
        pendingRequests = []
        clearAuth()
      } else {
        // 已经在刷新中，排队等待
        return new Promise(resolve => {
          pendingRequests.push(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }
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

function clearAuth() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('auth_user')
  window.dispatchEvent(new Event('auth:logout'))
}

export default api
