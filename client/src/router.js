import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/HomeView.vue')
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('./views/MapView.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('./views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('./views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      next({ name: 'Home', query: { login: '1' } })
      return
    }
  }
  if (to.meta.requiresAdmin) {
    try {
      const u = JSON.parse(localStorage.getItem('auth_user') || '{}')
      if (u.role !== 'admin') {
        next({ name: 'Home' })
        return
      }
    } catch {
      next({ name: 'Home' })
      return
    }
  }
  next()
})

export default router
