import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
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
  },
  {
    path: '/sensitive-rules',
    name: 'SensitiveRules',
    component: () => import('@/views/SensitiveRules.vue')
  },
  {
    path: '/convert',
    name: 'Convert',
    component: () => import('@/views/Convert.vue')
  }
]

const router = createRouter({
  // Electron 以 file:// 加载静态资源，使用 Hash 路由避免刷新时寻找本地子路径文件。
  history: window.desensDesktop ? createWebHashHistory() : createWebHistory(),
  routes
})

export default router
