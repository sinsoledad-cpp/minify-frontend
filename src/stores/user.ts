import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// (新增) 导入路由，用于登出后跳转
import router from '@/router'

// (新增) 定义我们将从 API 获取的用户信息类型
// 这对应你后端的 UserInfoResponse
export interface UserInfo {
  id: number
  username: string
  email: string
  role: string
  created_at: string
}

// 定义 Store
// 'user' 是这个 store 的唯一ID
export const useUserStore = defineStore(
  'user',
  () => {
    // --- State (状态) ---
    // 存储从后端获取的 JWT
    const token = ref<string | null>(null)
    // 存储当前登录的用户信息
    const userInfo = ref<UserInfo | null>(null)

    // --- Getters (计算属性) ---
    // 计算用户是否已登录
    const isLoggedIn = computed(() => token.value != null && token.value !== '')

    // 计算用户是否是管理员
    const isAdmin = computed(() => userInfo.value?.role === 'admin')

    // 获取 Authorization 请求头的值
    const authorizationHeader = computed(() => `Bearer ${token.value}`)

    // --- Actions (方法) ---

    /**
     * 登录成功后，设置 state
     * @param apiToken 后端返回的 accessToken
     * @param user 登录时（或后续/info接口）获取的用户信息
     */
    function login(apiToken: string, user: UserInfo) {
      token.value = apiToken
      userInfo.value = user
    }

    /**
     * 用户登出
     */
    function logout() {
      token.value = null
      userInfo.value = null

      // 登出后，强制跳转到登录页
      // 我们使用 replace 防止用户通过"后退"按钮回到需要登录的页面
      router.replace('/login')
    }

    // --- 返回 ---
    // 把所有 state, getters 和 actions 返回
    return {
      token,
      userInfo,
      isLoggedIn,
      isAdmin,
      authorizationHeader,
      login,
      logout,
    }
  },
  {
    // --- (关键) Pinia 持久化配置 ---
    // 告诉 Pinia 把这个 store 的状态存储在 localStorage
    persist: true,
    // 默认情况下，它会存储所有 ref() 定义的 state
    // (即 token 和 userInfo 都会被保存)
  },
)
