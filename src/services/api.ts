import axios, { type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from './api-types' // 导入我们刚定义的类型

// 1. 创建 Axios 实例
const apiService = axios.create({
  // Vite 代理会自动处理跨域，我们不需要写 'http://localhost:8888'
  // 我们所有的 API 都在 /api/v1/ 下
  baseURL: '/api/v1',
  timeout: 10000, // 10 秒超时
})

// 2. (关键) 添加请求拦截器
apiService.interceptors.request.use(
  (config) => {
    // 在发送请求之前
    const userStore = useUserStore()

    if (userStore.isLoggedIn) {
      // 如果已登录，自动附加 Authorization 请求头
      // 这对应你后端的 JWT 中间件
      config.headers.Authorization = userStore.authorizationHeader
    }
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  },
)

// 3. (关键) 添加响应拦截器
apiService.interceptors.response.use(
  /**
   * 成功的响应 (HTTP 状态码 2xx)
   * 我们在这里检查后端返回的业务码 (code)
   */
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    // 检查业务码 (code)
    if (res.code !== 0) {
      //
      // 业务错误 (例如：用户名已存在，短码已存在)
      ElMessage({
        message: res.msg || 'Error',
        type: 'error',
        duration: 5 * 1000,
      })

      // (关键) 检查是否是 Token 无效
      // 10005: user-api Token 无效
      // 11001: shortener-api Token 无效
      if (res.code === 10005 || res.code === 11001) {
        // 判定为 Token 失效，执行登出
        const userStore = useUserStore()
        userStore.logout()
      }

      // 拒绝这个 promise，让 .catch() 能捕获到
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      // 业务成功 (code === 0)，只返回 data 字段
      return res.data
    }
  },
  /**
   * 失败的响应 (HTTP 状态码 4xx, 5xx)
   * (例如：服务器崩溃 500, 找不到 404, 跨域失败)
   */
  (error) => {
    console.error('Axios Error:', error) // 在控制台打印详细错误

    // (可选) 检查 error.response 是否存在
    let errorMsg = error.message
    if (error.response && error.response.data && error.response.data.msg) {
      // 如果是 go-zero 框架层的错误 (如 401 Unauthorized)，它也会有 msg
      errorMsg = error.response.data.msg
    }

    ElMessage({
      message: `网络错误: ${errorMsg}`,
      type: 'error',
      duration: 5 * 1000,
    })
    return Promise.reject(error)
  },
)

// 4. 默认导出
export default apiService
