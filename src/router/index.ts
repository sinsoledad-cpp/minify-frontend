import { createRouter, createWebHistory } from 'vue-router'
// (新增) 导入我们的 Pinia Store
import { useUserStore } from '@/stores/user'
// (新增) 导入我们刚创建的布局和视图
import MainLayout from '@/layouts/MainLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import LinksView from '@/views/LinksView.vue'
// 创建路由实例
const router = createRouter({
  // 告诉路由使用 H5 历史模式
  history: createWebHistory(import.meta.env.BASE_URL),
  // (修改) 定义我们的“路由地图”
  routes: [
    {
      // 规则 1：公共路由（登录页）
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      // 规则 2：(新增) 重定向规则
      // 如果用户访问根路径 /，自动跳转到 /dashboard
      path: '/',
      redirect: '/dashboard',
    },
    {
      // 规则 3：(关键) 受保护的路由（所有需要登录的页面）
      // 这是一个“嵌套路由”
      path: '/',
      component: MainLayout, // 1. 先加载 MainLayout (蓝色的框)
      children: [
        // 2. 然后把子组件渲染到 MainLayout 的 <RouterView /> (绿色的框)
        {
          path: 'dashboard', // 对应的完整 URL 是 /dashboard
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'links', // 对应的完整 URL 是 /links
          name: 'links',
          component: LinksView // <--- (新增) 指定组件
        }
        // ... 稍后我们会在这里添加 /links, /admin/users 等
      ],
    },
  ],
})
// --- (关键) 全局路由守卫 ---
router.beforeEach((to, from, next) => {
  // 1. 获取 Pinia Store 和登录状态
  // (注意：必须在 beforeEach 内部获取 store 实例)
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn

  // 2. 定义我们的路由“白名单”（不需要登录就能访问）
  const publicPages = ['/login', '/register'] // 稍后可以添加 /register
  const authRequired = !publicPages.includes(to.path)

  // 3. 核心鉴权逻辑
  if (authRequired && !isLoggedIn) {
    // 场景 A: 访问受保护页面，但“未登录”
    // -> 强制重定向到登录页
    return next('/login')
  }

  if (!authRequired && isLoggedIn) {
    // 场景 B: 访问“登录页”(/login)，但“已登录”
    // -> 强制重定向到仪表盘
    return next('/dashboard')
  }

  // 场景 C: 访问受保护页面 -> 已登录 -> 放行
  // 场景 D: 访问公共页面 -> 未登录 -> 放行
  next()
})

export default router
