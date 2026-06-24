import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/desensitize',
    name: 'Desensitize',
    component: () => import('@/views/Desensitize.vue')
  },
  {
    path: '/restore',
    name: 'Restore',
    component: () => import('@/views/Restore.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
