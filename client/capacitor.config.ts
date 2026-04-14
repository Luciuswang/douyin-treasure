import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.totofun.app',
  appName: 'Totofun 突突翻',
  webDir: 'dist',
  server: {
    // 生产环境指向你的服务器 API
    url: 'https://youkongwa.com',
    cleartext: true
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
