<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, User, Postcard } from '@element-plus/icons-vue' // (新增) 导入图标

import apiService from '@/services/api'
import type { ApiResponse, LoginResponse } from '@/services/api-types'
import { useUserStore, type UserInfo } from '@/stores/user'

// --- 通用 ---
const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('login') // 控制显示'登录'还是'注册'
const isLoading = ref(false) // 控制按钮加载状态

// --- 登录表单 ---
const loginFormRef = ref<FormInstance>()
const loginForm = reactive({
  username: '', // 对应 LoginRequest.username
  password: '', // 对应 LoginRequest.password
})
const loginRules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
})

// --- 注册表单 ---
const registerFormRef = ref<FormInstance>()
const registerForm = reactive({
  username: '', // 对应 RegisterRequest.username
  email: '', // 对应 RegisterRequest.email
  password: '', // 对应 RegisterRequest.password
})
const registerRules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
})

/**
 * (关键) 统一的登录成功处理逻辑
 * @param token 登录/注册成功后返回的 token
 */
async function handleSuccessfulAuth(token: string) {
  try {
    // 登录成功后，立即调用 /info 接口获取用户信息
    // api.ts 拦截器会自动附加我们刚拿到的 token，
    // 但为了 100% 确保（因为 store 可能还没更新完），我们手动传递
    const userInfoResponse = await apiService.get<ApiResponse<UserInfo>>('/user/info', {
      headers: {
        Authorization: `Bearer ${token}`, // 对应 JWT
      },
    }) //

    // (关键) 调用 Pinia Action，
    // 将 token 和 userInfo 存入全局状态
    userStore.login(token, userInfoResponse as unknown as UserInfo)

    // 提示成功
    ElMessage.success('登录成功！')

    // 跳转到仪表盘
    // router.push 会在浏览器历史上留下记录
    // router.replace 不会留记录（更适合登录跳转）
    await router.replace('/dashboard')
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败，请重试')
    isLoading.value = false
  }
}

/**
 * 登录按钮点击事件
 */
const handleLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      isLoading.value = true
      try {
        // 1. 调用登录 API
        const loginRes = await apiService.post<ApiResponse<LoginResponse>>('/user/login', {
          username: loginForm.username,
          password: loginForm.password,
        })

        // 2. 调用统一的成功处理函数
        const loginData = loginRes as unknown as LoginResponse
        await handleSuccessfulAuth(loginData.accessToken)
      } catch (error) {
        // api.ts 拦截器会自动弹出后端的错误消息
        // (例如 "invalid username or password")
        console.error('登录失败:', error)
        isLoading.value = false
      }
    }
  })
}

/**
 * 注册按钮点击事件
 */
const handleRegister = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      isLoading.value = true
      try {
        // 1. 调用注册 API
        const registerRes = await apiService.post<ApiResponse<LoginResponse>>('/user/register', {
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
        })

        // 2. (关键) 注册成功后，后端直接返回了 token，
        //    我们直接调用统一的成功处理函数，实现“注册即登录”
        const registerData = registerRes as unknown as LoginResponse
        await handleSuccessfulAuth(registerData.accessToken)
      } catch (error) {
        // api.ts 拦截器会自动弹出后端的错误消息
        // (例如 "username already exists")
        console.error('注册失败:', error)
        isLoading.value = false
      }
    }
  })
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="title">Minify 短链接</h1>

      <el_tabs v-model="activeTab" class="login-tabs" stretch>
        <el_tab_pane label="登录" name="login">
          <el_form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            size="large"
            @keyup.enter="handleLogin(loginFormRef)"
          >
            <el_form_item label="用户名或邮箱" prop="username">
              <el_input
                v-model="loginForm.username"
                placeholder="Username or Email"
                :prefix-icon="User"
              />
            </el_form_item>
            <el_form_item label="密码" prop="password">
              <el_input
                v-model="loginForm.password"
                type="password"
                placeholder="Password"
                show-password
                :prefix-icon="Lock"
              />
            </el_form_item>
            <el_form_item>
              <el_button
                type="primary"
                class="login-button"
                :loading="isLoading"
                @click="handleLogin(loginFormRef)"
              >
                登 录
              </el_button>
            </el_form_item>
          </el_form>
        </el_tab_pane>

        <el_tab_pane label="注册" name="register">
          <el_form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            label-position="top"
            size="large"
            @keyup.enter="handleRegister(registerFormRef)"
          >
            <el_form_item label="用户名" prop="username">
              <el_input
                v-model="registerForm.username"
                placeholder="Username"
                :prefix-icon="User"
              />
            </el_form_item>
            <el_form_item label="邮箱" prop="email">
              <el_input v-model="registerForm.email" placeholder="Email" :prefix-icon="Postcard" />
            </el_form_item>
            <el_form_item label="密码" prop="password">
              <el_input
                v-model="registerForm.password"
                type="password"
                placeholder="Password"
                show-password
                :prefix-icon="Lock"
              />
            </el_form_item>
            <el_form_item>
              <el_button
                type="primary"
                class="login-button"
                :loading="isLoading"
                @click="handleRegister(registerFormRef)"
              >
                注 册
              </el_button>
            </el_form_item>
          </el_form>
        </el_tab_pane>
      </el_tabs>
    </div>
  </div>
</template>

<style scoped>
/* 1. 登录容器 (全屏居中) */
.login-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g fill-rule="evenodd"><g fill="%23c5c5c5" fill-opacity="0.4"><path opacity=".5" d="M96 95h4v1h-4v4h-1v-4h-4v-1h4v-4h1v4zM4 95h4v1H4v4H3v-4H0v-1h3v-4h1v4zM96 5h4v1h-4v4h-1V5h-4V4h4V0h1v4zM4 5h4v1H4v4H3V5H0V4h3V0h1v4z"/></g></g></svg>');
}

/* 2. 登录卡片 */
.login-box {
  width: 400px;
  padding: 30px 40px 20px 40px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 3. 标题 */
.title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

/* 4. 登录按钮 (占满整行) */
.login-button {
  width: 100%;
}

/* 5. (关键) 修正 Element Plus Tabs 的样式 */
.login-tabs {
  /* 移除 tabs 默认的下边框 */
  --el-tabs-header-margin: 0 0 20px 0;
}
:deep(.el-tabs__nav-wrap::after) {
  display: none;
}
</style>
