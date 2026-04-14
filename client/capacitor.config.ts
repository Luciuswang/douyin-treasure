import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.totofun.app',
  appName: 'Totofun 突突翻',
  webDir: 'dist',
  server: {
    // 不设 url → 加载本地打包文件（秒开 + splash 动画）
    // API/Socket 在 api.js 和 socket.js 中自动指向 youkongwa.com
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#00d4aa',
      showSpinner: false
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00d4aa'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#00d4aa'
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#00d4aa'
  }
};

export default config;
