import { io } from 'socket.io-client'

let socket = null

export function connectSocket() {
  if (socket?.connected) return socket

  const token = localStorage.getItem('auth_token')
  if (!token) return null

  let url = import.meta.env.VITE_WS_URL || window.location.origin
  if (window.Capacitor?.isNativePlatform()) url = 'https://youkongwa.com'
  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling']
  })

  socket.on('connect', () => console.log('🔌 WebSocket 已连接'))
  socket.on('disconnect', () => console.log('🔌 WebSocket 已断开'))
  socket.on('connect_error', err => console.error('🔌 连接失败:', err.message))

  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
