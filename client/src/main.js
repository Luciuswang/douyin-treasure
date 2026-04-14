import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router.js'
import App from './App.vue'
import './styles/main.css'
import { initNative } from './services/native.js'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

initNative()

const splash = document.getElementById('splash-screen')
if (splash) {
  setTimeout(() => {
    splash.classList.add('hide')
    setTimeout(() => splash.remove(), 700)
  }, 800)
}
