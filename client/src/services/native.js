/**
 * Capacitor 原生能力封装
 * 在浏览器中运行时自动降级为 Web API
 */

let _isNative = false

export function isNativePlatform() {
  return _isNative
}

export async function initNative() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    _isNative = Capacitor.isNativePlatform()

    if (!_isNative) return

    // 状态栏适配
    try {
      const { StatusBar } = await import('@capacitor/status-bar')
      await StatusBar.setBackgroundColor({ color: '#00d4aa' })
    } catch {}

    // 启动画面
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen')
      await SplashScreen.hide()
    } catch {}

    // App 返回键处理（Android）
    try {
      const { App } = await import('@capacitor/app')
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back()
        } else {
          App.exitApp()
        }
      })

      // App 恢复前台时重连
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          window.dispatchEvent(new Event('app:resume'))
        }
      })
    } catch {}

    console.log('📱 Capacitor 原生模式已启动')
  } catch {
    // 不在 Capacitor 环境中，静默降级
  }
}

/**
 * 原生高精度 GPS 定位（比浏览器 API 更准）
 */
export async function getNativePosition() {
  if (!_isNative) return null

  try {
    const { Geolocation } = await import('@capacitor/geolocation')
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    })
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    }
  } catch {
    return null
  }
}

/**
 * 触觉反馈（点击宝藏时震动）
 */
export async function hapticFeedback(style = 'Medium') {
  if (!_isNative) return

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle[style] || ImpactStyle.Medium })
  } catch {}
}

/**
 * 注册推送通知
 */
export async function registerPush(onNotification) {
  if (!_isNative) return

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return

    await PushNotifications.register()

    PushNotifications.addListener('registration', (token) => {
      console.log('📱 推送 token:', token.value)
      // TODO: 将 token 发送到后端保存
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      if (onNotification) onNotification(notification)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      if (onNotification) onNotification(action.notification)
    })
  } catch {}
}
