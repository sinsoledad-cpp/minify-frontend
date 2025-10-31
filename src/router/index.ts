import { createRouter, createWebHistory } from 'vue-router'
// 创建路由实例
const router = createRouter({
  // 告诉路由使用 H5 历史模式
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [],
})

export default router
